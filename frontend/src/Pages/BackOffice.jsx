import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import Header from "../components/Header";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

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
  flex: 1,
  margin: 4,
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 25px rgba(93, 51, 110, 0.15)",
  },
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(93, 51, 110, 0.1)",
  border: `1px solid ${theme.palette.secondary.light}`,
  background: "linear-gradient(135deg, #FFFFFF 0%, #F8F5FA 100%)",
  width: "100%",
  marginBottom: 16,
}));

const IconWrapper = styled(Box)(({ trend }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: "50%",
  backgroundColor:
    trend === "up" ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)",
  color: trend === "up" ? "#4CAF50" : "#F44336",
  marginRight: 8,
}));

// ---------- Sample Data ----------
const stats = [
  {
    label: "Net Sales",
    value: "$120,000",
    trend: "up",
    change: "+12%",
    icon: <AttachMoneyIcon />,
  },
  {
    label: "Cost of Product Sold",
    value: "$70,000",
    trend: "down",
    change: "-5%",
    icon: <TrendingDownIcon />,
  },
  {
    label: "Margin",
    value: "$50,000",
    trend: "up",
    change: "+18%",
    icon: <TrendingUpIcon />,
  },
  {
    label: "Expenses",
    value: "$20,000",
    trend: "down",
    change: "-3%",
    icon: <TrendingDownIcon />,
  },
  {
    label: "Profit",
    value: "$30,000",
    trend: "up",
    change: "+25%",
    icon: <TrendingUpIcon />,
  },
];

const lineData = [
  {
    id: "Revenue",
    data: [2, 5.5, 2, 8.5, 1.5, 5, 7, 9, 6.5, 8, 10, 12],
    color: "#8E44AD",
    area: true,
  },
  {
    id: "Expenses",
    data: [1, 3, 2.5, 4, 1, 2, 3.5, 4.5, 3, 4, 5, 6],
    color: "#5D336E",
    area: true,
  },
];
const lineLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const barData = [
  12000, 15000, 14000, 17000, 19000, 21000, 18000, 22000, 24000, 26000, 28000,
  30000,
];
const barLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pieData = [
  { id: 0, value: 35, label: "Product A", color: "#8E44AD" },
  { id: 1, value: 25, label: "Product B", color: "#5D336E" },
  { id: 2, value: 20, label: "Product C", color: "#7A4B8C" },
  { id: 3, value: 20, label: "Product D", color: "#D8BFD8" },
];

// ---------- Component ----------
export default function BackOffice() {
  const handlePrint = () => window.print();

  return (
    <ThemeProvider theme={purpleTheme}>
      {/* Root container hides vertical scrollbar */}
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          overflowY: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header title="Back Office" showNav={true} />

        {/* Scrollable content */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 2,
            py: 2,
          }}
        >
          {/* Stats */}
          <Box sx={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
            {stats.map((stat, idx) => (
              <StatCard key={idx}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <IconWrapper trend={stat.trend}>{stat.icon}</IconWrapper>
                    <Typography variant="subtitle2">{stat.label}</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: stat.trend === "up" ? "#4CAF50" : "#F44336",
                      fontWeight: 600,
                    }}
                  >
                    {stat.change} from last month
                  </Typography>
                </CardContent>
              </StatCard>
            ))}
          </Box>

          {/* Charts */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              mt: 2,
            }}
          >
            <ChartContainer>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Monthly Sales Performance
              </Typography>
              <BarChart
                xAxis={[{ data: barLabels, scaleType: "band" }]}
                series={[{ data: barData, label: "Revenue", color: "#8E44AD" }]}
                height={400}
                grid={{ vertical: true, horizontal: true }}
                margin={{ left: 60, right: 30, top: 30, bottom: 70 }}
                highlight
                tooltip
                zoom
                pan
              />
            </ChartContainer>

            <ChartContainer>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Product Distribution
              </Typography>
              <PieChart
                series={[
                  {
                    data: pieData,
                    highlightScope: { faded: "global", highlighted: "item" },
                  },
                ]}
                height={400}
                slotProps={{
                  legend: {
                    direction: "row",
                    position: { vertical: "bottom", horizontal: "middle" },
                  },
                }}
              />
            </ChartContainer>

            <ChartContainer>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Revenue & Expenses Trend
              </Typography>
              <LineChart
                xAxis={[{ data: lineLabels, scaleType: "point" }]}
                series={lineData.map((s) => ({
                  ...s,
                  curve: "monotoneX",
                  showMark: true,
                  area: s.area,
                }))}
                height={400}
                grid={{ vertical: true, horizontal: true }}
                margin={{ left: 60, right: 30, top: 30, bottom: 70 }}
                colors={["#8E44AD", "#5D336E"]}
                highlight
                tooltip
                zoom
                pan
              />
            </ChartContainer>
          </Box>

          {/* Generate Button */}
          <Box sx={{ textAlign: "center", mt: 4, mb: 4 }}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={handlePrint}
            >
              Generate Comprehensive Report
            </Button>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
