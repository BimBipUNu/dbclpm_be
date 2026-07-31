import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();
const cartController = new CartController();

// All cart routes require authentication as a Customer (or any logged-in user)
router.use(verifyToken as any);

router.get("/", cartController.getCart as any);
router.post("/", cartController.addToCart as any);
router.put("/:variant_id", cartController.updateCartItem as any);
router.delete("/:variant_id", cartController.removeFromCart as any);

export default router;
