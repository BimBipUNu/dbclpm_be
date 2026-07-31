import { prismaMock } from "../../config/prismaMock";
import { CartService } from "../../services/cart.service";

describe("Cart Service", () => {
  let cartService: CartService;

  beforeEach(() => {
    cartService = new CartService();
  });

  describe("getCart", () => {
    it("should create new cart if not exists and return it", async () => {
      prismaMock.cart.findUnique.mockResolvedValue(null);
      const mockCart = { cart_id: 1, user_id: 1, details: [] } as any;
      prismaMock.cart.create.mockResolvedValue(mockCart);

      const result = await cartService.getCart(1);

      expect(prismaMock.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { user_id: 1 } })
      );
      expect(result.cart).toEqual(mockCart);
      expect(result.total_amount).toBe(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should return cart with warnings if quantity > stock", async () => {
      const mockCart = {
        cart_id: 1,
        user_id: 1,
        details: [
          {
            quantity: 5,
            variant: {
              price: "100",
              stock_quantity: 2,
              sku: "SKU123",
              product: { product_name: "Test Product" },
            },
          },
        ],
      } as any;
      prismaMock.cart.findUnique.mockResolvedValue(mockCart);

      const result = await cartService.getCart(1);

      expect(result.total_amount).toBe(500);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("vượt quá tồn kho sẵn có");
    });
  });

  describe("addToCart", () => {
    it("should throw error if variant not found", async () => {
      prismaMock.cart.findUnique.mockResolvedValue({ cart_id: 1, user_id: 1 } as any);
      prismaMock.productVariant.findUnique.mockResolvedValue(null);

      await expect(cartService.addToCart(1, { variant_id: 1, quantity: 1 })).rejects.toThrow("Không tìm thấy biến thể sản phẩm này.");
    });

    it("should add new detail to cart", async () => {
      prismaMock.cart.findUnique.mockResolvedValue({ cart_id: 1, user_id: 1 } as any);
      prismaMock.productVariant.findUnique.mockResolvedValue({ variant_id: 1, stock_quantity: 10, allow_backorder: false } as any);
      prismaMock.cartDetail.findFirst.mockResolvedValue(null);
      prismaMock.cartDetail.create.mockResolvedValue({} as any);

      const result = await cartService.addToCart(1, { variant_id: 1, quantity: 2 });

      expect(prismaMock.cartDetail.create).toHaveBeenCalledWith({
        data: { cart_id: 1, variant_id: 1, quantity: 2 },
      });
      expect(result.message).toBe("Thêm vào giỏ hàng thành công");
      expect(result.warning).toBeNull();
    });

    it("should throw error if quantity > stock and not allow backorder", async () => {
      prismaMock.cart.findUnique.mockResolvedValue({ cart_id: 1, user_id: 1 } as any);
      prismaMock.productVariant.findUnique.mockResolvedValue({ variant_id: 1, stock_quantity: 1, allow_backorder: false } as any);
      prismaMock.cartDetail.findFirst.mockResolvedValue({ quantity: 1 } as any); // already 1 in cart

      // Try to add 1 more -> total 2, but stock is 1
      await expect(cartService.addToCart(1, { variant_id: 1, quantity: 1 })).rejects.toThrow("không cho phép bán trước");
    });
  });
});
