import { Router } from "express";
import { BlogCategoryController } from "../controllers/blogCategory.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();
const blogCategoryController = new BlogCategoryController();

// Public: lấy danh sách (dùng cho dropdown ở form tạo blog)
router.get("/", blogCategoryController.getAll as any);

// Admin only
router.use(verifyToken as any);
router.use(authorizeRoles("Admin") as any);

router.post("/", blogCategoryController.create as any);
router.put("/:id", blogCategoryController.update as any);
router.delete("/:id", blogCategoryController.delete as any);

export default router;
