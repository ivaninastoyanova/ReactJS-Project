import RecipeCard from "./RecipeCard";
import "./RecipesList.css";


const RecipesList = ({ recipes }) => {
  return (
    <>
      { recipes.length > 0 
        ? (
        <>
          
          <div className="recipes-list-container">
            {recipes.map((x) => (
              <RecipeCard key={x._id} recipe={x} />
            ))}
          </div>
        </>
      ) 
      : (
        <p className="recipe-no-recipes">There are no recipes yet!</p>
      )}
      
    </>
  );
};

export default RecipesList;
