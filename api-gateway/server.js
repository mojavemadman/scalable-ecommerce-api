import express from "express"
import dotenv from "dotenv"
import morgan from "morgan"
import jwt from "jsonwebtoken"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const USER_SERVICE = process.env.USER_SERVICE_URL;
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL;
const CART_SERVICE  = process.env.CART_SERVICE_URL;
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL;

app.use(express.json());
app.use(morgan("dev"));

const authenticateGateway = (req, res, next) => {
    console.log("Authenticate Gateway called");
    console.log("Request headers:", req.headers);
	try {
		let token;
		const authHeader = req.headers.authorization;

		if (authHeader && authHeader.startsWith("Bearer ")) {
			token = authHeader.split(" ")[1];
		}

		if (!token) {
			return res.status(401).send({ error: "Access not authorized" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
		req.user = decoded;
		next();
	} catch (error) {
		console.error("Gateway auth error:", error);
		res.status(401).send({ error: "Invalid or expired token" });
	}
}

//Helper function that proxies requests
const proxyRequest = async (req, res, targetUrl) => {
    try {
        // Remove /api/ to forward route expected by service
        const path = req.url.replace(/^\/api/, "");;
        const url = `${targetUrl}${path}`;

        const options = {
            method: req.method,
            headers: {
                "Content-Type": "application/json",
                ...(req.headers.authorization && { Authorization: req.headers.authorization }),
                ...(req.user && {
                    "X-User-Id": req.user.userId.toString(),
                    "X-User-Email": req.user.email,
                    "X-Is-Admin": req.user.isAdmin.toString()
                })
            },
        };

        //Need to add body for non-GET requests
        if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.body) {
            options.body = JSON.stringify(req.body)
        }

        const response = await fetch(url, options);
        const data = await response.text();

        res.status(response.status);

        //Forward response headers
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        //Send response
        try {
            res.json(JSON.parse(data));
        } catch {
            res.send(data);
        }
    } catch (error) {
        console.error(`Error proxying to ${targetUrl}:`, error.message);
        res.status(503).json({
            error: "Service unavailable",
            message: error.message
        });
    }
};

//====================PUBLIC ROUTES====================
//User Service Public Routes
app.post("/api/users", (req, res) => proxyRequest(req, res, USER_SERVICE));
app.post("/api/users/login", (req, res) => proxyRequest(req, res, USER_SERVICE));

//Product Service Public Routes
app.get("/api/products", (req, res) => proxyRequest(req, res, PRODUCT_SERVICE));
app.get("/api/products/active", (req, res) => proxyRequest(req, res, PRODUCT_SERVICE));
app.get("/api/products/categories/:id", (req, res) => proxyRequest(req, res, PRODUCT_SERVICE));
app.get("/api/products/:id", (req, res) => proxyRequest(req, res, PRODUCT_SERVICE));

//====================AUTHENTICATED ROUTES====================
// User Service - Authenticated routes
app.get("/api/users/profile", authenticateGateway, (req, res) => proxyRequest(req, res, USER_SERVICE));
app.delete("/api/users", authenticateGateway, (req, res) => proxyRequest(req, res, USER_SERVICE));
app.get("/api/users", authenticateGateway, (req, res) => proxyRequest(req, res, USER_SERVICE)); // Admin only (service checks)
app.put("/api/users/profile", authenticateGateway, (req, res) => proxyRequest(req, res, USER_SERVICE));

// Cart Service - Authenticated routes
app.get("/api/cart", authenticateGateway, (req, res) => proxyRequest(req, res, CART_SERVICE));
app.post("/api/cart/items", authenticateGateway, (req, res) => proxyRequest(req, res, CART_SERVICE));
app.put("/api/cart/items", authenticateGateway, (req, res) => proxyRequest(req, res, CART_SERVICE));
app.delete("/api/cart/items/:productId", authenticateGateway, (req, res) => proxyRequest(req, res, CART_SERVICE));
app.delete("/api/cart", authenticateGateway, (req, res) => proxyRequest(req, res, CART_SERVICE));

//Order Service - Authenticated routes
app.post("/api/orders/checkout", authenticateGateway, (req, res) => proxyRequest(req, res, ORDER_SERVICE));

//====================ADMIN ROUTES====================

//Product Service - Admin Routes
app.post("/api/products", (req, res) => proxyRequest(req, res, PRODUCT_SERVICE));
app.delete("/api/products/:id", (req, res) => proxyRequest(req, res, PRODUCT_SERVICE));


//====================INTERNAL ROUTES (Blocked from public)====================
//User Service internal routes (called directly between services)
// - GET /api/users (list all users)
// - GET /api/users/:id (get user by ID)

//Health check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        gateway: "running",
        services: {
            user: USER_SERVICE,
            product: PRODUCT_SERVICE,
            cart: CART_SERVICE
        }
    });
});

//404 Handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
    console.log("Routing to:");
    console.log(`  User Service: ${USER_SERVICE}`);
    console.log(`  Product Service: ${PRODUCT_SERVICE}`);
    console.log(`  Cart Service: ${CART_SERVICE}`);
})