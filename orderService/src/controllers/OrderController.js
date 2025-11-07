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
                return res.status(404).send({ error: "Orders not found" })
            }

            res.status(200).send(orders);
        } catch (error) {
            console.error("Error retrieving orders:", error);
            res.status(500).send({ error: error.message });
        }
    }

    static async findOrderById(req, res) {
        try {
            const userId = req.headers["x-user-id"];
            const orderId = req.params.id;

            const verification = await OrderController.verifyOrderOwnership(orderId, userId);
            if (!verification.authorized) {
                return res.status(verification.status).send(({ error: verification.error }))
            }

            const order = verification.order;
            const paymentResponse = await fetch(
                `${process.env.PAYMENT_SERVICE_URL}/order/${id}`
            );
            const payment = paymentResponse.ok ? await paymentResponse.json() : null;

            res.status(200).send({ order, payment });
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
            const userId = req.headers["x-user-id"];
            const orderId = req.params.id;
            const { shippingInfo } = req.body;

            const verification = await OrderController.verifyOrderOwnership(req.params.id, userId);
            
            if (!verification.authorized) {
                return res.status(verification.status).send({ error: verification.error});
            }

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
            const userId = req.headers["x-user-id"];
            const orderId = req.params.id;

            const verification = await OrderController.verifyOrderOwnership(userId, orderId);

            if (!verification.authorized) {
                return res.status(verification.status).send({ error: verification.error });
            }
            
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
            const userId = req.headers["x-user-id"];
            const orderId = req.params.id;
            const verification = await OrderController.verifyOrderOwnership(orderId, userId);
            
            if (!verification.authorized) {
                return res.status(verification.status).send(({ error: verification.error }))
            }

            const orderItems = await Orders.getOrderItems(orderId);

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
            const userEmail = req.headers["x-user-email"];
            const { paymentInfo } = req.body;

            const cart = await OrderController.getCartItems(userId);

            console.log("Cart fetched:", JSON.stringify(cart, null, 2));
            console.log("Cart items count:", cart?.items.length);

            if (!cart || !cart.items || cart.length === 0) {
                return res.status(404).send({ error: "Cart not found" });
            }
            const validatedItems = await OrderController.validateCartItems(cart.items);
            const totalAmount = await OrderController.calculateTotal(validatedItems);
            console.log(`Total amount: $${totalAmount.toFixed(2)}`);

            const order = await OrderController.createPendingOrder(userId, validatedItems, totalAmount);

            console.log(`Order created: ${order.id}`);
            const payment = await OrderController.processPayment(order, paymentInfo);

            const result = await OrderController.finalizeOrder(userId, userEmail, order, validatedItems, payment);
            res.status(201).json({ order: result.order , payment });
        } catch (error) {
            console.error("Checkout error:", error);
            res.status(500).json({ error: error.message });
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

    static async processPayment(order, paymentInfo) {
        try {
            const idempotencyKey = `order_${order.id}`;
            const response = await fetch(`${process.env.PAYMENT_SERVICE_URL}/payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    orderId: order.id,
                    idempotencyKey: idempotencyKey,
                    paymentMethod: paymentInfo.method,
                    totalAmount: order.total_amount,
                    billingInfo: paymentInfo.billingInfo
                })
            }
            );

            if (!response.ok) {
                throw new Error("Error creating payment");
            }

            const { payment } = await response.json();
            return payment;
        } catch (error) {
            console.error("Error processing payment");
            throw error;
        }
    }

    static async finalizeOrder(userId, userEmail, order, validatedItems, payment) {
        try {
            if (payment.payment_status === "confirmed") {
                //Decrease inventory
                for (const item of validatedItems) {
                    const response = await fetch(`${process.env.PRODUCT_SERVICE_URL}/products/inventory/${item.productId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            quantity: item.quantity
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Error decreasing inventory for ${item.name}`);
                    }
                }
                //Update order status to "confirmed" and add payment_id
                order = await Orders.updateOrderStatus(order.id, "confirmed", payment.id);
                console.log("Finalizing order; updated order:", order);
                //Clear user's cart
                const clearedCart = await fetch(`${process.env.CART_SERVICE_URL}/cart`, {
                    method: "DELETE",
                    headers: {
                        "X-User-Id": userId
                    }
                });

                if (!clearedCart.ok) {
                    throw new Error("Error clearing cart after order completion");
                }

                fetch(`${process.env.NOTIFICATION_SERVICE_URL}/notifications/order-confirmation`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        orderId: order.id,
                        userEmail: userEmail,
                        orderDetails: {
                            totalAmount: order.total_amount,
                            status: order.status,
                            items: validatedItems
                        }
                    })
                }).catch(err => {
                    //Allow notification service to fail without preventing checkout
                    console.error("Failed to send notification", err);
                })

                return { success: true, paymentId: payment.id, order: order };

            } else {
                order = await Orders.updateOrderStatus(order.id, "failed", payment.id)
                return { error: "Payment failed" }
            }
        } catch (error) {
            console.error("Error finalizing order:", error);
            throw error;
        }
    }

    static async verifyOrderOwnership(orderId, userId) {
        const order = await Orders.findOrderById(orderId)

        if (!order) {
            return { authorized: false, error: "Order not found", status: 404 };
        }

        if (order.userId !== parseInt(userId)) {
            return { authorized: false, error: "Access not authorized", status: 403 };
        }

        return { authorized: true, order };
    }
}

export default OrderController;