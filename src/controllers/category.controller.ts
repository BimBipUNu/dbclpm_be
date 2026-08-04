import { Request, Response } from "express";
import { CategoryService } from "../services/category.service";
import { CreateCategoryInput } from "../types/category.types";

const categoryService = new CategoryService();

export class CategoryController {
  public async getCategories(req: Request, res: Response) {
    try {
      const tree = await categoryService.getCategoryTree();
      res.status(200).json(tree);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  public async createCategory(req: Request<{}, {}, CreateCategoryInput>, res: Response) {
    try {
      const { category_name, description, parent_id } = req.body;
      if (!category_name) {
        return res.status(400).json({ message: "Category name is required" });
      }

      const category = await categoryService.createCategory({
        category_name,
        description,
        parent_id,
      });

      res.status(201).json({ message: "Category created successfully", data: category });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  public async updateCategory(req: Request, res: Response) {
    try {
      const categoryId = parseInt(req.params.id as string);
      const data = req.body;
      const category = await categoryService.updateCategory(categoryId, data);
      res.status(200).json({ message: "Category updated successfully", data: category });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  public async deleteCategory(req: Request, res: Response) {
    try {
      const categoryId = parseInt(req.params.id as string);
      await categoryService.deleteCategory(categoryId);
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Internal server error" });
    }
  }
}
