import PaymentController from "../controllers/PaymentController.js";
import { Router } from "express";

const paymentRouter = Router();

paymentRouter.post("/", PaymentController.createPayment);
paymentRouter.get("/health", (req, res) => res.status(200).send({ status: "Payment service is running" }));
paymentRouter.get("/order/:id", PaymentController.getPaymentByOrderId);

export default paymentRouter;