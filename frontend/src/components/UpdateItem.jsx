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
import { useNavigate, useParams } from "react-router-dom";
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

export default function UpdateItem() {
  const navigate = useNavigate();
  const { id } = useParams();

  console.log("🎯 UPDATEITEM COMPONENT MOUNTED");
  console.log("🎯 ID from useParams:", id);
  console.log("🎯 Full URL:", window.location.href);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [photo, setPhoto] = useState(null);
  const [type, setType] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [existingImage, setExistingImage] = useState("");
  const [error, setError] = useState(null);

  console.log("🎯 Component state - loading:", loading, "error:", error);

  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });

  // Fetch item data and categories
  useEffect(() => {
    const fetchItemData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          setError("No item ID provided");
          setLoading(false);
          return;
        }

        console.log("🔍 Fetching item data for ID:", id);

        const [itemRes, categoriesRes] = await Promise.all([
          fetch(`http://localhost:5000/api/items/${id}`),
          fetch("http://localhost:5000/api/categories"),
        ]);

        if (!itemRes.ok) {
          console.error("❌ Item fetch failed with status:", itemRes.status);
          throw new Error(`Failed to fetch item: ${itemRes.status}`);
        }
        if (!categoriesRes.ok) {
          throw new Error("Failed to fetch categories");
        }

        const itemData = await itemRes.json();
        const categoriesData = await categoriesRes.json();

        console.log("🔍 FULL Item data received:", itemData);
        console.log("🔍 Available keys in itemData:", Object.keys(itemData));
        console.log(
          "🔍 Category data:",
          itemData.categoryName,
          itemData.category_id,
          itemData.category
        );
        console.log("🔍 Categories list:", categoriesData);

        // Debug: Check what category fields exist
        if (itemData.categoryName) {
          console.log("✅ Using categoryName:", itemData.categoryName);
          setCategory(itemData.categoryName);
        } else if (itemData.category_name) {
          console.log("✅ Using category_name:", itemData.category_name);
          setCategory(itemData.category_name);
        } else if (itemData.category) {
          console.log("✅ Using category:", itemData.category);
          setCategory(itemData.category);
        } else {
          console.warn("❌ No category name found in item data");
          // Try to find category name from categories list using category_id
          if (itemData.category_id) {
            const foundCategory = categoriesData.find(
              (cat) => cat.id === itemData.category_id
            );
            if (foundCategory) {
              console.log(
                "✅ Found category from category_id:",
                foundCategory.name
              );
              setCategory(foundCategory.name);
            }
          }
        }

        // Populate form with existing data
        setName(itemData.name || "");
        setType(itemData.type || "");

        if (itemData.type === "color") {
          setSelectedColor(itemData.value || "");
        } else if (itemData.type === "image" && itemData.value) {
          setExistingImage(itemData.value);
        }

        // Set variants - ensure cost is handled as string to prevent rounding
        setVariants(
          itemData.variants && itemData.variants.length > 0
            ? itemData.variants.map((variant) => ({
                ...variant,
                cost: variant.cost ? variant.cost.toString() : "",
                price: variant.price ? variant.price.toString() : "",
              }))
            : [{ variant_name: "", cost: "", price: "", id: null }]
        );

        setCategories(categoriesData);
      } catch (err) {
        console.error("Error loading item:", err);
        setError(err.message);
        setSnackbar({
          open: true,
          message: "Failed to load item data",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchItemData();
  }, [id]);

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
      setExistingImage("");
    }
  };

  const handleBack = () => {
    navigate("/items/items");
  };

  // Add new variant input
  const addVariant = () => {
    setVariants([
      ...variants,
      { variant_name: "", cost: "", price: "", id: null },
    ]);
  };

  // Remove variant input
  const removeVariant = (index) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    }
  };

  // Update variant field - keep as strings to prevent rounding
  const updateVariant = (index, field, value) => {
    const newVariants = variants.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    );
    setVariants(newVariants);
  };

  const validateFields = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Item name is required";
    if (!category) newErrors.category = "Category is required";
    if (!type) newErrors.type = "Item type is required";

    if (type === "color" && !selectedColor)
      newErrors.color = "Please select a color";

    if (type === "image" && !photo && !existingImage)
      newErrors.photo = "Please upload a photo or keep existing one";

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

      // Price validation
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
      // Update base item
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("type", type);

      if (type === "color") {
        formData.append("value", selectedColor);
      } else if (type === "image") {
        if (photo) {
          formData.append("photo", photo);
        } else if (existingImage) {
          formData.append("value", existingImage.split("/").pop());
        }
      }

      const itemRes = await fetch(`http://localhost:5000/api/items/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!itemRes.ok) throw new Error("Failed to update base item");

      // Handle variants - SEND AS STRINGS TO AVOID ROUNDING
      const variantPromises = variants.map((variant) => {
        if (variant.id) {
          // Update existing variant
          return fetch(
            `http://localhost:5000/api/items/variants/${variant.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                variant_name: variant.variant_name,
                cost: variant.cost || "0", // Send as string, default to "0" if empty
                price: variant.price, // Send as string
              }),
            }
          );
        } else {
          // Create new variant
          return fetch(`http://localhost:5000/api/items/${id}/variants`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              variant_name: variant.variant_name,
              cost: variant.cost || "0", // Send as string, default to "0" if empty
              price: variant.price, // Send as string
            }),
          });
        }
      });

      const variantResults = await Promise.all(variantPromises);
      const allVariantsSuccessful = variantResults.every((res) => res.ok);

      if (!allVariantsSuccessful) {
        throw new Error("Failed to save some variants");
      }

      setSnackbar({
        open: true,
        message: "Item and variants updated successfully!",
        type: "success",
      });

      setTimeout(() => navigate("/items/items"), 1500);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to update item and variants",
        type: "error",
      });
    }
  };

  // Get image URL for display
  const getImageUrl = () => {
    if (photo) {
      return URL.createObjectURL(photo);
    } else if (existingImage) {
      if (existingImage.startsWith("/uploads/")) {
        return `http://localhost:5000${existingImage}`;
      }
      return `http://localhost:5000/uploads/${existingImage}`;
    }
    return null;
  };

  if (loading) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#f5f5f5",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography>Loading item data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#f5f5f5",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography variant="h6" color="error">
          Error: {error}
        </Typography>
        <Button variant="contained" onClick={handleBack}>
          Go Back to Items
        </Button>
      </Box>
    );
  }

  console.log(
    "🎯 UPDATEITEM RENDER - loading:",
    loading,
    "error:",
    error,
    "hasData:",
    !!name
  );

  return (
    <Box
      sx={{
        // Apply background to the entire page
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <HeaderItem title="Update Item" onBack={handleBack} onSave={handleSave} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 4,
          // Ensure this container takes full available space
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
            // Make the paper take full height of its container
            minHeight: "fit-content",
            // Ensure white background covers everything
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

          {/* Category */}
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
                <MenuItem key={cat.id} value={cat.name}>
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
                setExistingImage("");
                setErrors((prev) => ({
                  ...prev,
                  type: undefined,
                  photo: undefined,
                  color: undefined,
                }));
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
                Choose New Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </Button>

              {(photo || existingImage) && (
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}
                >
                  <Box
                    component="img"
                    src={getImageUrl()}
                    alt="Preview"
                    sx={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {photo ? "New photo" : "Current photo"}
                  </Typography>
                </Box>
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
                    Variant #{index + 1} {variant.id && "(Existing)"}
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
                      label="Cost (Optional)" // Updated label
                      color="secondary"
                      type="text" // Changed to text to prevent rounding
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
                      } // Updated helper text
                    />
                    <TextField
                      label="Price"
                      color="secondary"
                      type="text" // Changed to text to prevent rounding
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
