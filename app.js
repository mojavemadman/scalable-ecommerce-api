import dotenv from "dotenv"
import express from "express";
import morgan from "morgan";
import pool from "./db/db.js"

dotenv.config();
const app = express();

app.use(morgan("dev"));
app.use(express.json());


const testConnection = async () => {
    let testResult;
    let client;
    try {
        client = await pool.connect();
        const result = await client.query("SELECT 1 + 1 AS test");
        testResult = result.rows[0].test === 2;
        if (testResult) console.log("Successful connection to database");
        return testResult;
    } catch (error) {
        console.error("Error connecting to databse:", error);
        return false
    } finally {
        if (client) client.release();
    }
}

const startServer = async () => {
    const isConnected = await testConnection();
    if (!isConnected) {
        console.log("Connection to database failed; server will not run");
        process.exit(1);
    }

    app.listen(3000, async () => {
        console.log("Server running on http://localhost:3000")
    });
}

startServer();
