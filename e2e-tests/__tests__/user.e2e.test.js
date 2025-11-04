import { describe, test, expect,  afterAll} from "@jest/globals";
import request from "supertest";
import pg from "pg";
import dotenv from "dotenv"

dotenv.config();

const { Pool } = pg;

const GATEWAY_URL = process.env.GATEWAY_URL;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: "users_db",
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

describe("User end-to-end tests", () => {
    let authToken;
    let userId;
    const testEmail = `${Date.now()}@testdomain.com`

    //Clean up test data after tests
    afterAll(async () => {
        if (userId) {
            await pool.query("DELETE FROM users WHERE id = $1", [userId]);
        }
        await pool.end();
    });

    describe("POST /api/users - Registration", () => {
        test("should register a new user successfully", async() => {
            const response = await request(GATEWAY_URL)
                .post("/api/users")
                .send({
                    email: testEmail,
                    password: "testpassword",
                    firstName: "Testicus",
                    lastName: "Finch",
                    shippingStreet: "123 Test St",
                    shippingCity: "TestCity",
                    shippingState: "TS",
                    shippingZip: "12345",
                    shippingCountry: "US"
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("id");
            expect(response.body.email).toBe(testEmail);
            expect(response.body).not.toHaveProperty("password");
        });

        test("should fail with duplicate email", async () => {
            const response = await request(GATEWAY_URL)
                .post("/api/users")
                .send({
                    email: testEmail,
                    password: "testpassword",
                    firstName: "Testicus",
                    lastName: "Finch Jr."
                });

            expect(response.status).toBe(409);
        });

        test("should fail with required fields missing", async () => {
            const response = await request(GATEWAY_URL)
                .post("/api/users")
                .send({
                    email: "differentemail@testdomain.com"
                    //Missing password and name
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("error");
        });
    });

    describe("POST /api/users/login - Authentication", () => {
        test("should login with correct credentials", async () => {
            const response = await request(GATEWAY_URL)
                .post("/api/users/login")
                .send({
                    email: testEmail,
                    password: "testpassword"
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("token");
            expect(response.body.user.email).toBe(testEmail);

            //Store token for tests below
            authToken = response.body.token;
        });

        test("should fail with incorrect password", async () => {
            const response = await request(GATEWAY_URL)
                .post("/api/users/login")
                .send({
                    email: testEmail,
                    password: "wrongpassword"
                });

            expect(response.status).toBe(401);
        });

        test("should fail if email not in database", async () => {
            const response = await request(GATEWAY_URL)
                .post("/api/users/login")
                .send({
                    email: "fakeemail@doesntexist.com",
                    password: "blahblah"
                });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty("error");
        });
    });

    describe("GET /api/users/profile - Get Profile (Auth Req.)", () => {
        test("should get user profile with valid token", async () => {
            const response = await request(GATEWAY_URL)
                .get("/api/users/profile")
                .set("Authorization", `Bearer ${authToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.email).toBe(testEmail);
            expect(response.body.first_name).toBe("Testicus");
            expect(response.body.last_name).toBe("Finch");
            expect(response.body).not.toHaveProperty("password");
        });

        test("should fail without token (401 from gateway)", async () => {
            const response = await request(GATEWAY_URL)
                .get("/api/users/profile");

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty("error");
        });

        test("should fail with invalid token (401 from gateway)", async () => {
            const response = await request(GATEWAY_URL)
                .get("/api/users/profile")
                .set("Authorization", `Bearer invalidtokenstring`);

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty("error");
        });
    });

    describe("PUT /api/users/profile - Update Profile (Auth Req.)", () => {
        test("should update user profile with valid token", async () => {
            const response = await request(GATEWAY_URL)
                .put("/api/users/profile")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                    updates: {
                        firstName: "UpdatedName",
                        shippingCity: "NewCity"
                    }
                });
            
            expect(response.status).toBe(200);
            expect(response.body.first_name).toBe("UpdatedName");
            expect(response.body.shipping_city).toBe("NewCity");
        });

        test("should fail to update profile without token", async () => {
            const response = await request(GATEWAY_URL)
                .put("/api/users/profile")
                .send({
                    firstName: "ShouldNotWork"
                });
            
            expect(response.status).toBe(401);
        });
    });
});
