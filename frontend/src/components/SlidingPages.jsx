// SlidingPages.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function SlidingPages({
  page1,
  page2,
  initialPage = 0,
  onPageChange,
}) {
  const [page, setPage] = useState(initialPage);
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  // Update viewport width on resize
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Function to go to a specific page
  const goTo = (p) => {
    setPage(p);
    if (onPageChange) onPageChange(p);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        margin: 0,
      }}
    >
      <motion.div
        // Drag removed to prevent full screen dragging
        animate={{ x: page === 0 ? "0vw" : "-100vw" }}
        initial={false}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        style={{
          display: "flex",
          width: "200vw", // two pages side by side
          height: "100%",
        }}
      >
        {/* Page 1 */}
        <section style={{ width: "100vw", height: "100vh", flexShrink: 0 }}>
          {page1({ goTo })}
        </section>

        {/* Page 2 */}
        <section style={{ width: "100vw", height: "100vh", flexShrink: 0 }}>
          {page2({ goTo })}
        </section>
      </motion.div>
    </div>
  );
}
