import { Router, type IRouter } from "express";
import healthRouter from "./health";
import birdsRouter from "./birds";
import journalRouter from "./journal";
import birdSharesRouter from "./bird-shares";
import contentReportsRouter from "./content-reports";
import accountDeletionRouter from "./account-deletion";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contentReportsRouter);
router.use(accountDeletionRouter);
router.use(birdSharesRouter);
router.use(journalRouter);
router.use(birdsRouter);

export default router;
