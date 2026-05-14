import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, adminOnly, operacionalOrAdmin } from "../middleware/auth";
import { validate, carregamentoSchema, carregamentoUpdateSchema } from "../middleware/validate";
import { AppError } from "../middleware/errorHandler";
import { generateNumeroId } from "../lib/utils";

const router = Router();

// GET /api/carregamentos?contratoId=&dataInicio=&dataFim=&comprador=&produtor=&page=&limit=
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { contratoId, dataInicio, dataFim, comprador, produtor, page, limit } = req.query;
    const pageNum = Math.max(1, parseInt(String(page || "1")));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || "20"))));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (contratoId) where.contratoId = String(contratoId);
    if (dataInicio || dataFim) {
      where.dataEnvio = {};
      if (dataInicio) where.dataEnvio.gte = new Date(String(dataInicio));
      if (dataFim) where.dataEnvio.lte = new Date(String(dataFim) + "T23:59:59");
    }
    if (comprador) where.contrato = { ...where.contrato, comprador: { nome: { contains: String(comprador), mode: "insensitive" } } };
    if (produtor) where.contrato = { ...where.contrato, produtor: { nome: { contains: String(produtor), mode: "insensitive" } } };

    const [data, total] = await Promise.all([
      prisma.carregamento.findMany({
        where,
        include: { contrato: { include: { comprador: true, produtor: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.carregamento.count({ where }),
    ]);

    res.json({
      data,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/carregamentos — operacional ou admin
router.post("/", authMiddleware, operacionalOrAdmin, validate(carregamentoSchema), async (req, res, next) => {
  try {
    const data = req.body;

    // ── Guardrail: excess load check ───────────────────────────────────────
    const contrato = await prisma.contrato.findUnique({
      where: { id: data.contratoId },
      include: { carregamentos: true },
    });

    if (!contrato) throw new AppError(404, "Contrato não encontrado.", "NOT_FOUND");

    const sacasJaCarregadas = contrato.carregamentos.reduce((s, c) => s + c.qntSacas, 0);
    const saldoDisponivel = contrato.numSacas - sacasJaCarregadas;

    if (data.qntSacas > saldoDisponivel) {
      throw new AppError(
        422,
        `Excesso de carga: saldo disponível é ${saldoDisponivel.toLocaleString("pt-BR")} sacas, mas foram informadas ${data.qntSacas.toLocaleString("pt-BR")} sacas.`,
        "EXCESS_LOAD"
      );
    }
    // ──────────────────────────────────────────────────────────────────────

    const numeroId = generateNumeroId("CAR");
    const carregamento = await prisma.carregamento.create({
      data: {
        numeroId,
        contratoId: data.contratoId,
        corretor: data.corretor ?? null,
        motorista: data.motorista ?? null,
        produto: data.produto ?? null,
        observacoes: data.observacoes ?? null,
        pesoKg: data.pesoKg,
        qntSacas: data.qntSacas,
        valorCarga: data.valorCarga,
        refPeso: data.refPeso,
        refValorSaca: data.refValorSaca,
        umidadeSorgo: data.umidadeSorgo ?? null,
        dataEnvio: data.dataEnvio ? new Date(data.dataEnvio) : null,
      },
    });

    res.status(201).json(carregamento);
  } catch (err) {
    next(err);
  }
});

// PUT /api/carregamentos/:id — operacional ou admin
router.put("/:id", authMiddleware, operacionalOrAdmin, validate(carregamentoUpdateSchema), async (req, res, next) => {
  try {
    const data = req.body;

    // If updating qntSacas, validate excess against contract balance (excluding this record)
    if (data.qntSacas !== undefined) {
      const existing = await prisma.carregamento.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError(404, "Carregamento não encontrado.", "NOT_FOUND");

      const contrato = await prisma.contrato.findUnique({
        where: { id: existing.contratoId },
        include: { carregamentos: true },
      });
      if (!contrato) throw new AppError(404, "Contrato não encontrado.", "NOT_FOUND");

      const sacasJaCarregadas = contrato.carregamentos
        .filter((c) => c.id !== existing.id)
        .reduce((s, c) => s + c.qntSacas, 0);
      const saldoDisponivel = contrato.numSacas - sacasJaCarregadas;

      if (data.qntSacas > saldoDisponivel) {
        throw new AppError(
          422,
          `Excesso de carga: saldo disponível é ${saldoDisponivel.toLocaleString("pt-BR")} sacas.`,
          "EXCESS_LOAD"
        );
      }
    }

    const updateData: any = { ...data };
    if (data.dataEnvio) updateData.dataEnvio = new Date(data.dataEnvio);

    const carregamento = await prisma.carregamento.update({
      where: { id: String(req.params.id) },
      data: updateData,
    });
    res.json(carregamento);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/carregamentos/:id — admin only
router.delete("/:id", authMiddleware, adminOnly, async (req, res, next) => {
  try {
    await prisma.carregamento.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
