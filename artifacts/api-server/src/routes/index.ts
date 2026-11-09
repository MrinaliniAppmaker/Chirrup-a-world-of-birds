import { Router, type IRouter } from "express";
import healthRouter from "./health";
import birdsRouter from "./birds";

const router: IRouter = Router();

router.use(healthRouter);
router.use(birdsRouter);

export default router;
