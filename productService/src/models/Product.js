import pool from "../db/db.js";

class Product {
    static async create(sku, name, description, price) {
        const query = `
            INSERT INTO products (sku, name, description, price)
            VALUES ($1, $2, $3, $4)
            RETURNING *
    `;
        const result = await pool.query(query, [sku, name, description, price]);
        return result.rows[0];
    }

    static async delete(productId) {
        const query = `DELETE FROM products WHERE id = $1 RETURNING *`
        const result = await pool.query(query, [productId]);
        return result.rows[0];
    }

    static async findAll() {
        const query = `SELECT * FROM products ORDER BY name ASC`
        const result = await pool.query(query);
        return result.rows;
    }

    static async findbyActive(status) {
        const query = `
            SELECT * 
            FROM products 
            WHERE is_active = $1
            ORDER BY name ASC
        `
        const result = await pool.query(query, [status]);
        return result.rows;
    }

    static async findById(productId) {
        const query = `
            SELECT *
            FROM products
            WHERE id = $1
        `;
        const result = await pool.query(query, [productId]);
        return result.rows[0];
    }

    static async findByCategory(categoryId) {
        const query = `
            SELECT *
            FROM products
            WHERE category_id = $1
        `;
        const result = await pool.query(query, [categoryId]);
        return result.rows;
    }

    static async decreaseInventory(productId, quantity) {
        const query = `
            UPDATE products
            SET inventory = inventory - $2
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [productId, quantity]);
        return result.rows[0];
    }

    static async update(productId, updates) {
        const query = `
            UPDATE products
            SET
                sku = COALESCE($2, sku),
                name = COALESCE($3, name),
                description = COALESCE($4, description),
                price = COALESCE($5, price),
                inventory = COALESCE($6, inventory),
                category_id = COALESCE($7, category_id),
                is_active = COALESCE($8, is_active)
            WHERE id = $1
        `;
        const result = await pool.query(query, [
            productId,
            updates.sku,
            updates.name,
            updates.description,
            updates.price,
            updates.inventory,
            updates.category_id,
            updates.is_active,
        ]);
        return result.rows[0];
    }
}

export default Product;