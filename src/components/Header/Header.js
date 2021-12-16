import { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import './Header.css';

export default function Header() {

    const { user, setUser } = useContext(AuthContext);

    const onLogout = (e) => {
        e.preventDefault();
        setUser(null);
    }

    const userNav = (
        <>
        <li className="nav-item"><Link to="/">Home</Link></li>
        <li className="nav-item"><Link to="/recipes">Recipes</Link></li>                   
        <li className="nav-item"><Link to="/create">Add Recipe</Link></li>
        <li className="nav-item"><Link to="/my-recipes">My Recipes</Link></li>
        <li className="nav-item"><Link to="/about">About Us</Link></li>
        <li className="nav-item"><Link onClick={onLogout} to="/logout">Logout</Link></li>
        </>
    );

    const guestNav = (
        <>
        <li className="nav-item"><Link to="/">Home</Link></li>
        <li className="nav-item"><Link to="/recipes">Recipes</Link></li>                   
        <li className="nav-item"><Link to="/about">About Us</Link></li>
        <li className="nav-item"><Link to="/login">Login</Link></li>
        <li className="nav-item"><Link to="/register">Register</Link></li>
        </>
    )

    return (
        <>
        <header>
            <Link to="/"><h1 className="header-title">Yummy Recipes</h1></Link>
            <nav>
                <ul className="nav-items">
                    {
                        user ? userNav : guestNav
                    }
                </ul>
            </nav>
           
        </header>
        </>
    )
}