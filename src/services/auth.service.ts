import { Role } from "@prisma/client";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterUserInput } from "../types/auth.types";

export const registerUser = async (data: RegisterUserInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) throw new Error("Email đã được sử dụng!");

  const hashedPassword = await bcrypt.hash(data.password || "123456", 10);

  const newUser = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      full_name: data.full_name,
      phone: data.phone ?? null,
      address: data.address ?? null,
      avatar: data.avatar ?? null,
      role: Role.Customer,
    },
  });

  // Không trả về password cho Frontend
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const loginUser = async (email: string, pass: string) => {
  // 1. Tìm User
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Tài khoản không tồn tại!");

  // 2. So sánh mật khẩu
  const isMatch = await bcrypt.compare(pass, user.password);
  if (!isMatch) throw new Error("Mật khẩu không chính xác!");

  // 3. Tạo JWT Token
  const payload = { id: user.user_id, role: user.role };

  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any,
  });
  const { password, ...userInfo } = user;
  return { token, user: userInfo };
};
