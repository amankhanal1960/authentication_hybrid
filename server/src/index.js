import express from "express"; // if using ES modules
// or: const express = require('express'); if using CommonJS

const app = express();

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.listen(4000, () => {
  console.log("Server listening on http://localhost:4000");
});
