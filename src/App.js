import { Route, Routes } from "react-router";

import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Logout from "./components/Logout";
import MyRecipes from "./components/MyRecipes/MyRecipes";
import AboutUs from "./components/AboutUs";
import Create from "./components/Create";
import Details from "./components/Details";
import Catalog from "./components/Catalog";
import Edit from "./components/Edit";
import LatestRecipes from "./components/LatestRecipes";

import Notification from "./components/Common/Notification";
import ErrorBoundary from "./components/Common/ErrorBoundary";
import ProtectedRoute from "./components/Common/ProtectedRoute";

import "./App.css";


function App() {
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <div id="container">
            <Header />

            <Notification />

            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/details/:recipeId" element={<Details />} />
                <Route path="/latest-recipes" element={<LatestRecipes />} />


                <Route element={<ProtectedRoute />}>
                  <Route path="/my-recipes" element={<MyRecipes />} />
                  <Route path="/create" element={<Create />} />
                  <Route path="/edit/:recipeId" element={<Edit />} />
                </Route>

                <Route
                  path="*"
                  element={
                    <h1 style={{ textAlign: "center" }}>404 NOT FOUND! </h1>
                  }
                />
              </Routes>
            </main>

            <Footer />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
