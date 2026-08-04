import { Router } from "express";
import { BlogController } from "../controllers/blog.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();
const blogController = new BlogController();

// Public routes
router.get("/", blogController.getBlogs as any);
router.get("/categories", blogController.getBlogCategories as any);
router.get("/slug/:slug", blogController.getBlogBySlug as any);

// Admin routes
router.use(verifyToken as any);
router.use(authorizeRoles("Admin") as any);

router.get("/admin", blogController.getAllBlogsAdmin as any);
router.get("/admin/:id", blogController.getBlogById as any);
router.post("/", blogController.createBlog as any);
router.put("/:id", blogController.updateBlog as any);
router.delete("/:id", blogController.deleteBlog as any);

export default router;
