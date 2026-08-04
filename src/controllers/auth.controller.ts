import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { RegisterUserInput, AuthResponse } from "../types/auth.types";

export const sendRegisterOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Vui lòng cung cấp email" });
      return;
    }
    const result = await authService.sendRegistrationOTP(email);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const register = async (req: Request<{}, {}, RegisterUserInput & { otp: string }>, res: Response<AuthResponse>): Promise<void> => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({ message: "Đăng ký thành công", data: user });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response<AuthResponse>): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.status(200).json({ message: "Đăng nhập thành công", data: result });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const sendForgotOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Vui lòng cung cấp email" });
      return;
    }
    const result = await authService.sendForgotPasswordOTP(email);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.status(400).json({ message: "Vui lòng cung cấp đủ thông tin email, otp và mật khẩu mới" });
      return;
    }
    const result = await authService.resetPassword(email, otp, newPassword);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
