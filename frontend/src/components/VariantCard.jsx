import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

export default function VariantCard({ variant, isSelected, onSelect }) {
  // Blue when not selected, Purple when selected
  const cardColor = isSelected ? "#5D336E" : "#1565C0";
  const textColor = "white";

  return (
    <Card
      onClick={onSelect}
      sx={{
        borderRadius: 2,
        width: "100%", // Take full width of container
        height: 120, // Fixed height
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        backgroundColor: cardColor,
        background: isSelected
          ? `linear-gradient(135deg, #5D336E, #7A4B8C)`
          : `linear-gradient(135deg, #1565C0, #1976D2)`,
        color: textColor,
        border: isSelected ? "3px solid #FFD700" : "none",
        boxShadow: isSelected
          ? "0 6px 20px rgba(93, 51, 110, 0.4)"
          : "0 4px 12px rgba(0,0,0,0.1)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
        },
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Typography
          variant="h6"
          align="center"
          sx={{
            fontWeight: "bold",
            mb: 0.5,
            lineHeight: 1.2,
            fontSize: "1.1rem",
          }}
        >
          {variant.variant_name}
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{
            opacity: 0.9,
            fontWeight: "medium",
            fontSize: "0.9rem",
          }}
        >
          ₱{variant.price.toFixed(2)}
        </Typography>
      </Box>
    </Card>
  );
}
