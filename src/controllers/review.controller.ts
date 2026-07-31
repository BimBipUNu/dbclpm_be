import { Request, Response } from "express";
import { ReviewService } from "../services/review.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { CreateReviewInput, UpdateReviewStatusInput } from "../types/review.types";

const reviewService = new ReviewService();

export class ReviewController {
  public async createReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const data: CreateReviewInput = req.body;

      if (!data.product_id || !data.variant_id || !data.rating) {
        return res.status(400).json({ message: "Vui lòng cung cấp đủ product_id, variant_id và rating." });
      }

      if (data.rating < 1 || data.rating > 5) {
        return res.status(400).json({ message: "Số sao (rating) phải từ 1 đến 5." });
      }

      const result = await reviewService.createReview(userId, data);
      res.status(201).json({
        message: "Cảm ơn bạn đã đánh giá. Đánh giá đang chờ được duyệt.",
        review: result
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi tạo đánh giá." });
    }
  }

  public async getProductReviews(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.id as string);
      const result = await reviewService.getProductReviews(productId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi khi lấy đánh giá sản phẩm." });
    }
  }

  public async updateReviewStatus(req: Request, res: Response) {
    try {
      const reviewId = parseInt(req.params.id as string);
      const data: UpdateReviewStatusInput = req.body;
      const result = await reviewService.updateReviewStatus(reviewId, data);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: "Lỗi khi cập nhật đánh giá." });
    }
  }
}
