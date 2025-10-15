import React, { memo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";

const TransactionDetail = memo(function TransactionDetail({ transaction }) {
  const theme = useTheme();

  // Format date like "May 13, 2025 7:14 AM"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 2 }}>
      <Paper sx={{ p: 3 }} elevation={1}>
        {/* Transaction Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Transaction #{transaction.id}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {formatDate(transaction.transaction_date)}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Summary Cards */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Paper sx={{ p: 2, flex: 1, minWidth: 120 }} elevation={2}>
            <Typography variant="caption" color="text.secondary">
              Total Amount
            </Typography>
            <Typography variant="h5" color="primary" fontWeight="bold">
              ₱{transaction.total_amount?.toFixed(2) || "0.00"}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, flex: 1, minWidth: 120 }} elevation={2}>
            <Typography variant="caption" color="text.secondary">
              Total Cost
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              ₱{transaction.total_cost?.toFixed(2) || "0.00"}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, flex: 1, minWidth: 120 }} elevation={2}>
            <Typography variant="caption" color="text.secondary">
              Total Profit
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                color:
                  transaction.total_profit >= 0 ? "success.main" : "error.main",
              }}
            >
              ₱{transaction.total_profit?.toFixed(2) || "0.00"}
            </Typography>
          </Paper>

          {transaction.total_cost > 0 && (
            <Paper sx={{ p: 2, flex: 1, minWidth: 120 }} elevation={2}>
              <Typography variant="caption" color="text.secondary">
                Profit Margin
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {(
                  (transaction.total_profit / transaction.total_amount) *
                  100
                ).toFixed(1)}
                %
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Items List */}
        <Typography variant="h6" gutterBottom>
          Items Purchased ({transaction.items?.length || 0})
        </Typography>

        {transaction.items && transaction.items.length > 0 ? (
          <List sx={{ p: 0 }}>
            {transaction.items.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem sx={{ p: 2, display: "block" }}>
                  <Paper sx={{ p: 2 }} elevation={1}>
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
                          {item.item_name || `Item ${item.item_id}`}
                        </Typography>
                        {/* Use stored category_name instead of item_type */}
                        <Chip
                          label={item.category_name || "Uncategorized"}
                          size="small"
                          color="secondary"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="h6" color="primary">
                          ₱{item.total_price?.toFixed(2) || "0.00"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Qty: {item.qty} × ₱{item.unit_price?.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Item Cost and Profit */}
                    <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Unit Cost
                        </Typography>
                        <Typography variant="body2">
                          ₱{item.unit_cost?.toFixed(2) || "0.00"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total Cost
                        </Typography>
                        <Typography variant="body2">
                          ₱{item.total_cost?.toFixed(2) || "0.00"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Item Profit
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{
                            color:
                              item.item_profit >= 0
                                ? "success.main"
                                : "error.main",
                          }}
                        >
                          ₱{item.item_profit?.toFixed(2) || "0.00"}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </ListItem>
                {index < transaction.items.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            No items found for this transaction.
          </Typography>
        )}
      </Paper>
    </Box>
  );
});

export default TransactionDetail;
