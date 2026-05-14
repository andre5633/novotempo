import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import clientesRouter from "./routes/clientes";
import contratosRouter from "./routes/contratos";
import carregamentosRouter from "./routes/carregamentos";
import transacoesRouter from "./routes/transacoes";
import dashboardRouter from "./routes/dashboard";
import authRouter from "./routes/auth";
import motoristasRouter from "./routes/motoristas";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// ── Trust proxy (for rate limit behind nginx/caddy) ───────────────────────────
app.set("trust proxy", 1);

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // Permitir: sem origin (SSR), localhost, ou domínios específicos no .env
    // Além de permitir qualquer subdomínio da vercel.app para facilitar o teste
    if (!origin || 
        allowedOrigins.includes(origin) || 
        origin.includes("localhost") || 
        origin.endsWith(".vercel.app")) {
      return cb(null, true);
    }
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos.", code: "RATE_LIMIT" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos.", code: "AUTH_RATE_LIMIT" },
});

app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/clientes", clientesRouter);
app.use("/api/contratos", contratosRouter);
app.use("/api/carregamentos", carregamentosRouter);
app.use("/api/transacoes", transacoesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/auth", authRouter);
app.use("/api/motoristas", motoristasRouter);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend rodando na porta ${port} [${process.env.NODE_ENV || "development"}]`);
});

export default app;
