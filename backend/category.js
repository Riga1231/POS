import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await req.db.all(`
      SELECT 
        c.*,
        COUNT(i.id) AS itemsCount
      FROM category c
      LEFT JOIN item i ON i.category_id = c.id
      GROUP BY c.id
    `);
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// 🟣 Get one category
router.get("/:id", async (req, res) => {
  try {
    const category = await req.db.get("SELECT * FROM category WHERE id = ?", [
      req.params.id,
    ]);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// 🟢 Create category
router.post("/", async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !color)
      return res.status(400).json({ error: "Name and color are required" });

    const result = await req.db.run(
      "INSERT INTO category (name, color) VALUES (?, ?)",
      [name, color]
    );
    res.json({ id: result.lastID, name, color });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// 🟠 Update category
router.put("/:id", async (req, res) => {
  try {
    const { name, color } = req.body;
    const result = await req.db.run(
      "UPDATE category SET name = ?, color = ? WHERE id = ?",
      [name, color, req.params.id]
    );
    if (result.changes === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json({ id: req.params.id, name, color });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// 🔴 Delete category
router.delete("/:id", async (req, res) => {
  try {
    const result = await req.db.run("DELETE FROM category WHERE id = ?", [
      req.params.id,
    ]);
    if (result.changes === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
