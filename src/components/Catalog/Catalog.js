import { useState, useEffect } from "react";

import RecipesList from "../Recipes/RecipesList";
import * as recipeService from "../../services/recipeService";

const Catalog = () => {
  const [err, setError] = useState(null);

  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    recipeService
      .getAll()
      .then((result) => {
        setRecipes(result);
      })
      .catch((err) => {
        setError(err);
      });
  }, []);

  return (
    <div className="catalog">
      {recipes.length > 0 ? (
        <h1 className="recipes-title">Explore the best recipes in the world</h1>
      ) : (
        ""
      )}
      <RecipesList recipes={recipes} />
    </div>
  );
};

export default Catalog;
