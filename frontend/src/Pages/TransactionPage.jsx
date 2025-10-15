import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography"; // Add this import
import Header from "../components/Header";
import TransactionList from "../components/TransactionList";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Paper from "@mui/material/Paper";

export default function TransactionPage() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Filter states
  const [dateFilter, setDateFilter] = useState("all"); // all, today, yesterday, week, month, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:5000/api/transactions"
        );
        setTransactions(response.data);
        setFilteredTransactions(response.data);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Apply date filter whenever filter criteria change
  useEffect(() => {
    if (transactions.length === 0) return;

    let filtered = [...transactions];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    switch (dateFilter) {
      case "today":
        filtered = transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.transaction_date);
          return transactionDate >= today;
        });
        break;

      case "yesterday":
        filtered = transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.transaction_date);
          return transactionDate >= yesterday && transactionDate < today;
        });
        break;

      case "week":
        filtered = transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.transaction_date);
          return transactionDate >= weekAgo;
        });
        break;

      case "month":
        filtered = transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.transaction_date);
          return transactionDate >= monthAgo;
        });
        break;

      case "custom":
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999); // End of the day

          filtered = transactions.filter((transaction) => {
            const transactionDate = new Date(transaction.transaction_date);
            return transactionDate >= start && transactionDate <= end;
          });
        }
        break;

      case "all":
      default:
        filtered = transactions;
        break;
    }

    setFilteredTransactions(filtered);
  }, [dateFilter, customStartDate, customEndDate, transactions]);

  // Handle transaction click - navigate to detail page
  const handleTransactionClick = (transactionId) => {
    navigate(`/transactions/${transactionId}`);
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header with nav for main transactions page */}
      <Header
        title="Transactions"
        showNav={true}
        showSearch={false}
        showCategories={false}
      />

      {/* Filter Section */}
      <Paper sx={{ p: 2, m: 2, mb: 1 }} elevation={1}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {/* Date Filter Dropdown */}
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="date-filter-label">Time Period</InputLabel>
            <Select
              labelId="date-filter-label"
              value={dateFilter}
              label="Time Period"
              onChange={(e) => setDateFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>

          {/* Custom Date Range - Only show when custom is selected */}
          {dateFilter === "custom" && (
            <>
              <TextField
                label="Start Date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <TextField
                label="End Date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </>
          )}

          {/* Results Count */}
          <Box sx={{ ml: "auto" }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredTransactions.length} of {transactions.length}{" "}
              transactions
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <TransactionList
          transactions={filteredTransactions}
          loading={loading}
          error={error}
          onTransactionClick={handleTransactionClick}
        />
      </Box>
    </Box>
  );
}
