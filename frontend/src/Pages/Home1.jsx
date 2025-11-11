import Box from "@mui/material/Box";
import TicketDrawer from "../components/TicketDrawer";
import Header from "../components/Header";
import Pagination from "@mui/material/Pagination";
import { useState, useEffect } from "react";
import CategoryCard from "../components/CategoryCard";
import ItemCard from "../components/ItemCard";
import VariantCard from "../components/VariantCard";
import axios from "axios";
import { useCart } from "../context/CartContext";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router-dom";

export default function Home1({ goTo }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  const { addToCart } = useCart();

  // Views: 'categories', 'items', 'variants'
  const [currentView, setCurrentView] = useState("categories");

  // Fetch categories and items from API
  // In your Home1 component, update the fetchData function to include color:
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesRes = await axios.get(
          "http://localhost:5000/api/categories"
        );
        const categoriesData = categoriesRes.data;
        setCategories(categoriesData);

        // Fetch items
        const itemsRes = await axios.get("http://localhost:5000/api/items");

        // Map category_id to category data for each item
        const itemsWithCategoryData = itemsRes.data.map((item) => {
          const categoryObj = categoriesData.find(
            (cat) => cat.id === item.category_id
          );
          return {
            ...item,
            categoryName: categoryObj ? categoryObj.name : "Unknown",
            categoryColor: categoryObj ? categoryObj.color : "#7A4B8C", // Add color here too if needed
          };
        });

        setItems(itemsWithCategoryData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setCategories([]);
        setItems([]);
      }
    };

    fetchData();
  }, []);

  // Fetch variants when item is selected
  useEffect(() => {
    if (selectedItem && selectedItem.id) {
      const fetchVariants = async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/items/${selectedItem.id}/variants`
          );
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
  }, [selectedItem]);

  // Calculate total price when variant or quantity changes
  useEffect(() => {
    if (selectedVariant && currentView === "variants") {
      const variant = variants.find((v) => v.id === selectedVariant);
      if (variant) {
        setTotalPrice(variant.price * quantity);
      }
    }
  }, [selectedVariant, quantity, variants, currentView]);

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentView("items");
    setSearchText("");
  };

  // Handle item selection
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setCurrentView("variants");
  };

  // Handle back navigation
  const handleHeaderBack = () => {
    if (currentView === "variants") {
      setCurrentView("items");
      setSelectedItem(null);
      setSelectedVariant("");
      setQuantity(1);
      setTotalPrice(0);
    } else if (currentView === "items") {
      setCurrentView("categories");
      setSelectedCategory(null);
    } else if (currentView === "categories") {
      // If in categories view and back is pressed, go to previous page
      navigate(-1);
    }
  }; // Handle add to cart// Handle add to cart
  // Handle add to cart
  const handleAddToCart = () => {
    if (!selectedVariant) return;

    const variant = variants.find((v) => v.id === selectedVariant);
    if (variant && selectedItem) {
      // Use exact values without rounding
      const actualUnitPrice = totalPrice / quantity;

      const cartItem = {
        id: `${selectedItem.id}-${variant.id}`,
        name: selectedItem.name,
        variant_name: variant.variant_name,
        categoryName: selectedItem.categoryName,
        price: actualUnitPrice, // No rounding
        original_price: variant.price, // No rounding
        cost: variant.cost,
        qty: quantity,
        item_id: selectedItem.id,
        variant_id: variant.id,
        has_discount: actualUnitPrice < variant.price,
      };

      console.log("Adding to cart:", cartItem);
      console.log("Original Unit Price:", variant.price);
      console.log("Actual Unit Price:", actualUnitPrice);
      console.log("Quantity:", quantity);
      console.log("Total in Cart:", totalPrice);

      addToCart(cartItem);

      // Reset and go back to categories
      setCurrentView("categories");
      setSelectedCategory(null);
      setSelectedItem(null);
      setSelectedVariant("");
      setQuantity(1);
      setTotalPrice(0);
    }
  };
  // Filter categories based on search
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Filter items based on selected category and search
  const itemsInCategory = selectedCategory
    ? items.filter((item) => item.category_id === selectedCategory.id)
    : [];

  const filteredItems = itemsInCategory.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const itemsPerPage = 15;
  const [page, setPage] = useState(1);

  // Pagination for current view
  const getDisplayData = () => {
    if (currentView === "categories") {
      return filteredCategories;
    } else if (currentView === "items") {
      return filteredItems;
    }
    return [];
  };

  const displayData = getDisplayData();
  const pageCount = Math.ceil(displayData.length / itemsPerPage);
  const displayedData = displayData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const selectedVariantData = variants.find((v) => v.id === selectedVariant);

  // Get header title based on current view
  const getHeaderTitle = () => {
    if (currentView === "items") return selectedCategory?.name || "Items";
    if (currentView === "variants")
      return selectedItem?.name || "Select Variant";
    return "Categories";
  };

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
          showSearch={currentView !== "variants"}
          onCategoryChange={() => {}}
          onSearch={(text) => {
            setSearchText(text);
            setPage(1);
          }}
          hasBack={currentView !== "categories"}
          onBack={handleHeaderBack}
        />

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          {currentView === "categories" && (
            <>
              {/* Categories Grid */}
              <Box
                sx={{
                  flexGrow: 1,
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gridTemplateRows: "repeat(3, 1fr)",
                  gap: 2,
                  p: 2,
                }}
              >
                {displayedData.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onSelect={handleCategorySelect}
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
                    color="success"
                  />
                </Box>
              )}
            </>
          )}

          {currentView === "items" && (
            <>
              {/* Items Grid */}
              <Box
                sx={{
                  flexGrow: 1,
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gridTemplateRows: "repeat(3, 1fr)",
                  gap: 2,
                  p: 2,
                }}
              >
                {displayedData.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onSelect={handleItemSelect}
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
                    color="success"
                  />
                </Box>
              )}
            </>
          )}

          {currentView === "variants" && selectedItem && (
            /* Variant Selection View */
            <Box
              sx={{
                flexGrow: 1,
                p: 3,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Item Header */}
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <Typography
                  variant="h4"
                  gutterBottom
                  fontWeight="bold"
                  color="success.main"
                >
                  {selectedItem.name}
                </Typography>
                <Typography variant="h6" color="text.success">
                  Select a variant
                </Typography>
              </Box>

              {/* Variants Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 2,
                  mb: 3,
                  p: 2,
                }}
              >
                {variants.map((variant) => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    isSelected={selectedVariant === variant.id}
                    onSelect={() => setSelectedVariant(variant.id)}
                  />
                ))}
              </Box>

              {/* Input Section */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  width: 300,
                  mx: "auto",
                  opacity: selectedVariant ? 1 : 0.6,
                }}
              >
                {/* Quantity Input */}
                <TextField
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, newQuantity));
                    // Update total price based on variant price and new quantity
                    if (selectedVariantData) {
                      const calculatedTotal =
                        selectedVariantData.price * newQuantity;
                      setTotalPrice(calculatedTotal); // No rounding
                    }
                  }}
                  inputProps={{
                    min: 1,
                    step: 1, // Whole numbers only
                  }}
                  fullWidth
                  disabled={!selectedVariant}
                />
                {/* Price Display */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6">Unit Price:</Typography>
                  <Typography variant="h6" color="success" fontWeight="bold">
                    ₱
                    {selectedVariantData
                      ? selectedVariantData.price.toFixed(2)
                      : "0.00"}
                  </Typography>
                </Box>

                {/* Total Price (Editable) */}
                <TextField
                  label="Total Price"
                  type="number"
                  value={totalPrice}
                  onChange={(e) => {
                    const newTotal = parseFloat(e.target.value) || 0;
                    setTotalPrice(newTotal);
                    // DON'T change quantity when total price is edited manually
                    // This allows for custom pricing without affecting quantity
                  }}
                  inputProps={{
                    min: 0,
                    step: "0.01", // Allow 0.01 increments
                  }}
                  fullWidth
                  disabled={!selectedVariant}
                />

                {/* Add to Cart Button */}
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant}
                  sx={{
                    mt: 2,
                    py: 2,
                    fontSize: "1.2rem",
                    fontWeight: "semibold",
                    backgroundColor: selectedVariant
                      ? "success.main"
                      : "#cccccc",
                    color: "white",
                    "&:hover": selectedVariant
                      ? {
                          backgroundColor: "success.main",
                          transform: "scale(1.02)",
                        }
                      : {},
                    transition: "all 0.2s ease-in-out",
                    boxShadow: selectedVariant
                      ? "0 4px 12px rgba(93, 51, 110, 0.3)"
                      : "none",
                    width: "100%",
                  }}
                >
                  {selectedVariant ? `Add to Cart ` : "Select a variant first"}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Ticket Drawer - Always visible */}
      <Box sx={{ width: 400, flexShrink: 0 }}>
        <TicketDrawer goTo={goTo} hasSettings={true} anchor="right" />
      </Box>
    </Box>
  );
}
