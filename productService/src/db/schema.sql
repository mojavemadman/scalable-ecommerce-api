CREATE DATABASE products_db;

CREATE TABLE products (
    id SERIAL PRIMARY_KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    inventory INTEGER CHECK (inventory >= 0) 
)