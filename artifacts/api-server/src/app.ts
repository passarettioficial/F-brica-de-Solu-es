import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { handleStripeWebhook } from "./routes/billing";
import { recordRequest } from "./lib/metrics";

const app: Express = express();
app.set("trust proxy", 1);

// Cabeçalhos de segurança HTTP (CSP/HSTS/X-Frame-Options/nosniff/etc). Esta API só serve
// JSON, então a CSP padrão do helmet (pensada para páginas HTML) é inofensiva aqui — o que
// importa é frameguard/nosniff/HSTS. crossOriginResourcePolicy é relaxado para "cross-origin"
// porque o frontend (artifacts/fabrica) roda numa origem/porta diferente por design e
// consome esta API via fetch com CORS, não same-origin.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// Lightweight in-process request metrics (see lib/metrics.ts) — registered early so the
// "finish" listener is attached before any handler runs; req.route is populated by Express
// once the matching route handler is invoked, which always happens before "finish" fires.
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const routePath = (req.route as { path?: string } | undefined)?.path;
    const route = routePath ? `${req.method} ${req.baseUrl}${routePath}` : `${req.method} ${req.path}`;
    recordRequest(route, res.statusCode, durationMs);
  });
  next();
});

const allowedOrigins = new Set<string>(
  [process.env.APP_BASE_URL, ...(process.env.CORS_ALLOWED_ORIGINS?.split(",") ?? [])]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin)),
);

if (allowedOrigins.size === 0) {
  logger.warn(
    "CORS: nenhuma origem configurada via APP_BASE_URL/CORS_ALLOWED_ORIGINS — apenas requisições same-origin serão aceitas",
  );
}

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Requests without an Origin header (same-origin, curl, server-to-server) are always allowed.
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origem não permitida por CORS: ${origin}`));
    },
  }),
);

// Stripe webhook MUST be registered BEFORE express.json() (needs raw body)
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), (req: Request, res: Response) => {
  handleStripeWebhook(req, res);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// Global rate limit — protects all /api routes from abuse
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
  skip: (req) => req.path.startsWith("/api/healthz"),
});

// Strict limit for AI execution — prevents burst abuse
const aiExecuteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 6,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Limite de execuções de IA por minuto atingido. Aguarde 1 minuto." },
});

// AI Advisor: cada mensagem custa tokens GPT-4.1 reais (até 2000 max_completion_tokens),
// igual à geração de fases — sem isso era o único fluxo de IA sem teto de burst por minuto.
const advisorLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 6,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Limite de mensagens ao AI Advisor por minuto atingido. Aguarde 1 minuto." },
});

// Coupon code enumeration is cheap to brute-force without a dedicated limit — both the
// billing and admin-namespaced validation endpoints check the same codes.
const couponValidateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Muitas tentativas de validar cupom. Aguarde um minuto." },
});

// Prevents ticket-spam abuse of the support inbox.
const supportTicketLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Muitos tickets criados. Tente novamente mais tarde." },
});

app.use("/api", globalLimiter);
app.post("/api/projects/:projectId/phases/:phaseNumber/execute", aiExecuteLimiter);
app.post("/api/projects/:projectId/advisor", advisorLimiter);
// Mesmo teto de burst do execute/advisor — estes 4 endpoints também custam OpenAI real
// (checkAndIncrementAiUsage) e antes só tinham o globalLimiter genérico de 300/15min.
app.post("/api/projects/:id/coherence/analyze", aiExecuteLimiter);
app.post("/api/projects/:id/potential/analyze", aiExecuteLimiter);
app.post("/api/projects/:projectId/validations/:validationId/generate-script", aiExecuteLimiter);
app.post("/api/projects/:projectId/validations/:validationId/analyze", aiExecuteLimiter);
app.post("/api/billing/validate-coupon", couponValidateLimiter);
app.post("/api/admin/coupons/validate", couponValidateLimiter);
app.post("/api/support/tickets", supportTicketLimiter);

app.use("/api", router);

// Global error handler — must be registered last and declare all 4 params
// for Express to recognize it as an error-handling middleware.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;

  const message = err instanceof Error ? err.message : "Unknown error";
  const isCorsRejection = message.startsWith("Origem não permitida por CORS");

  req.log?.error({ err }, "Unhandled error");

  res.status(isCorsRejection ? 403 : 500).json({
    error: isCorsRejection ? "Origem não permitida." : "Erro interno do servidor.",
  });
});

export default app;
