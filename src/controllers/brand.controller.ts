import { Request, Response } from "express";
import { BrandService } from "../services/brand.service";

const brandService = new BrandService();

export class BrandController {
  public async getBrands(req: Request, res: Response) {
    try {
      const brands = await brandService.getBrands();
      res.status(200).json(brands);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  public async createBrand(req: Request, res: Response) {
    try {
      const { brand_name, country, description } = req.body;
      if (!brand_name) {
        return res.status(400).json({ message: "Brand name is required" });
      }

      const brand = await brandService.createBrand({ brand_name, country, description });
      res.status(201).json({ message: "Brand created successfully", data: brand });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  public async updateBrand(req: Request, res: Response) {
    try {
      const brandId = parseInt(req.params.id as string);
      const data = req.body;
      const brand = await brandService.updateBrand(brandId, data);
      res.status(200).json({ message: "Brand updated successfully", data: brand });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  public async deleteBrand(req: Request, res: Response) {
    try {
      const brandId = parseInt(req.params.id as string);
      await brandService.deleteBrand(brandId);
      res.status(200).json({ message: "Brand deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Internal server error" });
    }
  }
}
