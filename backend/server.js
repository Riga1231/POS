import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import categoryRoutes from "./category.js";
import itemRoutes from "./item.js";
import transactionRoutes from "./transaction.js"; // 👈 Import transactions
import path from "path";
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Open existing SQLite database
const dbPromise = open({
  filename: "./database.db",
  driver: sqlite3.Database,
});

// Inject db into routes
app.use(
  "/api/categories",
  async (req, res, next) => {
    req.db = await dbPromise;
    next();
  },
  categoryRoutes
);
app.use(
  "/api/items",
  async (req, res, next) => {
    req.db = await dbPromise;
    next();
  },
  itemRoutes
);
// 👈 Add transactions route
app.use(
  "/api/transactions",
  async (req, res, next) => {
    req.db = await dbPromise;
    next();
  },
  transactionRoutes
);

// Default route
app.get("/", (req, res) =>
  res.send("✅ API running and connected to SQLite database")
);

// Start server
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
