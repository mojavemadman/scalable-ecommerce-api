import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import notificationRoutes from "./src/routes/notification.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use("/notifications", notificationRoutes);

const PORT = process.env.PORT

if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`Notification service running on http://localhost:${PORT}`);
    });
}

export default app;