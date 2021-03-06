import "./RecipeCard.css";
import { Link } from "react-router-dom";

const RecipeCard = ({recipe}) => {
    return (
        <>
            <div className="card-container">
                <div className="card-img-container">
                    <img className="card-img" src={recipe.imageUrl} alt="img" />
                </div>
                <article className="card-text-wrapper">
                <h2 className="card-title">
                    {recipe.name}
                </h2>
                <p className="card-type">Type: {recipe.type}</p>
                <article className="card-buttons">
                    <Link to={`/details/${recipe._id}`}> 
                    <button className="card-button">Details</button>
                    </Link>
                </article>
                </article>

            </div>
        </>
    );
}
export default RecipeCard;
