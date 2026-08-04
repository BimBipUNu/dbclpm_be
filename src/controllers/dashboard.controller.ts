import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

const dashboardService = new DashboardService();

export class DashboardController {
  public async getOverview(_req: Request, res: Response) {
    try {
      const result = await dashboardService.getOverview();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }
}
