import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();
const orderController = new OrderController();

// Webhook từ PayOS (Không cần Token)
router.post("/webhook/payos", orderController.payOSWebhook);

// Protected routes (Customer)
router.use(verifyToken as any);

router.post("/", orderController.createOrder as any);
router.get("/my-orders", orderController.getMyOrders as any);

export default router;
