import { Request, Response } from "express";
import { BlogCategoryService } from "../services/blogCategory.service";

const blogCategoryService = new BlogCategoryService();

export class BlogCategoryController {
  public async getAll(_req: Request, res: Response) {
    try {
      const categories = await blogCategoryService.getAll();
      res.status(200).json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const { category_name, description } = req.body;
      if (!category_name) {
        return res.status(400).json({ message: "Tên danh mục không được để trống" });
      }
      const result = await blogCategoryService.create({ category_name, description });
      res.status(201).json({ message: "Tạo danh mục thành công", data: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi tạo danh mục" });
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await blogCategoryService.update(id, req.body);
      res.status(200).json({ message: "Cập nhật danh mục thành công", data: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi cập nhật danh mục" });
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      await blogCategoryService.delete(id);
      res.status(200).json({ message: "Xóa danh mục thành công" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi xóa danh mục" });
    }
  }
}
