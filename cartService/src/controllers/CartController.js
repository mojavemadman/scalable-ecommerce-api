import Cart from "../models/Cart.js";

class CartController {

    static async retrieveCart(req, res) {
        try {
            const userId = req.headers["x-user-id"];
            const cart = await Cart.getCart(userId);

            if (!cart) {
                return res.status(404).send({ error: "Cart not found" })
            }

            res.status(200).send(cart)
        } catch (error) {
            console.error("Error retrieving cart:", error);
            res.status(400).send({ error: error.message });
        }
    }

    static async updateItemQuantity(req, res) {
        try {
            const userId = req.headers["x-user-id"];
            const { productId, quantity } = req.body;
            const modifiedItem = await Cart.updateItemQuantity(userId, productId, quantity);

            if (!modifiedItem) {
                return res.status(404).send({ error: "Cart item not found" })
            }

            res.status(200).send(modifiedItem);
        } catch (error) {
            console.error("Error retrieving cart:", error);
            res.status(400).send({ error: error.message });
        }
    }

    static async addItem(req, res) {
        try {
            const userId = req.headers["x-user-id"];
            const { productId, quantity } = req.body;

            if (!quantity || quantity <= 0) {
                return res.status(400).send({ error: "Quantity must be greater than 0" });
            }
        
            const productResponse = await fetch(`http://localhost:3001/products/${productId}`);
            
            if (!productResponse.ok) {
                if (productResponse.status === 404) {
                    return res.status(404).send({ error: "Product not found" });
                }
                throw new Error(`Product service error: ${productResponse.status}`);
            }
            
            const product = await productResponse.json();
            
            if (!product.is_active) {
                return res.status(400).send({ error: "Product is not active" });
            }
            
            if (product.inventory < quantity) {
                return res.status(400).send({ error: "Insufficient inventory" });
            }

            const newItem = await Cart.addItem(userId, productId, quantity);

            if (!newItem) {
                return res.status(404).send({ error: "Item not found" });
            }

            res.status(201).send(newItem);
        } catch (error) {
            console.error("Error adding item to cart:", error);
            res.status(400).send({ error: error.message });
        }
    }

    static async deleteItem(req, res) {
        try {
            const userId = req.headers["x-user-id"];
            const { productId } = req.params;
            const deletedItem = await Cart.deleteItem(userId, productId);

            if (!deletedItem) {
                return res.status(404).send({ error: "Cart item not found" });
            }

            res.status(200).send(deletedItem);
        } catch (error) {
            console.error("Error deleting item:", error);
            res.status(400).send({ error: error.message })
        }
    }

    static async clearCart(req, res) {
        try {
            const userId = req.headers["x-user-id"];
            const clearedCart = await Cart.clearCart(userId)

            if (!clearedCart) {
                return res.status(404).send({ error: "Cart not found" });
            }

            res.status(200).send(clearedCart);
        } catch (error) {
            console.error("Error clearing cart:", error);
            res.status(400).send({ error: error.message });
        }
    }
}

export default CartController