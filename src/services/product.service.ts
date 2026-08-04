import prisma from "../config/prisma";
import { CreateProductInput } from "../types/product.types";

export class ProductService {
  /**
   * Tạo sản phẩm bằng Prisma Transaction
   * Bảm bảo toàn vẹn dữ liệu qua 5 bảng: Product, ProductOption, ProductOptionValue, ProductVariant, VariantValue
   */
  public async createProduct(data: CreateProductInput) {
    return await prisma.$transaction(async (tx) => {
      // 1. Tạo Master Product
      const product = await tx.product.create({
        data: {
          brand_id: data.brand_id,
          product_name: data.product_name,
          description: data.description ?? null,
          thumbnail: data.thumbnail ?? null,
          product_type: data.product_type,
          // Liên kết với các Categories
          categories: {
            create: data.category_ids.map((id) => ({ category_id: id })),
          },
          // Lưu hình ảnh sản phẩm
          images: {
            create: (data.images || []).map(url => ({ image_url: url })),
          }
        },
      });

      // 2. Tạo Options & Option Values
      // Sử dụng Map để lưu vết temp_id -> value_id thực tế sinh ra bởi DB
      const tempIdToValueId = new Map<string, number>();

      for (const option of data.options) {
        const createdOption = await tx.productOption.create({
          data: {
            product_id: product.product_id,
            option_name: option.option_name,
            values: {
              create: option.values.map((val) => ({
                value: val.value,
              })),
            },
          },
          include: { values: true }, // Include values để lấy lại value_id vừa tạo
        });

        option.values.forEach((val, index) => {
          if (val.temp_id) {
            tempIdToValueId.set(val.temp_id, createdOption.values[index]!.value_id);
          }
        });
      }

      // 3. Tạo Variants (Các SKUs)
      for (const variant of data.variants) {
        await tx.productVariant.create({
          data: {
            product_id: product.product_id,
            sku: variant.sku,
            price: variant.price,
            stock_quantity: variant.stock_quantity,
            image_url: variant.image_url ?? null,
            // Nối biến thể này với các Option Values tương ứng (ví dụ: Đỏ, Size M)
            option_values: {
              create: variant.option_temp_ids.map((tempId) => {
                const actualValueId = tempIdToValueId.get(tempId);
                if (!actualValueId) {
                  throw new Error(`Dữ liệu không hợp lệ: Không tìm thấy tuỳ chọn cho mã ${tempId}`);
                }
                return { value_id: actualValueId };
              }),
            },
          },
        });
      }

      return product;
    });
  }

  /**
   * Lấy chi tiết sản phẩm kèm theo cấu trúc Options và Variants để Client render giao diện
   */
  public async getProductDetail(product_id: number) {
    const product = await prisma.product.findUnique({
      where: { product_id },
      include: {
        brand: true,
        categories: { include: { category: true } },
        options: { include: { values: true } },
        variants: {
          include: {
            option_values: { include: { value: true } },
          },
        },
        images: true,
      },
    });

    if (!product) throw new Error("Product not found");
    return product;
  }

  /**
   * Lấy danh sách sản phẩm (Phân trang)
   */
  public async getProducts(
    page: number = 1, 
    limit: number = 10, 
    category_id?: number, 
    search_query?: string,
    min_price?: number,
    max_price?: number
  ) {
    const skip = (page - 1) * limit;

    const where: any = { status: "Active" };
    if (category_id) {
      where.categories = { some: { category_id } };
    }
    if (search_query) {
      where.product_name = { contains: search_query };
    }
    if (min_price !== undefined || max_price !== undefined) {
      const priceFilter: any = {};
      if (min_price !== undefined) priceFilter.gte = min_price;
      if (max_price !== undefined) priceFilter.lte = max_price;
      where.variants = { some: { price: priceFilter } };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        // Chỉ lấy vài thông tin cơ bản cho danh sách
        include: {
          brand: true,
          categories: { include: { category: true } },
          variants: {
            select: { price: true, stock_quantity: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async updateProduct(product_id: number, data: CreateProductInput) {
    return await prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin cơ bản
      const product = await tx.product.update({
        where: { product_id },
        data: {
          brand_id: data.brand_id,
          product_name: data.product_name,
          description: data.description ?? null,
          thumbnail: data.thumbnail ?? null,
          product_type: data.product_type,
        },
      });

      // 2. Cập nhật danh mục
      await tx.productCategory.deleteMany({ where: { product_id } });
      await tx.productCategory.createMany({
        data: data.category_ids.map(id => ({ product_id, category_id: id }))
      });

      // 3. Cập nhật hình ảnh phụ
      await tx.productImage.deleteMany({ where: { product_id } });
      if (data.images && data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map(url => ({ product_id, image_url: url }))
        });
      }

      // 4. Cập nhật Tồn kho và Giá cho các biến thể hiện có theo SKU
      for (const variant of data.variants) {
        await tx.productVariant.updateMany({
          where: { product_id, sku: variant.sku },
          data: {
            price: variant.price,
            stock_quantity: variant.stock_quantity,
            image_url: variant.image_url ?? null,
          }
        });
      }

      return product;
    });
  }

  public async updateProductStatus(product_id: number, status: "Active" | "Inactive") {
    return await prisma.product.update({
      where: { product_id },
      data: { status },
    });
  }

  public async deleteProduct(product_id: number) {
    return await prisma.product.delete({
      where: { product_id },
    });
  }
}
