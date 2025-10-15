import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import HeaderItem from "../components/HeaderItem";
import { useNavigate } from "react-router-dom";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const colorOptions = [
  "#AAA9A9",
  "#BE3943",
  "#E96D5A",
  "#EECC68",
  "#6FAD56",
  "#3C81AF",
  "#90609A",
];

export default function CreateItem() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [cost, setCost] = useState(""); // New cost state
  const [price, setPrice] = useState("");
  const [photo, setPhoto] = useState(null);
  const [type, setType] = useState(""); // "color" or "image"
  const [selectedColor, setSelectedColor] = useState("");
  const [categories, setCategories] = useState([]);

  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });

  // 🟢 Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Error loading categories:", err);
        setSnackbar({
          open: true,
          message: "Failed to load categories",
          type: "error",
        });
      }
    };
    fetchCategories();
  }, []);

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleBack = () => {
    navigate("/items/items");
  };

  const validateFields = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Item name is required";
    if (!category) newErrors.category = "Category is required";
    if (!type) newErrors.type = "Item type is required";

    if (type === "color" && !selectedColor)
      newErrors.color = "Please select a color";

    if (type === "image" && !photo) newErrors.photo = "Please upload a photo";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSave = async () => {
    if (!validateFields()) {
      setSnackbar({
        open: true,
        message: "Please fill in all the required fields",
        type: "error",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category_id", category);
      formData.append("cost", cost || ""); // Add this line
      formData.append("price", price || "");
      formData.append("type", type);

      if (type === "color") {
        formData.append("value", selectedColor);
      } else if (type === "image" && photo) {
        formData.append("photo", photo);
      }

      const res = await fetch("http://localhost:5000/api/items", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save item");

      const data = await res.json();
      console.log("✅ Saved item:", data);

      setSnackbar({
        open: true,
        message: "Item saved successfully!",
        type: "success",
      });

      // Reset fields
      setName("");
      setCategory("");
      setCost(""); // Add this
      setPrice("");
      setPhoto(null);
      setType("");
      setSelectedColor("");
      setErrors({});
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Upload failed", type: "error" });
    }
  };

  return (
    <Box sx={{ height: "100vh", backgroundColor: "#f5f5f5" }}>
      <HeaderItem title="Create Item" onBack={handleBack} onSave={handleSave} />

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
            fullWidth
            error={!!errors.name}
            helperText={errors.name}
          />

          {/* Category (from DB) */}
          <TextField
            select
            color="secondary"
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
            error={!!errors.category}
            helperText={errors.category}
          >
            {categories.length === 0 ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))
            )}
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
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
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
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
              placeholder="0.00"
            />
          </Box>

          {/* Item Type Selection */}
          <Box>
            <RadioGroup
              row
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPhoto(null);
                setSelectedColor("");
                setErrors((prev) => ({ ...prev, type: undefined }));
              }}
            >
              <FormControlLabel
                value="color"
                control={<Radio color="secondary" />}
                label="Color"
              />
              <FormControlLabel
                value="image"
                control={<Radio color="secondary" />}
                label="Photo"
              />
            </RadioGroup>
            {errors.type && (
              <Typography variant="caption" color="error">
                {errors.type}
              </Typography>
            )}
          </Box>

          {/* Conditional rendering based on type */}
          {type === "color" && (
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
                  onClick={() => {
                    setSelectedColor(color);
                    setErrors((prev) => ({ ...prev, color: undefined }));
                  }}
                />
              ))}
              {errors.color && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
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
                Choose Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </Button>
              {photo && (
                <Box
                  component="img"
                  src={URL.createObjectURL(photo)}
                  alt="Preview"
                  sx={{
                    width: 100,
                    height: 100,
                    mt: 1,
                    objectFit: "cover",
                    borderRadius: 1,
                  }}
                />
              )}
              {errors.photo && (
                <Typography variant="caption" color="error">
                  {errors.photo}
                </Typography>
              )}
            </Box>
          )}
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
