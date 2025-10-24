import pool from "../db/db.js"
import bcrypt from "bcrypt";

class Users {

    static async findAllUsers() {
        const query = `
            SELECT
                id, email, first_name, last_name, phone, shipping_street, shipping_city,
                shipping_state, shipping_zip, shipping_country, is_admin, created_at, last_login
            FROM users
            ORDER BY created_at
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    static async findById(userId) {
        const query = `SELECT * FROM users WHERE id = $1`;
        const result = await pool.query(query, [userId]);
        return result.rows[0]
    }

    static async findByEmail(email) {
        const query = `SELECT * FROM users WHERE email = $1`;
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async createUser(email, password, firstName, lastName) {
        const query = `
            INSERT INTO users (email, password, first_name, last_name)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `;
        const hashedPassword = await bcrypt.hash(password, 10)
        const result = await pool.query(query, [
            email,
            hashedPassword,
            firstName,
            lastName
        ]);
        return result.rows[0];
    }

    static async deleteUser(userId) {
        const query = `DELETE FROM users WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    }

    static async update(userId, updates) {
        const query = `
            UPDATE users
            SET 
                email = COALESCE($2, email),
                password = COALESCE($3, password),
                first_name = COALESCE($4, first_name),
                last_name = COALESCE($5, last_name),
                phone = COALESCE($6, phone),
                shipping_street = COALESCE($7, shipping_street),
                shipping_city = COALESCE($8, shipping_city),
                shipping_state = COALESCE($9, shipping_state),
                shipping_zip = COALESCE($10, shipping_zip),
                shipping_country = COALESCE($11, shipping_country)
            WHERE id = $1
            RETURNING *
        `;
        const hashedPassword =  updates.password ? await bcrypt.hash(updates.password, 10) : null;
        const result = await pool.query(query, [
            userId,
            updates.email,
            hashedPassword,
            updates.firstName,
            updates.lastName,
            updates.phone,
            updates.shippingStreet,
            updates.shippingCity,
            updates.shippingState,
            updates.shippingZip,
            updates.shippingCountry
        ]);
        return result.rows[0];
    }

    static async updateLastLogin(userId) {
        const query = `
            UPDATE users
            SET last_login = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    }
}

export default Users