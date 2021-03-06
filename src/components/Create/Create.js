import "./Create.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as recipeService from "../../services/recipeService";
import { useAuthContext } from "../../contexts/AuthContext";
import { useNotificationContext } from "../../contexts/NotificationContext";

const Create = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { addNotification } = useNotificationContext();
  const [err, setError] = useState(null);

  const onRecipeCreate = (e) => {
    e.preventDefault();
    let formData = new FormData(e.currentTarget);

    let name = formData.get("name");
    let description = formData.get("description");
    let imageUrl = formData.get("imageUrl");
    let type = formData.get("type");

    recipeService
      .create(
        {
          name,
          type,
          imageUrl,
          description,
        },
        user.accessToken
      )
      .then((result) => {
        addNotification("You created a new recipe.");
        navigate("/catalog");
      })
      .catch((err) => {
        setError(err);
      });
  };

  return (
    <>
      <section id="create">
        <article className="create-header">
          <h1>Add a New Recipe</h1>
        </article>

        <article className="create-form-container">
          <form className="createForm" onSubmit={onRecipeCreate} method="POST">
            <div className="createGroup">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Chicken Soup"
                required
                onInvalid={(e) => {
                  e.target.setCustomValidity("This field is required");
                }}
                onInput={(e) => e.target.setCustomValidity("")}
              />
            </div>
            <div className="createGroup">
              <label htmlFor="type">Type:</label>
              <input
                type="text"
                id="type"
                name="type"
                placeholder="Soup"
                required
                onInvalid={(e) => {
                  e.target.setCustomValidity("This field is required");
                }}
                onInput={(e) => e.target.setCustomValidity("")}
              />
            </div>

            <div className="createGroup">
              <label htmlFor="imageUrl">Image URL:</label>
              <input
                type="text"
                id="imageUrl"
                name="imageUrl"
                placeholder="Image URL"
                required
                onInvalid={(e) => {
                  e.target.setCustomValidity("This field is required");
                }}
                onInput={(e) => e.target.setCustomValidity("")}
              />
            </div>

            <div className="createGroup">
              <label htmlFor="description">Description:</label>
              <textarea
                type="text"
                id="description"
                name="description"
                placeholder="Some text"
                required
                onInvalid={(e) => {
                  e.target.setCustomValidity("This field is required");
                }}
                onInput={(e) => e.target.setCustomValidity("")}
              />
            </div>
            <div className="createGroup">
              <button className="createBtn">Add Recipe</button>
            </div>
          </form>
        </article>
      </section>
    </>
  );
};
export default Create;
