import Cart from "../models/Cart.js";

class CartController {

    static async retrieveCart(req, res) {
        try {
            const { userId } = req.user;
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
            const { userId } = req.user;
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
            const { userId } = req.user;
            const { productId, quantity } = req.body;

            //TODO: Call Product Service and verify product exists, is active, and inventory >= quantity
            fetch("http://localhost:3001/product/active")
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Error retrieving product information:", response.status )
                    }
                    return response.json();
                })
                .then(data => {
                    const filteredProds = data.filter(rows => rows.productId === productId);
                    if (filteredProds.length === 0) {
                        
                    }
                })

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
            const { userId } = req.user;
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
            const { userId } = req.user;
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