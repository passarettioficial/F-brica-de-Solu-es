import express, { type Express, type NextFunction, type Request, type Response } from "express";
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

const app: Express = express();
app.set("trust proxy", 1);

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
