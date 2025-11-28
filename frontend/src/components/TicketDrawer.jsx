import React, { useState, useCallback, useMemo, memo, useRef } from "react";
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

// In TicketDrawer.jsx - Updated TicketItem component with smoother long press support
const TicketItem = memo(({ item, onRemoveOne, onRemoveAll }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const pressTimer = useRef(null);
  const animationFrame = useRef(null);
  const pressStartTime = useRef(0);

  const LONG_PRESS_DURATION = 400; // Slightly longer for better UX

  const animateProgress = useCallback((currentTime) => {
    if (!pressStartTime.current) return;

    const elapsed = currentTime - pressStartTime.current;
    const newProgress = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100);

    setProgress(newProgress);

    if (newProgress < 100) {
      animationFrame.current = requestAnimationFrame(animateProgress);
    }
  }, []);

  const handleTouchStart = useCallback(
    (e) => {
      e.preventDefault();
      setIsPressed(true);
      setProgress(0);
      pressStartTime.current = performance.now();

      // Start smooth animation
      animationFrame.current = requestAnimationFrame(animateProgress);

      // Set timeout for long press action
      pressTimer.current = setTimeout(() => {
        onRemoveAll(item.id);
        cleanup();
      }, LONG_PRESS_DURATION);
    },
    [item.id, onRemoveAll, animateProgress]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      e.preventDefault();

      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      const wasLongPress = progress >= 80; // Consider it long press if progress is 80% or more

      if (isPressed && !wasLongPress) {
        // If released before long press threshold, do single remove
        onRemoveOne(item.id);
      }

      cleanup();
    },
    [isPressed, progress, item.id, onRemoveOne]
  );

  const cleanup = useCallback(() => {
    setIsPressed(false);
    setProgress(0);
    pressStartTime.current = 0;
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  // Also handle mouse events for desktop
  const handleMouseDown = useCallback(
    (e) => {
      handleTouchStart(e);
    },
    [handleTouchStart]
  );

  const handleMouseUp = useCallback(
    (e) => {
      handleTouchEnd(e);
    },
    [handleTouchEnd]
  );

  const handleMouseLeave = useCallback(
    (e) => {
      handleTouchEnd(e);
    },
    [handleTouchEnd]
  );

  const handleTouchCancel = useCallback(
    (e) => {
      handleTouchEnd(e);
    },
    [handleTouchEnd]
  );

  return (
    <ListItem
      disablePadding
      sx={{
        display: "flex",
        justifyContent: "space-between",
        py: 1.5,
        borderBottom: "1px dashed #e0e0e0",
        cursor: "pointer",
        backgroundColor: isPressed ? "rgba(76, 175, 80, 0.08)" : "transparent",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        userSelect: "none",
        transform: isPressed ? "scale(0.98)" : "scale(1)",
        "&:hover": {
          backgroundColor: "rgba(0, 0, 0, 0.04)",
        },
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Smooth progress bar for long press */}
      {isPressed && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            background: `linear-gradient(90deg, 
              rgba(76, 175, 80, 0.15) ${progress}%, 
              transparent ${progress}%
            )`,
            transition: "background 0.1s linear",
            zIndex: 0,
          }}
        />
      )}

      {/* Animated border progress */}
      {isPressed && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 3,
            backgroundColor: "secondary.main",
            width: `${progress}%`,
            borderRadius: "0 2px 0 0",
            transition: "width 0.1s linear",
            boxShadow: "0 0 8px rgba(76, 175, 80, 0.5)",
          }}
        />
      )}

      <Box sx={{ flex: 1, position: "relative", zIndex: 1 }}>
        <ListItemText
          primary={
            <Typography
              variant="body1"
              sx={{
                fontWeight: isPressed ? 600 : 400,
                color: isPressed ? "secondary.main" : "text.primary",
                transition: "all 0.2s ease",
              }}
            >
              {item.name}
            </Typography>
          }
        />
        <Typography
          variant="body2"
          color={isPressed ? "secondary.main" : "text.secondary"}
          sx={{ transition: "color 0.2s ease" }}
        >
          {item.variant_name} • Qty: {item.qty}
          {item.has_discount && (
            <Box component="span" sx={{ color: "secondary.main", ml: 1 }}>
              • Discounted
            </Box>
          )}
        </Typography>
        {item.has_discount && (
          <Typography
            variant="caption"
            color={isPressed ? "secondary.main" : "text.secondary"}
            sx={{ transition: "color 0.2s ease" }}
          >
            Original: ₱{(item.original_price * item.qty).toFixed(2)} • Saved: ₱
            {((item.original_price - item.price) * item.qty).toFixed(2)}
          </Typography>
        )}

        {/* Long press hint that fades in */}
        {isPressed && progress > 0 && (
          <Typography
            variant="caption"
            color="secondary.main"
            sx={{
              display: "block",
              mt: 0.5,
              opacity: Math.min(progress / 100, 1),
              transition: "opacity 0.2s ease",
              fontWeight: 500,
            }}
          >
            {progress < 100 ? "Keep holding to remove all" : "Removing all..."}
          </Typography>
        )}
      </Box>

      <Typography
        fontWeight="semibold"
        sx={{
          color: isPressed ? "secondary.main" : "text.primary",
          transition: "all 0.2s ease",
          position: "relative",
          zIndex: 1,
        }}
      >
        ₱{(item.qty * item.price).toFixed(2)}
      </Typography>

      {/* Ripple effect overlay */}
      {isPressed && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            borderRadius: 1,
            animation: "pulse 2s infinite",
            "@keyframes pulse": {
              "0%": { opacity: 0.6 },
              "50%": { opacity: 0.3 },
              "100%": { opacity: 0.6 },
            },
          }}
        />
      )}
    </ListItem>
  );
});

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
  const { cart, removeFromCart, removeItemCompletely, clearCart } = useCart();

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
  const handleRemoveOne = useCallback(
    (itemId) => {
      removeFromCart(itemId);
    },
    [removeFromCart]
  );

  // ✅ Handle long press - remove all quantities (complete removal)
  const handleRemoveAll = useCallback(
    (itemId) => {
      removeItemCompletely(itemId);
    },
    [removeItemCompletely]
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
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        overflow: "hidden",
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
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="h6" fontWeight="600">
          Ticket
        </Typography>
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
              <TicketItem
                key={`${item.id}-${index}`}
                item={item}
                onRemoveOne={handleRemoveOne}
                onRemoveAll={handleRemoveAll}
              />
            ))
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ p: 2, textAlign: "center" }}
            >
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
          py: 2,
          bgcolor: "secondary.50",

          borderColor: "secondary.100",
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          Total
        </Typography>
        <Typography
          variant="h5"
          fontWeight="bold"
          color="secondary.main"
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
            color="secondary"
            size="large"
            sx={{
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: "600",
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
              "&:hover": {
                boxShadow: "0 6px 16px rgba(76, 175, 80, 0.4)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            Charge
          </Button>
        </Box>
      )}
    </Box>
  );
}
