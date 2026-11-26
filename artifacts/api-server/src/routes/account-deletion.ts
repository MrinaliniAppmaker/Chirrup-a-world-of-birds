import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { GetAccountDeletionResponse, RequestAccountDeletionBody, RequestAccountDeletionResponse } from "@workspace/api-zod";
import { AccountDeletionBlocked, cancelDeletion, getDeletionRequest, publicDeletionState, requestDeletion } from "../lib/accountDeletion";

const router: IRouter = Router();
router.use("/account/deletion", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (!getAuth(req).userId) { res.status(401).json({ error: "Sign in to manage deletion of your own account." }); return; }
  next();
}, rateLimit({
  windowMs: 60 * 60_000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false,
  keyGenerator: req => getAuth(req).userId!,
}));
router.get("/account/deletion", async (req, res) => {
  res.json(GetAccountDeletionResponse.parse(publicDeletionState(await getDeletionRequest(getAuth(req).userId!))));
});
router.post("/account/deletion", async (req, res) => {
  const input = RequestAccountDeletionBody.safeParse(req.body);
  if (!input.success) { res.status(400).json({ error: "Type DELETE to confirm your request." }); return; }
  res.json(RequestAccountDeletionResponse.parse(publicDeletionState(await requestDeletion(getAuth(req).userId!))));
});
router.delete("/account/deletion", async (req, res) => {
  try {
    await cancelDeletion(getAuth(req).userId!);
    res.status(204).end();
  } catch (error) {
    if (error instanceof AccountDeletionBlocked) { res.status(409).json({ error: "Deletion is already being processed and cannot be cancelled here." }); return; }
    throw error;
  }
});
export default router;
