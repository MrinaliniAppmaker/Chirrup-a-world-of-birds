import { Router, type ErrorRequestHandler, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import {
  DeleteJournalBirdParams, ListJournalBirdsResponse, RegisterJournalInstallationResponse,
  RequestJournalPortraitBody, RequestJournalPortraitResponse, SaveJournalBirdBody, SaveJournalBirdResponse,
} from "@workspace/api-zod";
import {
  authenticateInstallation, createInstallation, deleteSavedBird, JournalFullError,
  listSavedBirds, persistSavedBird, presentSavedBird,
} from "../lib/journalRepository";
import { authorizePortrait, deletePortrait, ownsPortrait, validBirdId, validatePortrait } from "../lib/journalPortraits";

const router: IRouter = Router();
const registrationLimit = rateLimit({
  windowMs: 60 * 60_000, limit: 100, standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: "Too many new journals. Please try again later." },
});

router.post("/journal/installations", registrationLimit, async (_req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  res.status(201).json(RegisterJournalInstallationResponse.parse(await createInstallation()));
});

router.use("/journal", async (req, res, next): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const authorization = req.get("Authorization") ?? "";
  const installationId = await authenticateInstallation(authorization.startsWith("Bearer ") ? authorization.slice(7) : "");
  if (!installationId) {
    res.status(401).json({ error: "This journal could not be authorized. Your on-device birds have not been changed." });
    return;
  }
  res.locals.installationId = installationId;
  next();
});
router.use("/journal", rateLimit({
  windowMs: 10 * 60_000, limit: 600, keyGenerator: (_req, res) => res.locals.installationId as string,
  standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: "Your journal is busy. Please try again in a few minutes." },
}));

router.get("/journal/birds", async (_req, res): Promise<void> => {
  const records = await listSavedBirds(res.locals.installationId);
  const birds = [];
  // Avoid overwhelming the signing sidecar when recovering a full journal.
  for (let start = 0; start < records.length; start += 10) {
    birds.push(...await Promise.all(records.slice(start, start + 10).map(presentSavedBird)));
  }
  res.json(ListJournalBirdsResponse.parse(birds));
});

router.post("/journal/portraits", async (req, res): Promise<void> => {
  const parsed = RequestJournalPortraitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a valid portrait smaller than 8 MB." });
    return;
  }
  res.json(RequestJournalPortraitResponse.parse(
    await authorizePortrait(res.locals.installationId, parsed.data.birdId),
  ));
});

router.post("/journal/birds", async (req, res): Promise<void> => {
  const parsed = SaveJournalBirdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "The bird's journal details could not be read." });
    return;
  }
  const { bird, portraitPath } = parsed.data;
  const installationId = res.locals.installationId as string;
  if (!validBirdId(bird.id) || !ownsPortrait(installationId, bird.id, portraitPath)) {
    res.status(400).json({ error: "This portrait does not belong to this bird and journal." });
    return;
  }
  if (bird.imageUri !== "" || Object.values(bird).some(value => typeof value === "string" && value.length > 12_000)) {
    res.status(400).json({ error: "Send only field notes here; upload the portrait separately." });
    return;
  }
  try {
    await validatePortrait(portraitPath);
  } catch {
    res.status(400).json({ error: "The portrait upload is missing or invalid. Please try saving again." });
    return;
  }
  try {
    const saved = await persistSavedBird(installationId, bird, portraitPath);
    // A retry after a lost response must not replace the already committed photo.
    if (saved.portraitPath !== portraitPath) await deletePortrait(portraitPath).catch(() => {});
    res.json(SaveJournalBirdResponse.parse(await presentSavedBird(saved)));
  } catch (error) {
    if (!(error instanceof JournalFullError)) throw error;
    await deletePortrait(portraitPath).catch(() => {});
    res.status(409).json({ error: "Your journal holds up to 100 birds. Remove one before saving another." });
  }
});

router.delete("/journal/birds/:birdId", async (req, res): Promise<void> => {
  const parsed = DeleteJournalBirdParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid bird identifier." });
    return;
  }
  const deleted = await deleteSavedBird(res.locals.installationId, parsed.data.birdId);
  if (deleted) {
    await deletePortrait(deleted.portraitPath).catch(() => {
      req.log.warn("Removed journal entry; private portrait cleanup will need retrying.");
    });
  }
  res.status(204).end();
});

const journalError: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (!req.path.startsWith("/journal")) { next(error); return; }
  // Do not log credentials, signed URLs, or full storage SDK errors.
  req.log.error({ errorName: error instanceof Error ? error.name : "UnknownError" }, "Journal backend request failed");
  res.status(503).json({ error: "Your journal backend is temporarily unavailable. Your on-device birds are unchanged. Please retry." });
};
router.use(journalError);

export default router;
