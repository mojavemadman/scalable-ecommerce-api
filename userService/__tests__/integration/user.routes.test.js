import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";
import pool from "../../src/db/db.js";

//TODO: Rewrite tests to test through API Gateway, not directly to user service

describe("User Routes Integration Tests", () => {
    let authToken;
    let userId;

    //Clean up test data after all tests
    afterAll(async () => {
        if (userId) {
            await pool.query("DELETE FROM users WHERE id = $1", [userId])
        }
        await pool.end();
    });

    describe("POST /users - Registration", () => {
        test("should register a new user successfully", async () => {
            const response = await request(app)
                .post("/users")
                .send({
                    email: "testuser@testdomain.com",
                    password: "testpassword",
                    firstName: "Test",
                    lastName: "User"
                })

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("id");
            expect(response.body.email).toBe("testuser@testdomain.com");
            expect(response.body).not.toHaveProperty("password");

            userId = response.body.id; //Save to clean up after tests (see comment above)
        });

        test("should fail with duplicate email", async () => {
            const response = await request(app)
                .post("/users")
                .send({
                    email: "testuser@testdomain.com",
                    password: "testpassword",
                    firstName: "Duplicate",
                    lastName: "User"
                });
            
            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty("error");
        });

        test("should fail with missing required fields", async () => {
            const response = await request(app)
                .post("/users")
                .send({
                    email: "incomplete@testdomain.com"
                    //Missing password and name
                });
            
            expect(response.status).toBe(400);
        });
    });

    describe("POST /users/login - Authentication", () => {
        test("should login with correct credentials", async () => {
            const response = await request(app)
                .post("/users/login")
                .send({
                    email: "testuser@testdomain.com",
                    password: "testpassword"
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("token");
            expect(response.body.user.email).toBe("testuser@testdomain.com");
            expect(response.body).not.toHaveProperty("password");
            
            //Save token for tests below
            authToken = response.body.token; 
        });

        test("should fail with incorrect password", async () => {
            const response = await request(app)
                .post("/users/login")
                .send({
                    email: "testuser@testdomain.com",
                    password: "wrongpassword"
                });

            expect(response.status).toBe(401);
        });

        test("should fail if email not in database", async () => {
            const response = await request(app)
                .post("/users/login")
                .send({
                    email: "thisdoesntexist@dne.com",
                    password: "doesntmatter"
                });

            expect(response.status).toBe(404);
        })
    });

    describe("GET /users/profile - Get Profile", () => {
        test("should get user profile with valid token", async () => {
            const response = await request(app)
                .get("/users/profile")
                .set("Authorization", `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.email).toBe("testuser@testdomain.com");
            expect(response.body.first_name).toBe("Test");
            expect(response.body).not.toHaveProperty("password");
        });

        test("should fail without token", async () => {
            const response = await request(app)
                .get("/users/profile");

            expect(response.status).toBe(401);
        });

        test("should fail with invalid token", async () => {
            const response = await request(app)
                .get("/users/profile")
                .set("Authorization", "Bearer invalidtoken");

            expect(response.status).toBe(401);
        });
    });

    describe("PUT /users/profile - Update Profile", () => {
        test("should update user profile", async () => {
            const response = await request(app)
                .put("/users/profile")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                    firstName: "Updated",
                    shippingStreet: "123 Test St",
                    shippingCity: "Testville",
                    shippingState: "TS",
                    shippingZip: "12345"
                });

            expect(response.status).toBe(200);
            expect(response.body.first_name).toBe("Updated");
            expect(response.body.shipping_street).toBe("123 Test St");
            expect(response.body.shipping_city).toBe("Testville");
            expect(response.body.shipping_state).toBe("TS");
            expect(response.body.shipping_zip).toBe("12345");
        });

        test("should fail without authentication", async () => {
            const response = await request(app)
                .put("/users/profile")
                .send({
                    firstName: "Failure"
                });

            expect(response.status).toBe(401);
        });
    });
});