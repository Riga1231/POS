import React, { useState, useEffect, useCallback, memo } from "react";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import Pagination from "@mui/material/Pagination";
import { useNavigate } from "react-router-dom";
import Category from "../components/Category";
import Header from "../components/Header";

// Memoize the main component
const Categories = memo(function Categories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  const categoriesPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Memoized callback for Header search
  const handleSearch = useCallback((value) => {
    setSearchValue(value);
  }, []);

  // Filter categories by search value
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * categoriesPerPage,
    currentPage * categoriesPerPage
  );

  const handlePageChange = useCallback(
    (event, value) => setCurrentPage(value),
    []
  );
  const handleCreateCategory = useCallback(
    () => navigate("/items/categories/create"),
    [navigate]
  );

  const handleClick = useCallback(
    (category) => {
      navigate(`/items/categories/update/${category.id}`, {
        state: { category },
      });
    },
    [navigate]
  );

  if (loading) return <Box p={2}>Loading categories...</Box>;
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
      {/* Memoized Header with stable callback */}
      <Header showNav={false} onSearch={handleSearch} showSearch={true} />

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {/* Only show "No categories found" when not loading AND actually empty */}
        {!loading && paginatedCategories.length === 0 ? (
          <Box sx={{ p: 5 }}>No categories found.</Box>
        ) : (
          paginatedCategories.map((category) => (
            <Category
              key={category.id}
              category={category}
              onClick={handleClick}
            />
          ))
        )}
      </Box>

      {/* Pagination - Only show when not loading and has pages */}
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

      {/* Add button */}
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
        onClick={handleCreateCategory}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
});

export default Categories;
