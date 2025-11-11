import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import TicketDrawer from "../components/TicketDrawer";
import Header from "../components/Header";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useCart } from "../context/CartContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function Home3({ goTo }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const { item } = location.state || {};
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Fetch variants for the item
  useEffect(() => {
    if (item && item.id) {
      const fetchVariants = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/items/${item.id}/variants`);
          if (response.ok) {
            const variantsData = await response.json();
            setVariants(variantsData);
            if (variantsData.length > 0) {
              setSelectedVariant(variantsData[0].id);
            }
          }
        } catch (error) {
          console.error("Failed to fetch variants:", error);
        }
      };
      fetchVariants();
    }
  }, [item]);

  // Calculate total price when variant or quantity changes
  useEffect(() => {
    if (selectedVariant) {
      const variant = variants.find(v => v.id === selectedVariant);
      if (variant) {
        setTotalPrice(variant.price * quantity);
      }
    }
  }, [selectedVariant, quantity, variants]);

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    const variant = variants.find(v => v.id === selectedVariant);
    if (variant) {
      const cartItem = {
        id: `${item.id}-${variant.id}`, // Unique ID for item+variant combination
        name: item.name,
        variant_name: variant.variant_name,
        categoryName: item.categoryName,
        price: variant.price,
        cost: variant.cost,
        qty: quantity,
        item_id: item.id,
        variant_id: variant.id
      };

      addToCart(cartItem);
      goTo(0); // Go back to categories view
    }
  };

  const handleBack = () => {
    navigate(-1); // Go back to items view
  };

  if (!item) {
    return (
      <Box sx={{ display: "flex", height: "100vh" }}>
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography>No item selected</Typography>
        </Box>
      </Box>
    );
  }

  const selectedVariantData = variants.find(v => v.id === selectedVariant);

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Main content */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header */}
        <Header
          hasBack={true}
          onBack={handleBack}
          title={item.name}
        />

        {/* Variant Selection */}
        <Box sx={{ flexGrow: 1, p: 4, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Item Visual */}
          <Box sx={{ display: "flex', justifyContent: 'center', mb: 3 }}>
            {item.type === "color" ? (
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  backgroundColor: item.value,
                  borderRadius: 2,
                  border: "1px solid #ccc",
                }}
              />
            ) : (
              <Box
                component="img"
                src={`http://localhost:5000${item.value}`}
                alt={item.name}
                sx={{
                  width: 100,
                  height: 100,
                  objectFit: "cover",
                  borderRadius: 2,
                }}
              />
            )}
          </Box>

          {/* Variant Selection */}
          <FormControl fullWidth>
            <InputLabel>Variant</InputLabel>
            <Select
              value={selectedVariant}
              label="Variant"
              onChange={(e) => setSelectedVariant(e.target.value)}
            >
              {variants.map((variant) => (
                <MenuItem key={variant.id} value={variant.id}>
                  {variant.variant_name} - ₱{variant.price.toFixed(2)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Quantity Input */}
          <TextField
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1 }}
            fullWidth
          />

          {/* Price Display */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Unit Price:</Typography>
            <Typography variant="h6">
              ₱{selectedVariantData ? selectedVariantData.price.toFixed(2) : "0.00"}
            </Typography>
          </Box>

          {/* Total Price (Editable) */}
          <TextField
            label="Total Price"
            type="number"
            value={totalPrice.toFixed(2)}
            onChange={(e) => {
              const newTotal = parseFloat(e.target.value) || 0;
              setTotalPrice(newTotal);
              if (selectedVariantData && selectedVariantData.price > 0) {
                setQuantity(Math.max(1, Math.round(newTotal / selectedVariantData.price)));
              }
            }}
            inputProps={{ min: 0, step: "0.01" }}
            fullWidth
          />

          {/* Add to Cart Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleAddToCart}
            disabled={!selectedVariant}
            sx={{ mt: 2, py: 2 }}
          >
            Add to Cart - ₱{totalPrice.toFixed(2)}
          </Button>
        </Box>
      </Box>

      {/* Ticket Drawer */}
      <Box sx={{ width: 400, flexShrink: 0 }}>
        <TicketDrawer
          goTo={goTo}
          hasSettings={true}
          anchor="right"
        />
      </Box>
    </Box>
  );
}