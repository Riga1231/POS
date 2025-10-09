import React, { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import Pagination from "@mui/material/Pagination";
import Item from "../components/Item";
import Header from "../components/Header";

// Memoize the main component
const Items = memo(function Items() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const itemsPerPage = 8;

  // Fetch all items and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch items
        const itemsResponse = await fetch("http://localhost:5000/api/items");
        if (!itemsResponse.ok) throw new Error("Failed to fetch items");
        const itemsData = await itemsResponse.json();
        setItems(itemsData);

        // Fetch categories
        const categoriesResponse = await fetch(
          "http://localhost:5000/api/categories"
        );
        if (!categoriesResponse.ok)
          throw new Error("Failed to fetch categories");
        const categoriesData = await categoriesResponse.json();
        const categoryNames = categoriesData.map((c) => c.name);
        setCategories(categoryNames);

        if (categoryNames.length > 0) {
          setSelectedCategory(categoryNames[0]);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset to page 1 whenever search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, selectedCategory]);

  // Memoized callbacks for Header props
  const handleSearch = useCallback((value) => {
    setSearchValue(value);
  }, []);

  const handleCategoryChange = useCallback((value) => {
    setSelectedCategory(value);
  }, []);
  const handleClick = useCallback(
    (item) => {
      navigate(`/items/items/update/${item.id}`, { state: { item } });
    },
    [navigate]
  );

  // Filtered items based on search + category
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchValue ||
      item.name.toLowerCase().includes(searchValue.toLowerCase());
    const matchesCategory =
      !selectedCategory || selectedCategory === "All"
        ? true
        : item.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = useCallback((e, value) => setCurrentPage(value), []);
  const handleCreateItem = useCallback(
    () => navigate("/items/items/create"),
    [navigate]
  );

  if (loading) return <Box p={2}>Loading items...</Box>;
  if (error)
    return (
      <Box p={2} color="error.main">
        Error: {error}
      </Box>
    );

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Memoized Header with stable callbacks */}
      <Header
        showNav={false}
        categories={categories}
        onSearch={handleSearch}
        onCategoryChange={handleCategoryChange}
        selectedCategory={selectedCategory}
        showSearch={true}
      />

      {/* Scrollable content */}
      <Box sx={{ overflowY: "auto", flex: 1 }}>
        {/* Only show content when not loading */}
        {!loading && paginatedItems.length === 0 ? (
          <Box p={5}>No items found.</Box>
        ) : (
          paginatedItems.map((item) => (
            <Item key={item.id} item={item} onClick={() => handleClick(item)} />
          ))
        )}
      </Box>

      {/* Sticky pagination - Only show when not loading and has pages */}
      {!loading && totalPages > 1 && (
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            backgroundColor: "background.paper",
            display: "flex",
            justifyContent: "center",
            py: 1,
            zIndex: 1,
          }}
        >
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="secondary"
          />
        </Box>
      )}

      {/* Floating Add Button */}
      <Fab
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          bgcolor: "secondary.main",
          color: "white",
          "&:hover": { bgcolor: "secondary.dark" },
        }}
        aria-label="add"
        onClick={handleCreateItem}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
});

export default Items;
