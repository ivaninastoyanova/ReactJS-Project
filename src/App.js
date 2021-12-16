import { Route, Routes } from 'react-router';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';

import AuthContext from './contexts/AuthContext';
import useLocalStorage from './hooks/useLocalStorage';

import { useEffect } from 'react';

import RecipesList from './components/Recipes/RecipesList';
import MyRecipes from './components/MyRecipes/MyRecipes';
import AboutUs from './components/AboutUs';
import Create from './components/Create';
import Details from './components/Details';

function App() {

  const [user, setUser] = useLocalStorage('user', null);

  useEffect(() => {
    console.log(user);
  }, []);

  return (
    <>
    <AuthContext.Provider value={{ user, setUser }}>
    <div className="App">
      <Header />
      
      <main>
         <Routes>
           <Route path="/" element={<Home />} />
           <Route path="/login" element={<Login />} />
           <Route path="/register" element={<Register />} />
           <Route path="/recipes" element={< RecipesList />} />
           <Route path="/my-recipes" element={<MyRecipes />} />
           <Route path="/about" element={<AboutUs />} />
           <Route path="/create" element={<Create />} />

           <Route path="*" element={<h1 style={{textAlign : "center"}}>404 NOT FOUND! </h1>} />
         </Routes>
      </main>

      <Footer />
       
       <Details/>
    </div>
    </AuthContext.Provider>
    </>
  );
}

export default App;
