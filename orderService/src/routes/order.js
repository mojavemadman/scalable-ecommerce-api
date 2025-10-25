import OrderController from "../controllers/OrderController.js";
import { Router } from "express";

const orderRouter = Router();

orderRouter.post("/", OrderController.createOrder);
orderRouter.get("/", OrderController.findOrdersByUser);
orderRouter.get("/:id", OrderController.findOrderById);
orderRouter.put("/:id/status", OrderController.updateOrderStatus);
orderRouter.put("/:id/shipping", OrderController.updateShipping);
orderRouter.put("/:id/cancel", OrderController.cancelOrder);
orderRouter.post("/:id/items", OrderController.addItem);
orderRouter.get("/:id/items", OrderController.getOrderItems);

export default orderRouter;