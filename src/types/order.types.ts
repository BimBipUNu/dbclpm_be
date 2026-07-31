import { PaymentMethod } from "@prisma/client";

export interface CreateOrderInput {
  shipping_address: string;
  payment_method: PaymentMethod;
  note?: string;
  // Mảng ID của các CartDetail nếu khách chỉ chọn mua vài món.
  // Nếu mảng này trống hoặc không truyền, mặc định mua toàn bộ giỏ hàng.
  cart_item_ids?: number[]; 
}
