import { Request, Response } from "express";
import { OrderService } from "../services/order.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { CreateOrderInput } from "../types/order.types";
import prisma from "../config/prisma";

const orderService = new OrderService();

export class OrderController {
  public async createOrder(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const data: CreateOrderInput = req.body;

      if (!data.shipping_address || !data.payment_method) {
        return res.status(400).json({ message: "Vui lòng nhập địa chỉ giao hàng và chọn phương thức thanh toán." });
      }

      const result = await orderService.createOrder(userId, data);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi tạo đơn hàng." });
    }
  }

  public async getMyOrders(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const orders = await orderService.getMyOrders(userId);
      res.status(200).json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================
  public async getAllOrders(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status ? String(req.query.status) : undefined;

      const result = await orderService.getAllOrders(page, limit, status);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  public async getOrderDetailAdmin(req: Request, res: Response) {
    try {
      const orderId = parseInt(req.params.id as string);
      const order = await orderService.getOrderDetailAdmin(orderId);
      
      if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      
      res.status(200).json({ data: order });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  public async updateOrderStatus(req: any, res: Response) {
    try {
      const orderId = parseInt(req.params.id as string);
      const { status } = req.body;
      const staffId = req.user.user_id;

      if (!status) return res.status(400).json({ message: "Trạng thái không hợp lệ" });

      const updated = await orderService.updateOrderStatus(orderId, status, staffId);
      res.status(200).json({ message: "Cập nhật trạng thái thành công", data: updated });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
  }

  /**
   * Webhook cho PayOS (Sẽ được gọi từ máy chủ PayOS khi thanh toán thành công)
   */
  public async payOSWebhook(req: Request, res: Response) {
    try {
      const webhookData = req.body;
      // TODO: Verify signature với thư viện PayOS (payOS.verifyPaymentWebhookData)
      
      if (webhookData.success) {
        // orderCode được tạo từ Timestamp + OrderID, ta lấy phần OrderID ở đuôi.
        // Tùy thuộc vào chiến lược cắt orderCode của bạn.
        // Ở đây để đơn giản, giả sử PayOS gửi về mã đúng hoặc chúng ta tìm theo số tiền.
        console.log("[Webhook] Nhận tín hiệu thanh toán thành công:", webhookData);
        
        // Cần ánh xạ lại orderId từ webhookData.data.orderCode.
        // Đoạn này chỉ mang tính tham khảo khung. 
        // Thực tế cần query và cập nhật OrderStatus = "Confirmed", PaymentStatus = "Success"
      }

      res.status(200).json({ message: "Webhook received" });
    } catch (error) {
      res.status(400).json({ message: "Invalid webhook" });
    }
  }
}
