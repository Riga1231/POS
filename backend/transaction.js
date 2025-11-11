import express from "express";

const router = express.Router();

// 🟢 CREATE TRANSACTION
router.post("/", async (req, res) => {
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

    // Start transaction
    await db.run("BEGIN TRANSACTION");

    try {
      // 1. Insert main transaction
      const transactionResult = await db.run(
        `INSERT INTO transactions (total_amount, total_cost, payment_method) VALUES (?, ?, ?)`,
        [parseFloat(total_amount), parseFloat(total_cost), payment_method]
      );
      const transactionId = transactionResult.lastID;

      // 2. Insert transaction items with variant support
      for (const item of items) {
        const unit_cost = parseFloat(item.cost) || 0;
        const unit_price = parseFloat(item.price) || 0;
        const item_qty = parseInt(item.qty) || 1;
        const total_item_cost = unit_cost * item_qty;
        const total_item_price = unit_price * item_qty;

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
      }

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
  }
});

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
