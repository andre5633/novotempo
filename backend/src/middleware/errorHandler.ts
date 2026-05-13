import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  // Prisma known request errors
  if (err.constructor?.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as any;
    if (prismaErr.code === "P2002") {
      return res.status(409).json({
        error: "Registro duplicado. Verifique os dados e tente novamente.",
        code: "DUPLICATE",
      });
    }
    if (prismaErr.code === "P2025") {
      return res.status(404).json({
        error: "Registro não encontrado.",
        code: "NOT_FOUND",
      });
    }
  }

  console.error("[Unhandled Error]", err);
  return res.status(500).json({
    error: "Erro interno do servidor.",
    code: "INTERNAL_ERROR",
  });
}
