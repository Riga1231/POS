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

  // ➕ Add item to cart (with quantity tracking)
  const addToCart = (item) => {
    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        // If item exists, increase quantity
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        // If new item, add with quantity 1
        return [...prev, { ...item, qty: 1 }];
      }
    });
  };

  // ➖ Remove one quantity of item
  const removeFromCart = (id) => {
    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === id);
      if (existingItem && existingItem.qty > 1) {
        // If quantity > 1, decrease quantity
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

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        removeItemCompletely,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
