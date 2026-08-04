import { ProductType } from "@prisma/client";

// Input Data for creating Options & Values
export interface OptionValueInput {
  value: string;
  // Khóa tạm thời để variant match với giá trị này
  temp_id?: string; 
}

export interface OptionInput {
  option_name: string;
  values: OptionValueInput[];
}

export interface VariantInput {
  sku: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  // Danh sách các temp_id của option value để nối variant vào
  option_temp_ids: string[];
}

export interface CreateProductInput {
  brand_id: number;
  category_ids: number[];
  product_name: string;
  description?: string | undefined;
  thumbnail?: string | undefined;
  product_type: ProductType;
  options: OptionInput[];
  variants: VariantInput[];
  images?: string[];
}
