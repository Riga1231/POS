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
// In App.js - Update your routes:
export default function App() {
  return (
    <Routes>
      {/* Landing / home page */}
      <Route path="/" element={<LandingPage />} />

      {/* Item layout with nested routes */}
      <Route path="/items" element={<ItemLayout />}>
        <Route index element={<Items />} />
        <Route path="items" element={<Items />} />
        <Route path="categories" element={<Categories />} />
        {/* Move these INSIDE the ItemLayout */}
        <Route path="items/create" element={<CreateItem />} />
        <Route path="items/update/:id" element={<UpdateItem />} />
        <Route path="categories/create" element={<CreateCategory />} />
        <Route path="categories/update/:id" element={<UpdateCategory />} />
      </Route>

      {/* Back Office page - PROTECTED */}
      <Route path="/backoffice" element={<BackOffice />} />

      {/* Transaction Pages */}
      <Route path="/transactions" element={<TransactionPage />} />
      <Route path="/transactions/:id" element={<TransactionDetailPage />} />
    </Routes>
  );
}
