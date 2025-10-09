// pages/CreateCategory.jsx
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import HeaderItem from "../components/HeaderItem";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// Soft color palette
const colorOptions = [
  "#AAA9A9",
  "#BE3943",
  "#E96D5A",
  "#EECC68",
  "#6FAD56",
  "#3C81AF",
  "#90609A",
];

export default function CreateCategory() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [errors, setErrors] = useState({ name: false, color: false });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const handleBack = () => navigate("/items/categories");

  const handleSave = async () => {
    // Reset errors
    setErrors({ name: false, color: false });

    // Validation
    const newErrors = { name: !name.trim(), color: !selectedColor };
    if (newErrors.name || newErrors.color) {
      setErrors(newErrors);
      setSnackbar({
        open: true,
        message: "Please fill in all required fields",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      // Call backend API
      const response = await axios.post(
        "http://localhost:5000/api/categories",
        {
          name,
          color: selectedColor,
        }
      );

      console.log("✅ Created category:", response.data);

      setSnackbar({
        open: true,
        message: "Category created successfully!",
        type: "success",
      });

      // Reset form
      setName("");
      setSelectedColor("");

      // Navigate after short delay
      setTimeout(() => navigate("/items/categories"), 1000);
    } catch (err) {
      console.error("❌ Failed to save category:", err);
      setSnackbar({
        open: true,
        message: "Failed to create category. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <HeaderItem
        title="Create Category"
        onBack={handleBack}
        onSave={handleSave}
        disabled={loading}
      />

      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Paper
          sx={{
            p: 4,
            width: "90%",
            maxWidth: 800,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
          elevation={3}
        >
          {/* Category Name */}
          <TextField
            label="Category Name"
            color="secondary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            helperText={errors.name ? "Category name is required" : ""}
            fullWidth
            disabled={loading}
          />

          {/* Color Selection */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Select Color:
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {colorOptions.map((color) => (
                <Box
                  key={color}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: color,
                    borderRadius: 1,
                    cursor: "pointer",
                    border:
                      selectedColor === color
                        ? "3px solid #555"
                        : "1px solid #ccc",
                    boxShadow:
                      selectedColor === color
                        ? "0 0 6px rgba(0,0,0,0.3)"
                        : "none",
                    transition: "all 0.2s",
                    opacity: loading ? 0.5 : 1,
                  }}
                  onClick={() => !loading && setSelectedColor(color)}
                />
              ))}
            </Box>
            {errors.color && (
              <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
                Color selection is required
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.type} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
