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
}

export default OrderController;