import React, { useState, useEffect, useCallback, memo } from "react";
import Box from "@mui/material/Box";
import { useTheme, styled } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useAuth } from "../context/AuthContext";
import InputBase from "@mui/material/InputBase";
import ListItemButton from "@mui/material/ListItemButton";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import axios from "axios";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import LockIcon from "@mui/icons-material/Lock";

import PointOfSaleIcon from "@mui/icons-material/PointOfSaleOutlined";
import Inventory2Icon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLongOutlined";
import BusinessIcon from "@mui/icons-material/BusinessOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";

// Styled search input
const TransparentInput = styled(InputBase)(({ theme }) => ({
  color: "white",
  fontSize: "1rem",
  "& .MuiInputBase-input": {
    padding: "4px 8px",
  },
}));

// Drawer Nav Item
const DrawerNavItem = memo(
  ({ item, navigate, onClick, active, onBackOfficeClick, currentLocation }) => {
    return (
      <ListItemButton
        onClick={() => {
          if (item.link === "/backoffice") {
            onBackOfficeClick?.();
          } else {
            navigate(item.link);
            onClick?.();
          }
        }}
        sx={{
          color: active ? "#5D336E" : "gray",
          backgroundColor: active ? "rgba(93, 51, 110, 0.1)" : "transparent",
          borderRadius: 1,
          "&:hover": {
            backgroundColor: active ? "rgba(93, 51, 110, 0.15)" : "#f5f5f5",
          },
        }}
      >
        <ListItemIcon
          sx={{
            color: active ? "#5D336E" : "gray",
            minWidth: 40,
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText primary={item.text} />
      </ListItemButton>
    );
  }
);

// Drawer content
const DrawerContent = memo(
  ({
    navItems,
    theme,
    navigate,
    closeDrawer,
    currentPath,
    onBackOfficeClick,
    currentLocation,
  }) => (
    <Box sx={{ width: 250 }} role="presentation">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2,
          backgroundColor: theme.palette.background.paper,
          minHeight: "80px",
        }}
      >
        <Avatar
          src="/logo.png"
          alt="Logo"
          sx={{ width: 48, height: 48, bgcolor: "white" }}
        />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            <Box component="span" sx={{ color: theme.palette.success.main }}>
              Ark
            </Box>{" "}
            <Box component="span" sx={{ color: theme.palette.secondary.main }}>
              Ziam
            </Box>
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary }}
          >
            Printing Services
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List>
        {navItems.map((item, index) => (
          <DrawerNavItem
            key={index}
            item={item}
            navigate={navigate}
            onClick={closeDrawer}
            active={currentPath === item.link}
            onBackOfficeClick={onBackOfficeClick}
            currentLocation={currentLocation}
          />
        ))}
      </List>
    </Box>
  )
);

// Main Header
const Header = memo(function Header({
  title = "",
  categories = [],
  showSearch = false,
  onCategoryChange,
  onSearch,
  hasBack = false,
  onBack, // Add onBack prop
  goTo,
  showNav = true,
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  // PIN Authentication states
  const [pin, setPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pendingNavigation, setPendingNavigation] = useState("");

  const navItems = [
    { text: "Sales", icon: <PointOfSaleIcon />, link: "/" },
    { text: "Items", icon: <Inventory2Icon />, link: "/items/items" },
    { text: "Transactions", icon: <ReceiptLongIcon />, link: "/transactions" },
    {
      text: "Back Office",
      icon: <BusinessIcon />,
      link: "/backoffice",
    },
  ];

  // ✅ Only include dropdown if there are categories
  const hasCategories = Array.isArray(categories) && categories.length > 0;
  const categoryList = hasCategories ? ["All", ...categories] : [];

  useEffect(() => {
    if (hasCategories) {
      const initial = "All";
      setSelectedCategory(initial);
      onCategoryChange?.(initial);
    }
  }, [hasCategories, categories]);

  const toggleDrawer = useCallback((open) => setDrawerOpen(open), []);

  const handleCategoryChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSelectedCategory(value);
      onCategoryChange?.(value);
    },
    [onCategoryChange]
  );

  const handleSearchChange = useCallback(
    (e) => onSearch?.(e.target.value),
    [onSearch]
  );
  const { grantAccess } = useAuth();
  const handleSearchActivate = useCallback(() => setSearchActive(true), []);
  const handleSearchDeactivate = useCallback(() => setSearchActive(false), []);

  // PIN Authentication handlers - UPDATED FOR DATABASE
  const handleBackOfficeClick = () => {
    setShowPinModal(true);
    setPin("");
    setPinError("");
  };
  const handlePinSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/backoffice/verify-pin",
        { pin }
      );

      if (response.data.success) {
        console.log("🎯 Granting access...");
        grantAccess();

        // Wait for state update then navigate
        setTimeout(() => {
          console.log("🎯 Navigating to /backoffice");
          setShowPinModal(false);
          setPin("");
          setPinError("");
          navigate("/backoffice");
        }, 50);
      }
    } catch (err) {
      setPinError(
        err.response?.data?.error || "Invalid PIN. Please try again."
      );
      setPin("");
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4); // Only numbers, max 4 digits
    setPin(value);
    setPinError("");
  };

  const handleClosePinModal = () => {
    setShowPinModal(false);
    setPin("");
    setPinError("");
    setPendingNavigation("");
  };

  const renderLeftButton = useCallback(() => {
    if (!showNav) return null;
    if (hasBack) {
      return (
        <IconButton
          onClick={() => {
            if (onBack) {
              onBack(); // Use the onBack prop if provided
            } else {
              goTo?.(0); // Fallback to old behavior
            }
          }}
          sx={{ color: "white" }}
        >
          <ArrowBackIcon />
        </IconButton>
      );
    }
    return (
      <IconButton onClick={() => toggleDrawer(true)} sx={{ color: "white" }}>
        <MenuIcon />
      </IconButton>
    );
  }, [showNav, hasBack, goTo, toggleDrawer, onBack]); // Add onBack to dependencies

  const closeDrawer = useCallback(() => toggleDrawer(false), [toggleDrawer]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 2,
        backgroundColor: "success.main",
        minHeight: "64px",
        justifyContent: "space-between",
      }}
    >
      {/* Left Section */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {renderLeftButton()}

        {!searchActive && title && (
          <Typography variant="h6" sx={{ color: "white" }}>
            {title}
          </Typography>
        )}

        {/* ✅ Show Category Dropdown only if prop given */}
        {!searchActive && hasCategories && (
          <Select
            value={selectedCategory || ""}
            onChange={handleCategoryChange}
            sx={{
              minWidth: 150,
              color: "white",
              "& .MuiSelect-select": { color: "white" },
              "& .MuiSvgIcon-root": { color: "white" },
              "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            }}
          >
            {categoryList.map((cat, i) => (
              <MenuItem key={i} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        )}

        {searchActive && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid white",
              maxWidth: 250,
            }}
          >
            <TransparentInput
              placeholder="Search…"
              autoFocus
              fullWidth
              onChange={handleSearchChange}
              onBlur={handleSearchDeactivate}
            />
          </Box>
        )}
      </Box>

      {/* Right Section */}
      {showSearch && !searchActive && (
        <IconButton sx={{ color: "white" }} onClick={handleSearchActivate}>
          <SearchIcon />
        </IconButton>
      )}

      {/* Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={closeDrawer}>
        <DrawerContent
          navItems={navItems}
          theme={theme}
          navigate={navigate}
          closeDrawer={closeDrawer}
          currentPath={location.pathname}
          onBackOfficeClick={handleBackOfficeClick}
          currentLocation={location}
        />
      </Drawer>

      {/* PIN Modal */}
      <Dialog
        open={showPinModal}
        onClose={handleClosePinModal}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            padding: 2,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <LockIcon color="secondary" />
            <Typography
              variant="h6"
              sx={{ color: "#5D336E", fontWeight: "bold" }}
            >
              Admin Access Required
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
            Enter PIN to access Back Office
          </Typography>

          <TextField
            autoFocus
            fullWidth
            type="password"
            value={pin}
            onChange={handlePinChange}
            placeholder="Enter 4-digit PIN"
            inputProps={{
              maxLength: 4,
              style: {
                textAlign: "center",
                fontSize: "24px",
                letterSpacing: "8px",
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& input": {
                  textAlign: "center",
                  fontSize: "24px",
                  letterSpacing: "8px",
                  padding: "12px",
                },
              },
            }}
          />

          {pinError && (
            <Typography color="error" sx={{ mt: 2 }}>
              {pinError}
            </Typography>
          )}

          {/* Add helpful hint for first-time users */}
          <Typography
            variant="caption"
            sx={{ mt: 2, display: "block", color: "text.secondary" }}
          >
            First time? Use default PIN: 1234
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 3 }}>
          <Button
            variant="outlined"
            onClick={handleClosePinModal}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            onClick={handlePinSubmit}
            sx={{
              minWidth: 100,
              backgroundColor: "#5D336E",
              "&:hover": {
                backgroundColor: "#4a2a5a",
              },
            }}
          >
            Enter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default Header;
