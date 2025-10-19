import express from "express";

const router = express.Router();

router.delete("/reset-all", async (req, res) => {
  try {
    const db = req.db;

    // Start transaction
    await db.run("BEGIN TRANSACTION");

    try {
      // Delete data from all tables in correct order
      await db.run("DELETE FROM transaction_items");
      await db.run("DELETE FROM transactions");
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

// 🟢 GET BACKOFFICE DASHBOARD DATA WITH FILTERS
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

    // Build WHERE clause based on filters
    let whereClause = "1=1";
    const params = [];

    // Date range filtering using SQLite date functions
    if (startDate && endDate) {
      whereClause += " AND DATE(transaction_date) BETWEEN ? AND ?";
      params.push(startDate, endDate);
      console.log("📅 Using custom date range:", { startDate, endDate });
    } else {
      // Apply period filter using SQLite date functions
      switch (period) {
        case "today":
          whereClause += " AND DATE(transaction_date) = DATE('now')";
          console.log("📅 Filter: TODAY");
          break;
        case "yesterday":
          whereClause += " AND DATE(transaction_date) = DATE('now', '-1 day')";
          console.log("📅 Filter: YESTERDAY");
          break;
        case "week":
          whereClause +=
            " AND DATE(transaction_date) BETWEEN DATE('now', '-6 days') AND DATE('now')";
          console.log("📅 Filter: LAST 7 DAYS");
          break;
        case "month":
          whereClause +=
            " AND DATE(transaction_date) BETWEEN DATE('now', '-29 days') AND DATE('now')";
          console.log("📅 Filter: LAST 30 DAYS");
          break;
        case "quarter":
          whereClause +=
            " AND DATE(transaction_date) BETWEEN DATE('now', '-89 days') AND DATE('now')";
          console.log("📅 Filter: LAST 90 DAYS");
          break;
        case "year":
          whereClause +=
            " AND DATE(transaction_date) BETWEEN DATE('now', '-364 days') AND DATE('now')";
          console.log("📅 Filter: LAST 12 MONTHS");
          break;
        case "all":
          console.log("📅 Filter: ALL TIME (no date filter)");
          break;
        default:
          whereClause += " AND DATE(transaction_date) = DATE('now')";
          console.log("📅 Filter: DEFAULT (today)");
      }
    }

    // Category filtering
    if (category && category !== "all") {
      whereClause +=
        " AND i.category_id IN (SELECT id FROM category WHERE name = ?)";
      params.push(category);
    }

    console.log("🔍 Final WHERE clause:", whereClause);
    console.log("🔍 Final params:", params);

    // 1. OVERALL STATISTICS
    const stats = await db.all(
      `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(total_amount - total_cost), 0) as total_profit,
        COALESCE(AVG(total_amount), 0) as avg_transaction_value,
        COUNT(DISTINCT DATE(transaction_date)) as business_days
      FROM transactions t
      WHERE ${whereClause}
    `,
      params
    );

    console.log("📈 Stats query result:", stats[0]);

    // 2. COMPARISON PERIOD (for trends)
    const comparisonStats = await getComparisonStats(
      db,
      period,
      whereClause,
      params
    );

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
      FROM transactions t
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
      FROM transactions t
      WHERE ${whereClause}
      GROUP BY strftime('%H', transaction_date)
      ORDER BY hour ASC
    `,
      params
    );

    console.log("⏰ Hourly breakdown:", hourlyBreakdown);

    // 5. TOP ITEMS
    const topItems = await db.all(
      `
      SELECT 
        i.name as item_name,
        i.category_id,
        c.name as category_name,
        SUM(ti.qty) as total_quantity,
        SUM(ti.total_price) as total_revenue,
        SUM(ti.total_cost) as total_cost,
        SUM(ti.total_price - ti.total_cost) as total_profit,
        CASE 
          WHEN SUM(ti.total_price) > 0 THEN 
            ROUND((SUM(ti.total_price - ti.total_cost) * 100.0 / SUM(ti.total_price)), 2)
          ELSE 0 
        END as profit_margin
      FROM transaction_items ti
      JOIN item i ON ti.item_id = i.id
      LEFT JOIN category c ON i.category_id = c.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE ${whereClause}
      GROUP BY ti.item_id
      ORDER BY total_revenue DESC
      LIMIT 10
    `,
      params
    );

    console.log("🏆 Top items:", topItems);

    // 6. CATEGORY PERFORMANCE
    const categoryPerformance = await db.all(
      `
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT t.id) as transaction_count,
        SUM(ti.total_price) as total_revenue,
        SUM(ti.total_cost) as total_cost,
        SUM(ti.total_price - ti.total_cost) as total_profit,
        CASE 
          WHEN SUM(ti.total_price) > 0 THEN 
            ROUND((SUM(ti.total_price - ti.total_cost) * 100.0 / SUM(ti.total_price)), 2)
          ELSE 0 
        END as profit_margin
      FROM transaction_items ti
      JOIN item i ON ti.item_id = i.id
      JOIN transactions t ON ti.transaction_id = t.id
      LEFT JOIN category c ON i.category_id = c.id
      WHERE ${whereClause}
      GROUP BY c.name
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

    // Format response
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
        name: item.item_name,
        category: item.category_name,
        quantity: item.total_quantity,
        revenue: item.total_revenue,
        cost: item.total_cost,
        profit: item.total_profit,
        profit_margin: item.profit_margin || 0,
      })),
      categories: categoryPerformance.map((cat) => ({
        name: cat.category_name || "Uncategorized",
        revenue: cat.total_revenue || 0,
        cost: cat.total_cost || 0,
        profit: cat.total_profit || 0,
        transactions: cat.transaction_count || 0,
        profit_margin: cat.profit_margin || 0,
      })),
      available_categories: allCategories.map((cat) => cat.name),
    };

    console.log("✅ Final response being sent:", response);
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

// Helper functions (keep the same as before)
function getDateRange(period) {
  const now = new Date();

  switch (period) {
    case "today":
      const today = now.toISOString().split("T")[0];
      return {
        start: today,
        end: today,
      };

    case "yesterday":
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      return {
        start: yesterdayStr,
        end: yesterdayStr,
      };

    case "week":
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 6);
      return {
        start: weekAgo.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      };

    case "month":
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 29);
      return {
        start: monthAgo.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      };

    case "quarter":
      const quarterAgo = new Date(now);
      quarterAgo.setDate(quarterAgo.getDate() - 89);
      return {
        start: quarterAgo.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      };

    case "year":
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return {
        start: yearAgo.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      };

    case "all":
      return null;

    default:
      const todayDefault = now.toISOString().split("T")[0];
      return {
        start: todayDefault,
        end: todayDefault,
      };
  }
}

async function getComparisonStats(db, period, whereClause, params) {
  let comparisonWhere = whereClause;
  let comparisonParams = [...params];

  switch (period) {
    case "today":
      // Compare with yesterday
      comparisonWhere = comparisonWhere.replace(
        "DATE(transaction_date) BETWEEN ? AND ?",
        "DATE(transaction_date) = DATE('now', '-1 day')"
      );
      comparisonParams = comparisonParams.slice(2); // Remove date params
      break;
    case "week":
      // Compare with previous week
      comparisonWhere =
        "DATE(transaction_date) BETWEEN DATE('now', '-14 days') AND DATE('now', '-8 days')";
      comparisonParams = [];
      break;
    case "month":
      // Compare with previous month
      comparisonWhere =
        "DATE(transaction_date) BETWEEN DATE('now', '-60 days') AND DATE('now', '-31 days')";
      comparisonParams = [];
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
    FROM transactions t
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
