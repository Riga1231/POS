import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import HeaderItem from "../components/HeaderItem";
import TransactionDetail from "../components/TransactionDetail";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function TransactionDetailPage() {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch transaction details
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/transactions/${id}`
        );
        setTransaction(response.data);
      } catch (err) {
        console.error("Failed to fetch transaction details:", err);
        setError("Failed to load transaction details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTransaction();
    }
  }, [id]);

  // Handle back to transactions list
  const handleBack = () => {
    navigate("/transactions");
  };

  if (loading) {
    return (
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <HeaderItem title="Loading..." onBack={handleBack} />
        <Box sx={{ p: 2, textAlign: "center" }}>
          Loading transaction details...
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <HeaderItem title="Error" onBack={handleBack} />
        <Box sx={{ p: 2, textAlign: "center", color: "error.main" }}>
          {error}
        </Box>
      </Box>
    );
  }

  if (!transaction) {
    return (
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <HeaderItem title="Not Found" onBack={handleBack} />
        <Box sx={{ p: 2, textAlign: "center" }}>Transaction not found</Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <HeaderItem
        title={`Transaction #${transaction.id}`}
        onBack={handleBack}
      />

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <TransactionDetail transaction={transaction} />
      </Box>
    </Box>
  );
}
