import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

class EmailService {
	static transporter = nodemailer.createTransport({
		service: process.env.EMAIL_SERVICE,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASSWORD,
		},
	});

    static {
        console.log("Email config:", {
            service: process.env.EMAIL_SERVICE,
            user: process.env.EMAIL_USER,
            hasPassword: !!process.env.EMAIL_PASSWORD
        });
    }

	static async sendOrderConfirmation(userEmail, orderId, orderDetails) {
		const itemsList = orderDetails.items
			.map(
				(item) => `  • ${item.name} x${item.quantity} - $${item.price}`
			)
			.join("\n");

		const mailOptions = {
			from: process.env.EMAIL_FROM,
			to: userEmail,
			subject: `Order Confirmation - Order #${orderId}`,
			text: `
Thank you for your order!

Order Details:
--------------
Order ID: ${orderId}
Status: ${orderDetails.status}
Total Amount: $${orderDetails.totalAmount}

Items:
${itemsList}

We'll send a confirmation email when your order ships.

Thank you for shopping with us!
            `,
			html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">Thank you for your order!</h1>
                
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h2 style="margin-top: 0;">Order Details</h2>
                        <p><strong>Order ID:</strong> ${orderId}</p>
                        <p><strong>Status:</strong> <span style="color: #28a745;">${
                            orderDetails.status
                        }</span></p>
                        <p><strong>Total Amount:</strong> $${orderDetails.totalAmount}</p>
                    </div>

                    <div style="margin: 20px 0;">
                        <h3>Items:</h3>
                        <ul style="list-style: none; padding: 0;">
                        ${orderDetails.items
                                .map(
                                    (item) => `
                            <li style="padding: 10px; border-bottom: 1px solid #eee;">
                            <strong>${item.name}</strong> x${item.quantity} - $${item.price}
                            </li>
                        `
                                )
                                .join("")}
                        </ul>
                    </div>

                    <p style="color: #666; font-size: 14px;">
                        We'll send you another email when your order ships.
                    </p>

                    <p>Thank you for shopping with us!</p>
                </div>
            `,
		};

        try {
            const info = await EmailService.transporter.sendMail(mailOptions);
            console.log("Email sent successfully", info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
	}

    static async verifyConnection() {
        try {
            await EmailService.transporter.verify();
            console.log("Email service is ready to send emails");
            return true;
        } catch (error) {
            console.error("Email service verification failed:", error);
            return false;
        }
    }
}

export default EmailService;