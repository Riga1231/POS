import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ✅ Ensure /uploads exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Helper function to delete file
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      resolve(true);
      return;
    }

    // Extract filename from path
    const filename = filePath.startsWith("/uploads/")
      ? filePath.split("/").pop()
      : filePath;

    const fullPath = path.join(uploadDir, filename);

    fs.unlink(fullPath, (err) => {
      if (err) {
        // If file doesn't exist, it's not an error - just log it
        if (err.code === "ENOENT") {
          console.log(`File not found, skipping deletion: ${fullPath}`);
          resolve(true);
        } else {
          console.error(`Error deleting file ${fullPath}:`, err);
          reject(err);
        }
      } else {
        console.log(`Successfully deleted file: ${fullPath}`);
        resolve(true);
      }
    });
  });
};

// ===================== ITEM VARIANTS ROUTES =====================

// 🟢 CREATE ITEM VARIANT
router.post("/:id/variants", async (req, res) => {
  try {
    const db = req.db;
    const { variant_name, cost, price } = req.body;
    const item_id = req.params.id;

    // Validate required fields
    if (!variant_name || cost === undefined || price === undefined) {
      return res.status(400).json({
        error: "Variant name, cost, and price are required",
      });
    }

    // Check if item exists
    const item = await db.get("SELECT id FROM item WHERE id = ?", [item_id]);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Insert variant
    const result = await db.run(
      `INSERT INTO item_variants (item_id, variant_name, cost, price)
       VALUES (?, ?, ?, ?)`,
      [item_id, variant_name, parseFloat(cost), parseFloat(price)]
    );

    res.status(201).json({
      id: result.lastID,
      item_id,
      variant_name,
      cost: parseFloat(cost),
      price: parseFloat(price),
    });
  } catch (err) {
    console.error("❌ Failed to create item variant:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🟢 GET VARIANTS FOR ITEM
router.get("/:id/variants", async (req, res) => {
  try {
    const db = req.db;
    const item_id = req.params.id;

    const variants = await db.all(
      `SELECT * FROM item_variants WHERE item_id = ? ORDER BY variant_name`,
      [item_id]
    );

    res.json(variants);
  } catch (err) {
    console.error("❌ Failed to fetch item variants:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🟢 DELETE ITEM VARIANT
router.delete("/variants/:variantId", async (req, res) => {
  try {
    const db = req.db;
    const variantId = req.params.variantId;

    // Check if variant exists
    const variant = await db.get("SELECT * FROM item_variants WHERE id = ?", [
      variantId,
    ]);
    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }

    // Delete variant
    await db.run("DELETE FROM item_variants WHERE id = ?", [variantId]);

    res.json({ message: "Variant deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete item variant:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===================== ITEM ROUTES (UPDATED) =====================

// 🟢 CREATE ITEM (UPDATED - without cost/price)
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const db = req.db;
    const { name, category_id, type, value } = req.body;

    // ✅ Validate type
    if (!["color", "image"].includes(type)) {
      return res
        .status(400)
        .json({ error: "Invalid type. Must be 'color' or 'image'." });
    }

    // ✅ Determine stored value
    let finalValue = value;
    if (type === "image" && req.file) {
      finalValue = `/uploads/${req.file.filename}`;
    }

    // ✅ Insert into database (without cost/price)
    const result = await db.run(
      `INSERT INTO item (name, category_id, type, value)
       VALUES (?, ?, ?, ?)`,
      [name, category_id, type, finalValue]
    );

    res.status(201).json({
      id: result.lastID,
      name,
      category_id,
      type,
      value: finalValue,
    });
  } catch (err) {
    console.error("❌ Failed to create item:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🟢 GET ALL ITEMS WITH VARIANTS
router.get("/", async (req, res) => {
  try {
    const db = req.db;
    const items = await db.all(
      `SELECT i.*, c.name AS categoryName
       FROM item i
       LEFT JOIN category c ON i.category_id = c.id`
    );

    // Get variants for each item
    const itemsWithVariants = await Promise.all(
      items.map(async (item) => {
        const variants = await db.all(
          `SELECT * FROM item_variants WHERE item_id = ? ORDER BY variant_name`,
          [item.id]
        );
        return {
          ...item,
          variants,
        };
      })
    );

    res.json(itemsWithVariants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// 🟢 GET SINGLE ITEM WITH VARIANTS
router.get("/:id", async (req, res) => {
  try {
    const db = req.db;
    const item = await db.get(
      `SELECT i.*, c.name AS categoryName 
       FROM item i 
       LEFT JOIN category c ON i.category_id = c.id 
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (!item) return res.status(404).json({ error: "Item not found" });

    // Get variants for this item
    const variants = await db.all(
      `SELECT * FROM item_variants WHERE item_id = ? ORDER BY variant_name`,
      [req.params.id]
    );

    res.json({
      ...item,
      variants,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟡 UPDATE ITEM - UPDATED FOR VARIANTS
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const db = req.db;
    const { name, category, type, value } = req.body;

    console.log("Update request body:", req.body);
    console.log("File:", req.file);

    // Get category_id from category name
    const categoryRecord = await db.get(
      "SELECT id FROM category WHERE name = ?",
      [category]
    );
    if (!categoryRecord) {
      return res.status(400).json({ error: "Category not found" });
    }

    let finalValue = value;

    // Handle file upload
    if (type === "image" && req.file) {
      finalValue = `/uploads/${req.file.filename}`;
    } else if (type === "image" && value && !value.startsWith("/uploads/")) {
      // If it's an existing photo path from frontend, reconstruct it
      finalValue = `/uploads/${value.split("/").pop()}`;
    }

    // Get current item to preserve existing photo if no new one uploaded
    const currentItem = await db.get("SELECT * FROM item WHERE id = ?", [
      req.params.id,
    ]);
    if (type === "image" && !finalValue && currentItem.value) {
      finalValue = currentItem.value;
    }

    await db.run(
      `UPDATE item SET name=?, category_id=?, type=?, value=? WHERE id=?`,
      [name, categoryRecord.id, type, finalValue, req.params.id]
    );

    res.json({ message: "Item updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update item: " + err.message });
  }
});

// 🔴 DELETE ITEM - UPDATED TO DELETE VARIANTS TOO
router.delete("/:id", async (req, res) => {
  try {
    const db = req.db;

    // First, get the item to check if it has a file
    const item = await db.get("SELECT * FROM item WHERE id = ?", [
      req.params.id,
    ]);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Delete all variants for this item first (due to foreign key constraints)
    await db.run(`DELETE FROM item_variants WHERE item_id = ?`, [
      req.params.id,
    ]);

    // If the item has a file (image type), delete it from uploads folder
    if (item.type === "image" && item.value) {
      try {
        await deleteFile(item.value);
        console.log(`Deleted file for item ${item.id}: ${item.value}`);
      } catch (fileError) {
        console.error(`Failed to delete file for item ${item.id}:`, fileError);
        // Continue with deletion even if file deletion fails
      }
    }

    // Delete the item from database
    await db.run(`DELETE FROM item WHERE id = ?`, [req.params.id]);

    res.json({ message: "Item and its variants deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete item: " + err.message });
  }
});
// 🟢 UPDATE ITEM VARIANT
router.put("/variants/:variantId", async (req, res) => {
  try {
    const db = req.db;
    const { variant_name, cost, price } = req.body;
    const variantId = req.params.variantId;

    // Validate required fields
    if (!variant_name || cost === undefined || price === undefined) {
      return res.status(400).json({
        error: "Variant name, cost, and price are required",
      });
    }

    // Check if variant exists
    const variant = await db.get("SELECT * FROM item_variants WHERE id = ?", [
      variantId,
    ]);
    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }

    // Update variant
    await db.run(
      `UPDATE item_variants SET variant_name = ?, cost = ?, price = ? WHERE id = ?`,
      [variant_name, parseFloat(cost), parseFloat(price), variantId]
    );

    res.json({
      message: "Variant updated successfully",
      variant: {
        id: variantId,
        variant_name,
        cost: parseFloat(cost),
        price: parseFloat(price),
      },
    });
  } catch (err) {
    console.error("❌ Failed to update item variant:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;
