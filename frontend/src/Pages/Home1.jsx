import Box from "@mui/material/Box";
import TicketDrawer from "../components/TicketDrawer";
import Header from "../components/Header";
import Pagination from "@mui/material/Pagination";
import { useState, useEffect } from "react";
import ItemCard from "../components/ItemCard";
import axios from "axios";
import { useCart } from "../context/CartContext";

export default function Home1({ goTo }) {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState([]);

  // Get cart functions from context
  const { addToCart } = useCart();

  // Fetch categories and items from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesRes = await axios.get(
          "http://localhost:5000/api/categories"
        );
        const categoryNames = categoriesRes.data.map((c) => c.name);
        setCategories(categoryNames);

        // Fetch items
        const itemsRes = await axios.get("http://localhost:5000/api/items");
        console.log("Items from API:", itemsRes.data);
        setItems(itemsRes.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setCategories(["Electronics", "Clothing", "Books", "Furniture"]);
        setItems([]);
      }
    };

    fetchData();
  }, []);

  // Handle item selection - add to cart
  const handleItemSelect = (item) => {
    addToCart(item);
  };

  const itemsPerPage = 15;
  const [page, setPage] = useState(1);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) &&
      (category === "All" || item.categoryName === category)
  );

  const pageCount = Math.ceil(filteredItems.length / itemsPerPage);
  const displayedItems = filteredItems.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

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
          categories={categories}
          showSearch={true}
          onCategoryChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
          onSearch={(text) => {
            setSearchText(text);
            setPage(1);
          }}
        />

        {/* Grid */}
        <Box
          sx={{
            flexGrow: 1,
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gridTemplateRows: "repeat(3, 1fr)",
          }}
        >
          {displayedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onSelect={handleItemSelect} // Pass the handler to ItemCard
            />
          ))}
        </Box>

        {/* Pagination */}
        {pageCount > 1 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              borderTop: "1px solid #e0e0e0",
              p: 1,
            }}
          >
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="secondary"
            />
          </Box>
        )}
      </Box>

      {/* Ticket Drawer */}
      <Box sx={{ width: 400, flexShrink: 0 }}>
        <TicketDrawer
          goTo={goTo}
          hasSettings={true}
          anchor="right"
          items={filteredItems.slice(0, 15)}
        />
      </Box>
    </Box>
  );
}
