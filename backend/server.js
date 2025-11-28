import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { Client } from "pg";
import categoryRoutes from "./category.js";
import itemRoutes from "./item.js";
import transactionRoutes from "./transaction.js";
import backofficeRoutes from "./backoffice.js";
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

// PostgreSQL configuration
const pgConfig = {
  host: "localhost",
  port: 5432,
  database: "inventorydb",
  user: "postgres",
}; // Initial sync function - runs only once on server start
async function initialSyncPostgreSQLToSQLite() {
  try {
    console.log("🔄 Starting initial PostgreSQL to SQLite sync...");

    const pgClient = new Client(pgConfig);
    await pgClient.connect();
    const sqliteDb = await dbPromise;

    // Step 1: Sync categories (only once)
    console.log("📂 Syncing categories...");
    const categoryQuery = `
      SELECT DISTINCT 
        c.category_id,
        c.category_name
      FROM product p
      JOIN category c ON p.category_id = c.category_id
      WHERE p.status = 'Active'
      ORDER BY c.category_name
    `;

    const categoryResult = await pgClient.query(categoryQuery);
    const categories = categoryResult.rows;
    console.log(`📊 Found ${categories.length} categories in PostgreSQL`);

    // Clear existing categories
    await sqliteDb.run("DELETE FROM category");
    await sqliteDb.run('DELETE FROM sqlite_sequence WHERE name="category"');

    // Insert categories with colors
    const colors = [
      "#3498db",
      "#e74c3c",
      "#2ecc71",
      "#f39c12",
      "#9b59b6",
      "#1abc9c",
    ];
    let colorIndex = 0;

    for (const category of categories) {
      const color = colors[colorIndex % colors.length];
      await sqliteDb.run("INSERT INTO category (name, color) VALUES (?, ?)", [
        category.category_name,
        color,
      ]);
      colorIndex++;
    }

    console.log(`✅ Synced ${categories.length} categories to SQLite`);

    // Step 2: Get products grouped by category and subcategory
    console.log("📦 Grouping products by subcategory...");
    const itemsQuery = `
      SELECT 
        p.product_id,
        p.product_name,
        p.brand_name,
        p.generic_name,
        p.price,
        p.unit_of_measurement,
        c.category_name,
        s.subcategory_name,
        COALESCE(ps.total_on_hand, 0) as stock_quantity,
        ps.stock_id as postgres_stock_id
      FROM product p
      JOIN category c ON p.category_id = c.category_id
      JOIN subcategory s ON p.subcategory_id = s.subcategory_id
      LEFT JOIN product_stocks ps ON p.product_id = ps.product_id
      WHERE p.status = 'Active'
      ORDER BY c.category_name, s.subcategory_name, p.product_name
    `;

    const itemsResult = await pgClient.query(itemsQuery);
    const products = itemsResult.rows;

    console.log(`📊 Found ${products.length} active products in PostgreSQL`);

    // Clear existing items and variants
    await sqliteDb.run("DELETE FROM item");
    await sqliteDb.run("DELETE FROM item_variants");
    await sqliteDb.run('DELETE FROM sqlite_sequence WHERE name="item"');
    await sqliteDb.run(
      'DELETE FROM sqlite_sequence WHERE name="item_variants"'
    );

    // Ensure item_variants has the PostgreSQL ID columns
    try {
      await sqliteDb.run(
        "ALTER TABLE item_variants ADD COLUMN postgres_product_id TEXT"
      );
      await sqliteDb.run(
        "ALTER TABLE item_variants ADD COLUMN postgres_stock_id TEXT"
      );
      console.log("✅ Added PostgreSQL ID columns to item_variants");
    } catch (error) {
      console.log("ℹ️ PostgreSQL ID columns already exist");
    }

    // Ensure item_variants has quantity column
    try {
      await sqliteDb.run(
        "ALTER TABLE item_variants ADD COLUMN quantity INTEGER DEFAULT 0"
      );
      console.log("✅ Added quantity column to item_variants");
    } catch (error) {
      console.log("ℹ️ Quantity column already exists");
    }

    // Get category IDs from SQLite
    const sqliteCategories = await sqliteDb.all(
      "SELECT id, name FROM category"
    );
    const categoryMap = new Map();
    sqliteCategories.forEach((cat) => categoryMap.set(cat.name, cat.id));

    // Group products by category and subcategory
    const itemsMap = new Map();

    for (const product of products) {
      const key = `${product.category_name}-${product.subcategory_name}`;

      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          category_name: product.category_name,
          subcategory_name: product.subcategory_name,
          variants: [],
        });
      }

      itemsMap.get(key).variants.push({
        product_id: product.product_id,
        product_name: product.product_name,
        brand_name: product.brand_name,
        generic_name: product.generic_name,
        price: product.price,
        unit_of_measurement: product.unit_of_measurement,
        stock_quantity: product.stock_quantity,
        postgres_stock_id: product.postgres_stock_id,
      });
    }

    console.log(
      `📊 Created ${itemsMap.size} items from ${products.length} products`
    );

    let itemId = 1;
    let variantId = 1;
    let totalVariantsInserted = 0;

    // Insert items and their variants
    for (const [key, itemData] of itemsMap) {
      try {
        const categoryId = categoryMap.get(itemData.category_name);

        if (!categoryId) {
          console.warn(
            `⚠️ Category not found for: ${itemData.subcategory_name}`
          );
          continue;
        }

        // Insert ONE item per subcategory
        const itemResult = await sqliteDb.run(
          `INSERT INTO item (name, category_id, type, value) VALUES (?, ?, ?, ?)`,
          [itemData.subcategory_name, categoryId, "color", "#9b59b6"]
        );

        const currentItemId = itemResult.lastID;

        // Insert ALL variants for this subcategory
        for (const variant of itemData.variants) {
          // Calculate cost (80% of price)
          const cost = parseFloat(variant.price) * 0.8;

          await sqliteDb.run(
            `INSERT INTO item_variants (id, item_id, variant_name, cost, price, quantity, created_at, postgres_product_id, postgres_stock_id) 
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`,
            [
              variantId,
              currentItemId,
              variant.product_name, // This becomes the variant name
              cost,
              variant.price,
              variant.stock_quantity,
              variant.product_id,
              variant.postgres_stock_id,
            ]
          );

          variantId++;
          totalVariantsInserted++;

          // Log first few inserts for verification
          if (totalVariantsInserted <= 3) {
            console.log(
              `✅ Added variant: ${variant.product_name} to item: ${itemData.subcategory_name} → Stock: ${variant.stock_quantity}`
            );
          }
        }

        itemId++;
      } catch (error) {
        console.error(
          `❌ Error syncing item ${itemData.subcategory_name}:`,
          error
        );
      }
    }

    await pgClient.end();

    // Final verification
    const finalItemCount = await sqliteDb.get(
      "SELECT COUNT(*) as count FROM item"
    );
    const finalVariantCount = await sqliteDb.get(
      "SELECT COUNT(*) as count FROM item_variants"
    );

    console.log(
      `✅ Initial sync completed! ${totalVariantsInserted} variants across ${itemsMap.size} items`
    );
    console.log(
      `📊 Final counts - Items: ${finalItemCount.count}, Variants: ${finalVariantCount.count}`
    );

    // Debug: Show the structure
    console.log("🔍 Final structure:");
    const sampleItems = await sqliteDb.all(`
      SELECT i.name as item_name, COUNT(iv.id) as variant_count 
      FROM item i 
      LEFT JOIN item_variants iv ON i.id = iv.item_id 
      GROUP BY i.id 
      LIMIT 5
    `);
    sampleItems.forEach((item) => {
      console.log(`   - ${item.item_name}: ${item.variant_count} variants`);
    });

    return {
      success: true,
      count: totalVariantsInserted,
      items: itemsMap.size,
    };
  } catch (error) {
    console.error("❌ Initial sync error:", error);
    return { success: false, error: error.message };
  }
} // Stock-only sync function - updates only quantities without recreating structure
// Add this at the top of your server.js (after imports)
let isSyncing = false;

// Stock-only sync function - updates only quantities without recreating structure
async function syncStockQuantitiesOnly() {
  // Prevent concurrent syncs
  if (isSyncing) {
    console.log("⏳ Sync already in progress, skipping...");
    return { success: true, count: 0, message: "Sync already in progress" };
  }

  isSyncing = true;

  try {
    console.log("🔄 Syncing stock quantities from PostgreSQL...");

    const pgClient = new Client(pgConfig);
    await pgClient.connect();
    const sqliteDb = await dbPromise;

    // Step 1: Get current stock levels from PostgreSQL
    console.log("📦 Fetching current stock levels...");
    const stockQuery = `
      SELECT 
        p.product_id,
        p.product_name,
        COALESCE(ps.total_on_hand, 0) as stock_quantity,
        ps.stock_id as postgres_stock_id
      FROM product p
      LEFT JOIN product_stocks ps ON p.product_id = ps.product_id
      WHERE p.status = 'Active'
    `;

    const stockResult = await pgClient.query(stockQuery);
    const stockData = stockResult.rows;

    console.log(`📊 Found ${stockData.length} products with stock data`);

    // Step 2: Update SQLite variants with new stock quantities
    let updatedCount = 0;

    for (const stockItem of stockData) {
      try {
        // Update the quantity in item_variants using postgres_product_id
        const result = await sqliteDb.run(
          `UPDATE item_variants 
           SET quantity = ? 
           WHERE postgres_product_id = ?`,
          [stockItem.stock_quantity, stockItem.product_id]
        );

        if (result.changes > 0) {
          updatedCount++;
          // Log first few updates for verification
          if (updatedCount <= 3) {
            console.log(
              `✅ Updated: ${stockItem.product_name} → Stock: ${stockItem.stock_quantity}`
            );
          }
        }
      } catch (error) {
        console.error(
          `❌ Error updating stock for ${stockItem.product_name}:`,
          error
        );
      }
    }

    await pgClient.end();

    console.log(`✅ Stock sync completed! ${updatedCount} products updated`);
    return { success: true, count: updatedCount };
  } catch (error) {
    console.error("❌ Stock sync error:", error);
    return { success: false, error: error.message };
  } finally {
    // Always release the sync lock
    isSyncing = false;
  }
}
// Auto-sync function
async function initializeServer() {
  try {
    console.log("🚀 Initializing server with auto-sync...");
    await dbPromise;

    const syncResult = await initialSyncPostgreSQLToSQLite();

    if (syncResult.success) {
      console.log(
        `🎉 Initial sync successful! ${syncResult.count} products loaded`
      );
    } else {
      console.log("⚠️ Initial sync failed, but server will continue running");
    }

    app.listen(PORT, () => {
      console.log(`🔥 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server initialization failed:", error);
    process.exit(1);
  }
}

// Sync routes
app.post("/api/sync/products", async (req, res) => {
  try {
    // Use stock-only sync for API calls (lightweight)
    const result = await syncStockQuantitiesOnly();
    if (result.success) {
      res.json({
        success: true,
        message: `Successfully synced stock for ${result.count} products`,
        count: result.count,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/sync/full", async (req, res) => {
  try {
    // Full sync endpoint (use only when needed)
    const result = await initialSyncPostgreSQLToSQLite();
    if (result.success) {
      res.json({
        success: true,
        message: `Successfully performed full sync for ${result.count} products`,
        count: result.count,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/sync/status", async (req, res) => {
  try {
    const sqliteDb = await dbPromise;
    const itemCount = await sqliteDb.get("SELECT COUNT(*) as count FROM item");
    const variantCount = await sqliteDb.get(
      "SELECT COUNT(*) as count FROM item_variants"
    );
    const categoryCount = await sqliteDb.get(
      "SELECT COUNT(*) as count FROM category"
    );

    res.json({
      success: true,
      items: itemCount.count,
      variants: variantCount.count,
      categories: categoryCount.count,
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
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
app.use(
  "/api/backoffice",
  async (req, res, next) => {
    req.db = await dbPromise;
    next();
  },
  backofficeRoutes
);

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
  res.send("✅ API running with PostgreSQL auto-sync enabled")
);

// Initialize server with auto-sync
initializeServer();
