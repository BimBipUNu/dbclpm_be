import { prismaMock } from "../../config/prismaMock";
import { ReviewService } from "../../services/review.service";

describe("Review Service", () => {
  let reviewService: ReviewService;

  beforeEach(() => {
    reviewService = new ReviewService();
  });

  describe("createReview", () => {
    it("should throw error if user has not purchased", async () => {
      prismaMock.orderDetail.findFirst.mockResolvedValue(null);
      await expect(
        reviewService.createReview(1, { product_id: 1, variant_id: 1, rating: 5 })
      ).rejects.toThrow("Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng thành công.");
    });

    it("should throw error if user already reviewed", async () => {
      prismaMock.orderDetail.findFirst.mockResolvedValue({} as any);
      prismaMock.review.findFirst.mockResolvedValue({ review_id: 1 } as any);
      await expect(
        reviewService.createReview(1, { product_id: 1, variant_id: 1, rating: 5 })
      ).rejects.toThrow("Bạn đã đánh giá cho phân loại sản phẩm này rồi.");
    });

    it("should create review successfully", async () => {
      prismaMock.orderDetail.findFirst.mockResolvedValue({} as any);
      prismaMock.review.findFirst.mockResolvedValue(null);
      prismaMock.review.create.mockResolvedValue({ review_id: 1, status: "Pending" } as any);

      const result = await reviewService.createReview(1, {
        product_id: 1,
        variant_id: 1,
        rating: 5,
        comment: "Good",
      });
      expect(result.review_id).toBe(1);
      expect(result.status).toBe("Pending");
    });
  });

  describe("getProductReviews", () => {
    it("should return approved reviews with average rating", async () => {
      prismaMock.review.findMany.mockResolvedValue([
        { rating: 4 },
        { rating: 5 },
      ] as any);

      const result = await reviewService.getProductReviews(1);
      expect(result.total_reviews).toBe(2);
      expect(result.average_rating).toBe("4.5");
      expect(result.reviews).toHaveLength(2);
    });
  });

  describe("updateReviewStatus", () => {
    it("should update status", async () => {
      prismaMock.review.update.mockResolvedValue({ review_id: 1, status: "Approved" } as any);
      const result = await reviewService.updateReviewStatus(1, { status: "Approved" });
      expect(result.status).toBe("Approved");
    });
  });
});
