import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

export default function ItemCard({ item, onSelect }) {
  const itemName = item?.name || "Unknown Item";

  // Determine card appearance based on item type
  const getCardStyle = () => {
    if (item?.type === "color" && item?.value) {
      // For color type, use the color value from database
      const cardColor = item.value;
      return {
        backgroundColor: cardColor,
        background: `linear-gradient(135deg, ${cardColor}, ${adjustBrightness(
          cardColor,
          -0.2
        )})`,
        color: getContrastTextColor(cardColor),
      };
    } else if (item?.type === "image" && item?.value) {
      // For image type, use the image as background
      return {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${item.value})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
      };
    } else {
      // Fallback to default teal
      const cardColor = "#00796B";
      return {
        backgroundColor: cardColor,
        background: `linear-gradient(135deg, ${cardColor}, #009688)`,
        color: "white",
      };
    }
  };

  const cardStyle = getCardStyle();

  return (
    <Card
      onClick={() => onSelect && onSelect(item)}
      sx={{
        borderRadius: 2,
        m: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        border: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        },
        ...cardStyle,
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
            textShadow:
              item?.type === "image" ? "0 2px 4px rgba(0,0,0,0.5)" : "none",
          }}
        >
          {itemName}
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

// Helper function to determine text color based on background brightness
function getContrastTextColor(hexColor) {
  // Remove the # if present
  hexColor = hexColor.replace(/^#/, "");

  // Parse r, g, b values
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Calculate relative luminance (perceived brightness)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use white text for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? "black" : "white";
}
