import { Router, type IRouter } from "express";
import { publicLegalPage } from "../lib/publicLegalPages";

const router: IRouter = Router();

router.use((_req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "public, max-age=300");
  next();
});

router.get("/privacy", (_req, res) => {
  res.type("html").send(publicLegalPage("privacy"));
});
router.get("/delete-account", (_req, res) => {
  res.type("html").send(publicLegalPage("delete-account"));
});

export default router;
