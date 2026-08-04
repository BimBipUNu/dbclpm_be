import prisma from "../config/prisma";
import { CreateOrderInput } from "../types/order.types";
import { PaymentService } from "./payment.service";

const paymentService = new PaymentService();

export class OrderService {
  /**
   * Chuyển đổi giỏ hàng thành Đơn hàng
   */
  public async createOrder(userId: number, data: CreateOrderInput) {
    // 1. Lấy giỏ hàng
    const cart = await prisma.cart.findUnique({
      where: { user_id: userId },
      include: {
        details: {
          include: { variant: true }
        }
      }
    });

    if (!cart || cart.details.length === 0) {
      throw new Error("Giỏ hàng của bạn đang trống.");
    }

    // Lọc ra các món khách muốn mua (nếu truyền cart_item_ids)
    let selectedItems = cart.details;
    if (data.cart_item_ids && data.cart_item_ids.length > 0) {
      selectedItems = cart.details.filter(item => data.cart_item_ids?.includes(item.cart_detail_id));
      if (selectedItems.length === 0) throw new Error("Không có sản phẩm nào hợp lệ được chọn.");
    }

    let totalAmount = 0;

    // 2. Thực thi Transaction
    const orderData = await prisma.$transaction(async (tx) => {
      // 2.1 Kiểm tra tồn kho & Tính tổng tiền
      for (const item of selectedItems) {
        if (!item.variant.allow_backorder && item.quantity > item.variant.stock_quantity) {
          throw new Error(`Sản phẩm SKU ${item.variant.sku} chỉ còn ${item.variant.stock_quantity} cái. Không đủ để đặt hàng.`);
        }
        totalAmount += Number(item.variant.price) * item.quantity;
      }

      // 2.2 Tạo Order
      const newOrder = await tx.order.create({
        data: {
          user_id: userId,
          shipping_address: data.shipping_address,
          payment_method: data.payment_method,
          note: data.note ?? null,
          total_amount: totalAmount,
          order_status: "Pending", // Đợi thanh toán hoặc đợi xác nhận (COD)
        }
      });

      // 2.3 Tạo OrderDetail và Trừ tồn kho
      const orderDetailsData = [];
      for (const item of selectedItems) {
        const subtotal = Number(item.variant.price) * item.quantity;
        orderDetailsData.push({
          order_id: newOrder.order_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.variant.price,
          subtotal: subtotal
        });

        // Trừ tồn kho ngay lập tức
        await tx.productVariant.update({
          where: { variant_id: item.variant_id },
          data: { stock_quantity: { decrement: item.quantity } }
        });
      }

      await tx.orderDetail.createMany({ data: orderDetailsData });

      // 2.4 Xóa các món đã mua khỏi Cart
      const itemIdsToRemove = selectedItems.map(i => i.cart_detail_id);
      await tx.cartDetail.deleteMany({
        where: { cart_detail_id: { in: itemIdsToRemove } }
      });

      // 2.5 Tạo Payment Record (Pending)
      await tx.payment.create({
        data: {
          order_id: newOrder.order_id,
          payment_method: data.payment_method,
          amount: totalAmount,
          payment_status: "Pending"
        }
      });

      return newOrder;
    });

    // 3. Gọi cổng thanh toán nếu là PayOS
    let paymentUrl = null;
    if (data.payment_method === "PayOS") {
      paymentUrl = await paymentService.createPayOSPaymentUrl(
        orderData.order_id,
        totalAmount,
        `Thanh toan don hang ${orderData.order_id}`
      );
    }

    return {
      message: "Tạo đơn hàng thành công.",
      order_id: orderData.order_id,
      total_amount: totalAmount,
      payment_url: paymentUrl
    };
  }

  public async getMyOrders(userId: number) {
    return await prisma.order.findMany({
      where: { user_id: userId },
      include: {
        details: { include: { variant: { include: { product: true } } } },
        payments: true
      },
      orderBy: { order_date: "desc" }
    });
  }

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================
  public async getAllOrders(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { order_status: status as any } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { full_name: true, email: true, phone: true } },
          payments: { select: { payment_status: true } }
        },
        orderBy: { order_date: "desc" }
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async getOrderDetailAdmin(orderId: number) {
    return await prisma.order.findUnique({
      where: { order_id: orderId },
      include: {
        user: { select: { full_name: true, email: true, phone: true, address: true } },
        details: { include: { variant: { include: { product: true } } } },
        payments: true
      }
    });
  }

  public async updateOrderStatus(orderId: number, status: string, staffId: number) {
    return await prisma.order.update({
      where: { order_id: orderId },
      data: { 
        order_status: status as any,
        staff_id: staffId
      }
    });
  }
}
