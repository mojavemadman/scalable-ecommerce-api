import Product from "../models/Product.js";

class ProductController {
	static async create(req, res) {
		try {
			const { sku, name, description, price } = req.body;
			const product = await Product.create(sku, name, description, price);
			res.status(201).send(product);
		} catch (error) {
			console.error("Error creating product:", error);
			res.status(400).send({ error: error.message });
		}
	}

	static async delete(req, res) {
		try {
			const productId = req.params.id;
			const product = await Product.delete(productId);

			if (!product) {
				return res.status(404).send({ error: "Product not found" });
            }

			res.status(204).send();
		} catch (error) {
			console.error("Error deleting product:", error);
			res.status(400).send({ error: error.message });
		}
	}

	static async findAll(req, res) {
		try {
			const products = await Product.findAll();

			if (!products) {
                return res.status(404).send({ error: "Products not found" });
			}
            
            res.status(200).send(products);
		} catch (error) {
            console.error("Error retrieving products:", error);
            res.status(400).send({ error: error.message });
        }
	}

    static async findByActive(req, res) {
        const status = req.query.status
        try {
            
            const products = await Product.findByActive(status);

            if (!products) {
                return res.status(404).send({ error: "Products not found"});
            }

            res.status(200).send(products);
        } catch (error) {
            console.error("Error retrieving products:", error);
            res.status(400).send({ error: error.message })
        }
    }

    static async findById(req, res) {
        try {
            const productId = req.params.id;
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).send({ error: "Product not found" });
            }

            res.status(200).send(product);
        } catch (error) {
            console.error("Error retrieving product:", error);
            res.status(400).send({ error: error.message })
        }
    }

    static async findByCategory(req,res) {
        try {
            const categoryId = req.params.id;
            const products = await Product.findByCategory(categoryId);

            if (!products) {
                return res.status(404).send({ error: "Products not found" });
            }

            res.status(200).send(products);
        } catch (error) {
            console.error("Error retrieving products:", error);
            res.status(400).send({ error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const productId = req.params.id;
            const { updates } = req.body
            const updatedProduct = await Product.update(productId, updates);

            if (!updatedProduct) {
                return res.status(404).send({ error: "Product not found" });
            }

            res.status(200).send(updatedProduct);
        } catch (error) {
            console.error("Error updating product:", error);
            res.status(400).send({ error: error.message })
        }
    }
}

export default ProductController