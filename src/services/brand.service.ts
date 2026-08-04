import prisma from "../config/prisma";

export class BrandService {
  public async getBrands() {
    return await prisma.brand.findMany({
      where: { status: "Active" },
      orderBy: { brand_name: "asc" },
    });
  }

  public async createBrand(data: { brand_name: string; country?: string; description?: string }) {
    return await prisma.brand.create({
      data: {
        brand_name: data.brand_name,
        country: data.country ?? null,
        description: data.description ?? null,
      },
    });
  }

  public async updateBrand(id: number, data: { brand_name?: string; country?: string; description?: string }) {
    return await prisma.brand.update({
      where: { brand_id: id },
      data,
    });
  }

  public async deleteBrand(id: number) {
    return await prisma.brand.delete({
      where: { brand_id: id },
    });
  }
}
