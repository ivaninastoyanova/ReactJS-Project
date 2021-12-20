import "./Header.css";

import { Link } from "react-router-dom";

import { useAuthContext } from "../../contexts/AuthContext";

const Header = () => {
  const { user } = useAuthContext();

  let guestNavigation = (
    <>
       <li className="nav-item">
        <Link to="/">Home</Link>
      </li>
      <li className="nav-item">
        <Link to="/catalog">All Recipes</Link>
      </li>
      <li className="nav-item">
        <Link to="/about">About Us</Link>
      </li>
      <li className="nav-item">
        <Link to="/login">Login</Link>
      </li>
      <li className="nav-item">
        <Link to="/register">Register</Link>
      </li>
    </>
  );

  let userNavigation = (
    <>
      <li className="nav-item">
        <Link to="/">Home</Link>
      </li>
      <li className="nav-item">
        <Link to="/catalog">All Recipes</Link>
      </li>
      <li className="nav-item">
        <Link to="/create">Add Recipe</Link>
      </li>
      <li className="nav-item">
        <Link to="/my-recipes">My Recipes</Link>
      </li>
      <li className="nav-item">
        <Link to="/about">About Us</Link>
      </li>
      <li className="nav-item">
        <Link to="/logout">
          Logout
        </Link>
      </li>
    </>
  );


  return (
    <>
      <header>
        <Link to="/">
          <h1 className="header-title">Yummy Recipes</h1>
        </Link>
        <nav>
          <ul className="nav-items">  {user.email
                        ? userNavigation
                        : guestNavigation
                    }</ul>
        </nav>
      </header>
    </>
  );
}

export default Header;