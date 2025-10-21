import { Router } from "express";
import ProductController from "../../controllers/ProductController.js";

const productRouter = Router();

//Will need auth/admin
productRouter.post("/", ProductController.create);

productRouter.get("/", ProductController.findAll);

productRouter.get("/active", ProductController.findByActive);

productRouter.get("/categories/:id", ProductController.findByCategory);

productRouter.get("/:id", ProductController.findById);

productRouter.put("/:id", ProductController.update);

//Will need auth/admin
productRouter.delete("/:id", ProductController.delete);

export default productRouter;