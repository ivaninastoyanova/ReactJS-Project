import "./Details.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import * as recipeService from "../../services/recipeService";
import * as likeService from "../../services/likeService";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  useNotificationContext,
  types,
} from "../../contexts/NotificationContext";
import useRecipeState from "../../hooks/useRecipeState";

import ConfirmDialog from "../Common/ConfirmDialog";

const Details = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { addNotification } = useNotificationContext();
  const { recipeId } = useParams();
  const [recipe, setRecipe] = useRecipeState(recipeId);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    likeService.getRecipeLikes(recipeId).then((likes) => {
      setRecipe((state) => ({ ...state, likes }));
    });
  }, []);

  const deleteHandler = (e) => {
    e.preventDefault();

    recipeService
      .destroy(recipeId, user.accessToken)
      .then(() => {
        navigate("/catalog");
      })
      .finally(() => {
        setShowDeleteDialog(false);
      });
  };

  const deleteClickHandler = (e) => {
    e.preventDefault();
    console.log(process.env.NODE_ENV);
    setShowDeleteDialog(true);
  };

  const likeButtonClick = () => {
    if (user._id === recipe._ownerId) {
      return;
    }

    if (recipe.likes.includes(user._id)) {
      addNotification("You cannot like a recipe more than once.");
      return;
    }

    likeService.like(user._id, recipeId).then(() => {
      setRecipe((state) => ({ ...state, likes: [...state.likes, user._id] }));

      addNotification("Successfuly liked a recipe.", types.success);
    });
  };

  const ownerButtons = (
    <>
      <Link className="button" to={`/edit/${recipe._id}`}>
        <button className="details-owner-button"> Edit </button>
      </Link>
      <button className="details-owner-button" onClick={deleteClickHandler}> Delete </button>
    </>
  );

  const userButtons = (
      <button className="details-guest-button" onClick={likeButtonClick} disabled={recipe.likes?.includes(user._id)}>Like</button>
  );

  return (
    <>
    <ConfirmDialog show={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} onSave={deleteHandler} />
      <section id="details">
        <article className="details-top">
          <section className="details-top-left">
            <h2 className="details-title">{recipe.name}</h2>
            <h3 className="details-type">Type: {recipe.type} </h3>
            <p className="details-likes-count">Likes:  {recipe.likes?.length || 0} </p>

            <article className="details-buttons">
              {user._id && (user._id == recipe._ownerId 
                ? ownerButtons 
                : userButtons)}
            </article>
          </section>

          <section className="details-top-right">
            <img
              className="details-top-right-img"
              src={recipe.imageUrl}
              alt="recipe"
            />
          </section>
        </article>

        <article className="details-bottom">
          <h2 className="details-description-title">Description:</h2>
          <p className="details-description-text">
            {recipe.description}
          </p>
        </article>
      </section>
    </>
  );
};

export default Details;
