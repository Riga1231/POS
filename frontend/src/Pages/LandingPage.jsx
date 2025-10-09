import React from "react";
import SlidingPages from "../components/SlidingPages";
import Home1 from "./Home1";
import Home2 from "./Home2";
import { CartProvider } from "../context/CartContext";

export default function LandingPage() {
  return (
    <CartProvider>
      <SlidingPages
        page1={({ goTo }) => <Home1 goTo={goTo} />}
        page2={({ goTo }) => <Home2 goTo={goTo} />}
      />
    </CartProvider>
  );
}
