import { Router } from "express";
import { BlogController } from "../controllers/blog.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();
const blogController = new BlogController();

// Public routes
router.get("/", blogController.getBlogs as any);
router.get("/:slug", blogController.getBlogBySlug as any);

// Admin routes
router.post("/", [verifyToken, authorizeRoles("Admin")] as any, blogController.createBlog as any);

export default router;
