const express = require("express");

const app = express();

const PORT = 3000;

// Home route
app.get("/", (req, res) => {
  console.log("GET / request received");
  res.json({
    message: "DevOps Platform is running!"
  });
});

// Health check route
app.get("/health", (req, res) => {
  console.log("Health check requested");
  res.json({
    status: "UP"
  });
});

// Users API
app.get("/api/users", (req, res) => {
  console.log("GET /api/users request received");

  res.json([
    {
      id: 1,
      name: "Rutuja"
    },
    {
      id: 2,
      name: "John"
    }
  ]);
});

app.use((err, req, res, next) => {
  console.error("Application error:", err);

  res.status(500).json({
    error: "Internal Server Error"
  });
});

// Start server only when this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;