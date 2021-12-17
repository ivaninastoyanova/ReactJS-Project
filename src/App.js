import { Route, Routes } from "react-router";
import "./App.css";

import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

import Notification from "./components/Common/Notification";
import ErrorBoundary from "./components/Common/ErrorBoundary";
import PrivateRoute from "./components/Common/PrivateRoute";
import GuardedRoute from "./components/Common/GuardedRoute";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Logout from './components/Logout';

import AuthContext from "./contexts/AuthContext";
import useLocalStorage from "./hooks/useLocalStorage";

import { useEffect } from "react";

import RecipesList from "./components/Recipes/RecipesList";
import MyRecipes from "./components/MyRecipes/MyRecipes";
import AboutUs from "./components/AboutUs";
import Create from "./components/Create";
import Details from "./components/Details";
import Catalog from "./components/Catalog";
import Edit from './components/Edit';

function App() {
  const [user, setUser] = useLocalStorage("user", null);

  useEffect(() => {
    console.log(user);
  }, []);

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
                <Route path="/my-recipes" element={<MyRecipes />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/create" element={<Create />} />
                <Route path="/details/:recipeId" element={<Details />} />
                <Route path="/edit/:recipeId" element={<Edit />} />


                <Route element={<GuardedRoute />}>

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
