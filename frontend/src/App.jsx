import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./Pages/LandingPage";
import ItemLayout from "./layouts/ItemLayout";
import Items from "./Pages/Items";
import Categories from "./Pages/Categories";
import BackOffice from "./Pages/BackOffice";
import CreateItem from "./Pages/CreateItem";
import CreateCategory from "./Pages/CreateCategory";
import UpdateCategory from "./Pages/UpdateCategory";
import UpdateItem from "./Pages/UpdateItem";
import TransactionPage from "./Pages/TransactionPage";
import TransactionDetailPage from "./Pages/TransactionDetailPage"; // Add this

import "@fontsource/roboto";

export default function App() {
  return (
    <Routes>
      {/* Landing / home page */}
      <Route path="/" element={<LandingPage />} />
      {/* Item layout with nested routes */}
      <Route path="/items" element={<ItemLayout />}>
        {/* Default content when visiting /items */}
        <Route index element={<Items />} />

        {/* Nested pages */}
        <Route path="items" element={<Items />} />
        <Route path="categories" element={<Categories />} />
      </Route>
      {/* Create Item outside of ItemLayout */}
      <Route path="/items/items/create" element={<CreateItem />} />
      {/* Update Item */}
      <Route path="/items/items/update/:id" element={<UpdateItem />} />
      {/* Create Category outside of ItemLayout */}
      <Route path="/items/categories/create" element={<CreateCategory />} />
      {/* Update Category outside of ItemLayout */}
      <Route path="/items/categories/update/:id" element={<UpdateCategory />} />
      {/* Back Office page */}
      <Route path="/backoffice" element={<BackOffice />} />
      {/* Transaction Pages */}
      <Route path="/transactions" element={<TransactionPage />} />
      <Route
        path="/transactions/:id"
        element={<TransactionDetailPage />}
      />{" "}
      {/* Add this route */}
    </Routes>
  );
}
