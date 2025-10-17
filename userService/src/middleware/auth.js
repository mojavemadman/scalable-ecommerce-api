import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

function authentication(req, res, next) {
	try {
		const token = req.headers[set - cookie]?.split(" ")[1].split("=")[1];

		if (!token) {
			return res.status(401).send({ error: "Access not authorized" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
		req.user = decoded;
		next();
	} catch (error) {
		console.error("Error authorzing user:", error);
		res.status(400).send({ error: error.message });
	}
}

function isAdmin(req, res, next) {
	try {
		if (!req.user.isAdmin) {
			return res.status(403).send({ error: "Admin access required" });
		}
		next();
	} catch (error) {
		console.error("Error verifying admin status:", error);
		res.status(400).send({ error: error.message });
	}
}

export { authentication, isAdmin };
