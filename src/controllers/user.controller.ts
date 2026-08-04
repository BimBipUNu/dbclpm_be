import { Request, Response } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

export class UserController {
  public async getUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search ? String(req.query.search) : undefined;

      const result = await userService.getUsers(page, limit, search);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  public async updateUserStatus(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id as string);
      const { status } = req.body;

      if (!status || !["Active", "Inactive", "Banned"].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }

      const user = await userService.updateUserStatus(userId, status as any);
      res.status(200).json({ message: "Cập nhật trạng thái thành công", data: user });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }
}
