import { Router, type ErrorRequestHandler, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { getAuth } from "@clerk/express";
import {
  CreateBirdShareBody, CreateBirdShareResponse, ImportBirdShareBody, ImportBirdShareResponse,
  OpenBirdShareQueryParams, PreviewBirdShareQueryParams, PreviewBirdShareResponse,
} from "@workspace/api-zod";
import { BirdShareUnavailable, createBirdShareLink, findBirdShare, importSharedBird } from "../lib/birdShares";
import { accountJournal, JournalFullError, presentSavedBird } from "../lib/journalRepository";

const router: IRouter = Router();
router.use("/bird-shares", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
}, rateLimit({
  windowMs: 60_000, limit: 90, standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: "Too many sharing requests. Please try again in a minute." },
}));
const creationLimit = rateLimit({
  windowMs: 60 * 60_000, limit: 100, standardHeaders: "draft-8", legacyHeaders: false,
  keyGenerator: (req) => getAuth(req).userId!,
  message: { error: "Too many new links. Existing links still work for seven days." },
});

router.post("/bird-shares", (req, res, next) => {
  if (!getAuth(req).userId) { res.status(401).json({ error: "Sign in to share a bird." }); return; }
  next();
}, creationLimit, async (req, res): Promise<void> => {
  const parsed = CreateBirdShareBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Choose a saved bird to share." }); return; }
  const installationId = await accountJournal(getAuth(req).userId!);
  const link = await createBirdShareLink(installationId, parsed.data.birdId);
  res.status(201).json(CreateBirdShareResponse.parse(link));
});

router.get("/bird-shares/preview", async (req, res): Promise<void> => {
  const parsed = PreviewBirdShareQueryParams.safeParse(req.query);
  if (!parsed.success) throw new BirdShareUnavailable();
  const { share, bird } = await findBirdShare(parsed.data.token);
  res.json(PreviewBirdShareResponse.parse({
    bird: await presentSavedBird(bird), expiresAt: share.expiresAt.toISOString(),
  }));
});

router.post("/bird-shares/import", async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) { res.status(401).json({ error: "Sign in to add this bird to your library." }); return; }
  const parsed = ImportBirdShareBody.safeParse(req.body);
  if (!parsed.success) throw new BirdShareUnavailable();
  const targetId = await accountJournal(userId);
  const bird = await importSharedBird(targetId, parsed.data.token);
  res.json(ImportBirdShareResponse.parse(await presentSavedBird(bird)));
});

const html = (value: string) => value.replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

router.get("/bird-shares/open", async (req, res): Promise<void> => {
  const parsed = OpenBirdShareQueryParams.safeParse(req.query);
  if (!parsed.success) throw new BirdShareUnavailable();
  const { share, bird } = await findBirdShare(parsed.data.token);
  const name = typeof bird.metadata.name === "string" ? bird.metadata.name : "A shared bird";
  // Relative URL retains the real deployment host without trusting Host or a client-supplied redirect.
  const relativeLink = `/api/bird-shares/open?token=${parsed.data.token}`;
  const appLink = `chirrup:///receive-bird?token=${parsed.data.token}`;
  res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  res.type("html").send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>A bird for your CHIRRUP journal</title>
<style>body{margin:0;background:#F5F2EA;color:#1F2A22;font:16px/1.6 system-ui,sans-serif}main{max-width:440px;margin:8vh auto;padding:28px}h1{font:32px Georgia,serif}a.button{display:block;background:#2C4A37;color:#F7F4EC;padding:14px;text-align:center;text-decoration:none;border-radius:6px}small{display:block;color:#6E7266;margin-top:18px}p{overflow-wrap:anywhere}a{color:#2C4A37}</style></head>
<body><main><strong>CHIRRUP · FIELD JOURNAL</strong><h1>${html(name)}</h1>
<p>Someone has shared an imaginary bird with you. Add an exact copy of its portrait, traits and field notes to your own library.</p>
<a class="button" href="${appLink}">Open Chirrup to add this bird</a>
<p>If the button does not open the app, copy this page’s address, open <strong>Share birds</strong> in Chirrup’s Library or Your Profile, and paste it under <strong>Open a shared bird</strong>.</p>
<p><a href="${relativeLink}">Copy this sharing link</a> using your browser’s link menu, or copy the address bar.</p>
<small>Sign in and choose Add to my library. Nothing is added automatically. The link expires ${html(share.expiresAt.toUTCString())}. Anyone with this link can import this bird until then; the rest of the sender’s journal stays private.</small>
</main></body></html>`);
});

const shareError: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (!req.path.startsWith("/bird-shares")) { next(error); return; }
  if (error instanceof BirdShareUnavailable) {
    res.status(404).json({ error: "This sharing link is invalid, has expired, or its bird was removed. Ask the sender for a new link." }); return;
  }
  if (error instanceof JournalFullError) {
    res.status(409).json({ error: "Your library holds up to 100 birds. Remove one before adding this bird." }); return;
  }
  req.log.error({ errorName: error instanceof Error ? error.name : "UnknownError" }, "Bird sharing request failed");
  res.status(503).json({ error: "Sharing is temporarily unavailable. Please try again; your existing birds are unchanged." });
};
router.use(shareError);

export default router;
