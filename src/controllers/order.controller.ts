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
      res.status(500).json({ message: "Lỗi hệ thống." });
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
