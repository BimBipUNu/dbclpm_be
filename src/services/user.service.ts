import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

export class UserService {
  public async getUsers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { full_name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        select: {
          user_id: true,
          full_name: true,
          email: true,
          phone: true,
          address: true,
          avatar: true,
          role: true,
          status: true,
          created_at: true,
        }
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async updateUserStatus(user_id: number, status: "Active" | "Inactive" | "Banned") {
    return await prisma.user.update({
      where: { user_id },
      data: { status },
      select: { user_id: true, email: true, status: true }
    });
  }
}
