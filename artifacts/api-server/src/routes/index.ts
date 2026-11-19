import { Router, type IRouter } from "express";
import healthRouter from "./health";
import birdsRouter from "./birds";
import journalRouter from "./journal";
import birdSharesRouter from "./bird-shares";

const router: IRouter = Router();

router.use(healthRouter);
router.use(birdSharesRouter);
router.use(journalRouter);
router.use(birdsRouter);

export default router;
