import RecipeCard from "./RecipeCard";
import "./RecipesList.css";

const RecipesList = () => {
    return (
        <div className="recipes">
            <h1 className="recipes-title">Explore the best recipes in the world</h1>
            <div className="recipes-list-container">
                <RecipeCard />
                <RecipeCard />
                <RecipeCard />
                <RecipeCard />
                <RecipeCard />
                
            </div>

        </div>
    );
};

export default RecipesList;
