import express from "express";
import { Client } from "pg"; // Add this import

const router = express.Router();

// PostgreSQL configuration (same as in server.js)
const pgConfig = {
  host: "localhost",
  port: 5432,
  database: "inventorydb",
  user: "postgres",
  password: "your_password_here", // Use same password as in server.js
};

// 🟢 CREATE TRANSACTION - UPDATED WITH POSTGRES STOCK UPDATE
router.post("/", async (req, res) => {
  let pgClient;

  try {
    const db = req.db;
    const { items, total_amount, payment_method = "cash" } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Items array is required and cannot be empty" });
    }
    if (total_amount === undefined || total_amount === null) {
      return res.status(400).json({ error: "Total amount is required" });
    }

    // Validate payment method
    const validPaymentMethods = ["cash", "gcash"];
    if (!validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({
        error:
          "Invalid payment method. Must be one of: " +
          validPaymentMethods.join(", "),
      });
    }

    // Calculate total cost from items with proper decimal handling
    const total_cost = items.reduce((sum, item) => {
      const itemCost = parseFloat(item.cost) || 0;
      const itemQty = parseInt(item.qty) || 1;
      return sum + itemCost * itemQty;
    }, 0);

    // Connect to PostgreSQL
    pgClient = new Client(pgConfig);
    await pgClient.connect();

    // Start SQLite transaction
    await db.run("BEGIN TRANSACTION");

    try {
      // 1. Insert main transaction
      const transactionResult = await db.run(
        `INSERT INTO transactions (total_amount, total_cost, payment_method) VALUES (?, ?, ?)`,
        [parseFloat(total_amount), parseFloat(total_cost), payment_method]
      );
      const transactionId = transactionResult.lastID;

      // 2. Insert transaction items and update PostgreSQL stock
      for (const item of items) {
        const unit_cost = parseFloat(item.cost) || 0;
        const unit_price = parseFloat(item.price) || 0;
        const item_qty = parseInt(item.qty) || 1;
        const total_item_cost = unit_cost * item_qty;
        const total_item_price = unit_price * item_qty;

        // Insert transaction item
        await db.run(
          `INSERT INTO transaction_items 
          (transaction_id, item_id, variant_id, item_name, category_name, variant_name, qty, 
           unit_price, unit_cost, total_price, total_cost) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transactionId,
            item.item_id || item.id,
            item.variant_id || null,
            item.name,
            item.categoryName || "Uncategorized",
            item.variant_name || "",
            item_qty,
            unit_price,
            unit_cost,
            total_item_price,
            total_item_cost,
          ]
        );

        // 3. UPDATE STOCK IN POSTGRESQL using stored IDs
        if (item.variant_id) {
          await updatePostgreSQLStock(pgClient, db, item.variant_id, item_qty);
        } else {
          console.warn(`⚠️ No variant_id provided for item: ${item.name}`);
        }
      }

      // Commit both transactions
      await db.run("COMMIT");

      res.status(201).json({
        message: "Transaction created successfully",
        transaction_id: transactionId,
        total_amount: parseFloat(total_amount),
        total_cost: parseFloat(total_cost),
        total_profit: parseFloat(total_amount) - parseFloat(total_cost),
        items_count: items.length,
        payment_method: payment_method,
      });
    } catch (error) {
      await db.run("ROLLBACK");
      throw error;
    }
  } catch (err) {
    console.error("❌ Failed to create transaction:", err);
    res
      .status(500)
      .json({ error: "Failed to create transaction: " + err.message });
  } finally {
    // Close PostgreSQL connection
    if (pgClient) {
      await pgClient.end();
    }
  }
});

// Function to update PostgreSQL stock using stored IDs
async function updatePostgreSQLStock(
  pgClient,
  sqliteDb,
  variantId,
  quantitySold
) {
  try {
    // Get PostgreSQL IDs from SQLite
    const variant = await sqliteDb.get(
      "SELECT postgres_product_id, postgres_stock_id FROM item_variants WHERE id = ?",
      [variantId]
    );

    if (!variant) {
      console.warn(`⚠️ Variant not found in SQLite: ${variantId}`);
      return;
    }

    if (variant.postgres_stock_id) {
      // Update using stock_id (most reliable)
      const updateQuery = `
        UPDATE product_stocks 
        SET total_on_hand = GREATEST(0, total_on_hand - $1)
        WHERE stock_id = $2
        RETURNING stock_id, total_on_hand, product_id
      `;

      const result = await pgClient.query(updateQuery, [
        quantitySold,
        variant.postgres_stock_id,
      ]);

      if (result.rows.length > 0) {
        console.log(`✅ Updated PostgreSQL stock:`, {
          stock_id: result.rows[0].stock_id,
          product_id: result.rows[0].product_id,
          new_stock: result.rows[0].total_on_hand,
          quantity_sold: quantitySold,
        });
      } else {
        console.warn(
          `⚠️ No stock record found for stock_id: ${variant.postgres_stock_id}`
        );
      }
    } else if (variant.postgres_product_id) {
      // Fallback: update using product_id
      const updateQuery = `
        UPDATE product_stocks 
        SET total_on_hand = GREATEST(0, total_on_hand - $1)
        WHERE product_id = $2
        RETURNING stock_id, total_on_hand, product_id
      `;

      const result = await pgClient.query(updateQuery, [
        quantitySold,
        variant.postgres_product_id,
      ]);

      if (result.rows.length > 0) {
        console.log(`✅ Updated PostgreSQL stock (fallback):`, {
          product_id: result.rows[0].product_id,
          new_stock: result.rows[0].total_on_hand,
          quantity_sold: quantitySold,
        });
      } else {
        console.warn(
          `⚠️ No stock record found for product_id: ${variant.postgres_product_id}`
        );
      }
    } else {
      console.warn(`⚠️ No PostgreSQL IDs found for variant: ${variantId}`);
    }
  } catch (error) {
    console.error("❌ Failed to update PostgreSQL stock:", error);
    throw error;
  }
}

// 🟢 GET ALL TRANSACTIONS
router.get("/", async (req, res) => {
  try {
    const db = req.db;

    const transactions = await db.all(`
      SELECT 
        t.*,
        (t.total_amount - t.total_cost) as total_profit,
        COUNT(ti.id) as items_count
      FROM transactions t
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      GROUP BY t.id
      ORDER BY t.transaction_date DESC
    `);

    res.json(transactions);
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// 🟢 GET SINGLE TRANSACTION WITH ITEMS
router.get("/:id", async (req, res) => {
  try {
    const db = req.db;
    const transactionId = req.params.id;

    // Get transaction details
    const transaction = await db.get(
      `SELECT *, (total_amount - total_cost) as total_profit FROM transactions WHERE id = ?`,
      [transactionId]
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Get transaction items with variant info
    const transactionItems = await db.all(
      `
      SELECT 
        ti.*,
        ti.item_name,
        ti.category_name,
        ti.variant_name,
        i.name as current_item_name,
        c.name as current_category_name,
        i.type as item_type,
        (ti.total_price - ti.total_cost) as item_profit
      FROM transaction_items ti
      LEFT JOIN item i ON ti.item_id = i.id
      LEFT JOIN category c ON i.category_id = c.id
      WHERE ti.transaction_id = ?
    `,
      [transactionId]
    );

    res.json({
      ...transaction,
      items: transactionItems,
    });
  } catch (err) {
    console.error("Failed to fetch transaction:", err);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

export default router;
