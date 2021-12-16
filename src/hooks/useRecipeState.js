import { useState, useEffect, useMemo } from "react";

import * as recipeService from "../services/recipeService";

const useRecipeState = (recipeId) => {
  const [recipe, setRecipe] = useState({});

  const controller = useMemo(() => {
    const controller = new AbortController();

    return controller;
  }, []);

  useEffect(() => {
    recipeService.getOne(recipeId, controller.signal).then((recipeResult) => {
      setRecipe(recipeResult);
    });

    return () => {
      controller.abort();
    };
  }, [recipeId, controller]);

  return [recipe, setRecipe];
};

export default useRecipeState;
