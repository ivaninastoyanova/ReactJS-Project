import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import * as recipeService from "../../services/recipeService";
import useRecipeState from "../../hooks/useRecipeState";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { useState } from "react";

import "./Edit.css";

const Edit = () => {
  const [err, setError] = useState(null);

  const { recipeId } = useParams();
  const [recipe, setRecipe] = useRecipeState(recipeId);
  const { addNotification } = useNotificationContext();

  const navigate = useNavigate();

  const recipeEditSubmitHandler = (e) => {
    e.preventDefault();

    let recipeData = Object.fromEntries(new FormData(e.currentTarget));

    recipeService
      .update(recipe._id, recipeData)
      .then((result) => {
        addNotification("Successfully edited a recipe.");

        navigate("/catalog");
      })
      .catch((err) => {
        setError(err);
      });
  };

  return (
    <section id="edit">
      <article className="edit-header">
        <h1>Edit Your Recipe</h1>
      </article>

      <article className="edit-form-container">
        <form
          className="editForm"
          onSubmit={recipeEditSubmitHandler}
          method="POST"
        >
          <div className="editGroup">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={recipe.name}
              required
              onInvalid={(e) => {
                e.target.setCustomValidity("This field is required");
              }}
              onInput={(e) => e.target.setCustomValidity("")}
            />
          </div>

          <div className="editGroup">
            <label htmlFor="type">Type:</label>
            <input
              type="text"
              id="type"
              name="type"
              defaultValue={recipe.type}
              required
              onInvalid={(e) => {
                e.target.setCustomValidity("This field is required");
              }}
              onInput={(e) => e.target.setCustomValidity("")}
            />
          </div>
          <div className="editGroup">
            <label htmlFor="imageUrl">Image URL:</label>
            <input
              type="text"
              id="imageUrl"
              name="imageUrl"
              defaultValue={recipe.imageUrl}
              required
              onInvalid={(e) => {
                e.target.setCustomValidity("This field is required");
              }}
              onInput={(e) => e.target.setCustomValidity("")}
            />
          </div>

          <div className="editGroup">
            <label htmlFor="description">Description:</label>
            <textarea
              type="text"
              id="description"
              name="description"
              defaultValue={recipe.description}
              required
              onInvalid={(e) => {
                e.target.setCustomValidity("This field is required");
              }}
              onInput={(e) => e.target.setCustomValidity("")}
            />
          </div>
          <div className="editGroup">
            <button className="editBtn">Edit Recipe</button>
          </div>
        </form>
      </article>
    </section>
  );
};

export default Edit;
