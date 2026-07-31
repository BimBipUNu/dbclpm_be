import { PrismaClient, ProductType } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import "dotenv/config";

const dbUrl = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.substring(1),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Tạo tài khoản Admin mặc định
  const adminEmail = "admin@petshop.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("123456", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        full_name: "System Admin",
        role: "Admin",
        status: "Active",
      },
    });
    console.log("Created Admin account: admin@petshop.com / 123456");
  } else {
    console.log("Admin account already exists.");
  }

  // 2. Tạo Danh mục (Đệ quy)
  const rootCategory = await prisma.category.findFirst({ where: { category_name: "Thức ăn thú cưng" } });
  if (!rootCategory) {
    console.log("Creating categories...");
    const parentCat = await prisma.category.create({
      data: {
        category_name: "Thức ăn thú cưng",
        description: "Thức ăn tổng hợp",
        children: {
          create: [
            { category_name: "Thức ăn cho Chó", description: "Hạt, pate cho chó" },
            { category_name: "Thức ăn cho Mèo", description: "Hạt, pate cho mèo" }
          ]
        }
      },
      include: { children: true }
    });

    // 3. Tạo Brand
    const brand = await prisma.brand.create({
      data: { brand_name: "Royal Canin", country: "France" }
    });

    // 4. Tạo Sản phẩm (Master)
    const dogFoodCat = parentCat.children.find(c => c.category_name === "Thức ăn cho Chó");
    if (dogFoodCat) {
      console.log("Creating sample Master-Variant product...");
      await prisma.product.create({
        data: {
          product_name: "Royal Canin Mini Adult",
          description: "Thức ăn hạt cho chó giống nhỏ",
          brand_id: brand.brand_id,
          product_type: ProductType.Food,
          categories: {
            create: [
              { category_id: dogFoodCat.category_id } // Gắn với danh mục con
            ]
          },
          options: {
            create: [
              {
                option_name: "Trọng lượng",
                values: {
                  create: [
                    { value: "800g" },
                    { value: "2kg" }
                  ]
                }
              }
            ]
          }
        }
      });

      // Lấy option values ra để tạo Variant
      const product = await prisma.product.findFirst({
        where: { product_name: "Royal Canin Mini Adult" },
        include: { options: { include: { values: true } } }
      });

      if (product && product.options.length > 0) {
        const optionValues = product.options[0]?.values;

        if (optionValues && optionValues.length >= 2) {
          // Variant 1: 800g
          await prisma.productVariant.create({
            data: {
              product_id: product.product_id,
              sku: "RC-MINI-800G",
              price: 150000,
              stock_quantity: 100,
              option_values: {
                create: [
                  { value_id: optionValues[0]!.value_id }
                ]
              }
            }
          });

          // Variant 2: 2kg
          await prisma.productVariant.create({
            data: {
              product_id: product.product_id,
              sku: "RC-MINI-2KG",
              price: 350000,
              stock_quantity: 50,
              option_values: {
                create: [
                  { value_id: optionValues[1]!.value_id }
                ]
              }
            }
          });
          console.log("Created sample product variants.");
        }
      }
    }
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
