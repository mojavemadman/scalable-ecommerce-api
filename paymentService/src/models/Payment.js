import pool from "../db/db.js";

class Payment {
    static async createPayment(orderId, idempotencyKey, paymentMethod, totalAmount, billingInfo) {
        const existingPayment = await Payment.findByIdempotencyKey(idempotencyKey);
        if (existingPayment) {
            return existingPayment;
        }

        const query = `
            INSERT INTO payments (
                order_id, 
                idempotency_key,
                payment_method,
                total_amount, 
                billing_street, 
                billing_city, 
                billing_state, 
                billing_zip
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const result = await pool.query(query, [
            orderId,
            idempotencyKey,
            paymentMethod,
            totalAmount,
            billingInfo.street,
            billingInfo.city,
            billingInfo.state,
            billingInfo.zip
        ]);
        return result.rows[0];
    }

    static async findByIdempotencyKey(idempotencyKey) {
        const query = `SELECT * FROM payments WHERE idempotency_key = $1`;
        const result = await pool.query(query, [idempotencyKey]);
        return result.rows[0];
    }

    static async updatePaymentStatus(paymentId, status, transactionId, errorMessage) {
        const query = `
            UPDATE payments
            SET 
                payment_status = $2,
                stripe_transaction_id = COALESCE($3, stripe_transaction_id),
                error_message = COALESCE($4, error_message),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [paymentId, status, transactionId, errorMessage]);
        return result.rows[0]
    }

    static async getPaymentDetails(orderId) {
        const query = `SELECT * FROM payments WHERE order_id = $1`;
        const result = await pool.query(query, [orderId]);
        return result.rows[0];
    }
}

export default Payment;