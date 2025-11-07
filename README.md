# Scalable E-Commerce Microservices Platform

## Overview
This scalable e-commerce platform utilizes a microservice architecture to enable independent deployment/development and scalability. This project features a custom API gateway, JWT authentication, and payment processing with Stripe. 

This project was built to deeply understand microservices architecture, from designing service boundaries and communication patterns to properly handling distributed transactions and implementing proper security.

## Tech Stack
- Node.js
- Express.js
- PostgreSQL
- Stripe

## Key Features

- **Independent Services**: Six specialized microservices (User, Product, Cart, Order, Payment, Gateway) that can be deployed and scaled independently
- **Real Payment Processing**: Integrated `Stripe` API with idempotency handling for reliable payment processing
- **Distributed Security**: `JWT` verification at gateway with user context propagation via headers
- **Service Communication**: RESTful APIs with proper error handling and service-to-service validation
- **Complete E-Commerce Flow**: Full user journey from registration through checkout

## Services
- **User Service**:  Handles registration, login/authentication, and updates to user profile, including shipping information. Admins may be created to modify product listings and perform business operations, as needed.
- **Product Service**: Manages catalog of products, categories, and inventory
- **Cart Service**: Stores and manages items in user's cart for checkout and modifying quantities of items
- **Order Service**: Handles checkout and orders, including creating new orders upon checkout, and viewing past orders
- **Payment Service**: Handles payment processing through `Stripe` integration
- **Payment Service**: Utilizes `nodemailer` to send order confirmations

## Architecture
- **Microservices Architecture**: Each service has its own independent source code and database
- **API Gateway**: Custom gateway created with `Express` routes requests to the proper endpoints
- **Database**: `PostgreSQL` databases run on the backend of each service
- **Security**: `JWT` authentication with `bcrypt` password hashing
