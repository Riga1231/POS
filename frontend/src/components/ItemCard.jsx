// components/ItemCard.jsx
import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default function ItemCard({ item, onSelect }) {
  return (
    <Card
      onClick={() => onSelect && onSelect(item)}
      sx={{
        borderRadius: 0,
        m: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.15s ease-in-out",
        "&:hover": {
          transform: "scale(1.02)",
          boxShadow: 3,
        },
      }}
    >
      {/* Color or Image box - 60% height */}
      <Box
        sx={{
          flex: 6, // 60% height
          backgroundColor: item.type === "color" ? item.value : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "semibold",
          color: item.type === "color" ? "white" : "black",
          backgroundImage:
            item.type === "image"
              ? `url(http://localhost:5000${item.value})`
              : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Show item name as overlay for images, or directly for colors */}
        {item.type === "image" && (
          <Box
            sx={{
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "white",
              px: 1,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            {item.name}
          </Box>
        )}
        {item.type === "color" && item.name}
      </Box>

      {/* Card content - 40% height */}
      <CardContent sx={{ flex: 4, p: 1 }}>
        <Typography variant="subtitle2" noWrap>
          {item.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ₱{item.price}
        </Typography>
      </CardContent>
    </Card>
  );
}
