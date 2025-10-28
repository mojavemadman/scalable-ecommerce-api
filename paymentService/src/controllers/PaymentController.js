import Payment from "../models/Payment.js";
import Stripe from "stripe";
import dotenv from "dotenv";
import crypto from "crypto"

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)


class PaymentController {
    static async createPayment(req, res) {
        try {
            const idempotencyKey = crypto.randomUUID();
            const {orderId, paymentMethod, totalAmount, billingInfo } = req.body;
    
            if (!orderId || !paymentMethod || !totalAmount || !billingInfo) {
                return res.status(400).send({ error: "Missing required fields" });
            }
    
            const payment = await Payment.createPayment(
                orderId, 
                idempotencyKey, 
                paymentMethod, 
                totalAmount, 
                billingInfo
            );

            if (payment.payment_status !== "pending") {
                return res.status(200).send(payment);
            }
        
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(totalAmount * 100),
                    currency: "usd",
                    payment_method: "pm_card_visa", //Testing purposes; swap for paymentMethod
                    confirm: true,
                    automatic_payment_methods: {
                        enabled: true,
                        allow_redirects: "never"
                    },
                    metadata: { 
                        orderId: orderId.toString(),
                        paymentId: payment.id.toString()
                    }
                }, {
                    idempotencyKey: idempotencyKey
                });
        
                if (paymentIntent.status === "succeeded") {
                    const updatedPayment = await Payment.updatePaymentStatus(
                        payment.id,
                        "confirmed",
                        paymentIntent.id,
                        null
                    );
                    return res.status(200).send({ payment: updatedPayment })
                } else {
                    const updatedPayment = await Payment.updatePaymentStatus(
                        payment.id,
                        "rejected",
                        paymentIntent.id,
                        `Payment status: ${paymentIntent.status}`
                    );
                    return res.status(402).send({
                        error: "Payment failed",
                        payment: updatedPayment
                    });
                }
            } catch (stripeError) {
                const updatedPayment = await Payment.updatePaymentStatus(
                    payment.id,
                    "rejected",
                    null,
                    stripeError.message
                );
                return res.status(402).send({
                    error: "Payment processing failed",
                    message: stripeError.message,
                    payment: updatedPayment
                });
            }
                
        } catch (error) {
            console.error("Payment creation error:", error);
            res.status(500).send({ error: error.message});
        }
    }

    static async getPaymentByOrderId(req, res) {
        try {
            const orderId = req.params.id;
            const payment = await Payment.getPaymentById(orderId);
    
            if (!payment) {
                return res.status(404).send({ error: "Payment not found" });
            }
            return res.status(200).send(payment);
        } catch (error) {
            console.error("Error retrieving payment:", error);
            res.status(500).send({ error: error.message})
        }
    }
}

export default PaymentController;