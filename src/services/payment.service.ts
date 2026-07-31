import { payOS } from "../config/payos.config";

export class PaymentService {
  /**
   * Tạo link thanh toán PayOS
   * @param orderId Mã đơn hàng trong DB
   * @param amount Tổng tiền
   * @param description Mô tả (tối đa 25 kí tự)
   * @returns URL thanh toán
   */
  public async createPayOSPaymentUrl(
    orderId: number,
    amount: number,
    description: string
  ): Promise<string> {
    const DOMAIN = process.env.CORS_ORIGIN || "http://localhost:3000";
    
    // PayOS orderCode requires a number < 9007199254740991
    // We can use the Database orderId directly or generate a unique timestamp-based one.
    // For simplicity, we append timestamp to orderId to avoid duplicate code in dev environment.
    const orderCode = Number(String(Date.now()).slice(-6) + String(orderId));

    const body: any = {
      orderCode: orderCode,
      amount: amount,
      description: description.substring(0, 25),
      returnUrl: `${DOMAIN}/checkout/success?order_id=${orderId}`,
      cancelUrl: `${DOMAIN}/checkout/cancel?order_id=${orderId}`,
    };

    try {
      const paymentLink = await payOS.paymentRequests.create(body);
      return paymentLink.checkoutUrl;
    } catch (error: any) {
      console.error("PayOS Error: ", error);
      throw new Error("Lỗi khi tạo link thanh toán PayOS");
    }
  }

  // Webhook handling will be added if required
}
