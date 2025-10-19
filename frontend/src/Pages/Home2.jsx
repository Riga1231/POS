// Home2.jsx
import React, { useState, useMemo, useEffect } from "react"; // Added useEffect
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import TicketDrawer from "../components/TicketDrawer";
import Header from "../components/Header";
import { useTheme } from "@mui/material/styles";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import PrintIcon from "@mui/icons-material/Print";
import { useCart } from "../context/CartContext";
import axios from "axios";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

export default function Home2({ goTo }) {
  const theme = useTheme();
  const { cart, clearCart } = useCart();

  // Calculate total from cart context items
  const totalDefault = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const [page, setPage] = useState("main");
  const [totalAmount, setTotalAmount] = useState(totalDefault.toString());
  const [cashReceived, setCashReceived] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("error");

  // In Home2.jsx, update the debug log to check for category:
  const handleCreateTransaction = async () => {
    try {
      // DEBUG: Check if cart items have cost AND category
      console.log(
        "🛒 CART ITEMS DEBUG:",
        cart.map((item) => ({
          id: item.id,
          name: item.name,
          categoryName: item.categoryName, // Check if this exists
          category: item.category, // Or this
          cost: item.cost,
          price: item.price,
          qty: item.qty,
          hasCost: item.cost !== undefined,
          hasCategory: !!(item.categoryName || item.category),
        }))
      );

      const transactionData = {
        items: cart,
        total_amount: totalNum,
        payment_method: paymentMethod,
      };

      console.log("📦 SENDING TRANSACTION DATA:", transactionData);

      const response = await axios.post(
        "http://localhost:5000/api/transactions",
        transactionData
      );

      console.log("✅ TRANSACTION CREATED:", response.data);
      return true; // Success
    } catch (error) {
      console.error("❌ FAILED TO CREATE TRANSACTION:", error);
      console.error("📋 ERROR DETAILS:", error.response?.data);
      showAlert("Failed to create transaction: " + error.message, "error");
      return false; // Failure
    }
  };

  // ✅ FIX: Update totalAmount whenever totalDefault changes
  useEffect(() => {
    setTotalAmount(totalDefault.toString());
  }, [totalDefault]);

  const quickAmounts = [50, 70, 100];

  const handleQuickAmount = (amount) => setCashReceived(amount.toString());

  const showAlert = (message, severity = "error") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const handleCharge = async () => {
    // Validate if cart is empty
    if (cart.length === 0) {
      showAlert("Cart is empty. Please add items before charging.", "warning");
      return;
    }

    // Validate payment amount
    if (paymentMethod === "cash") {
      if (paid < totalNum) {
        showAlert(
          `Insufficient payment! Total: ₱${totalNum.toFixed(
            2
          )}, Received: ₱${paid.toFixed(2)}`,
          "error"
        );
        return;
      }
    }

    // For non-cash payments, validate that payment method is selected
    if (!paymentMethod) {
      showAlert("Please select a payment method.", "warning");
      return;
    }

    // Create transaction in database
    const success = await handleCreateTransaction();

    if (success) {
      // Only proceed to charge screen if transaction was created successfully
      setPage("charge");
    }
  };

  const handleNewSale = () => {
    setPage("main");
    setCashReceived("");
    setTotalAmount(totalDefault.toString());
    setPaymentMethod("cash");
    clearCart();
    goTo(0);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              margin: 0; 
              padding: 20px;
              font-size: 14px;
            }
            .receipt { 
              width: 280px; 
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 15px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .company-name { 
              font-weight: bold; 
              font-size: 18px;
              margin-bottom: 5px;
            }
            .address { 
              font-size: 12px; 
              margin-bottom: 5px;
            }
            .date { 
              font-size: 12px; 
              margin-bottom: 10px;
            }
            .items { 
              margin: 15px 0; 
            }
            .item-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 5px;
            }
            .item-name { 
              flex: 2; 
            }
            .item-qty { 
              flex: 1; 
              text-align: center;
            }
            .item-price { 
              flex: 1; 
              text-align: right;
            }
            .divider { 
              border-top: 1px dashed #000; 
              margin: 10px 0;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              font-weight: bold;
              margin: 5px 0;
            }
            .payment-info { 
              margin-top: 15px;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            .thank-you { 
              text-align: center; 
              margin-top: 20px;
              font-style: italic;
            }
            .insufficient { 
              color: red; 
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="company-name">ARK ZIAM</div>
              <div class="address">Printing Services</div>
              <div class="date">${new Date().toLocaleString()}</div>
            </div>
            
            <div class="items">
              ${cart
                .map(
                  (item) => `
                <div class="item-row">
                  <div class="item-name">${item.name}</div>
                  <div class="item-qty">${item.qty}</div>
                  <div class="item-price">₱${(item.price * item.qty).toFixed(
                    2
                  )}</div>
                </div>
              `
                )
                .join("")}
            </div>
            
            <div class="divider"></div>
            
            <div class="total-row">
              <div>Subtotal:</div>
              <div>₱${totalDefault.toFixed(2)}</div>
            </div>
            <div class="total-row">
              <div>Total:</div>
              <div>₱${totalNum.toFixed(2)}</div>
            </div>
            
            <div class="payment-info">
              <div class="total-row">
                <div>Cash:</div>
                <div>₱${paid.toFixed(2)}</div>
              </div>
              <div class="total-row">
                <div>Change:</div>
                <div>₱${change.toFixed(2)}</div>
              </div>
              <div style="margin-top: 5px; font-size: 12px;">
                Payment Method: ${paymentMethod.toUpperCase()}
              </div>
            </div>
            
            <div class="thank-you">
              Thank you for your purchase!
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // parsed numbers
  const totalNum = Number(totalAmount) || 0;
  const paid = Number(cashReceived) || 0;
  const change = paid - totalNum;

  // Check if payment is sufficient
  const isPaymentSufficient = paid >= totalNum;
  const isCartEmpty = cart.length === 0;

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Left drawer */}
      <Box sx={{ width: 400, flexShrink: 0 }}>
        <TicketDrawer goTo={goTo} hasCharge={false} hasSettings />
      </Box>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Header
          hasBack={true}
          goTo={() => {
            setPage("main");
            goTo(0);
          }}
        />

        <Box
          sx={{
            flexGrow: 1,
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
            gap: 3,
          }}
        >
          {/* Alert Snackbar */}
          <Snackbar
            open={alertOpen}
            autoHideDuration={6000}
            onClose={() => setAlertOpen(false)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={() => setAlertOpen(false)}
              severity={alertSeverity}
              sx={{ width: "100%" }}
            >
              {alertMessage}
            </Alert>
          </Snackbar>

          {page === "main" ? (
            <>
              {/* Total Amount (editable) */}
              <TextField
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                variant="standard"
                color="secondary"
                placeholder="Total amount due"
                sx={{
                  width: 450,
                  input: {
                    textAlign: "center",
                    fontSize: 48,
                    fontWeight: "bold",
                  },
                }}
              />
              <Typography
                variant="subtitle1"
                sx={{ color: theme.palette.secondary.main }}
              >
                Total amount due
              </Typography>

              {/* Cash Received */}
              <TextField
                type="number"
                value={cashReceived}
                color="secondary"
                onChange={(e) => setCashReceived(e.target.value)}
                label="Cash received"
                variant="standard"
                sx={{
                  width: 400,
                  input: { fontSize: 24, textAlign: "center" },
                }}
                error={paid > 0 && !isPaymentSufficient}
                helperText={
                  paid > 0 && !isPaymentSufficient
                    ? `Insufficient! Need ₱${(totalNum - paid).toFixed(2)} more`
                    : ""
                }
              />

              {/* Quick amount buttons */}
              <Box sx={{ display: "flex", gap: 2 }}>
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant="contained"
                    sx={{
                      bgcolor: theme.palette.secondary.main,
                      color: "white",
                      "&:hover": { bgcolor: theme.palette.secondary.dark },
                      px: 4,
                      py: 2,
                    }}
                    onClick={() => handleQuickAmount(amt)}
                  >
                    {amt}
                  </Button>
                ))}
              </Box>

              {/* Payment method */}
              <RadioGroup
                row
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <FormControlLabel
                  value="cash"
                  control={
                    <Radio sx={{ color: theme.palette.secondary.main }} />
                  }
                  label="Cash"
                />
                <FormControlLabel
                  value="gcash"
                  control={
                    <Radio sx={{ color: theme.palette.secondary.main }} />
                  }
                  label="GCash"
                />
              </RadioGroup>

              {/* Empty cart warning */}
              {isCartEmpty && (
                <Alert severity="warning" sx={{ width: 400 }}>
                  Cart is empty. Please add items before charging.
                </Alert>
              )}

              {/* Charge button */}
              <Button
                variant="contained"
                sx={{
                  bgcolor:
                    isPaymentSufficient && !isCartEmpty
                      ? theme.palette.secondary.main
                      : "#ccc",
                  color: "white",
                  "&:hover": {
                    bgcolor:
                      isPaymentSufficient && !isCartEmpty
                        ? theme.palette.secondary.dark
                        : "#ccc",
                  },
                  width: 250,
                  height: 60,
                  fontSize: 20,
                }}
                onClick={handleCharge}
                disabled={!isPaymentSufficient || isCartEmpty}
              >
                {isCartEmpty
                  ? "Cart Empty"
                  : !isPaymentSufficient
                  ? "Insufficient Payment"
                  : "Charge"}
              </Button>
            </>
          ) : (
            <>
              {/* Paid */}
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                Paid: ₱{paid.toFixed(2)}
              </Typography>

              {/* Change */}
              <Typography
                variant="h3"
                sx={{ fontWeight: "bold", color: theme.palette.secondary.main }}
              >
                Change: ₱{change.toFixed(2)}
              </Typography>

              {/* Buttons row */}
              <Box sx={{ display: "flex", gap: 3, mt: 3 }}>
                {/* Print Receipt */}
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  color="secondary"
                  sx={{
                    width: 220,
                    height: 70,
                    fontSize: 20,
                  }}
                  onClick={handlePrint}
                >
                  Print Receipt
                </Button>

                {/* New Sale */}
                <Button
                  variant="contained"
                  startIcon={<AddShoppingCartIcon />}
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    color: "white",
                    "&:hover": { bgcolor: theme.palette.secondary.dark },
                    width: 220,
                    height: 70,
                    fontSize: 20,
                  }}
                  onClick={handleNewSale}
                >
                  New Sale
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
