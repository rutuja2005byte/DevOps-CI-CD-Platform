const request = require("supertest");
const app = require("../src/server");

describe("GET /", () => {
  test("should return the application message", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe(
      "DevOps Platform is running!"
    );
  });
});

describe("GET /health", () => {
  test("should return UP status", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);

    expect(response.body.status).toBe("UP");
  });
});

describe("GET /api/users", () => {
  test("should return users", async () => {
    const response = await request(app).get("/api/users");

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveLength(2);

    expect(response.body[0].name).toBe("Rutuja");
    expect(response.body[1].name).toBe("John");
  });
});