// pages/UpdateCategory.jsx
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import HeaderItem from "../components/HeaderItem";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
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

export default function UpdateCategory() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category;

  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [errors, setErrors] = useState({ name: false, color: false });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSelectedColor(category.color);
    }
  }, [category]);

  const handleBack = () => navigate("/items/categories");

  const handleSave = async () => {
    setErrors({ name: false, color: false });

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
      await axios.put(`http://localhost:5000/api/categories/${category.id}`, {
        name,
        color: selectedColor,
      });

      setSnackbar({
        open: true,
        message: "Category updated successfully!",
        type: "success",
      });

      // Navigate after short delay
      setTimeout(() => navigate("/items/categories"), 1000);
    } catch (err) {
      console.error("❌ Failed to update category:", err);
      setSnackbar({
        open: true,
        message: "Failed to update category. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`http://localhost:5000/api/categories/${category.id}`);
      setSnackbar({
        open: true,
        message: "Category deleted successfully!",
        type: "success",
      });

      // Close modal and navigate back
      setTimeout(() => {
        setOpenDialog(false);
        navigate("/items/categories");
      }, 1000);
    } catch (err) {
      console.error("❌ Failed to delete category:", err);
      setSnackbar({
        open: true,
        message: "Failed to delete category. Please try again.",
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!category) {
    return <Box p={2}>No category selected. Go back and try again.</Box>;
  }

  return (
    <Box sx={{ height: "100vh", backgroundColor: "#f5f5f5" }}>
      <HeaderItem
        title="Update Category"
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
          {/* Name */}
          <TextField
            label="Category Name"
            color="secondary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            helperText={errors.name ? "Category name is required" : ""}
            fullWidth
            disabled={loading || deleting}
          />

          {/* Color picker */}
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
                    opacity: loading || deleting ? 0.5 : 1,
                  }}
                  onClick={() =>
                    !(loading || deleting) && setSelectedColor(color)
                  }
                />
              ))}
            </Box>
            {errors.color && (
              <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
                Color selection is required
              </Typography>
            )}
          </Box>

          <Button
            variant="outlined"
            color="error"
            onClick={() => setOpenDialog(true)}
            disabled={deleting}
          >
            Delete Category
          </Button>
        </Paper>
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the category "{category.name}"? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
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
