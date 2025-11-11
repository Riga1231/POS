import React, { createContext, useContext, useState } from "react";

// 🛒 Create the context
const CartContext = createContext();

// 🧠 Custom hook for easy use
export function useCart() {
  return useContext(CartContext);
}

// 📦 Provider component
export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // ➕ Add item to cart (with proper price calculation)
  const addToCart = (newItem) => {
    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === newItem.id);

      if (existingItem) {
        // If item exists, calculate new total and average unit price
        const newQuantity = existingItem.qty + newItem.qty;
        const newTotalPrice =
          existingItem.price * existingItem.qty + newItem.price * newItem.qty;
        const newUnitPrice = newTotalPrice / newQuantity;

        console.log("🔄 Updating existing cart item:");
        console.log(
          "Existing - Qty:",
          existingItem.qty,
          "Unit Price:",
          existingItem.price,
          "Total:",
          existingItem.price * existingItem.qty
        );
        console.log(
          "New - Qty:",
          newItem.qty,
          "Unit Price:",
          newItem.price,
          "Total:",
          newItem.price * newItem.qty
        );
        console.log(
          "Combined - Qty:",
          newQuantity,
          "Unit Price:",
          newUnitPrice,
          "Total:",
          newTotalPrice
        );

        return prev.map((i) =>
          i.id === newItem.id
            ? {
                ...i,
                qty: newQuantity,
                price: newUnitPrice, // Update to the new average unit price
                original_price: newItem.original_price, // Keep the latest original price
              }
            : i
        );
      } else {
        // If new item, add with the provided quantity and price
        console.log("🆕 Adding new cart item:");
        console.log(
          "Qty:",
          newItem.qty,
          "Unit Price:",
          newItem.price,
          "Total:",
          newItem.price * newItem.qty
        );
        return [...prev, { ...newItem }];
      }
    });
  };

  // ➖ Remove one quantity of item
  const removeFromCart = (id) => {
    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === id);
      if (existingItem && existingItem.qty > 1) {
        // If quantity > 1, decrease quantity (price remains the same)
        return prev.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i));
      } else {
        // If quantity is 1, remove completely
        return prev.filter((i) => i.id !== id);
      }
    });
  };

  // 🗑️ Remove item completely
  const removeItemCompletely = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  // 🧹 Clear cart
  const clearCart = () => setCart([]);

  // 💰 Get cart total
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.qty, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        removeItemCompletely,
        clearCart,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
