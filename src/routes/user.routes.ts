import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();
const userController = new UserController();

// Require Admin rights to manage users
router.use(verifyToken as any);
router.use(authorizeRoles("Admin") as any);

router.get("/", userController.getUsers as any);
router.patch("/:id/status", userController.updateUserStatus as any);

export default router;
