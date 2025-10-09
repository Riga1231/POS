// transaction.js
import express from "express";

const router = express.Router();

// 🟢 CREATE TRANSACTION
router.post("/", async (req, res) => {
  try {
    const db = req.db;
    const { items, total_amount, payment_method } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Items array is required and cannot be empty" });
    }
    if (total_amount === undefined || total_amount === null) {
      return res.status(400).json({ error: "Total amount is required" });
    }

    // Start transaction
    await db.run("BEGIN TRANSACTION");

    try {
      // 1. Insert main transaction
      const transactionResult = await db.run(
        `INSERT INTO transactions (total_amount) VALUES (?)`,
        [total_amount]
      );
      const transactionId = transactionResult.lastID;

      // 2. Insert transaction items
      for (const item of items) {
        await db.run(
          `INSERT INTO transaction_items (transaction_id, item_id, qty, unit_price, total_price) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            transactionId,
            item.id,
            item.qty,
            item.price, // unit price at time of purchase
            item.qty * item.price, // total price for this item
          ]
        );
      }

      // 3. Optional: Insert payment method if you have a payments table
      // If you want to store payment method, you might need a payments table
      // For now, we'll just return success

      await db.run("COMMIT");

      res.status(201).json({
        message: "Transaction created successfully",
        transaction_id: transactionId,
        total_amount: total_amount,
        items_count: items.length,
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
  }
});

// 🟢 GET ALL TRANSACTIONS
router.get("/", async (req, res) => {
  try {
    const db = req.db;

    const transactions = await db.all(`
      SELECT 
        t.*,
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
      `SELECT * FROM transactions WHERE id = ?`,
      [transactionId]
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Get transaction items with item details
    const transactionItems = await db.all(
      `
      SELECT 
        ti.*,
        i.name as item_name,
        i.type as item_type
      FROM transaction_items ti
      LEFT JOIN item i ON ti.item_id = i.id
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
