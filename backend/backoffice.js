import express from "express";

const router = express.Router();

// 🟢 RESET ALL DATA (Updated for variants)
router.delete("/reset-all", async (req, res) => {
  try {
    const db = req.db;

    // Start transaction
    await db.run("BEGIN TRANSACTION");

    try {
      // Delete data from all tables in correct order (including variant tables)
      await db.run("DELETE FROM transaction_items");
      await db.run("DELETE FROM transactions");
      await db.run("DELETE FROM item_variants"); // Clear variants table
      await db.run("DELETE FROM item");
      await db.run("DELETE FROM category");

      // Reset auto-increment counters
      await db.run("DELETE FROM sqlite_sequence");

      // Commit transaction
      await db.run("COMMIT");

      console.log("✅ All database data deleted successfully");
      res.json({
        success: true,
        message: "All data has been deleted successfully",
        tables_cleared: [
          "transaction_items",
          "transactions",
          "item_variants",
          "item",
          "category",
          "admin_pin",
        ],
      });
    } catch (transactionError) {
      // Rollback on error
      await db.run("ROLLBACK");
      throw transactionError;
    }
  } catch (err) {
    console.error("❌ Failed to delete all data:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete all data: " + err.message,
    });
  }
});

// 🟢 VERIFY PIN (with database)
router.post("/verify-pin", async (req, res) => {
  try {
    const { pin } = req.body;
    const db = req.db;

    if (!pin) {
      return res.status(400).json({ success: false, error: "PIN is required" });
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      return res
        .status(400)
        .json({ success: false, error: "PIN must be 4 digits" });
    }

    // Get latest PIN from database
    const pinRecord = await db.get(
      "SELECT pin FROM admin_pin ORDER BY created_at DESC LIMIT 1"
    );

    if (!pinRecord) {
      return res
        .status(500)
        .json({ success: false, error: "No PIN configured" });
    }

    // Compare PINs (plain text comparison as requested)
    if (pin === pinRecord.pin) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: "Invalid PIN" });
    }
  } catch (err) {
    console.error("❌ PIN verification error:", err);
    res.status(500).json({ success: false, error: "PIN verification failed" });
  }
});

// 🟢 UPDATE PIN (with database)
router.put("/pin", async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const db = req.db;

    if (!currentPin || !newPin) {
      return res.status(400).json({
        success: false,
        error: "Current PIN and new PIN are required",
      });
    }

    // Validate new PIN
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        error: "New PIN must be 4 digits",
      });
    }

    // Get latest PIN from database
    const currentPinRecord = await db.get(
      "SELECT pin FROM admin_pin ORDER BY created_at DESC LIMIT 1"
    );

    if (!currentPinRecord) {
      return res.status(500).json({
        success: false,
        error: "No PIN configured in system",
      });
    }

    // Verify current PIN matches
    if (currentPin !== currentPinRecord.pin) {
      return res.status(401).json({
        success: false,
        error: "Current PIN is incorrect",
      });
    }

    // Prevent using same PIN
    if (currentPin === newPin) {
      return res.status(400).json({
        success: false,
        error: "New PIN cannot be the same as current PIN",
      });
    }

    // Insert new PIN record
    await db.run("INSERT INTO admin_pin (pin) VALUES (?)", [newPin]);

    res.json({
      success: true,
      message: "PIN updated successfully",
    });
  } catch (err) {
    console.error("❌ Failed to update PIN:", err);
    res.status(500).json({ success: false, error: "Failed to update PIN" });
  }
});

// 🟢 GET CURRENT PIN INFO (for admin purposes)
router.get("/pin-info", async (req, res) => {
  try {
    const db = req.db;

    const pinRecord = await db.get(
      "SELECT pin, created_at FROM admin_pin ORDER BY created_at DESC LIMIT 1"
    );

    if (!pinRecord) {
      return res.status(404).json({ success: false, error: "No PIN found" });
    }

    res.json({
      success: true,
      pin_set: true,
      created_at: pinRecord.created_at,
      // Don't return actual PIN for security
    });
  } catch (err) {
    console.error("❌ Failed to get PIN info:", err);
    res.status(500).json({ success: false, error: "Failed to get PIN info" });
  }
});

// 🟢 INITIALIZE DEFAULT PIN (if no PIN exists)
router.post("/initialize-pin", async (req, res) => {
  try {
    const db = req.db;

    // Check if any PIN exists
    const existingPin = await db.get("SELECT id FROM admin_pin LIMIT 1");

    if (existingPin) {
      return res.status(400).json({
        success: false,
        error: "PIN already initialized",
      });
    }

    // Insert default PIN
    await db.run("INSERT INTO admin_pin (pin) VALUES (?)", ["1234"]);

    res.json({
      success: true,
      message: "Default PIN (1234) initialized successfully",
    });
  } catch (err) {
    console.error("❌ Failed to initialize PIN:", err);
    res.status(500).json({ success: false, error: "Failed to initialize PIN" });
  }
});

// Helper function to get dates in database local time
function getDatabaseLocalDates(period) {
  // Use SQLite's localtime functions to match the database timezone
  switch (period) {
    case "today":
      return {
        where: "DATE(transaction_date) = DATE('now', 'localtime')",
        params: [],
      };

    case "yesterday":
      return {
        where: "DATE(transaction_date) = DATE('now', 'localtime', '-1 day')",
        params: [],
      };

    case "week":
      return {
        where:
          "DATE(transaction_date) BETWEEN DATE('now', 'localtime', '-6 days') AND DATE('now', 'localtime')",
        params: [],
      };

    case "month":
      return {
        where:
          "DATE(transaction_date) BETWEEN DATE('now', 'localtime', '-29 days') AND DATE('now', 'localtime')",
        params: [],
      };

    case "quarter":
      return {
        where:
          "DATE(transaction_date) BETWEEN DATE('now', 'localtime', '-89 days') AND DATE('now', 'localtime')",
        params: [],
      };

    case "year":
      return {
        where:
          "DATE(transaction_date) BETWEEN DATE('now', 'localtime', '-364 days') AND DATE('now', 'localtime')",
        params: [],
      };

    case "all":
      return {
        where: "1=1",
        params: [],
      };

    default:
      return {
        where: "DATE(transaction_date) = DATE('now', 'localtime')",
        params: [],
      };
  }
}

// 🟢 GET BACKOFFICE DASHBOARD DATA WITH FIXED TABLE ALIASES
router.get("/dashboard", async (req, res) => {
  try {
    const db = req.db;
    const { period = "today", startDate, endDate, category } = req.query;

    console.log("📊 Dashboard request received:", {
      period,
      startDate,
      endDate,
      category,
    });

    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Debug: Check database time vs system time
    const dbTime = await db.get(
      "SELECT datetime('now', 'localtime') as db_local_now, date('now', 'localtime') as db_local_today"
    );
    console.log("🐛 Database local time:", dbTime);

    // Build WHERE clause based on filters - USE DATABASE LOCAL TIME
    let whereClause = "1=1";
    const params = [];

    // Date range filtering - USE DATABASE LOCAL TIME
    if (startDate && endDate) {
      whereClause += " AND DATE(transactions.transaction_date) BETWEEN ? AND ?";
      params.push(startDate, endDate);
      console.log("📅 Using custom date range:", { startDate, endDate });
    } else {
      // Use database local time for period filtering
      const dateFilter = getDatabaseLocalDates(period);
      whereClause += " AND " + dateFilter.where;
      params.push(...dateFilter.params);
      console.log("📅 Using period filter:", period, dateFilter);
    }

    // Category filtering - using category_name from transaction_items
    if (category && category !== "all") {
      whereClause += " AND transaction_items.category_name = ?";
      params.push(category);
    }

    console.log("🔍 Final WHERE clause:", whereClause);
    console.log("🔍 Final params:", params);

    // Debug: Check what transactions match the current filter
    const debugTransactions = await db.all(
      `SELECT id, transaction_date, DATE(transaction_date) as date_only, total_amount FROM transactions WHERE ${whereClause}`,
      params
    );
    console.log("🐛 Filtered transactions debug:", {
      count: debugTransactions.length,
      transactions: debugTransactions,
    });

    // 1. OVERALL STATISTICS (Variant-aware)
    const stats = await db.all(
      `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(total_amount - total_cost), 0) as total_profit,
        COALESCE(AVG(total_amount), 0) as avg_transaction_value,
        COUNT(DISTINCT DATE(transaction_date)) as business_days
      FROM transactions
      WHERE ${whereClause}
    `,
      params
    );

    console.log("📈 Stats query result:", stats[0]);

    // 2. COMPARISON PERIOD (for trends) - Also use database local time
    const comparisonStats = await getComparisonStats(db, period);

    console.log("📊 Comparison stats:", comparisonStats[0]);

    // 3. DAILY BREAKDOWN (for charts)
    const dailyBreakdown = await db.all(
      `
      SELECT 
        DATE(transaction_date) as date,
        COUNT(*) as transaction_count,
        SUM(total_amount) as daily_revenue,
        SUM(total_cost) as daily_cost,
        SUM(total_amount - total_cost) as daily_profit
      FROM transactions
      WHERE ${whereClause}
      GROUP BY DATE(transaction_date)
      ORDER BY date ASC
    `,
      params
    );

    console.log("📅 Daily breakdown:", dailyBreakdown);

    // 4. HOURLY BREAKDOWN (for peak hours analysis)
    const hourlyBreakdown = await db.all(
      `
      SELECT 
        strftime('%H', transaction_date) as hour,
        COUNT(*) as transaction_count,
        SUM(total_amount) as hourly_revenue
      FROM transactions
      WHERE ${whereClause}
      GROUP BY strftime('%H', transaction_date)
      ORDER BY hour ASC
    `,
      params
    );

    console.log("⏰ Hourly breakdown:", hourlyBreakdown);

    // 5. TOP ITEMS WITH VARIANTS (UPDATED)
    const topItems = await db.all(
      `
      SELECT 
        transaction_items.item_name,
        transaction_items.variant_name,
        transaction_items.category_name,
        SUM(transaction_items.qty) as total_quantity,
        SUM(transaction_items.total_price) as total_revenue,
        SUM(transaction_items.total_cost) as total_cost,
        SUM(transaction_items.total_price - transaction_items.total_cost) as total_profit,
        CASE 
          WHEN SUM(transaction_items.total_price) > 0 THEN 
            ROUND((SUM(transaction_items.total_price - transaction_items.total_cost) * 100.0 / SUM(transaction_items.total_price)), 2)
          ELSE 0 
        END as profit_margin
      FROM transaction_items
      JOIN transactions ON transaction_items.transaction_id = transactions.id
      WHERE ${whereClause}
      GROUP BY transaction_items.item_id, transaction_items.variant_id
      ORDER BY total_revenue DESC
      LIMIT 10
    `,
      params
    );

    console.log("🏆 Top items with variants:", topItems);

    // 6. CATEGORY PERFORMANCE (UPDATED)
    const categoryPerformance = await db.all(
      `
      SELECT 
        transaction_items.category_name,
        COUNT(DISTINCT transactions.id) as transaction_count,
        SUM(transaction_items.total_price) as total_revenue,
        SUM(transaction_items.total_cost) as total_cost,
        SUM(transaction_items.total_price - transaction_items.total_cost) as total_profit,
        CASE 
          WHEN SUM(transaction_items.total_price) > 0 THEN 
            ROUND((SUM(transaction_items.total_price - transaction_items.total_cost) * 100.0 / SUM(transaction_items.total_price)), 2)
          ELSE 0 
        END as profit_margin
      FROM transaction_items
      JOIN transactions ON transaction_items.transaction_id = transactions.id
      WHERE ${whereClause}
      GROUP BY transaction_items.category_name
      ORDER BY total_revenue DESC
    `,
      params
    );

    console.log("📊 Category performance:", categoryPerformance);

    // 7. GET ALL CATEGORIES FOR FILTER
    const allCategories = await db.all(`
      SELECT DISTINCT name 
      FROM category 
      ORDER BY name
    `);

    // 8. VARIANT PERFORMANCE ANALYSIS (FIXED - INCLUSIVE)
    const variantPerformance = await db.all(
      `
      SELECT 
        transaction_items.item_name,
        transaction_items.variant_name,
        transaction_items.category_name,
        SUM(transaction_items.qty) as total_quantity,
        SUM(transaction_items.total_price) as total_revenue,
        SUM(transaction_items.total_cost) as total_cost,
        SUM(transaction_items.total_price - transaction_items.total_cost) as total_profit,
        CASE 
          WHEN SUM(transaction_items.total_price) > 0 THEN 
            ROUND((SUM(transaction_items.total_price - transaction_items.total_cost) * 100.0 / SUM(transaction_items.total_price)), 2)
          ELSE 0 
        END as profit_margin,
        AVG(transaction_items.unit_price) as avg_unit_price,
        AVG(transaction_items.unit_cost) as avg_unit_cost
      FROM transaction_items
      JOIN transactions ON transaction_items.transaction_id = transactions.id
      WHERE ${whereClause}
      GROUP BY transaction_items.item_id, transaction_items.variant_id
      ORDER BY total_profit DESC
      LIMIT 15
    `,
      params
    );

    console.log("🔬 Variant performance:", variantPerformance);

    // 9. ITEM PERFORMANCE (Without variants - aggregated)
    const itemPerformance = await db.all(
      `
      SELECT 
        transaction_items.item_name,
        transaction_items.category_name,
        COUNT(DISTINCT transaction_items.variant_id) as variant_count,
        SUM(transaction_items.qty) as total_quantity,
        SUM(transaction_items.total_price) as total_revenue,
        SUM(transaction_items.total_cost) as total_cost,
        SUM(transaction_items.total_price - transaction_items.total_cost) as total_profit,
        CASE 
          WHEN SUM(transaction_items.total_price) > 0 THEN 
            ROUND((SUM(transaction_items.total_price - transaction_items.total_cost) * 100.0 / SUM(transaction_items.total_price)), 2)
          ELSE 0 
        END as profit_margin
      FROM transaction_items
      JOIN transactions ON transaction_items.transaction_id = transactions.id
      WHERE ${whereClause}
      GROUP BY transaction_items.item_id
      ORDER BY total_revenue DESC
      LIMIT 10
    `,
      params
    );

    console.log("📦 Item performance (aggregated):", itemPerformance);

    const summary = stats[0] || {};
    const comparison = comparisonStats[0] || {};

    console.log("💾 Final summary:", summary);
    console.log("📈 Final comparison:", comparison);

    // Calculate trends
    const revenueTrend = calculateTrend(
      summary.total_revenue,
      comparison.previous_revenue
    );
    const profitTrend = calculateTrend(
      summary.total_profit,
      comparison.previous_profit
    );
    const transactionTrend = calculateTrend(
      summary.total_transactions,
      comparison.previous_transactions
    );

    console.log("📊 Trends:", { revenueTrend, profitTrend, transactionTrend });

    // Format response with comprehensive variant data
    const response = {
      filters: {
        period,
        startDate: startDate || getDateRange(period)?.start,
        endDate: endDate || getDateRange(period)?.end,
        category: category || "all",
      },
      summary: {
        total_revenue: summary.total_revenue || 0,
        total_cost: summary.total_cost || 0,
        total_profit: summary.total_profit || 0,
        total_transactions: summary.total_transactions || 0,
        avg_transaction_value: summary.avg_transaction_value || 0,
        business_days: summary.business_days || 0,
        profit_margin:
          summary.total_revenue > 0
            ? (summary.total_profit / summary.total_revenue) * 100
            : 0,
      },
      trends: {
        revenue_trend: revenueTrend,
        profit_trend: profitTrend,
        transaction_trend: transactionTrend,
      },
      charts: {
        daily_breakdown: dailyBreakdown.map((item) => ({
          date: formatDate(item.date),
          revenue: item.daily_revenue || 0,
          cost: item.daily_cost || 0,
          profit: item.daily_profit || 0,
          transactions: item.transaction_count || 0,
        })),
        hourly_breakdown: hourlyBreakdown.map((item) => ({
          hour: `${item.hour}:00`,
          revenue: item.hourly_revenue || 0,
          transactions: item.transaction_count || 0,
        })),
      },
      top_items: topItems.map((item) => ({
        name: item.variant_name
          ? `${item.item_name} - ${item.variant_name}`
          : item.item_name,
        item_name: item.item_name,
        variant_name: item.variant_name,
        category: item.category_name,
        quantity: item.total_quantity,
        revenue: item.total_revenue,
        cost: item.total_cost,
        profit: item.total_profit,
        profit_margin: item.profit_margin || 0,
        has_variant: !!item.variant_name,
      })),
      categories: categoryPerformance.map((cat) => ({
        name: cat.category_name || "Uncategorized",
        revenue: cat.total_revenue || 0,
        cost: cat.total_cost || 0,
        profit: cat.total_profit || 0,
        transactions: cat.transaction_count || 0,
        profit_margin: cat.profit_margin || 0,
      })),
      variants: variantPerformance.map((variant) => ({
        name: variant.variant_name,
        item_name: variant.item_name,
        variant_name: variant.variant_name,
        category: variant.category_name,
        quantity: variant.total_quantity,
        revenue: variant.total_revenue,
        cost: variant.total_cost,
        profit: variant.total_profit,
        profit_margin: variant.profit_margin || 0,
        avg_unit_price: variant.avg_unit_price || 0,
        avg_unit_cost: variant.avg_unit_cost || 0,
      })),
      items_aggregated: itemPerformance.map((item) => ({
        name: item.item_name,
        category: item.category_name,
        variant_count: item.variant_count || 0,
        quantity: item.total_quantity,
        revenue: item.total_revenue,
        cost: item.total_cost,
        profit: item.total_profit,
        profit_margin: item.profit_margin || 0,
      })),
      available_categories: allCategories.map((cat) => cat.name),
      debug: {
        db_local_time: dbTime.db_local_now,
        db_local_today: dbTime.db_local_today,
        filtered_transactions_count: debugTransactions.length,
      },
    };

    console.log("✅ Final response with variants being sent");
    res.json(response);
  } catch (err) {
    console.error("❌ Failed to fetch backoffice data:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch backoffice data: " + err.message });
  }
});

// 🟢 GET FILTER OPTIONS
router.get("/filters", async (req, res) => {
  try {
    const db = req.db;

    const categories = await db.all(`
      SELECT DISTINCT name 
      FROM category 
      ORDER BY name
    `);

    const dateRange = await db.all(`
      SELECT 
        MIN(DATE(transaction_date)) as min_date,
        MAX(DATE(transaction_date)) as max_date
      FROM transactions
    `);

    res.json({
      categories: categories.map((cat) => cat.name),
      date_range: dateRange[0] || { min_date: null, max_date: null },
      periods: [
        { value: "today", label: "Today" },
        { value: "yesterday", label: "Yesterday" },
        { value: "week", label: "Last 7 Days" },
        { value: "month", label: "Last 30 Days" },
        { value: "quarter", label: "Last 90 Days" },
        { value: "year", label: "Last 12 Months" },
        { value: "all", label: "All Time" },
      ],
    });
  } catch (err) {
    console.error("❌ Failed to fetch filter options:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch filter options: " + err.message });
  }
});

// 🟢 DEBUG: Check timezone differences
router.get("/debug-time", async (req, res) => {
  try {
    const db = req.db;

    const times = await db.all(`
      SELECT 
        datetime('now') as utc_now,
        datetime('now', 'localtime') as local_now,
        date('now') as utc_today,
        date('now', 'localtime') as local_today
    `);

    const recentTransactions = await db.all(`
      SELECT 
        id,
        transaction_date,
        DATE(transaction_date) as transaction_date_only
      FROM transactions 
      ORDER BY transaction_date DESC 
      LIMIT 5
    `);

    res.json({
      database_times: times[0],
      recent_transactions: recentTransactions,
      system_time: new Date().toString(),
      system_date: new Date().toISOString().split("T")[0],
    });
  } catch (err) {
    console.error("❌ Debug time error:", err);
    res.status(500).json({ error: "Debug failed: " + err.message });
  }
});

// Helper functions
function getDateRange(period) {
  const dateFilter = getDatabaseLocalDates(period);
  if (period === "all") return null;

  // Extract dates from the SQL condition for response
  const now = new Date();
  switch (period) {
    case "today":
      const today = now.toISOString().split("T")[0];
      return { start: today, end: today };
    case "yesterday":
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      return { start: yesterdayStr, end: yesterdayStr };
    // ... other cases
    default:
      return null;
  }
}

async function getComparisonStats(db, period) {
  let comparisonWhere = "1=1";
  let comparisonParams = [];

  // Use database local time for comparison periods too
  switch (period) {
    case "today":
      comparisonWhere =
        "DATE(transaction_date) = DATE('now', 'localtime', '-1 day')";
      break;
    case "week":
      comparisonWhere =
        "DATE(transaction_date) BETWEEN DATE('now', 'localtime', '-14 days') AND DATE('now', 'localtime', '-8 days')";
      break;
    case "month":
      comparisonWhere =
        "DATE(transaction_date) BETWEEN DATE('now', 'localtime', '-60 days') AND DATE('now', 'localtime', '-31 days')";
      break;
    default:
      return [{}];
  }

  const comparison = await db.all(
    `
    SELECT 
      COALESCE(SUM(total_amount), 0) as previous_revenue,
      COALESCE(SUM(total_amount - total_cost), 0) as previous_profit,
      COUNT(*) as previous_transactions
    FROM transactions
    WHERE ${comparisonWhere}
  `,
    comparisonParams
  );

  return comparison;
}

function calculateTrend(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default router;
