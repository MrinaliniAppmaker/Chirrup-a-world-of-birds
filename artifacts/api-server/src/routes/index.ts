import { Router, type IRouter } from "express";
import healthRouter from "./health";
import birdsRouter from "./birds";
import journalRouter from "./journal";

const router: IRouter = Router();

router.use(healthRouter);
router.use(journalRouter);
router.use(birdsRouter);

export default router;
