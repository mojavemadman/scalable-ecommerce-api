import pool from "./src/db/db.js";

const products = [
    {
        sku: "LAPTOP-001",
        name: "Gaming Laptop",
        description: "Lose ELO on LoL with high FPS!",
        price: 650.00,
        inventory: 50,
        category_id: 1,
        is_active: true
    },
    {
        sku: "MOUSE-001",
        name: "Gaming Mouse",
        description: "Lose CS with ergonomics!",
        price: 65.00,
        inventory: 10,
        category_id: 1,
        is_active: true
    },
    {
        sku: "MONITOR-001",
        name: "Curved Monitor",
        description: "Nerd neck; in style!",
        price: 350.00,
        inventory: 150,
        category_id: 1,
        is_active: true
    },
    {
        sku: "COUCH-123",
        name: "3 Piece Sectional",
        description: "Say goodbye to pocket change and keys! Complete with Narnia-Tech(TM) gaps in between sections.",
        price: 1650.00,
        inventory: 22,
        category_id: 2,
        is_active: true
    },
    {
        sku: "LAMP-001",
        name: "70s Lamp Shade",
        description: "That's, like *cough cough*, so 70s man. Groovy and keeps your room semi-dim.  Complete with incandescent light bulbs (don't tell the EPA)",
        price: 150.00,
        inventory: 350,
        category_id: 2,
        is_active: true
    },
    {
        sku: "IRIDIUM-001",
        name: "Spicy Rock",
        description: "We'd show you a picture, but it'd come out grainy. Tell anyone where you got this and you'll wish you set up your will!",
        price: 11650.00,
        inventory: 50,
        category_id: 3,
        is_active: false
    },
];

const seedProducts = async () => {
    try {
        console.log("Starting product seed...");
    
        console.log("Clearing existing products...");
        await pool.query(`DELETE FROM products`);
    
        console.log("Inserting products...")
        for (const product of products) {
            await pool.query(
                `INSERT INTO products (sku, name, description, price, inventory, category_id, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    product.sku,
                    product.name,
                    product.description,
                    product.price,
                    product.inventory,
                    product.category_id,
                    product.is_active
                ]
            );
            console.log(`Added ${product.name}`);
        }
    
        console.log(`\n Successfully seeded ${products.length} products!`);
        process.exit(0);
    } catch (error) {
        console.error("Seed error:", error);
        process.exit(1)
    }
};

seedProducts();