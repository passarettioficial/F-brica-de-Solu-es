import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import phasesRouter from "./phases";
import usersRouter from "./users";
import billingRouter from "./billing";
import advisorRouter from "./advisor";
import validationRouter from "./validation";
import adminRouter from "./admin";
import notificationsRouter from "./notifications";
import supportRouter from "./support";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(phasesRouter);
router.use(usersRouter);
router.use(billingRouter);
router.use(advisorRouter);
router.use(validationRouter);
router.use(adminRouter);
router.use(notificationsRouter);
router.use(supportRouter);

export default router;
