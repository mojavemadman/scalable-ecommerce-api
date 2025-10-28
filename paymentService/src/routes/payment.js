import PaymentController from "../controllers/PaymentController.js";
import { Router } from "express";

const paymentRouter = Router();

paymentRouter.post("/", PaymentController.createPayment);
paymentRouter.get("/order/:id", PaymentController.getPaymentByOrderId);

export default paymentRouter;