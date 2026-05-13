import { Request, Response, NextFunction } from "express";
import { decode } from "next-auth/jwt";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token =
    req.headers.authorization?.split(" ")[1] ||
    req.cookies?.["next-auth.session-token"] ||
    req.cookies?.["__Secure-next-auth.session-token"];

  if (!token) return res.status(401).json({ error: "Não autenticado.", code: "UNAUTHORIZED" });

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("NEXTAUTH_SECRET not set");
    return res.status(500).json({ error: "Erro de configuração do servidor.", code: "INTERNAL_ERROR" });
  }

  try {
    const decoded = await decode({ token, secret });
    if (!decoded) return res.status(401).json({ error: "Sessão inválida.", code: "INVALID_SESSION" });

    req.user = {
      id: (decoded.id || decoded.sub) as string,
      email: decoded.email as string,
      name: decoded.name as string,
      role: (decoded.role || "readonly") as string,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido.", code: "INVALID_TOKEN" });
  }
};

// Only admin can proceed
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Acesso restrito a administradores.", code: "FORBIDDEN" });
  }
  next();
};

// Admin or operacional (field operator) can proceed — readonly is blocked
export const operacionalOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (role !== "admin" && role !== "operacional") {
    return res.status(403).json({ error: "Acesso restrito. Permissão insuficiente.", code: "FORBIDDEN" });
  }
  next();
};
