import { prismaMock } from "../../config/prismaMock";
import { OrderService } from "../../services/order.service";

jest.mock("../../services/payment.service", () => {
  return {
    PaymentService: jest.fn().mockImplementation(() => ({
      createPayOSPaymentUrl: jest.fn().mockResolvedValue("http://payos.url"),
    })),
  };
});

describe("Order Service", () => {
  let orderService: OrderService;

  beforeEach(() => {
    orderService = new OrderService();
  });

  describe("createOrder", () => {
    it("should throw error if cart is empty", async () => {
      prismaMock.cart.findUnique.mockResolvedValue({ details: [] } as any);
      await expect(
        orderService.createOrder(1, { shipping_address: "Address", payment_method: "COD" })
      ).rejects.toThrow("Giỏ hàng của bạn đang trống.");
    });

    it("should create order successfully and return PayOS URL", async () => {
      prismaMock.cart.findUnique.mockResolvedValue({
        details: [
          {
            cart_detail_id: 1,
            quantity: 2,
            variant_id: 1,
            variant: { price: "100", stock_quantity: 10, allow_backorder: false, sku: "SKU1" },
          },
        ],
      } as any);

      prismaMock.$transaction.mockImplementation(async (cb) => {
        return await cb(prismaMock as any);
      });
      prismaMock.order.create.mockResolvedValue({ order_id: 1 } as any);

      const result = await orderService.createOrder(1, {
        shipping_address: "Address",
        payment_method: "PayOS",
      });

      expect(result.order_id).toBe(1);
      expect(result.payment_url).toBe("http://payos.url");
      expect(result.message).toBe("Tạo đơn hàng thành công.");
    });
  });

  describe("getMyOrders", () => {
    it("should return list of orders", async () => {
      prismaMock.order.findMany.mockResolvedValue([{ order_id: 1 }] as any);
      const result = await orderService.getMyOrders(1);
      expect(result).toHaveLength(1);
    });
  });
});
