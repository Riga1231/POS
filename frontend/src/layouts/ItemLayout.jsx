import React from "react";
import Box from "@mui/material/Box";
import Header from "../components/Header";
import List from "@mui/material/List";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

// Drawer nav item
const DrawerNavItem = ({ item, navigate, active }) => (
  <ListItemButton
    onClick={() => navigate(item.link)}
    sx={{
      pl: 3,
      color: active ? "#5D336E" : "gray",
      backgroundColor: active ? "rgba(93, 51, 110, 0.1)" : "transparent",
      borderRadius: 1,
      "&:hover": {
        backgroundColor: active ? "rgba(93, 51, 110, 0.15)" : "#f5f5f5",
      },
    }}
  >
    <ListItemIcon sx={{ color: active ? "#5D336E" : "gray", minWidth: 40 }}>
      {item.icon}
    </ListItemIcon>
    <ListItemText primary={item.text} />
  </ListItemButton>
);

export default function ItemLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { text: "Items", icon: <Inventory2OutlinedIcon />, link: "/items/items" },
    {
      text: "Categories",
      icon: <CategoryOutlinedIcon />,
      link: "/items/categories",
    },
  ];

  return (
    <Box sx={{ display: "flex", width: "100%", height: "100vh" }}>
      {/* Left nav */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRight: 1,
          borderColor: "divider",
        }}
      >
        {/* Header with navigation enabled and "Items" title */}
        <Header
          hasNoBack
          title="Items"
          showNav={true}
          sx={{ height: "100%" }}
        />

        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <List sx={{ p: 0, m: 0 }}>
            {navItems.map((item, index) => (
              <DrawerNavItem
                key={index}
                item={item}
                navigate={navigate}
                active={location.pathname === item.link}
              />
            ))}
          </List>
        </Box>
      </Box>

      {/* Right side - No Header here */}
      <Box
        sx={{
          flex: 3,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-2px 0 6px rgba(0,0,0,0.15)",
        }}
      >
        {/* Child routes - Header will be inside each child component if needed */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
