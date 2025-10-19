import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import Header from "../components/Header";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import axios from "axios";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import FilterListIcon from "@mui/icons-material/FilterList";
import PrintIcon from "@mui/icons-material/Print";
import LockIcon from "@mui/icons-material/Lock";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import WarningIcon from "@mui/icons-material/Warning";
import CircularProgress from "@mui/material/CircularProgress";

// ---------- Theme ----------
const purpleTheme = createTheme({
  palette: {
    primary: { main: "#5D336E" },
    secondary: { main: "#8E44AD", light: "#D8BFD8", dark: "#5D336E" },
    background: { default: "#F8F5FA", paper: "#FFFFFF" },
  },
});

// ---------- Styled Components ----------
const StatCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(93, 51, 110, 0.1)",
  border: `1px solid ${theme.palette.secondary.light}`,
  transition: "all 0.3s ease",
  height: "100%",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 25px rgba(93, 51, 110, 0.15)",
  },
}));

const ChartContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(93, 51, 110, 0.1)",
  border: `1px solid ${theme.palette.secondary.light}`,
  background: "linear-gradient(135deg, #FFFFFF 0%, #F8F5FA 100%)",
  height: "100%",
}));

const FilterPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(93, 51, 110, 0.1)",
  border: `1px solid ${theme.palette.secondary.light}`,
  marginBottom: theme.spacing(2),
}));

const IconWrapper = styled(Box)(({ trend }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: "50%",
  backgroundColor:
    trend === "up"
      ? "rgba(76, 175, 80, 0.1)"
      : trend === "down"
      ? "rgba(244, 67, 54, 0.1)"
      : "rgba(158, 158, 158, 0.1)",
  color: trend === "up" ? "#4CAF50" : trend === "down" ? "#F44336" : "#9E9E9E",
  marginRight: 8,
}));

// ---------- Component ----------
export default function BackOffice() {
  console.log("🚀 BackOffice component mounted");

  const { isAuthorized } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    period: "today",
    startDate: "",
    endDate: "",
  });

  // PIN Change states
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");

  // Reset Data states
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetConfirmation, setResetConfirmation] = useState("");

  // Redirect if not authorized
  useEffect(() => {
    if (!isAuthorized) {
      console.log("🔐 No authorization, redirecting to home");
      navigate("/");
    }
  }, [isAuthorized, navigate]);

  // Fetch dashboard data only when authorized
  useEffect(() => {
    if (isAuthorized) {
      fetchDashboardData(filters);
    }
  }, [isAuthorized, filters]);

  // Fetch dashboard data with current filters
  const fetchDashboardData = async (currentFilters) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (currentFilters.period) params.append("period", currentFilters.period);
      if (currentFilters.startDate)
        params.append("startDate", currentFilters.startDate);
      if (currentFilters.endDate)
        params.append("endDate", currentFilters.endDate);

      const url = `http://localhost:5000/api/backoffice/dashboard?${params}`;
      console.log("🔄 Fetching from:", url);

      const response = await axios.get(url);
      console.log("✅ Backoffice data received:", response.data);
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error("❌ Failed to fetch dashboard data:", err);
      if (err.code === "ERR_NETWORK") {
        setError(
          "Backend server is not running. Please start your backend server on port 5000."
        );
      } else {
        setError(`Failed to load dashboard data: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (isAuthorized) {
      fetchDashboardData(newFilters);
    }
  };

  // PIN Change handlers
  const handleOpenPinDialog = () => {
    setShowPinDialog(true);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setPinError("");
    setPinSuccess("");
  };

  const handleClosePinDialog = () => {
    setShowPinDialog(false);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setPinError("");
    setPinSuccess("");
  };

  const handleChangePin = async (e) => {
    e.preventDefault();

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setPinError("New PIN must be exactly 4 digits");
      return;
    }

    if (newPin !== confirmPin) {
      setPinError("New PIN and confirmation do not match");
      return;
    }

    try {
      const response = await axios.put(
        "http://localhost:5000/api/backoffice/pin",
        {
          currentPin,
          newPin,
        }
      );

      if (response.data.success) {
        setPinSuccess("PIN changed successfully!");
        setPinError("");
        setTimeout(() => {
          handleClosePinDialog();
        }, 2000);
      }
    } catch (err) {
      setPinError(err.response?.data?.error || "Failed to change PIN");
      setPinSuccess("");
    }
  };

  // Reset Data handlers
  const handleOpenResetDialog = () => {
    setShowResetDialog(true);
    setResetError("");
    setResetSuccess("");
    setResetConfirmation("");
  };

  const handleCloseResetDialog = () => {
    setShowResetDialog(false);
    setResetError("");
    setResetSuccess("");
    setResetConfirmation("");
  };

  const handleResetAllData = async () => {
    setResetLoading(true);
    setResetError("");
    setResetSuccess("");

    try {
      const response = await axios.delete(
        "http://localhost:5000/api/backoffice/reset-all"
      );

      if (response.data.success) {
        setResetSuccess("All data has been reset successfully!");
        setResetError("");

        // Refresh dashboard data after reset
        setTimeout(() => {
          fetchDashboardData(filters);
          setShowResetDialog(false);
          setResetConfirmation("");
        }, 2000);
      }
    } catch (err) {
      setResetError(err.response?.data?.error || "Failed to reset data");
      setResetSuccess("");
    } finally {
      setResetLoading(false);
    }
  };

  const handlePrint = () => window.print();

  // Format currency
  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format percentage with proper sign
  const formatPercentage = (value) => {
    const numValue = parseFloat(value || 0);
    return `${numValue >= 0 ? "+" : ""}${numValue.toFixed(1)}%`;
  };

  // Calculate stats for display
  const getStats = () => {
    if (!dashboardData) return [];

    const { summary, trends } = dashboardData;

    return [
      {
        label: "Total Revenue",
        value: formatCurrency(summary.total_revenue),
        trend:
          trends.revenue_trend > 0
            ? "up"
            : trends.revenue_trend < 0
            ? "down"
            : "neutral",
        change: formatPercentage(trends.revenue_trend),
        icon: <AttachMoneyIcon />,
        description: `from previous period`,
      },
      {
        label: "Total Cost",
        value: formatCurrency(summary.total_cost),
        trend: "neutral",
        change: `Cost of Sales`,
        icon: <InventoryIcon />,
        description: ``,
      },
      {
        label: "Net Profit",
        value: formatCurrency(summary.total_profit),
        trend:
          trends.profit_trend > 0
            ? "up"
            : trends.profit_trend < 0
            ? "down"
            : "neutral",
        change: formatPercentage(trends.profit_trend),
        icon: <TrendingUpIcon />,
        description: `Margin: ${(summary.profit_margin || 0).toFixed(1)}%`,
      },
      {
        label: "Transactions",
        value: summary.total_transactions?.toString() || "0",
        trend:
          trends.transaction_trend > 0
            ? "up"
            : trends.transaction_trend < 0
            ? "down"
            : "neutral",
        change: formatPercentage(trends.transaction_trend),
        icon: <PointOfSaleIcon />,
        description: `Avg: ${formatCurrency(summary.avg_transaction_value)}`,
      },
      {
        label: "Business Days",
        value: summary.business_days?.toString() || "0",
        trend: "neutral",
        change: `Active days`,
        icon: <PeopleIcon />,
        description: `in selected period`,
      },
    ];
  };

  // Don't render anything if not authorized (ProtectedRoute handles redirect)
  if (!isAuthorized) {
    return null;
  }

  // Show loading while fetching data
  if (loading && !dashboardData) {
    return (
      <ThemeProvider theme={purpleTheme}>
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
          <Header title="Back Office Analytics" showNav={true} />
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography>Loading dashboard data...</Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={purpleTheme}>
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
          <Header title="Back Office Analytics" showNav={true} />
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="error">{error}</Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  if (!dashboardData) {
    return (
      <ThemeProvider theme={purpleTheme}>
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
          <Header title="Back Office Analytics" showNav={true} />
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography>No data available</Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  const { charts, top_items } = dashboardData;

  return (
    <ThemeProvider theme={purpleTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          overflowY: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F8F5FA",
        }}
      >
        <Header title="Back Office Analytics" showNav={true} />

        {/* Filter Panel */}
        <FilterPanel className="no-print">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterListIcon color="secondary" />
              <Typography variant="h6">Filters</Typography>
            </Box>

            {/* Time Period Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={filters.period}
                label="Time Period"
                onChange={(e) => handleFilterChange("period", e.target.value)}
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="yesterday">Yesterday</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
                <MenuItem value="quarter">Last 90 Days</MenuItem>
                <MenuItem value="year">Last 12 Months</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>

            {/* Custom Date Range */}
            <TextField
              label="Start Date"
              type="date"
              size="small"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 150 }}
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 150 }}
            />

            {/* Action Buttons - Moved to the right */}
            <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={handleOpenPinDialog}
              >
                Change PIN
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForeverIcon />}
                onClick={handleOpenResetDialog}
              >
                Reset All Data
              </Button>
            </Box>
          </Box>
        </FilterPanel>

        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2 }}>
          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }} className="no-print">
            {getStats().map((stat, idx) => (
              <Grid item xs={12} sm={6} md={2.4} key={idx}>
                <StatCard>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <IconWrapper trend={stat.trend}>{stat.icon}</IconWrapper>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          stat.trend === "up"
                            ? "#4CAF50"
                            : stat.trend === "down"
                            ? "#F44336"
                            : "text.secondary",
                        fontWeight: 600,
                      }}
                    >
                      {stat.change}
                    </Typography>
                    {stat.description && (
                      <Typography variant="caption" color="text.secondary">
                        {stat.description}
                      </Typography>
                    )}
                  </CardContent>
                </StatCard>
              </Grid>
            ))}
          </Grid>

          {/* Charts Grid */}
          <Grid container spacing={3} className="no-print">
            {/* Revenue Trend Chart */}
            <Grid item xs={12} lg={8}>
              <ChartContainer>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Revenue & Profit Trend
                </Typography>
                {charts.daily_breakdown.length > 0 ? (
                  <LineChart
                    xAxis={[
                      {
                        data: charts.daily_breakdown.map((item) => item.date),
                        scaleType: "point",
                        label: "Date",
                      },
                    ]}
                    series={[
                      {
                        data: charts.daily_breakdown.map(
                          (item) => item.revenue
                        ),
                        label: "Revenue",
                        color: "#8E44AD",
                        curve: "monotoneX",
                        showMark: true,
                      },
                      {
                        data: charts.daily_breakdown.map((item) => item.profit),
                        label: "Profit",
                        color: "#5D336E",
                        curve: "monotoneX",
                        showMark: true,
                      },
                    ]}
                    height={400}
                    grid={{ vertical: true, horizontal: true }}
                    margin={{ left: 60, right: 30, top: 30, bottom: 70 }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 400,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography color="text.secondary">
                      No data available for the selected period
                    </Typography>
                  </Box>
                )}
              </ChartContainer>
            </Grid>

            {/* Top Selling Items */}
            <Grid item xs={12} lg={6}>
              <ChartContainer>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Top Selling Items
                </Typography>
                {top_items.length > 0 ? (
                  <BarChart
                    xAxis={[
                      {
                        data: top_items.map((item) => item.name),
                        scaleType: "band",
                        label: "Items",
                      },
                    ]}
                    series={[
                      {
                        data: top_items.map((item) => item.revenue),
                        label: "Revenue",
                        color: "#8E44AD",
                      },
                      {
                        data: top_items.map((item) => item.profit),
                        label: "Profit",
                        color: "#5D336E",
                      },
                    ]}
                    height={400}
                    grid={{ vertical: true, horizontal: true }}
                    margin={{ left: 60, right: 30, top: 30, bottom: 100 }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 400,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography color="text.secondary">
                      No items sold in selected period
                    </Typography>
                  </Box>
                )}
              </ChartContainer>
            </Grid>

            {/* Hourly Performance */}
            <Grid item xs={12} lg={6}>
              <ChartContainer>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Hourly Performance
                </Typography>
                {charts.hourly_breakdown.length > 0 ? (
                  <BarChart
                    xAxis={[
                      {
                        data: charts.hourly_breakdown.map((item) => item.hour),
                        scaleType: "band",
                        label: "Hour of Day",
                      },
                    ]}
                    series={[
                      {
                        data: charts.hourly_breakdown.map(
                          (item) => item.revenue
                        ),
                        label: "Revenue",
                        color: "#8E44AD",
                      },
                    ]}
                    height={400}
                    grid={{ vertical: true, horizontal: true }}
                    margin={{ left: 60, right: 30, top: 30, bottom: 70 }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 400,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography color="text.secondary">
                      No hourly data available
                    </Typography>
                  </Box>
                )}
              </ChartContainer>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ textAlign: "center", mt: 4, mb: 2 }} className="no-print">
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ px: 4, py: 1.5, mr: 2 }}
            >
              Generate Report
            </Button>
          </Box>
        </Box>

        {/* Change PIN Dialog */}
        <Dialog
          open={showPinDialog}
          onClose={handleClosePinDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LockIcon color="secondary" />
              <Typography variant="h6">Change Admin PIN</Typography>
            </Box>
          </DialogTitle>
          <form onSubmit={handleChangePin}>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Change the PIN required to access the Back Office
              </Typography>

              <TextField
                fullWidth
                type="password"
                label="Current PIN"
                value={currentPin}
                onChange={(e) =>
                  setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                inputProps={{ maxLength: 4 }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                type="password"
                label="New PIN (4 digits)"
                value={newPin}
                onChange={(e) =>
                  setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                inputProps={{ maxLength: 4 }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                type="password"
                label="Confirm New PIN"
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                inputProps={{ maxLength: 4 }}
                sx={{ mb: 2 }}
              />

              {pinError && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {pinError}
                </Typography>
              )}

              {pinSuccess && (
                <Typography color="success.main" sx={{ mt: 1 }}>
                  {pinSuccess}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePinDialog}>Cancel</Button>
              <Button type="submit" variant="contained" color="secondary">
                Change PIN
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Reset All Data Dialog */}
        <Dialog
          open={showResetDialog}
          onClose={resetLoading ? undefined : handleCloseResetDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <WarningIcon color="error" />
              <Typography variant="h6" color="error">
                Reset All Data
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: "bold" }}>
              ⚠️ This action cannot be undone!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This will permanently delete:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" color="text.secondary">
                • All transactions and sales records
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • All items and categories
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • All inventory data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • All analytics and reports
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 2, fontStyle: "italic" }}>
              This action is irreversible. Please type "RESET" to confirm.
            </Typography>

            <TextField
              fullWidth
              label='Type "RESET" to confirm'
              value={resetConfirmation}
              onChange={(e) => setResetConfirmation(e.target.value)}
              sx={{ mt: 2 }}
              disabled={resetLoading}
            />

            {resetError && (
              <Typography color="error" sx={{ mt: 2 }}>
                {resetError}
              </Typography>
            )}

            {resetSuccess && (
              <Typography color="success.main" sx={{ mt: 2 }}>
                {resetSuccess}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseResetDialog} disabled={resetLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleResetAllData}
              variant="contained"
              color="error"
              disabled={resetLoading || resetConfirmation !== "RESET"}
              startIcon={
                resetLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <DeleteForeverIcon />
                )
              }
            >
              {resetLoading ? "Resetting..." : "Reset All Data"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
