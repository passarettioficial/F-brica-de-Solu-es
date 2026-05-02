import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import phasesRouter from "./phases";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(phasesRouter);
router.use(usersRouter);

export default router;
