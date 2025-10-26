import Orders from "../models/Orders.js";

class OrderController {
    static async createOrder(req, res) {
        try {
            const { shippingInfo, totalAmount } = req.body;
            const userId = req.headers["x-user-id"];
            
            const order = await Orders.createOrder(userId, shippingInfo, totalAmount);
            res.status(201).send(order);
        } catch (error) {
            console.error("Error creating order", error);
            res.status(500).send({ error: error.message });
        }
    }

    static async findOrdersByUser(req, res) {
        try {
            const orders = await Orders.findOrdersByUserId(req.headers["x-user-id"]);

            if (!orders || orders.length === 0) {
                return res.status(404).send({ error: "Orders not found"})
            }

            res.status(200).send(orders);
        } catch (error) {
            console.error("Error retrieving orders:", error);
            res.status(500).send({ error: error.message });
        }
    }

    static async findOrderById(req, res) {
        try {
            const order = await Orders.findOrderById(req.params.id);

            if (!order) {
                return res.status(404).send({ error: "Order not found"});
            }

            res.status(200).send(order);
        } catch (error) {
            console.error("Error retrieving order:", error);
            res.status(500).send({ error: error.message });
        }
    }

    static async updateOrderStatus(req, res) {
        try {
            const orderId = req.params.id;
            const { newStatus } = req.body;
            const updatedOrder = await Orders.updateOrderStatus(orderId, newStatus);

            if (!updatedOrder) {
                return res.status(404).send({ error: "Order not found" });
            }

            res.status(200).send(updatedOrder);
        } catch (error) {
            console.error("Error updating order:", error);
            res.status(500).send({ error: error.message });
        }
    }

    static async updateShipping(req, res) {
        try {
            const orderId = req.params.id;
            const { shippingInfo } = req.body;
            const updatedOrder = await Orders.updateShippingInfo(orderId, shippingInfo);

            if (!updatedOrder) {
                return res.status(404).send({ error: "Order not found" });
            }

            res.status(200).send(updatedOrder);
        } catch (error) {
            console.error("Error updating order:", error);
            res.status(500).send({ error: error.message });
        }
    }

    static async cancelOrder(req, res) {
        try {
            const orderId = req.params.id;
            const cancelledOrder = await Orders.cancelOrder(orderId);

            if (!cancelledOrder) {
                return res.status(404).send({ error: "Order not found" });
            }

            res.status(200).send(cancelledOrder);
        } catch (error) {
            console.error("Error deleting order:", error);
            res.status(500).send({ error: error.message });
        }
    }

    static async addItem(req, res) {
        try {
            const orderId = req.params.id;
            const { productId, quantity, priceAtPurchase } = req.body;
            const newOrderItem = await Orders.addItemToOrder(orderId, productId, quantity, priceAtPurchase);

            if (!newOrderItem) {
                return res.status(400).send({ error: "Unable to add item" });
            }

            res.status(200).send(newOrderItem);
        } catch (error) {
            console.error("Error adding item:", error);
            res.status(500).send({ error: error.message });
        }
    }

    static async getOrderItems(req, res) {
        try {
            const orderItems = await Orders.getOrderItems(req.params.id);

            if (orderItems.length === 0) {
                return res.status(404).send({ error: "Items not found" });
            }

            res.status(200).send(orderItems);
        } catch (error) {
            console.error("Error retrieving order items:", error);
            res.status(500).send({ error: error.message });
        }
    }

    //Checkout flow -- Helper functions below
    static async checkout(req, res) {
        try {
            const userId = req.headers["x-user-id"];
            const { paymentInfo } = req.body;

            const cart = await OrderController.getCartItems(userId);

            if(!cart || cart.length === 0) {
                return res.status(404).send({ error: "Cart not found" });
            }

            const validatedItems = await OrderController.validateCartItems(cart.items);
            const totalAmount = await OrderController.calculateTotal(validatedItems);
            
            console.log(`Total amount: $${totalAmount.toFixed(2)}`);

            const order = await OrderController.createPendingOrder(userId, validatedItems, totalAmount);
            const payment = await OrderController.processPayment(order.id, totalAmount, paymentInfo);

            await OrderController.finalizeOrder(order.id, cart.items);

            res.status(201).json({ order, payment });
        } catch (error) {
            console.error("Checkout error:", error);
            res.status(500).json({ error: error.message })
        }
    }

    static async getCartItems(userId) {
        try {
            const response = await fetch(`${process.env.CART_SERVICE_URL}/cart`, {
                headers: {
                    'X-User-Id': userId
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Cart not found");
                }
                throw new Error(`Cart service error: ${response.status}`)
            }
            
            const data = await response.json();
            return data;

        } catch (error) {
            console.error("Error fetching cart:", error);
            throw new Error(`Failed to get cart: ${error.message}`);
        }
    }

    static async validateCartItems(items) {
        try {
            const validatedItems = [];

            for (const item of items) {
                const response = await fetch(
                    `${process.env.PRODUCT_SERVICE_URL}/products/${item.productId}`
                );

                if (!response.ok) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                const product = await response.json();

                if (!product.is_active) {
                    throw new Error(`Product ${product.name} is no longer available`)
                }

                if (product.inventory < item.quantity) {
                    throw new Error(
                        `Not enough stock for "${product.name}". ` +
                        `Requested: ${item.quantity}; Available: ${product.inventory}` 
                    );
                }

                validatedItems.push({
                    productId: product.id,
                    quantity: item.quantity,
                    price: product.price,
                    name: product.name
                });
            }

            console.log(`All ${items.length} items validated`);
            return validatedItems;
        } catch (error) {
            console.error("Validation error:", error);
            throw error;
        }
    }

    static async calculateTotal(validatedItems) {
        return validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    static async createPendingOrder(userId, validatedItems, totalAmount) {
        try {
            //1. Create order (need userId, shippingInfo, totalAmount)
            const response = await fetch(`${process.env.USER_SERVICE_URL}/users/profile`, {
                headers: {
                    "X-User-Id": userId
                }
            });
            
            if (!response.ok) {
                throw new Error("User not found");
            }

            const user = await response.json();
            const shippingInfo = {
                street: user.shipping_street,
                city: user.shipping_city,
                state: user.shipping_state,
                zip: user.shipping_zip
            }

            //2. Create order
            const order = await Orders.createOrder(userId, shippingInfo, totalAmount);

            if (!order) {
                throw new Error("Error creating order");
            }
            
            //3. Add validated items to order
            for (const item of validatedItems) {
                await Orders.addItemToOrder(order.id, item.productId, item.quantity, item.price)
            }
            console.log(`Order ${order.id} created with ${validatedItems.length} items`)
            return order;
        } catch (error) {
            console.error("Error initializing order:", error);
            throw error;
        }
    }

    //TODO: CREATE PAYMENT HELPER
}

export default OrderController;