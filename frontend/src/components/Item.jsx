import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";

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
              sx={{ color: "text.secondary", fontSize: 13 }}
            >
              {item.categoryName || "Uncategorized"}
            </Typography>
          </Box>
        </Box>

        {/* Right: Price */}
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          ₱{item.price ? `${parseFloat(item.price).toFixed(2)}` : "-"}
        </Typography>
      </Box>

      <Divider sx={{ marginX: 2 }} />
    </Box>
  );
}

export default React.memo(Item);
