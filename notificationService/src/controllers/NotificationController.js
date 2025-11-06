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
            console.log(`Total Amount: ${orderDetails.totalAmount}`);
            console.log(`Status: ${orderDetails.status}`);
            console.log("Items:");
            orderDetails.items?.forEach(item => {
                console.log(`  -${item.name} x${item.quantity} @ ${item.price}`);
            });
            console.log("==============================\n");

            await new Promise(resolve => setTimeout(resolve, 100));

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
        return res.status(200).send({ status: "Notification service is running" });
    }
}

export default NotificationController;