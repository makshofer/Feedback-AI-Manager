import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import feedbacksRouter from "./feedbacks";
import usersRouter from "./users";
import adminRouter from "./admin";
import projectsRouter from "./projects";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(feedbacksRouter);
router.use(usersRouter);
router.use(adminRouter);
router.use(projectsRouter);

export default router;
