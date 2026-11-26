import express, { type Express, type ErrorRequestHandler } from "express";
import { AccountDeletionBlocked } from "./lib/accountDeletion";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import publicLegalRouter from "./routes/public-legal";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./middlewares/clerkProxyMiddleware";

const app: Express = express();
// One trusted hop: the managed reverse proxy immediately in front of Express.
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
// Standalone HTML: no Clerk session, app bundle or third-party scripts needed.
app.use("/api/legal", publicLegalRouter);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ credentials: true, origin: true }));
// Up to six compressed portrait references; keep other endpoints' smaller limit.
app.use("/api/birds/interact", express.json({ limit: "9mb" }));
app.use("/api/content-reports", express.json({ limit: "2mb" }));
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

app.use("/api", router);
const deletionError: ErrorRequestHandler = (error, _req, res, next) => {
  if (error instanceof AccountDeletionBlocked) {
    res.status(410).json({ error: "Account deletion is being processed. This journal is no longer writable. Please sign out." });
    return;
  }
  next(error);
};
app.use(deletionError);

export default app;
