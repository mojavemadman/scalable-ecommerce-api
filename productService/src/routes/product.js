import { Router } from "express";
import ProductController from "../controllers/ProductController.js";

const productRouter = Router();

//Will need auth/admin
productRouter.post("/", ProductController.create);
productRouter.get("/", ProductController.findAll);
productRouter.get("/active", ProductController.findByActive);
productRouter.get("/heath", (req, res) => res.status(200).send({ status: "Product service is running" }));
productRouter.get("/categories/:id", ProductController.findByCategory);
productRouter.put("/inventory/:productId", ProductController.decreaseInventory);
productRouter.get("/:id", ProductController.findById);
//Will need auth/admin
productRouter.put("/:id", ProductController.update);
//Will need auth/admin
productRouter.delete("/:id", ProductController.delete);

export default productRouter;