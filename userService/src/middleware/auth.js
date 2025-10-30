import dotenv from "dotenv";
dotenv.config();

function isAdmin(req, res, next) {
	const isAdmin = req.headers["x-is-admin"] === true;

	if (!isAdmin) {
		return res.status(403).json({ error: "Admin access required" });
	}
	next();
}

export { isAdmin };
