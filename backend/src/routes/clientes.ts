import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, adminOnly } from "../middleware/auth";
import { validate, clienteSchema, clienteUpdateSchema } from "../middleware/validate";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// GET /api/clientes?tipo=&q=&page=&limit=
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { tipo, q, page, limit } = req.query;
    const pageNum = Math.max(1, parseInt(String(page || "1")));
    const limitNum = Math.min(200, Math.max(1, parseInt(String(limit || "50"))));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (tipo) {
      if (tipo === "produtor") where.tipo = { in: ["produtor", "ambos"] };
      else if (tipo === "comprador") where.tipo = { in: ["comprador", "ambos"] };
      else where.tipo = String(tipo);
    }
    if (q) {
      where.OR = [
        { nome: { contains: String(q), mode: "insensitive" } },
        { cpfCnpj: { contains: String(q) } },
        { cidade: { contains: String(q), mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.cliente.findMany({ where, orderBy: { nome: "asc" }, skip, take: limitNum }),
      prisma.cliente.count({ where }),
    ]);

    res.json({
      data,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/clientes/:id
router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: String(req.params.id) } });
    if (!cliente) throw new AppError(404, "Cliente não encontrado.", "NOT_FOUND");
    res.json(cliente);
  } catch (err) {
    next(err);
  }
});

// POST /api/clientes — admin only
router.post("/", authMiddleware, adminOnly, validate(clienteSchema), async (req, res, next) => {
  try {
    const data = req.body;
    const existing = await prisma.cliente.findUnique({ where: { cpfCnpj: data.cpfCnpj } });
    if (existing) throw new AppError(409, "CPF/CNPJ já cadastrado.", "DUPLICATE");

    const cliente = await prisma.cliente.create({ data });
    res.status(201).json(cliente);
  } catch (err) {
    next(err);
  }
});

// PUT /api/clientes/:id — admin only
router.put("/:id", authMiddleware, adminOnly, validate(clienteUpdateSchema), async (req, res, next) => {
  try {
    const data = req.body;
    delete (data as any).id;

    const cliente = await prisma.cliente.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json(cliente);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/clientes/:id — admin only
router.delete("/:id", authMiddleware, adminOnly, async (req, res, next) => {
  try {
    await prisma.cliente.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
