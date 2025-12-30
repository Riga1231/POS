import Box from "@mui/material/Box";
import TicketDrawer from "../components/TicketDrawer";
import Header from "../components/Header";
import Pagination from "@mui/material/Pagination";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Use ref to track sync state without re-renders
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  const { addToCart } = useCart();

  // Views: 'categories', 'items', 'variants'
  const [currentView, setCurrentView] = useState("categories");

  // Reusable fetch data function
  const fetchData = useCallback(async () => {
    try {
      console.log("📥 Fetching fresh data...");

      // Fetch categories with cache busting
      const categoriesRes = await axios.get(
        "http://localhost:5000/api/categories",
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          params: {
            _t: new Date().getTime(), // Cache buster
          },
        }
      );
      const categoriesData = categoriesRes.data;

      // Fetch items with cache busting
      const itemsRes = await axios.get("http://localhost:5000/api/items", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        params: {
          _t: new Date().getTime(), // Cache buster
        },
      });

      // Map category_id to category data for each item
      const itemsWithCategoryData = itemsRes.data.map((item) => {
        const categoryObj = categoriesData.find(
          (cat) => cat.id === item.category_id
        );
        return {
          ...item,
          categoryName: categoryObj ? categoryObj.name : "Unknown",
          categoryColor: categoryObj ? categoryObj.color : "#7A4B8C",
        };
      });

      // IMPORTANT: Force state update by creating new array
      setItems([...itemsWithCategoryData]);
      setCategories([...categoriesData]);

      // Debug: Check specific item stock
      const targetItem = itemsWithCategoryData.find(
        (item) => item.id === "PRD-00001"
      );
      if (targetItem) {
        console.log("🔍 Frontend Stock Check - PRD-00001:", {
          frontendStock: targetItem.stock_quantity,
          itemId: targetItem.id,
          name: targetItem.name,
        });
      }

      console.log("✅ Data refreshed at:", new Date().toLocaleTimeString());
      console.log("📊 Total items loaded:", itemsWithCategoryData.length);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }, []);

  // Smart sync function - only syncs when needed
  const smartSync = useCallback(async () => {
    // Use ref to prevent race conditions
    if (isSyncingRef.current) {
      console.log("⏳ Sync already in progress, skipping...");
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      console.log("🔄 Checking if sync is needed...");

      // First check if sync is needed - with better error handling
      let statusResponse;
      let secondsSinceLastSync = Infinity; // Default to "needs sync"

      try {
        statusResponse = await axios.get(
          "http://localhost:5000/api/sync/status",
          {
            timeout: 10000,
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }
        );

        const lastSync = new Date(statusResponse.data.lastSync);
        const now = new Date();
        secondsSinceLastSync = (now - lastSync) / 1000;

        console.log("📊 Sync Status Response:", {
          lastSync: statusResponse.data.lastSync,
          secondsSinceLastSync: secondsSinceLastSync.toFixed(0),
          itemsCount: statusResponse.data.items,
          serverTime: now.toISOString(),
        });
      } catch (statusError) {
        console.error("❌ Failed to get sync status:", statusError);
        // If we can't get status, assume we need to sync
        secondsSinceLastSync = Infinity;
      }

      // Only sync if last sync was more than 60 seconds ago OR if status check failed
      const shouldSync = secondsSinceLastSync > 60;

      if (shouldSync) {
        console.log("🔄 Auto-syncing stocks...");
        try {
          const syncResponse = await axios.post(
            "http://localhost:5000/api/sync/products",
            {},
            {
              timeout: 30000,
              headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
            }
          );

          console.log("✅ Sync completed:", syncResponse.data);
          setLastSyncTime(new Date().toLocaleTimeString());

          // Wait a moment then refresh data to ensure we get updated stocks
          setTimeout(async () => {
            await fetchData();
          }, 1000);
        } catch (syncError) {
          console.error("❌ Sync POST failed:", syncError);
          if (syncError.code === "ECONNABORTED") {
            console.log("⏰ Sync timeout, continuing with current data");
          }
          // Still refresh data even if sync fails
          await fetchData();
        }
      } else {
        console.log("✅ Data is recent, no sync needed");
        // Force refresh data anyway to ensure we have latest stocks
        // This is important because the status might be cached
        await fetchData();
      }
    } catch (error) {
      console.error("❌ Sync process failed:", error);
      // Try to refresh data even if everything fails
      try {
        await fetchData();
      } catch (fetchError) {
        console.error("❌ Data refresh also failed:", fetchError);
      }
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  }, [fetchData, items.length]);

  // Force sync function that bypasses all checks
  const handleForceSync = async () => {
    if (isSyncingRef.current) {
      console.log("⏳ Sync already in progress...");
      return;
    }

    console.log("🔄 FORCE SYNC triggered...");
    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const syncResponse = await axios.post(
        "http://localhost:5000/api/sync/products",
        {},
        {
          timeout: 30000,
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      console.log("✅ Force sync completed:", syncResponse.data);
      setLastSyncTime(new Date().toLocaleTimeString());

      // Wait 2 seconds then refresh data
      setTimeout(async () => {
        await fetchData();
        console.log("✅ Data refreshed after force sync");
      }, 2000);
    } catch (syncError) {
      console.error("❌ Force sync failed:", syncError);
      await fetchData();
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  };

  // Fetch categories and items from API + Smart auto-sync
  useEffect(() => {
    let intervalId;

    const initializeData = async () => {
      // First, fetch the current data
      await fetchData();

      // Then do initial sync check after a delay
      syncTimeoutRef.current = setTimeout(() => {
        smartSync();
      }, 5000); // Wait 5 seconds before first sync
    };

    initializeData();

    // Set up interval to check and sync every 60 seconds (increased from 30)
    intervalId = setInterval(smartSync, 60000);

    // Cleanup function to clear interval when component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [smartSync, fetchData]);

  // Fetch variants when item is selected
  useEffect(() => {
    if (selectedItem && selectedItem.id) {
      const fetchVariants = async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/items/${selectedItem.id}/variants`,
            {
              headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
            }
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
  };

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
        price: actualUnitPrice,
        original_price: variant.price,
        cost: variant.cost,
        qty: quantity,
        item_id: selectedItem.id,
        variant_id: variant.id,
        has_discount: actualUnitPrice < variant.price,
        max_stock: variant.quantity,
      };

      console.log("➕ ADDING TO CART:", {
        name: cartItem.name,
        variant_id: cartItem.variant_id,
        item_id: cartItem.item_id,
        quantity: cartItem.qty,
        current_stock: variant.quantity,
      });

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

  // Manual sync function with cooldown
  const handleManualSync = async () => {
    if (isSyncingRef.current) {
      console.log("⏳ Sync already in progress...");
      return;
    }

    console.log("🔄 Manual sync triggered...");
    await smartSync();
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
          onSync={handleManualSync}
          isSyncing={isSyncing}
          syncStatus={
            lastSyncTime ? `Last sync: ${lastSyncTime}` : "Syncing..."
          }
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
                {/* Show last sync time and sync status */}
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {lastSyncTime
                      ? `Stocks updated: ${lastSyncTime}`
                      : "Checking stock..."}
                  </Typography>
                  {isSyncing && (
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ ml: 1 }}
                    >
                      🔄 Syncing...
                    </Typography>
                  )}
                </Box>
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
                    const maxQuantity = selectedVariantData
                      ? selectedVariantData.quantity
                      : 1;

                    // Limit quantity to available stock
                    const limitedQuantity = Math.min(
                      Math.max(1, newQuantity),
                      maxQuantity
                    );
                    setQuantity(limitedQuantity);

                    // Update total price based on variant price and new quantity
                    if (selectedVariantData) {
                      const calculatedTotal =
                        selectedVariantData.price * limitedQuantity;
                      setTotalPrice(calculatedTotal);
                    }
                  }}
                  inputProps={{
                    min: 1,
                    max: selectedVariantData ? selectedVariantData.quantity : 1,
                    step: 1,
                  }}
                  fullWidth
                  disabled={!selectedVariant}
                  error={quantity > (selectedVariantData?.quantity || 0)}
                  helperText={
                    selectedVariantData &&
                    quantity > selectedVariantData.quantity
                      ? `Only ${selectedVariantData.quantity} available in stock`
                      : selectedVariantData
                      ? `${selectedVariantData.quantity} available in stock`
                      : "Select a variant first"
                  }
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
                    if (selectedVariantData) {
                      const maxTotal =
                        selectedVariantData.price *
                        selectedVariantData.quantity;
                      const limitedTotal = Math.min(newTotal, maxTotal);
                      setTotalPrice(limitedTotal);
                    } else {
                      setTotalPrice(newTotal);
                    }
                  }}
                  inputProps={{
                    min: 0,
                    max: selectedVariantData
                      ? selectedVariantData.price * selectedVariantData.quantity
                      : 0,
                    step: "0.01",
                  }}
                  fullWidth
                  disabled={!selectedVariant}
                  helperText={
                    selectedVariantData &&
                    `Max total: ₱${(
                      selectedVariantData.price * selectedVariantData.quantity
                    ).toFixed(2)}`
                  }
                />

                {/* Add to Cart Button */}
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAddToCart}
                  disabled={
                    !selectedVariant ||
                    quantity > (selectedVariantData?.quantity || 0)
                  }
                  sx={{
                    mt: 2,
                    py: 2,
                    fontSize: "1.2rem",
                    fontWeight: "semibold",
                    backgroundColor:
                      selectedVariant &&
                      quantity <= (selectedVariantData?.quantity || 0)
                        ? "success.main"
                        : "#cccccc",
                    color: "white",
                    "&:hover":
                      selectedVariant &&
                      quantity <= (selectedVariantData?.quantity || 0)
                        ? {
                            backgroundColor: "success.main",
                            transform: "scale(1.02)",
                          }
                        : {},
                    transition: "all 0.2s ease-in-out",
                    boxShadow:
                      selectedVariant &&
                      quantity <= (selectedVariantData?.quantity || 0)
                        ? "0 4px 12px rgba(93, 51, 110, 0.3)"
                        : "none",
                    width: "100%",
                  }}
                >
                  {!selectedVariant
                    ? "Select a variant first"
                    : quantity > (selectedVariantData?.quantity || 0)
                    ? "Not enough stock"
                    : `Add to Cart`}
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
