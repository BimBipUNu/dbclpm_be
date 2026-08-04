import { Request, Response } from "express";
import { BlogService } from "../services/blog.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { CreateBlogInput, UpdateBlogInput } from "../types/blog.types";

const blogService = new BlogService();

export class BlogController {
  // =================== PUBLIC ===================
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

  // =================== ADMIN ===================
  public async getAllBlogsAdmin(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status ? String(req.query.status) : undefined;

      const result = await blogService.getAllBlogsAdmin(page, limit, status);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  public async getBlogById(req: Request, res: Response) {
    try {
      const blogId = parseInt(req.params.id as string);
      const result = await blogService.getBlogById(blogId);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(404).json({ message: error.message || "Không tìm thấy bài viết." });
    }
  }

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

  public async updateBlog(req: Request, res: Response) {
    try {
      const blogId = parseInt(req.params.id as string);
      const data: UpdateBlogInput = req.body;
      const result = await blogService.updateBlog(blogId, data);
      res.status(200).json({ message: "Cập nhật bài viết thành công", data: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi cập nhật Blog." });
    }
  }

  public async deleteBlog(req: Request, res: Response) {
    try {
      const blogId = parseInt(req.params.id as string);
      await blogService.deleteBlog(blogId);
      res.status(200).json({ message: "Xóa bài viết thành công" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi xóa Blog." });
    }
  }

  public async getBlogCategories(_req: Request, res: Response) {
    try {
      const categories = await blogService.getBlogCategories();
      res.status(200).json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }
}
