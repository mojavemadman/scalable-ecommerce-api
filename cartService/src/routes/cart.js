import { Router } from "express";
import CartController from "../controllers/CartController.js"

const cartRouter = Router();

cartRouter.get("/", CartController.retrieveCart);
cartRouter.put("/items/", CartController.updateItemQuantity);
cartRouter.post("/items", CartController.addItem);
cartRouter.delete("/items/:productId", CartController.deleteItem);
cartRouter.delete("/", CartController.clearCart);

export default cartRouter