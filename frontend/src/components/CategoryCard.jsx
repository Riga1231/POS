import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

export default function CategoryCard({ category, onSelect }) {
  const categoryName = category?.name || "Unknown Category";

  // Use the category's color from database, fallback to default purple
  const categoryColor = category?.color || "#7A4B8C";
  const textColor = "white";

  return (
    <Card
      onClick={() => onSelect && onSelect(category)}
      sx={{
        borderRadius: 2,
        m: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        backgroundColor: categoryColor,
        background: `linear-gradient(135deg, ${categoryColor}, ${adjustBrightness(
          categoryColor,
          -0.2
        )})`,
        color: textColor,
        border: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        },
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Typography
          variant="h5"
          align="center"
          sx={{
            fontWeight: "bold",
            lineHeight: 1.2,
          }}
        >
          {categoryName}
        </Typography>
      </Box>
    </Card>
  );
}

// Helper function to adjust color brightness for gradient
function adjustBrightness(hex, factor) {
  // Remove the # if present
  hex = hex.replace(/^#/, "");

  // Parse r, g, b values
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Adjust brightness
  r = Math.max(0, Math.min(255, Math.round(r + r * factor)));
  g = Math.max(0, Math.min(255, Math.round(g + g * factor)));
  b = Math.max(0, Math.min(255, Math.round(b + b * factor)));

  // Convert back to hex
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
