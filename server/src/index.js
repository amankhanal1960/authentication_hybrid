import express from "express";
import userRoutes from "./user/userRoutes.js";

const app = express();
app.use(express.json());

app.use("/api/user", userRoutes);

app.listen(4000, () => {
  console.log("Server listening on http://localhost:4000");
});
