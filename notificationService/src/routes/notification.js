import { Router } from "express";
import NotificationController from "../controllers/NotificationController.js";

const notificationRouter = Router();

notificationRouter.get("/health", NotificationController.healthCheck);
notificationRouter.post("/order-confirmation", NotificationController.sendOrderConfirmation);

export default notificationRouter;