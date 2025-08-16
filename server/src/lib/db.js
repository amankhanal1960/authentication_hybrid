import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

db.$connect()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((error) => {
    console.error("Databse connection error:", error);
  });

module.exports = db;
