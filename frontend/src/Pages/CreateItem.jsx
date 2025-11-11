import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import HeaderItem from "../components/HeaderItem";
import { useNavigate } from "react-router-dom";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";

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
  const [photo, setPhoto] = useState(null);
  const [type, setType] = useState(""); // "color" or "image"
  const [selectedColor, setSelectedColor] = useState("");
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([
    { variant_name: "", cost: "", price: "" },
  ]);

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

  // Add new variant input
  const addVariant = () => {
    setVariants([...variants, { variant_name: "", cost: "", price: "" }]);
  };

  // Remove variant input
  const removeVariant = (index) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    }
  };

  // Update variant field - NO PARSING, keep as string
  const updateVariant = (index, field, value) => {
    const newVariants = variants.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    );
    setVariants(newVariants);
  };

  const validateFields = () => {
    const newErrors = {};

    // Basic item validation
    if (!name.trim()) newErrors.name = "Item name is required";
    if (!category) newErrors.category = "Category is required";
    if (!type) newErrors.type = "Item type is required";

    if (type === "color" && !selectedColor)
      newErrors.color = "Please select a color";

    if (type === "image" && !photo) newErrors.photo = "Please upload a photo";

    // Variant validation - COST IS NOW OPTIONAL
    const variantErrors = [];
    variants.forEach((variant, index) => {
      const variantError = {};
      if (!variant.variant_name.trim())
        variantError.variant_name = "Variant name is required";

      // Cost is optional, but if provided must be valid
      if (variant.cost) {
        const costValue = parseFloat(variant.cost);
        if (isNaN(costValue) || costValue < 0)
          variantError.cost = "Cost must be a valid positive number";
      }

      // Price validation - allow any valid number
      const priceValue = parseFloat(variant.price);
      if (!variant.price || isNaN(priceValue) || priceValue < 0)
        variantError.price = "Valid price is required";

      if (Object.keys(variantError).length > 0) {
        variantErrors[index] = variantError;
      }
    });

    if (variantErrors.length > 0) {
      newErrors.variants = variantErrors;
    }

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
      // First, create the base item
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category_id", category);
      formData.append("type", type);

      if (type === "color") {
        formData.append("value", selectedColor);
      } else if (type === "image" && photo) {
        formData.append("photo", photo);
      }

      // Create base item
      const itemRes = await fetch("http://localhost:5000/api/items", {
        method: "POST",
        body: formData,
      });

      if (!itemRes.ok) throw new Error("Failed to save base item");

      const itemData = await itemRes.json();
      console.log("✅ Saved base item:", itemData);

      // Then create variants for this item - SEND AS STRINGS TO AVOID ROUNDING
      const variantPromises = variants.map((variant) =>
        fetch(`http://localhost:5000/api/items/${itemData.id}/variants`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variant_name: variant.variant_name,
            // Send as strings to backend to avoid JavaScript rounding
            cost: variant.cost || "0",
            price: variant.price,
          }),
        })
      );

      const variantResults = await Promise.all(variantPromises);
      const allVariantsSuccessful = variantResults.every((res) => res.ok);

      if (!allVariantsSuccessful) {
        throw new Error("Failed to save some variants");
      }

      setSnackbar({
        open: true,
        message: "Item and variants saved successfully!",
        type: "success",
      });

      // Reset form
      setName("");
      setCategory("");
      setPhoto(null);
      setType("");
      setSelectedColor("");
      setVariants([{ variant_name: "", cost: "", price: "" }]);
      setErrors({});

      // Navigate back after success
      setTimeout(() => navigate("/items/items"), 1500);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to save item and variants",
        type: "error",
      });
    }
  };

  return (
    <Box
      sx={{
        // Fixed background that covers entire page
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <HeaderItem title="Create Item" onBack={handleBack} onSave={handleSave} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 4,
          minHeight: "calc(100vh - 64px)", // Subtract header height
        }}
      >
        <Paper
          sx={{
            p: 4,
            width: "90%",
            maxWidth: 800,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            minHeight: "fit-content",
            backgroundColor: "white",
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

          {/* Variants Section */}
          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" color="secondary">
                Variants
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addVariant}
                color="secondary"
                variant="outlined"
                size="small"
              >
                Add Variant
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {variants.map((variant, index) => (
              <Box
                key={index}
                sx={{
                  mb: 3,
                  p: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  backgroundColor: "white",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1">
                    Variant #{index + 1}
                  </Typography>
                  {variants.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => removeVariant(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
                  <TextField
                    label="Variant Name"
                    color="secondary"
                    value={variant.variant_name}
                    onChange={(e) =>
                      updateVariant(index, "variant_name", e.target.value)
                    }
                    placeholder="e.g., Small, Medium, Large, One Size"
                    fullWidth
                    error={errors.variants?.[index]?.variant_name}
                    helperText={errors.variants?.[index]?.variant_name}
                  />

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="Cost (Optional)"
                      color="secondary"
                      type="text" // Changed from "number" to "text" to avoid browser rounding
                      value={variant.cost}
                      onChange={(e) => {
                        // Allow only numbers and decimal point
                        const value = e.target.value.replace(/[^0-9.]/g, "");
                        // Ensure only one decimal point
                        const parts = value.split(".");
                        if (parts.length > 2) return;
                        updateVariant(index, "cost", value);
                      }}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ mr: 1 }}>₱</Typography>
                        ),
                      }}
                      placeholder="0.00"
                      error={errors.variants?.[index]?.cost}
                      helperText={
                        errors.variants?.[index]?.cost ||
                        "Leave empty if no cost"
                      }
                    />
                    <TextField
                      label="Price"
                      color="secondary"
                      type="text" // Changed from "number" to "text" to avoid browser rounding
                      value={variant.price}
                      onChange={(e) => {
                        // Allow only numbers and decimal point
                        const value = e.target.value.replace(/[^0-9.]/g, "");
                        // Ensure only one decimal point
                        const parts = value.split(".");
                        if (parts.length > 2) return;
                        updateVariant(index, "price", value);
                      }}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ mr: 1 }}>₱</Typography>
                        ),
                      }}
                      placeholder="0.00"
                      error={errors.variants?.[index]?.price}
                      helperText={errors.variants?.[index]?.price}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
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
