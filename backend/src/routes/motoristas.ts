import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, adminOnly } from "../middleware/auth";
import { validate, motoristaSchema, motoristaUpdateSchema } from "../middleware/validate";

const router = Router();

// GET /api/motoristas?q=&page=&limit=
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { q, page, limit } = req.query;
    const pageNum = Math.max(1, parseInt(String(page || "1")));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || "50"))));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (q) {
      where.OR = [
        { nome: { contains: String(q), mode: "insensitive" } },
        { placaCavalo: { contains: String(q), mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.motorista.findMany({
        where,
        orderBy: { nome: "asc" },
        skip,
        take: limitNum,
      }),
      prisma.motorista.count({ where }),
    ]);

    res.json({
      data,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/motoristas — admin only
router.post("/", authMiddleware, adminOnly, validate(motoristaSchema), async (req, res, next) => {
  try {
    const motorista = await prisma.motorista.create({ data: req.body });
    res.status(201).json(motorista);
  } catch (err) {
    next(err);
  }
});

// PUT /api/motoristas/:id — admin only
router.put("/:id", authMiddleware, adminOnly, validate(motoristaUpdateSchema), async (req, res, next) => {
  try {
    const motorista = await prisma.motorista.update({
      where: { id: String(req.params.id) },
      data: req.body,
    });
    res.json(motorista);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/motoristas/:id — admin only
router.delete("/:id", authMiddleware, adminOnly, async (req, res, next) => {
  try {
    await prisma.motorista.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
