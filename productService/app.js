import express from "express";
import morgan from "morgan";
import pool from "./src/db/db.js";
import productRouter from "./src/routes/product.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use("/products", productRouter);

const PORT = process.env.PORT;

const testConnect = async () => {
	let client;
	try {
		client = await pool.connect();
		const result = await client.query(`SELECT 1 + 1 AS test`);
		const testSuccess = result.rows[0].test === 2;
		if (testSuccess) console.log("Successful connection to database");
		return testSuccess;
	} catch (error) {
		console.error("Error connecting to database:", error);
		return false;
	} finally {
		if (client) client.release();
	}
};

const startServer = async () => {
	const isConnected = await testConnect();
	if (!isConnected) {
		console.log("Connection to database failed; server will not run");
		process.exit(1);
	}

	app.listen(PORT, async () => {
		console.log(`Product server running on http://localhost:${PORT}`);
	});
};

startServer();
