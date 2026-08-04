import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();
const userController = new UserController();

// All routes require token
router.use(verifyToken as any);

// Address Book routes (Customer/Logged In User)
router.get("/addresses", userController.getAddresses as any);
router.post("/addresses", userController.addAddress as any);
router.put("/addresses/:id/default", userController.setDefaultAddress as any);
router.delete("/addresses/:id", userController.deleteAddress as any);

// Admin routes
router.get("/", authorizeRoles("Admin") as any, userController.getUsers as any);
router.patch("/:id/status", authorizeRoles("Admin") as any, userController.updateUserStatus as any);

export default router;
