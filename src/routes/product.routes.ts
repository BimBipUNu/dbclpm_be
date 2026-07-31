import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();
const productController = new ProductController();

// Public routes
router.get("/", productController.getProducts as any);
router.get("/:id", productController.getProductDetail as any);

// Protected routes (Admin only)
router.post("/", verifyToken as any, authorizeRoles("Admin") as any, productController.createProduct as any);

export default router;
