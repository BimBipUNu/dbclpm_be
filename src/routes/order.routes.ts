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

// Protected routes (Admin)
import { authorizeRoles } from "../middlewares/auth.middleware";
router.get("/admin", authorizeRoles("Admin") as any, orderController.getAllOrders as any);
router.get("/admin/:id", authorizeRoles("Admin") as any, orderController.getOrderDetailAdmin as any);
router.patch("/admin/:id/status", authorizeRoles("Admin") as any, orderController.updateOrderStatus as any);

export default router;
