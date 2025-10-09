import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

// ✅ Memoized component
function Category({ category, onClick }) {
  return (
    <Box>
      <Box
        onClick={() => onClick(category)} // passes category to parent handler
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          cursor: "pointer",
          width: "100%",
          borderRadius: 1,
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        {/* Left side: Colored circle + Name */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: category.color || "#ccc",
              border: "1px solid #ccc",
            }}
          />
          <Typography variant="body1">{category.name}</Typography>
        </Box>

        {/* Right side: Items count */}
        <Typography variant="body1" sx={{ fontWeight: 400 }}>
          {category.itemsCount || 0} items
        </Typography>
      </Box>

      <Divider sx={{ marginX: 2 }} />
    </Box>
  );
}

export default React.memo(Category);
