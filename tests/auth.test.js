import request from "supertest";
import { app } from "../src/index.js";

describe("Auth Flow", () => {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  };
  it("Should register a new user successfull", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("_id");
  });
  it("should reject login with bad credentials", async () => {
    // Register first
    await request(app).post("/api/v1/auth/register").send(testUser);
    // Try bad login
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testUser.email, password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
