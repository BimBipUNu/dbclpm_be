import { Request, Response } from "express";
import { BlogService } from "../services/blog.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { CreateBlogInput } from "../types/blog.types";

const blogService = new BlogService();

export class BlogController {
  public async createBlog(req: AuthRequest, res: Response) {
    try {
      const authorId = req.user!.id;
      const data: CreateBlogInput = req.body;

      if (!data.title || !data.blog_category_id) {
        return res.status(400).json({ message: "Thiếu thông tin tiêu đề hoặc danh mục." });
      }

      const result = await blogService.createBlog(authorId, data);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi tạo Blog." });
    }
  }

  public async getBlogs(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : undefined;
      
      const result = await blogService.getBlogs(page, limit, categoryId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi hệ thống." });
    }
  }

  public async getBlogBySlug(req: Request, res: Response) {
    try {
      const slug = req.params.slug as string;
      const result = await blogService.getBlogBySlug(slug);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(404).json({ message: error.message || "Không tìm thấy bài viết." });
    }
  }
}
