import { Router } from "express";
import { BrandController } from "../controllers/brand.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();
const brandController = new BrandController();

// Public routes
router.get("/", brandController.getBrands);

// Protected routes (Admin only)
router.post("/", verifyToken as any, authorizeRoles("Admin") as any, brandController.createBrand as any);
router.put("/:id", verifyToken as any, authorizeRoles("Admin") as any, brandController.updateBrand as any);
router.delete("/:id", verifyToken as any, authorizeRoles("Admin") as any, brandController.deleteBrand as any);

export default router;
