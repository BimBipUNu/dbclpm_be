import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();
const dashboardController = new DashboardController();

router.use(verifyToken as any);
router.use(authorizeRoles("Admin") as any);

router.get("/overview", dashboardController.getOverview as any);

export default router;
