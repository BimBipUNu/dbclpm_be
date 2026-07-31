import cron from "node-cron";
import prisma from "../config/prisma";

export const startCronJobs = () => {
  // Chạy mỗi 1 phút
  cron.schedule("* * * * *", async () => {
    try {
      console.log("[CRON] Đang quét các đơn hàng chưa thanh toán quá 5 phút...");

      // Tìm các Payment đang Pending, thuộc đơn PayOS, và đã tạo quá 5 phút
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const expiredPayments = await prisma.payment.findMany({
        where: {
          payment_status: "Pending",
          payment_method: "PayOS",
          payment_date: {
            lt: fiveMinutesAgo,
          },
          order: {
            order_status: "Pending",
          },
        },
        include: {
          order: {
            include: {
              details: true,
            },
          },
        },
      });

      for (const payment of expiredPayments) {
        await prisma.$transaction(async (tx) => {
          // 1. Cập nhật OrderStatus -> Cancelled
          await tx.order.update({
            where: { order_id: payment.order_id },
            data: { order_status: "Cancelled", note: "Hệ thống tự động hủy do quá hạn thanh toán." },
          });

          // 2. Cập nhật PaymentStatus -> Failed
          await tx.payment.update({
            where: { payment_id: payment.payment_id },
            data: { payment_status: "Failed" },
          });

          // 3. Cộng lại tồn kho (Rollback)
          for (const detail of payment.order.details) {
            await tx.productVariant.update({
              where: { variant_id: detail.variant_id },
              data: { stock_quantity: { increment: detail.quantity } },
            });
          }
        });
        console.log(`[CRON] Đã hủy đơn hàng ${payment.order_id} và hoàn lại tồn kho.`);
      }
    } catch (error) {
      console.error("[CRON] Lỗi khi chạy quét đơn hàng:", error);
    }
  });
};
