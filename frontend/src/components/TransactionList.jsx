import React, { memo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";

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
                    <Typography variant="h6" component="div">
                      Transaction #{transaction.id}
                    </Typography>
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
