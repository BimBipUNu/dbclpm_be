import { Role } from "@prisma/client";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterUserInput } from "../types/auth.types";
import { sendMail } from "./mail.service";

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendRegistrationOTP = async (email: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("Email đã được sử dụng!");

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Lưu OTP vào DB
  await prisma.oTP.create({
    data: {
      email,
      otp,
      purpose: "REGISTER",
      expires_at: expiresAt,
    },
  });

  // Gửi mail
  const html = `
    <h2>Xác thực đăng ký tài khoản PetCare</h2>
    <p>Mã xác nhận (OTP) của bạn là: <strong>${otp}</strong></p>
    <p>Mã này sẽ hết hạn sau 5 phút.</p>
  `;
  await sendMail(email, "Mã xác nhận đăng ký tài khoản", html);
  return { message: "Mã OTP đã được gửi đến email của bạn." };
};

export const registerUser = async (data: RegisterUserInput & { otp: string }) => {
  // 1. Kiểm tra OTP
  const validOTP = await prisma.oTP.findFirst({
    where: {
      email: data.email,
      otp: data.otp,
      purpose: "REGISTER",
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
  });

  if (!validOTP) throw new Error("Mã OTP không hợp lệ hoặc đã hết hạn!");

  // 2. Tạo User
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
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

  // Đánh dấu OTP đã dùng (bằng cách sửa thời gian hết hạn hoặc xoá)
  await prisma.oTP.delete({ where: { id: validOTP.id } });

  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const loginUser = async (email: string, pass: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Tài khoản không tồn tại!");

  const isMatch = await bcrypt.compare(pass, user.password);
  if (!isMatch) throw new Error("Mật khẩu không chính xác!");

  const payload = { id: user.user_id, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any,
  });
  
  const { password, ...userInfo } = user;
  return { token, user: userInfo };
};

export const sendForgotPasswordOTP = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Tài khoản không tồn tại trong hệ thống!");

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.oTP.create({
    data: {
      email,
      otp,
      purpose: "FORGOT_PASSWORD",
      expires_at: expiresAt,
    },
  });

  const html = `
    <h2>Yêu cầu khôi phục mật khẩu PetCare</h2>
    <p>Mã xác nhận (OTP) để đổi mật khẩu của bạn là: <strong>${otp}</strong></p>
    <p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
  `;
  await sendMail(email, "Mã xác nhận khôi phục mật khẩu", html);
  return { message: "Mã OTP đã được gửi đến email của bạn." };
};

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
  const validOTP = await prisma.oTP.findFirst({
    where: {
      email,
      otp,
      purpose: "FORGOT_PASSWORD",
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
  });

  if (!validOTP) throw new Error("Mã OTP không hợp lệ hoặc đã hết hạn!");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  // Xóa OTP
  await prisma.oTP.delete({ where: { id: validOTP.id } });

  return { message: "Đổi mật khẩu thành công!" };
};
