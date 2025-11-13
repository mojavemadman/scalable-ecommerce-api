-- CREATE DATABASE payment_db;

CREATE TABLE payments (
    id SERIAL UNIQUE,
    order_id INTEGER NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    stripe_transaction_id VARCHAR(255) UNIQUE,
    paypal_transaction_id VARCHAR(255) UNIQUE,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'rejected')),
    payment_method VARCHAR(100) NOT NULL CHECK (payment_method IN ('stripe', 'paypal')),
    total_amount DECIMAL(10, 2) CHECK (total_amount >= 0) NOT NULL,
    billing_street VARCHAR(255) NOT NULL,
    billing_city VARCHAR(100) NOT NULL,
    billing_state VARCHAR(50) NOT NULL,
    billing_zip VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    error_message VARCHAR(255)
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_idempotency_key ON payments(idempotency_key);