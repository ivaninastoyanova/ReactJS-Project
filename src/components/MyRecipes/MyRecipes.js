import "./MyRecipes.css";
import RecipeCard from "../Recipes/RecipeCard"

const MyRecipes = () => {
    return (
        <div className="my-recipes">
            <h1 className="my-recipes-title">My Recipes</h1>
             <h3 className="my-recipes-subtitle">Here is a list of all the recipes you have created.</h3>
             <div className="my-recipes-list-container">
                <RecipeCard />
                <RecipeCard />
                <RecipeCard />
                <RecipeCard />
                <RecipeCard />
                
            </div>
        </div>
    );
};

export default MyRecipes;
