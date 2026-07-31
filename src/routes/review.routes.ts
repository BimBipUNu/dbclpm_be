import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();
const reviewController = new ReviewController();

// Public routes
router.get("/product/:id", reviewController.getProductReviews as any);

// Customer routes
router.post("/", verifyToken as any, reviewController.createReview as any);

// Admin routes
router.put("/:id/status", [verifyToken, authorizeRoles("Admin")] as any, reviewController.updateReviewStatus as any);

export default router;
