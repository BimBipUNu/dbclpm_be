import { Request, Response } from "express";
import { ProductService } from "../services/product.service";
import { CreateProductInput } from "../types/product.types";

const productService = new ProductService();

export class ProductController {
  public async createProduct(req: Request<{}, {}, CreateProductInput>, res: Response) {
    try {
      const data = req.body;
      // Basic validation
      if (!data.product_name || !data.brand_id || !data.product_type) {
        return res.status(400).json({ message: "Thiếu trường dữ liệu bắt buộc (product_name, brand_id, product_type)" });
      }

      if (!data.variants || data.variants.length === 0) {
        return res.status(400).json({ message: "Sản phẩm phải có ít nhất 1 biến thể (Variant)" });
      }

      const product = await productService.createProduct(data);
      res.status(201).json({ message: "Tạo sản phẩm thành công", data: product });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  public async getProductDetail(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.id as string);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
      }

      const product = await productService.getProductDetail(productId);
      res.status(200).json(product);
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  public async getProducts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as any) || 1;
      const limit = parseInt(req.query.limit as any) || 10;
      const categoryId = req.query.category_id ? parseInt(req.query.category_id as any) : undefined;

      const result = await productService.getProducts(page, limit, categoryId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }
}
