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