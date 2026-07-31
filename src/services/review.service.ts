import prisma from "../config/prisma";
import { CreateReviewInput, UpdateReviewStatusInput } from "../types/review.types";
import { ReviewStatus } from "@prisma/client";

export class ReviewService {
  /**
   * Tạo đánh giá (Bắt buộc phải mua hàng thành công mới được đánh giá)
   */
  public async createReview(userId: number, data: CreateReviewInput) {
    // 1. Kiểm tra Verified Purchase (Khách đã mua món hàng này và đơn hàng đã Completed chưa?)
    const hasPurchased = await prisma.orderDetail.findFirst({
      where: {
        variant_id: data.variant_id,
        order: {
          user_id: userId,
          order_status: "Completed",
        },
      },
    });

    if (!hasPurchased) {
      throw new Error("Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng thành công.");
    }

    // 2. Kiểm tra xem khách đã đánh giá cho variant này chưa (Tránh spam)
    const existingReview = await prisma.review.findFirst({
      where: {
        user_id: userId,
        variant_id: data.variant_id,
      },
    });

    if (existingReview) {
      throw new Error("Bạn đã đánh giá cho phân loại sản phẩm này rồi.");
    }

    // 3. Tạo Review (Mặc định status = Pending)
    return await prisma.review.create({
      data: {
        user_id: userId,
        product_id: data.product_id, // Gắn vào Product gốc để tính tổng sao
        variant_id: data.variant_id, // Gắn vào Variant để hiển thị Subtitle (VD: Loại 2kg, Hạt mềm)
        rating: data.rating,
        comment: data.comment ?? null,
        status: "Pending", // Admin sẽ duyệt
      },
    });
  }

  /**
   * Lấy danh sách đánh giá của một sản phẩm (Chỉ lấy các đánh giá đã được duyệt - Approved)
   */
  public async getProductReviews(productId: number) {
    const reviews = await prisma.review.findMany({
      where: {
        product_id: productId,
        status: "Approved",
      },
      include: {
        user: {
          select: { full_name: true, avatar: true },
        },
        variant: {
          include: {
            option_values: { include: { value: true } },
          },
        },
      },
      orderBy: { review_date: "desc" },
    });

    // Tính Average Rating
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews
      : 0;

    return {
      total_reviews: totalReviews,
      average_rating: averageRating.toFixed(1),
      reviews,
    };
  }

  /**
   * Admin cập nhật trạng thái Review
   */
  public async updateReviewStatus(reviewId: number, data: UpdateReviewStatusInput) {
    return await prisma.review.update({
      where: { review_id: reviewId },
      data: { status: data.status },
    });
  }
}
