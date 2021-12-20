import { useState, useEffect } from "react";

import * as recipeService from "../services/recipeService";

const useRecipeState = (recipeId) => {
  const [recipe, setRecipe] = useState({});

  useEffect(() => {
    recipeService.getOne(recipeId)
    .then((recipeResult) => {
      setRecipe(recipeResult);
    });
  }, [recipeId]);

  return [recipe, setRecipe];
};

export default useRecipeState;
