import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();
const categoryController = new CategoryController();

// Public routes
router.get("/", categoryController.getCategories);

// Protected routes (Admin only)
router.post("/", verifyToken as any, authorizeRoles("Admin") as any, categoryController.createCategory as any);
router.put("/:id", verifyToken as any, authorizeRoles("Admin") as any, categoryController.updateCategory as any);
router.delete("/:id", verifyToken as any, authorizeRoles("Admin") as any, categoryController.deleteCategory as any);

export default router;
