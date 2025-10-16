import pool from "..db/db.js"
import bcrypt from "bcrypt";

class User {

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
        const hashedPassword = await bcrypt.hash(password)
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

export default User