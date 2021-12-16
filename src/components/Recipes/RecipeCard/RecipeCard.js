import "./RecipeCard.css";
import { Link } from "react-router-dom";

export default function RecipeCard() {
    return (
        <>
            <div className="card-container">
                <div className="card-img-container">
                    <img className="card-img" src="https://images.immediate.co.uk/production/volatile/sites/30/2013/05/Puttanesca-fd5810c.jpg" alt="img" />
                </div>
                <article className="card-text-wrapper">
                <h2 className="card-title">
                    Recipe name
                </h2>
                <p>Type: salad</p>
                <article className="card-buttons">
                    {/* link to /details */}
                    <button className="card-button">Details</button>
                </article>
                </article>

            </div>
        </>
    );
}

// types can be salad, starter, soup, main course , dessert 