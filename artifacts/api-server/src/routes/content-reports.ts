import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { SubmitContentReportBody, SubmitContentReportResponse } from "@workspace/api-zod";
import { InvalidReferenceError } from "../lib/encounterReference";
import { ReportConflictError, storeContentReport } from "../lib/contentReports";
import { logger } from "../lib/logger";

const router: IRouter = Router();
router.post("/content-reports", rateLimit({
  windowMs: 60 * 60_000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: "Too many reports. Please try again later." },
}), async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const parsed = SubmitContentReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a reason and keep the report within the displayed limits." }); return;
  }
  try {
    const result = await storeContentReport(parsed.data);
    res.status(result.created ? 201 : 200).json(SubmitContentReportResponse.parse({ id: result.id, received: true }));
  } catch (error) {
    if (error instanceof ReportConflictError) {
      res.status(409).json({ error: "This report identifier was already used. Close the form and start a new report." }); return;
    }
    if (error instanceof InvalidReferenceError) {
      res.status(400).json({ error: "The attached picture could not be read. Try sending the report without its picture." }); return;
    }
    // Do not log offensive content, image bytes, personal details or signed URLs.
    logger.error({ reportId: parsed.data.submissionId }, "Content report could not be stored");
    res.status(503).json({ error: "Your report was not confirmed. Your text is kept; please retry." });
  }
});
export default router;
