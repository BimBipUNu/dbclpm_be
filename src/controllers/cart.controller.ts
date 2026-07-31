import { Request, Response } from "express";
import { CartService } from "../services/cart.service";
import { AddToCartInput, UpdateCartItemInput } from "../types/cart.types";
import { AuthRequest } from "../middlewares/auth.middleware";

const cartService = new CartService();

export class CartController {
  public async getCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const result = await cartService.getCart(userId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  public async addToCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const data: AddToCartInput = req.body;

      if (!data.variant_id || !data.quantity || data.quantity <= 0) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
      }

      const result = await cartService.addToCart(userId, data);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  public async updateCartItem(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const variantId = parseInt(req.params.variant_id as string);
      const data: UpdateCartItemInput = req.body;

      if (isNaN(variantId) || data.quantity === undefined || data.quantity < 0) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
      }

      const result = await cartService.updateCartItem(userId, variantId, data);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  public async removeFromCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const variantId = parseInt(req.params.variant_id as string);

      if (isNaN(variantId)) {
        return res.status(400).json({ message: "ID biến thể không hợp lệ." });
      }

      await cartService.removeFromCart(userId, variantId);
      res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng." });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
