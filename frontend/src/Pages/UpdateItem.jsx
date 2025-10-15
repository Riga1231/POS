import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import HeaderItem from "../components/HeaderItem";
import { useNavigate, useLocation } from "react-router-dom";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import axios from "axios";
import InputAdornment from "@mui/material/InputAdornment";

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

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function UpdateItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.item;

  const [name, setName] = useState("");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [cost, setCost] = useState(""); // Added cost state
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [photo, setPhoto] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState("");
  const [existingPhotoFilename, setExistingPhotoFilename] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Fetch categories first
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/categories");
        const categoryNames = res.data.map((c) => c.name);
        setCategories(categoryNames);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Auto-fill form from item - IMPROVED
  useEffect(() => {
    if (!item) return;
    console.log("Editing item:", item);

    setName(item.name || "");
    setCost(item.cost || ""); // Added cost
    setPrice(item.price || "");
    setType(item.type || "");
    const cat = item.categoryName || item.category || "";
    setCategory(cat);

    if (item.type === "color" && item.value) {
      setSelectedColor(item.value);
    } else if (item.type === "image" && item.value) {
      // Store both the display URL and the filename separately
      const filename = item.value.split("/").pop();
      const imgUrl = item.value.startsWith("http")
        ? item.value
        : `http://localhost:5000${item.value.startsWith("/") ? "" : "/"}${
            item.value
          }`;

      setExistingPhoto(imgUrl);
      setExistingPhotoFilename(filename);
    }
  }, [item]);

  const handleBack = () => navigate("/items/items");

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
      setExistingPhoto("");
      setExistingPhotoFilename("");
    }
  };

  // FIXED: Better type change handler
  const handleTypeChange = (newType) => {
    setType(newType);

    // Only reset the data that's specific to the other type
    if (newType === "color") {
      setPhoto(null);
    } else if (newType === "image") {
      setSelectedColor("");
    }
  };

  const handleSave = async () => {
    setErrors({});
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Item name is required";
    if (!category) newErrors.category = "Category is required";
    if (!type) newErrors.type = "Select item type";
    if (type === "color" && !selectedColor) newErrors.color = "Select a color";
    if (type === "image" && !photo && !existingPhoto)
      newErrors.photo = "Select a photo";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSnackbar({
        open: true,
        message: "Please fill all required fields.",
        severity: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("cost", cost || ""); // Added cost
      formData.append("price", price || "");
      formData.append("type", type);

      if (type === "color") {
        formData.append("value", selectedColor);
      } else if (type === "image") {
        if (photo) {
          formData.append("photo", photo);
        } else if (existingPhotoFilename) {
          formData.append("value", existingPhotoFilename);
        }
      }

      console.log("Sending update with:", {
        name,
        category,
        cost, // Added cost
        price,
        type,
        selectedColor,
        hasPhoto: !!photo,
        hasExistingPhoto: !!existingPhoto,
        existingPhotoFilename,
      });

      await axios.put(`http://localhost:5000/api/items/${item.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSnackbar({
        open: true,
        message: "Item updated successfully!",
        severity: "success",
      });

      setTimeout(() => navigate("/items/items"), 1000);
    } catch (err) {
      console.error(
        "Failed to update item:",
        err.response?.data || err.message
      );
      setSnackbar({
        open: true,
        message: "Failed to update item. Check console for details.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`http://localhost:5000/api/items/${item.id}`);
      setSnackbar({
        open: true,
        message: "Item deleted successfully!",
        severity: "success",
      });
      setTimeout(() => navigate("/items/items"), 1000);
    } catch (err) {
      console.error("Failed to delete item:", err);
      setSnackbar({
        open: true,
        message: "Failed to delete item.",
        severity: "error",
      });
    } finally {
      setDeleting(false);
      setOpenDialog(false);
    }
  };

  if (!item) return <Box p={2}>No item selected. Go back and try again.</Box>;

  return (
    <Box sx={{ height: "100vh", backgroundColor: "#f5f5f5" }}>
      <HeaderItem
        title="Update Item"
        onBack={handleBack}
        onSave={handleSave}
        loading={loading}
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
            label="Item Name"
            color="secondary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
          />

          {/* Category */}
          <TextField
            select
            color="secondary"
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            error={!!errors.category}
            helperText={errors.category}
            fullWidth
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>

          {/* Cost and Price in one line */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Cost"
              color="secondary"
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              fullWidth
              InputProps={{
                inputProps: { min: 0, step: "0.01" },
                startAdornment: (
                  <InputAdornment position="start">₱</InputAdornment>
                ),
              }}
              placeholder="0.00"
            />
            <TextField
              label="Price"
              color="secondary"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              fullWidth
              InputProps={{
                inputProps: { min: 0, step: "0.01" },
                startAdornment: (
                  <InputAdornment position="start">₱</InputAdornment>
                ),
              }}
              placeholder="0.00"
            />
          </Box>

          {/* Type */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Item Type
            </Typography>
            <RadioGroup
              row
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <FormControlLabel
                value="color"
                control={<Radio />}
                label="Color"
              />
              <FormControlLabel
                value="image"
                control={<Radio />}
                label="Photo"
              />
            </RadioGroup>
            {errors.type && (
              <Typography color="error" variant="caption">
                {errors.type}
              </Typography>
            )}
          </Box>

          {/* Type-specific input */}
          {type === "color" && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Selected Color: {selectedColor || "None"}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
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
                    }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </Box>
              {errors.color && (
                <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
                  {errors.color}
                </Typography>
              )}
            </Box>
          )}

          {type === "image" && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}
            >
              <Button
                variant="outlined"
                component="label"
                color="secondary"
                startIcon={<AttachFileIcon />}
                sx={{ width: "fit-content" }}
              >
                {photo ? "Change Photo" : "Choose Photo"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </Button>

              {(photo || existingPhoto) && (
                <Box
                  component="img"
                  src={photo ? URL.createObjectURL(photo) : existingPhoto}
                  alt="Preview"
                  sx={{
                    width: 100,
                    height: 100,
                    mt: 1,
                    objectFit: "cover",
                    borderRadius: 1,
                    border: "1px solid #ddd",
                  }}
                />
              )}

              {errors.photo && (
                <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
                  {errors.photo}
                </Typography>
              )}
            </Box>
          )}

          {/* Delete Button */}
          <Button
            variant="outlined"
            color="error"
            onClick={() => setOpenDialog(true)}
            disabled={deleting || loading}
          >
            Delete Item
          </Button>
        </Paper>
      </Box>

      {/* Delete Confirmation */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{item.name}"? This cannot be
            undone.
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

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
