import React, { useState, useCallback, useMemo, memo } from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import DeleteIcon from "@mui/icons-material/Delete";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import Divider from "@mui/material/Divider";
import { useCart } from "../context/CartContext";

// ✅ Memoized Ticket Item - NOW CLICKABLE
const TicketItem = memo(({ item, onClick }) => (
  <ListItem
    disablePadding
    onClick={() => onClick(item.id)}
    sx={{
      display: "flex",
      justifyContent: "space-between",
      py: 1,
      borderBottom: "1px dashed #ddd",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "#f5f5f5",
      },
    }}
  >
    <ListItemText primary={item.name} secondary={`Qty: ${item.qty}`} />
    <Typography fontWeight="semibold">
      ₱{(item.qty * item.price).toFixed(2)}
    </Typography>
  </ListItem>
));

// ✅ Memoized Header Menu - SAME DESIGN
const TicketHeaderMenu = memo(
  ({ menuAnchor, menuOpen, onClick, onClose, onClear, onOpenDrawer }) => (
    <>
      <IconButton onClick={onClick} sx={{ color: "grey.600" }}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={onClear}>
          <DeleteIcon sx={{ mr: 1, color: "grey.600" }} /> Clear Ticket
        </MenuItem>
        <MenuItem onClick={onOpenDrawer}>
          <PointOfSaleIcon sx={{ mr: 1, color: "grey.600" }} /> Open Cash Drawer
        </MenuItem>
      </Menu>
    </>
  )
);

export default function TicketDrawer({
  hasSettings = true,
  hasCharge = true,
  goTo,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  // Get cart data and functions from context
  const { cart, removeFromCart, clearCart } = useCart();

  // ✅ Menu handlers
  const handleMenuClick = useCallback(
    (event) => setMenuAnchor(event.currentTarget),
    []
  );
  const handleMenuClose = useCallback(() => setMenuAnchor(null), []);

  const handleClearTicket = useCallback(() => {
    clearCart();
    handleMenuClose();
  }, [clearCart, handleMenuClose]);

  const handleOpenCashDrawer = useCallback(() => {
    console.log("Open cash drawer clicked");
    handleMenuClose();
  }, [handleMenuClose]);

  // ✅ Handle item click - remove one quantity
  const handleItemClick = useCallback(
    (itemId) => {
      removeFromCart(itemId);
    },
    [removeFromCart]
  );

  // ✅ Total calculation
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty * item.price, 0),
    [cart]
  );

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #ddd",
        borderRadius: 1,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.5,
        }}
      >
        <Typography variant="h6">Ticket</Typography>
        {hasSettings && (
          <TicketHeaderMenu
            menuAnchor={menuAnchor}
            menuOpen={menuOpen}
            onClick={handleMenuClick}
            onClose={handleMenuClose}
            onClear={handleClearTicket}
            onOpenDrawer={handleOpenCashDrawer}
          />
        )}
      </Box>

      <Divider />

      {/* Scrollable Items */}
      <Box sx={{ flex: "1 1 auto", overflowY: "auto" }}>
        <List sx={{ p: 2 }}>
          {cart.length > 0 ? (
            cart.map((item, index) => (
              <TicketItem key={index} item={item} onClick={handleItemClick} />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No items yet
            </Typography>
          )}
        </List>
      </Box>

      {/* Total */}
      <Divider sx={{ mx: 2 }} />
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.5,
          bgcolor: "#fafafa",
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          Total
        </Typography>
        <Typography
          variant="h5"
          fontWeight="bold"
          color="secondary"
          sx={{ minWidth: 80, textAlign: "right" }}
        >
          ₱{total.toFixed(2)}
        </Typography>
      </Box>

      {/* Charge Button */}
      {hasCharge && (
        <Box sx={{ flexShrink: 0, p: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => goTo?.(1)}
            sx={{
              height: "100%",
              bgcolor: "#5D336E",
              "&:hover": { bgcolor: "#4a2857" },
            }}
          >
            Charge
          </Button>
        </Box>
      )}
    </Box>
  );
}
