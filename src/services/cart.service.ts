import prisma from "../config/prisma";
import { AddToCartInput, UpdateCartItemInput } from "../types/cart.types";

export class CartService {
  /**
   * Lấy giỏ hàng của user và đính kèm danh sách cảnh báo Backorder
   */
  public async getCart(userId: number) {
    let cart = await prisma.cart.findUnique({
      where: { user_id: userId },
      include: {
        details: {
          include: {
            variant: {
              include: {
                product: true,
                option_values: { include: { value: true } },
              },
            },
          },
        },
      },
    });

    // Nếu user chưa có giỏ hàng, tự động tạo mới
    if (!cart) {
      cart = await prisma.cart.create({
        data: { user_id: userId },
        include: {
          details: {
            include: {
              variant: {
                include: { product: true, option_values: { include: { value: true } } },
              },
            },
          },
        },
      });
    }

    // Quét cảnh báo Backorder (Sản phẩm có SL đặt > Tồn kho)
    const warnings: string[] = [];
    let totalAmount = 0;

    cart.details.forEach((item) => {
      totalAmount += Number(item.variant.price) * item.quantity;
      
      if (item.quantity > item.variant.stock_quantity) {
        warnings.push(
          `Sản phẩm "${item.variant.product.product_name}" (SKU: ${item.variant.sku}) có số lượng trong giỏ (${item.quantity}) vượt quá tồn kho sẵn có (${item.variant.stock_quantity}). Thời gian giao hàng sẽ phụ thuộc vào đợt nhập hàng tiếp theo.`
        );
      }
    });

    return { 
      cart,
      total_amount: totalAmount,
      warnings
    };
  }

  /**
   * Thêm Variant vào giỏ hàng
   */
  public async addToCart(userId: number, data: AddToCartInput) {
    let cart = await prisma.cart.findUnique({ where: { user_id: userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { user_id: userId } });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { variant_id: data.variant_id },
      include: { product: true },
    });

    if (!variant) throw new Error("Không tìm thấy biến thể sản phẩm này.");

    const existingDetail = await prisma.cartDetail.findFirst({
      where: { cart_id: cart.cart_id, variant_id: data.variant_id },
    });

    const newQuantity = (existingDetail?.quantity || 0) + data.quantity;

    // Kiểm tra chính sách Backorder
    if (!variant.allow_backorder && newQuantity > variant.stock_quantity) {
      throw new Error(`Kho chỉ còn ${variant.stock_quantity} sản phẩm cho phân loại này. Sản phẩm này không cho phép bán trước (backorder).`);
    }

    if (existingDetail) {
      await prisma.cartDetail.update({
        where: { cart_detail_id: existingDetail.cart_detail_id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartDetail.create({
        data: { cart_id: cart.cart_id, variant_id: data.variant_id, quantity: newQuantity },
      });
    }

    let warning = null;
    if (variant.allow_backorder && newQuantity > variant.stock_quantity) {
      warning = `Lưu ý: Số lượng bạn đặt (${newQuantity}) đang vượt quá tồn kho sẵn có (${variant.stock_quantity}). Đơn hàng sẽ được chuyển thành dạng đặt trước.`;
    }

    return { message: "Thêm vào giỏ hàng thành công", warning };
  }

  /**
   * Cập nhật số lượng của một item trong giỏ
   */
  public async updateCartItem(userId: number, variantId: number, data: UpdateCartItemInput) {
    const cart = await prisma.cart.findUnique({ where: { user_id: userId } });
    if (!cart) throw new Error("Không tìm thấy giỏ hàng.");

    const existingDetail = await prisma.cartDetail.findFirst({
      where: { cart_id: cart.cart_id, variant_id: variantId },
      include: { variant: true }
    });

    if (!existingDetail) throw new Error("Sản phẩm không có trong giỏ hàng.");

    if (!existingDetail.variant.allow_backorder && data.quantity > existingDetail.variant.stock_quantity) {
      throw new Error(`Chỉ có thể đặt tối đa ${existingDetail.variant.stock_quantity} sản phẩm.`);
    }

    if (data.quantity <= 0) {
      await prisma.cartDetail.delete({ where: { cart_detail_id: existingDetail.cart_detail_id } });
      return { message: "Đã xóa sản phẩm khỏi giỏ hàng." };
    }

    await prisma.cartDetail.update({
      where: { cart_detail_id: existingDetail.cart_detail_id },
      data: { quantity: data.quantity },
    });

    let warning = null;
    if (existingDetail.variant.allow_backorder && data.quantity > existingDetail.variant.stock_quantity) {
      warning = `Số lượng đã đặt (${data.quantity}) vượt tồn kho (${existingDetail.variant.stock_quantity}). Đây là đơn hàng đặt trước.`;
    }

    return { message: "Cập nhật giỏ hàng thành công", warning };
  }

  /**
   * Xóa một item khỏi giỏ
   */
  public async removeFromCart(userId: number, variantId: number) {
    const cart = await prisma.cart.findUnique({ where: { user_id: userId } });
    if (!cart) return;

    const existingDetail = await prisma.cartDetail.findFirst({
      where: { cart_id: cart.cart_id, variant_id: variantId },
    });

    if (existingDetail) {
      await prisma.cartDetail.delete({ where: { cart_detail_id: existingDetail.cart_detail_id } });
    }
  }
}
