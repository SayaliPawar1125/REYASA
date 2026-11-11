
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import AdminNavbar from "./components/AdminNavbar";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

import Home from "./pages/Home";
import Register from "./Pages/Register";
import Collection from "./Pages/Collection";
import About from "./Pages/About";
import Profile from "./Pages/Profile";
import Login from "./Pages/Login";
import ForgotPassword from "./components/ForgotPassword";
import Footer from "./components/Footer";

import AdminDashboard from "./Pages/AdminDashboard";
import AdminProfile from "./Pages/AdminProfile";
import ManageProducts from "./Pages/ManageProducts";
import Cart from "./Pages/Cart";
import ProductDetails from "./Pages/ProductDetails";
import ManageDeliveryPinCodes from "./Pages/ManageDeliveryPinCodes";
import HomepageVideos from "./Pages/HomepageVideos";
import ManageOrders from "./Pages/ManageOrder";
import Checkout from "./Pages/Checkout";
import Enquiry from "./Pages/Enquiry";
import ContactMessages from "./Pages/ContactMessages";
import ManageAbout from "./Pages/ManageAbout";
import ManageFooter from "./Pages/ManageFooter";
import ManageExpenses from "./Pages/ManageExpenses";
import Wishlist from "./Pages/Wishlist";
import MyOrders from "./Pages/MyOrders";
import OrderTracking from "./Pages/OrderTracking";

function AppLayout() {
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith("/admin");

  const token = localStorage.getItem("token");
  const storedRole = localStorage.getItem("role");

  const role = storedRole
    ?.toUpperCase()
    .replace("ROLE_", "");

  const isAuthorizedAdmin = Boolean(token) && role === "ADMIN";

  return (
    <>
      {isAdminPage && isAuthorizedAdmin
        ? <AdminNavbar />
        : <Navbar />}

      <Routes>
        {/* CUSTOMER PAGES */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/about" element={<About />} />
        <Route path="/enquiry" element={<Enquiry />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/track-order/:orderId" element={<OrderTracking />} />

        {/* PROTECTED ADMIN PAGES */}
        <Route element={<ProtectedAdminRoute />}>
          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/profile"
            element={<AdminProfile />}
          />

          <Route
            path="/admin/manageproducts"
            element={<ManageProducts />}
          />

          <Route
            path="/admin/delivery-pins"
            element={<ManageDeliveryPinCodes />}
          />

          <Route
            path="/admin/videos"
            element={<HomepageVideos />}
          />

          <Route
            path="/admin/orders"
            element={<ManageOrders />}
          />

          <Route
            path="/admin/enquiries"
            element={<ContactMessages />}
          />

          <Route
            path="/admin/about"
            element={<ManageAbout />}
          />

          <Route
            path="/admin/footer"
            element={<ManageFooter />}
          />

          <Route
            path="/admin/expenses"
            element={<ManageExpenses />}
          />
        </Route>
      </Routes>

      {!isAdminPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
