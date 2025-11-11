import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";

function Item({ item, onClick }) {
  // Safely generate image URL
  const getImageUrl = () => {
    if (!item.value) return null;

    // If value already includes /uploads/, use as is
    if (item.value.startsWith("/uploads/")) {
      return `http://localhost:5000${item.value}`;
    }

    // Otherwise, prepend uploads path
    return `http://localhost:5000/uploads/${item.value}`;
  };

  // Calculate price range from variants
  const getPriceRange = () => {
    if (!item.variants || item.variants.length === 0) {
      return "No variants";
    }

    const prices = item.variants.map((v) => parseFloat(v.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `₱${minPrice.toFixed(2)}`;
    } else {
      return `₱${minPrice.toFixed(2)} - ₱${maxPrice.toFixed(2)}`;
    }
  };

  // Count variants
  const variantCount = item.variants ? item.variants.length : 0;

  const renderVisual = () => {
    if (item.type === "color") {
      // Display a color circle
      return (
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: item.value,
            border: "1px solid #ccc",
          }}
        />
      );
    } else if (item.type === "image" && item.value) {
      // Display an uploaded image
      const imageUrl = getImageUrl();
      return (
        <Avatar
          src={imageUrl}
          alt={item.name}
          sx={{
            width: 40,
            height: 40,
            objectFit: "cover",
            bgcolor: "#f0f0f0",
          }}
        />
      );
    } else {
      // Fallback: show first letter
      return (
        <Avatar sx={{ width: 40, height: 40, bgcolor: "#9e9e9e" }}>
          {item.name ? item.name[0] : "?"}
        </Avatar>
      );
    }
  };

  return (
    <Box>
      <Box
        onClick={() => onClick(item)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          cursor: "pointer",
          width: "100%",
          borderRadius: 1,
          "&:hover": { backgroundColor: "#f5f5f5" },
        }}
      >
        {/* Left: Visual + Info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {renderVisual()}
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {item.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.success", fontSize: 13 }}
            >
              {item.categoryName || "Uncategorized"}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
              <Chip
                label={`${variantCount} variant${
                  variantCount !== 1 ? "s" : ""
                }`}
                size="small"
                variant="outlined"
                color="success"
              />
            </Box>
          </Box>
        </Box>

        {/* Right: Price Range */}
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {getPriceRange()}
        </Typography>
      </Box>

      <Divider sx={{ marginX: 2 }} />
    </Box>
  );
}

export default React.memo(Item);
