import React from "react";
import { Routes, Route } from "react-router-dom"; // Remove BrowserRouter import
import LandingPage from "./Pages/LandingPage";
import ItemLayout from "./layouts/ItemLayout";
import Items from "./Pages/Items";
import Categories from "./Pages/Categories";
import { AuthProvider } from "./context/AuthContext";
import RouteAuthHandler from "./context/RouteAuthHandler";
import ProtectedRoute from "./context/ProtectedRoute";
import BackOffice from "./Pages/BackOffice";
import CreateItem from "./Pages/CreateItem";
import CreateCategory from "./Pages/CreateCategory";
import UpdateCategory from "./Pages/UpdateCategory";
import UpdateItem from "./Pages/UpdateItem";
import TransactionPage from "./Pages/TransactionPage";
import TransactionDetailPage from "./Pages/TransactionDetailPage";
import "@fontsource/roboto";

export default function App() {
  return (
    <AuthProvider>
      {/* Remove BrowserRouter - it's already in main.jsx */}
      <RouteAuthHandler />

      <Routes>
        {/* Landing / home page */}
        <Route path="/" element={<LandingPage />} />

        {/* Item layout with nested routes */}
        <Route path="/items" element={<ItemLayout />}>
          <Route index element={<Items />} />
          <Route path="items" element={<Items />} />
          <Route path="categories" element={<Categories />} />
        </Route>

        {/* Create Item outside of ItemLayout */}
        <Route path="/items/items/create" element={<CreateItem />} />
        <Route path="/items/items/update/:id" element={<UpdateItem />} />
        <Route path="/items/categories/create" element={<CreateCategory />} />
        <Route
          path="/items/categories/update/:id"
          element={<UpdateCategory />}
        />

        {/* Back Office page - PROTECTED */}
        <Route
          path="/backoffice"
          element={
            <ProtectedRoute>
              <BackOffice />
            </ProtectedRoute>
          }
        />

        {/* Transaction Pages */}
        <Route path="/transactions" element={<TransactionPage />} />
        <Route path="/transactions/:id" element={<TransactionDetailPage />} />
      </Routes>
    </AuthProvider>
  );
}
