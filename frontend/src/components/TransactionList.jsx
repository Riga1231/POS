import React, { memo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";
import Chip from "@mui/material/Chip";

const TransactionList = memo(function TransactionList({
  transactions,
  loading,
  error,
  onTransactionClick,
}) {
  const theme = useTheme();

  // Format date like "May 13, 2025 7:14 AM"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get chip color based on payment method
  const getPaymentMethodColor = (method) => {
    switch (method?.toLowerCase()) {
      case "cash":
        return "success";
      case "gcash":
        return "primary";
      case "card":
        return "secondary";
      case "bank_transfer":
        return "info";
      default:
        return "default";
    }
  };

  // Format payment method for display
  const formatPaymentMethod = (method) => {
    if (!method) return "Unknown";

    switch (method.toLowerCase()) {
      case "cash":
        return "Cash";
      case "gcash":
        return "GCash";
      case "card":
        return "Credit Card";
      case "bank_transfer":
        return "Bank Transfer";
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>Loading transactions...</Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: "center", color: "error.main" }}>{error}</Box>
    );
  }

  if (transactions.length === 0) {
    return <Box sx={{ p: 2, textAlign: "center" }}>No transactions found</Box>;
  }

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 2 }}>
      <List sx={{ p: 0 }}>
        {transactions.map((transaction, index) => (
          <React.Fragment key={transaction.id}>
            <ListItem
              onClick={() => onTransactionClick(transaction.id)}
              sx={{
                p: 2,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <Paper sx={{ width: "100%", p: 2 }} elevation={1}>
                {/* Transaction Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="h6" component="div">
                        Transaction #{transaction.id}
                      </Typography>
                      <Chip
                        label={formatPaymentMethod(transaction.payment_method)}
                        color={getPaymentMethodColor(
                          transaction.payment_method
                        )}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(transaction.transaction_date)}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      ₱{transaction.total_amount?.toFixed(2) || "0.00"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {transaction.items_count || 0} items
                    </Typography>
                  </Box>
                </Box>

                {/* Transaction Summary */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 2 }}>
                    {transaction.total_cost > 0 && (
                      <>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Cost
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            ₱{transaction.total_cost?.toFixed(2) || "0.00"}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Profit
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{
                              color:
                                transaction.total_profit >= 0
                                  ? "success.main"
                                  : "error.main",
                            }}
                          >
                            ₱{transaction.total_profit?.toFixed(2) || "0.00"}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Click for details →
                  </Typography>
                </Box>
              </Paper>
            </ListItem>
            {index < transactions.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
});

export default TransactionList;
