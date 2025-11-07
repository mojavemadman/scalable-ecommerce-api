import EmailService from "../services/emailService.js";

class NotificationController {
    //Send order confirmation notification
    static async sendOrderConfirmation(req, res) {
        try {
            const { orderId, userEmail, orderDetails } = req.body;

            //Validate required fields
            if (!orderId || !userEmail || !orderDetails) {
                return res.status(400).send({ error: "Missing required fields" });
            }

            console.log("\n======ORDER CONFIRMATION======");
            console.log(`To: ${userEmail}`);
            console.log(`Order ID: ${orderId}`);
            console.log("==============================\n");

            await EmailService.sendOrderConfirmation(userEmail, orderId, orderDetails);

            return res.status(200).send({
                success: true,
                message: "Order confirmation sent",
                recipient: userEmail
            });
        } catch (error) {
            console.error("Error sending order confirmation:", error);
            return res.status(500).send({ error: "Failed to send notification" });
        }
    }

    static async healthCheck(req, res) {
        const emailReady = await EmailService.verifyConnection();
        return res.status(200).send({ 
            status: "Notification service is running",
            emailService: emailReady ? "connected" : "disconnected"
        });
    }
}

export default NotificationController;