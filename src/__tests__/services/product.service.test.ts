import { prismaMock } from "../../config/prismaMock";
import { ProductService } from "../../services/product.service";

describe("Product Service", () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
  });

  describe("createProduct", () => {
    it("should create product with options and variants", async () => {
      prismaMock.$transaction.mockImplementation(async (cb) => {
        return await cb(prismaMock as any);
      });
      prismaMock.product.create.mockResolvedValue({ product_id: 1, product_name: "Test Product" } as any);
      prismaMock.productOption.create.mockResolvedValue({
        values: [{ value_id: 1, value: "Red" }]
      } as any);

      const result = await productService.createProduct({
        brand_id: 1,
        product_name: "Test Product",
        product_type: "Physical" as any,
        category_ids: [1],
        options: [{ option_name: "Color", values: [{ temp_id: "temp1", value: "Red" }] }],
        variants: [{ sku: "SKU1", price: 100, stock_quantity: 10, option_temp_ids: ["temp1"] }],
      });

      expect(result.product_id).toBe(1);
      expect(result.product_name).toBe("Test Product");
    });
  });

  describe("getProductDetail", () => {
    it("should throw error if product not found", async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);
      await expect(productService.getProductDetail(999)).rejects.toThrow("Product not found");
    });

    it("should return product details", async () => {
      prismaMock.product.findUnique.mockResolvedValue({ product_id: 1 } as any);
      const result = await productService.getProductDetail(1);
      expect(result.product_id).toBe(1);
    });
  });

  describe("getProducts", () => {
    it("should return paginated products", async () => {
      prismaMock.product.findMany.mockResolvedValue([{ product_id: 1 }] as any);
      prismaMock.product.count.mockResolvedValue(1);

      const result = await productService.getProducts(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });
  });
});
