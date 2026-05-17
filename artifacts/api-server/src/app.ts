import express, { type Express, type Request, type Response } from "express";
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

app.use(cors({ credentials: true, origin: true }));

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

app.use("/api", globalLimiter);
app.post("/api/projects/:projectId/phases/:phaseNumber/execute", aiExecuteLimiter);

app.use("/api", router);

export default app;
