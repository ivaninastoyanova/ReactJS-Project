import { useState, useEffect } from 'react';
import "./MyRecipes.css";
import * as recipeService from '../../services/recipeService';
import { useAuthContext } from '../../contexts/AuthContext';

import RecipesList from "../Recipes/RecipesList";

const MyRecipes = () => {

    const [recipes, setRecipes] = useState([]);
    const { user } = useAuthContext();

    useEffect(() => {
        recipeService.getMyRecipes(user._id)
            .then(recipeResult => {
                setRecipes(recipeResult);
            });
    }, []);

    return (
        <div className="my-recipes">
             {recipes.length > 0 ? 
           <>
           <h1 className="my-recipes-title">My Recipes</h1>
             <h3 className="my-recipes-subtitle">Here is a list of all the recipes you have created.</h3>
            
           </>
          : ''
       }
             <div className="my-recipes-list-container">
             <RecipesList recipes={recipes} />
            </div>
        </div>
    );
};

export default MyRecipes;
