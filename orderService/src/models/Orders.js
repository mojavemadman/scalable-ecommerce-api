import pool from "../db/db.js";

class Orders {

    static async createOrder(userId, shippingInfo, totalAmount) {
        const query = `
            INSERT INTO orders (user_id, shipping_street, shipping_city, shipping_state, shipping_zip, total_amount)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await pool.query(query, [
            userId,
            shippingInfo.street,
            shippingInfo.city,
            shippingInfo.state,
            shippingInfo.zip,
            totalAmount
        ]);
        return result.rows[0];
    }

static async findOrdersByUserId(userId) {
    const query = `
        SELECT 
            orders.id as order_id,
            orders.user_id,
            orders.status,
            orders.total_amount,
            orders.shipping_street,
            orders.shipping_city,
            orders.shipping_state,
            orders.shipping_zip,
            orders.created_at as order_created_at,
            orders.updated_at,
            order_items.id as item_id,
            order_items.product_id,
            order_items.quantity,
            order_items.price_at_purchase
        FROM orders
        LEFT JOIN order_items ON order_items.order_id = orders.id
        WHERE orders.user_id = $1
        ORDER BY orders.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) return [];
    
    const ordersMap = {};
    
    result.rows.forEach(row => {
        if (!ordersMap[row.order_id]) {
            ordersMap[row.order_id] = {
                id: row.order_id,
                userId: row.user_id,
                status: row.status,
                totalAmount: row.total_amount,
                shippingAddress: {
                    street: row.shipping_street,
                    city: row.shipping_city,
                    state: row.shipping_state,
                    zip: row.shipping_zip
                },
                createdAt: row.order_created_at,
                updatedAt: row.updated_at,
                items: []
            };
        }
        
        if (row.item_id !== null) {
            ordersMap[row.order_id].items.push({
                id: row.item_id,
                productId: row.product_id,
                quantity: row.quantity,
                priceAtPurchase: row.price_at_purchase
            });
        }
    });
    
    return Object.values(ordersMap);
}

    static async findOrderById(orderId) {
        const query = `
            SELECT 
                orders.id as order_id,
                orders.user_id,
                orders.status,
                orders.total_amount,
                orders.shipping_street,
                orders.shipping_city,
                orders.shipping_state,
                orders.shipping_zip,
                orders.created_at as order_created_at,
                orders.updated_at,
                order_items.id as item_id,
                order_items.product_id,
                order_items.quantity,
                order_items.price_at_purchase
            FROM orders
            LEFT JOIN order_items ON order_items.order_id = orders.id
            WHERE orders.id = $1
        `;
        const result = await pool.query(query, [orderId]);
        const rows = result.rows[0];

        if (result.rows.length === 0) return null;

        const order = {
            id: rows.order,
            userId: rows.user_id,
            status: rows.status,
            shippingAddress: {
                street: rows.shipping_street,
                city: rows.shipping_city,
                state: rows.shipping_street,
                zip: rows.shipping_zip
            },
            createdAt: rows.created_at,
            updatedAt: rows.updated_at,
            items: result.rows
                .filter(row => row.item_id !== null)
                .map(row => ({
                    id: row.item_id,
                    productId: row.product_id,
                    quantity: row.quantity,
                    priceAtPurchase: row.priceAtPurchase
                }))
        };
        
        return order;
    }

    static async updateOrderStatus(orderId, newStatus, paymentId) {
        const query = `
            UPDATE orders
            SET status = $2, payment_id = COALESCE($3, payment_id)
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [orderId, newStatus, paymentId]);
        return result.rows[0];
    }

    static async updateShippingInfo(orderId, shippingInfo) {
        const query = `
            UPDATE orders
            SET 
                shipping_street = COALESCE($1, shipping_street),
                shipping_city = COALESCE($2, shipping_city),
                shipping_state = COALESCE($3, shipping_state),
                shipping_zip = COALESCE($4, shipping_zip)
            WHERE id = $5
            RETURNING *
        `;
        const result = await pool.query(query, [
            shippingInfo.street,
            shippingInfo.city,
            shippingInfo.state,
            shippingInfo.zip,
            orderId
        ]);
        return result.rows[0]
    }

    static async cancelOrder(orderId) {
        const query = `
            UPDATE orders
            SET status = 'cancelled'
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [orderId]);
        return result.rows[0];
    }

    static async addItemToOrder(orderId, productId, quantity, priceAtPurchase) {
        const query = `
            INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [orderId, productId, quantity, priceAtPurchase]);
        return result.rows[0];
    }

    static async getOrderItems(orderId) {
        const query = `
            SELECT *
            FROM order_items
            WHERE order_id = $1
        `;
        const result = await pool.query(query, [orderId]);
        return result.rows;
    }
}

export default Orders;