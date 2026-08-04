import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { UserAddressService } from "../services/userAddress.service";
import { AuthRequest } from "../middlewares/auth.middleware";

const userService = new UserService();
const userAddressService = new UserAddressService();

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

  // ============================================
  // ADDRESS BOOK ENDPOINTS (Customer)
  // ============================================
  public async getAddresses(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const addresses = await userAddressService.getAddresses(userId);
      res.status(200).json(addresses);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  public async addAddress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { phone, address } = req.body;
      if (!phone || !address) {
        return res.status(400).json({ message: "Vui lòng cung cấp số điện thoại và địa chỉ" });
      }
      const newAddress = await userAddressService.addAddress(userId, phone, address);
      res.status(201).json(newAddress);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  public async setDefaultAddress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const addressId = parseInt(req.params.id as string);
      const updated = await userAddressService.setDefaultAddress(userId, addressId);
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  public async deleteAddress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const addressId = parseInt(req.params.id as string);
      const result = await userAddressService.deleteAddress(userId, addressId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
  }
}
