import { useState, useEffect } from 'react';
import "./LatestRecipes.css";
import * as recipeService from '../../services/recipeService';

import RecipesList from "../Recipes/RecipesList";

const LatestRecipes = () => {

    const [recipes, setRecipes] = useState([]);

    useEffect(() => {
        recipeService.getLatestThreeRecipes()
            .then(recipeResult => {
                setRecipes(recipeResult);
            });
    }, []);

    return (
        <div className="latest-recipes">
             {recipes.length > 0 ? 
           <>
           <h1 className="latest-title">Latest Recipes</h1>
             <h3 className="latest-subtitle">Here is a list of the latest three recipes.</h3>
            
           </>
          : ''
       }
             <div className="latest-list-container">
             <RecipesList recipes={recipes} />
            </div>
        </div>
    );
};

export default LatestRecipes;
