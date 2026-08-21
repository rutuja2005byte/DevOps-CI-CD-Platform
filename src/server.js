const express = require("express");

const app = express();

const PORT = 3000;

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "DevOps Platform is running!"
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "UP"
  });
});

// Users API
app.get("/api/users", (req, res) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});