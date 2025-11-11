import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function HeaderItem({ onBack, onSave, title = "Header" }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        backgroundColor: "success.main",
        minHeight: "64px",
      }}
    >
      {/* Left: Back button + title */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={onBack} sx={{ color: "white", p: 0.5 }}>
          <ArrowBackIcon fontSize="medium" />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ color: "white", fontWeight: 500, pl: 1 }}
        >
          {title}
        </Typography>
      </Box>

      {/* Right: Save button */}
      {onSave && (
        <Typography
          variant="h6"
          sx={{ color: "white", cursor: "pointer" }}
          onClick={onSave}
        >
          Save
        </Typography>
      )}
    </Box>
  );
}
