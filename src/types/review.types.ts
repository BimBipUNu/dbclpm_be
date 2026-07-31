import { ReviewStatus } from "@prisma/client";

export interface CreateReviewInput {
  product_id: number;
  variant_id: number;
  rating: number; // 1 to 5
  comment?: string | undefined;
}

export interface UpdateReviewStatusInput {
  status: ReviewStatus;
}
