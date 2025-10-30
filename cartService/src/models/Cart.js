import pool from "../db/db.js"

class Cart {

    static async getCart(userId) {
        const query = `
            SELECT
                carts.id as cart_id,
                carts.user_id,
                carts.created_at,
                cart_items.id as item_id,
                cart_items.product_id,
                cart_items.quantity
            FROM carts
            LEFT JOIN cart_items ON cart_items.cart_id = carts.id
            WHERE carts.user_id = $1
        `;
        const result = await pool.query(query, [userId]);
        const rows = result.rows;

        if (rows.length === 0 || !rows[0].cart_id) {
            return null;
        }

        return {
            cart: {
                id : rows[0].cart_id,
                userId: rows[0].user_id,
                createdAt: rows[0].created_at
            },
            items: rows.map(row => ({
                id: row.item_id,
                productId: row.product_id,
                quantity: row.quantity
            }))
        };
    }

    static async createCart(userId) {
        const query = `INSERT INTO carts (user_id) VALUES ($1) RETURNING *`;
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    }

    static async addItem(userId, productId, quantity) {
        const cartQuery = `SELECT id FROM carts WHERE user_id = $1`
        let cartResult = (await pool.query(cartQuery, [userId])).rows[0];

        if (!cartResult) {
            cartResult = await this.createCart(userId)
        }

        const cartId = cartResult.id
        const query = `
            INSERT INTO cart_items (cart_id, product_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (cart_id, product_id)
            DO UPDATE SET quantity = cart_items.quantity + $3
            RETURNING *
        `
        const result = await pool.query(query, [cartId, productId, quantity]);
        return result.rows[0]
        
    }
    
    static async updateItemQuantity(userId, productId, newQuantity) {
        const cartQuery = `SELECT id FROM carts WHERE user_id = $1`
        let cartResult = (await pool.query(cartQuery, [userId])).rows[0];

        if (!cartResult) return null

        const cartId = cartResult.id

        if (newQuantity <= 0) {
            const deleteQuery = `
                DELETE FROM cart_items
                WHERE cart_id = $1 AND product_id = $2 
                RETURNING *
            `;
            const result = await pool.query(deleteQuery, [cartId, productId])
            return { deleted: true, item: result.rows[0] };
        }

        const itemQuery = `
            UPDATE cart_items 
            SET quantity = $3
            WHERE cart_id = $1 AND product_id = $2
            RETURNING *
        `;
        const itemResult = await pool.query(itemQuery, [cartId, productId, newQuantity]);
        return itemResult.rows[0];
    }

    static async deleteItem(userId, productId) {
        const cartQuery = `SELECT id FROM carts WHERE user_id = $1`
        const cartResult = await pool.query(cartQuery, [userId]);

        if (cartResult.rows.length === 0) return false

        const cartId = cartResult.rows[0].id;

        const itemQuery = `
            DELETE FROM cart_items 
            WHERE cart_id = $1 AND product_id = $2
            RETURNING *
        `;
        const itemResult = await pool.query(itemQuery, [cartId, productId]);
        return itemResult.rows[0];
    }

    static async clearCart(userId) {
        const cartQuery = `SELECT id FROM carts WHERE user_id = $1`;
        const cartResult = await pool.query(cartQuery, [userId]);
        
        if (cartResult.rows.length === 0) return null;
        
        const cartId = cartResult.rows[0].id;
        
        const query = `DELETE FROM cart_items WHERE cart_id = $1`;
        await pool.query(query, [cartId]);
        return { cartId, cleared: true };
    }

}

export default Cart;