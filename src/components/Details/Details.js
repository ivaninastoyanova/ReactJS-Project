import "./Details.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import * as recipeService from "../../services/recipeService";
import * as likeService from "../../services/likeService";
import * as dislikeService from "../../services/dislikeService";
import { useAuthContext } from "../../contexts/AuthContext";
import { useNotificationContext } from "../../contexts/NotificationContext";
import useRecipeState from "../../hooks/useRecipeState";

import ConfirmDialog from "../Common/ConfirmDialog";

const Details = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { addNotification } = useNotificationContext();
  const { recipeId } = useParams();
  const [err, setError] = useState(null);

  const [recipe, setRecipe] = useRecipeState(recipeId);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    likeService.getRecipeLikes(recipeId).then((likes) => {
      setRecipe((state) => ({ ...state, likes }));
    });
    dislikeService.getRecipeDislikes(recipeId).then((dislikes) => {
      setRecipe((state) => ({ ...state, dislikes }));
    });
  }, []);
  
  const deleteHandler = (e) => {
    e.preventDefault();

    recipeService
      .remove(recipeId, user.accessToken)
      .then(() => {
        addNotification("You deleted a recipe.");
        navigate("/catalog");
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setShowDeleteDialog(false);
      });
  };

  const deleteClickHandler = (e) => {
    e.preventDefault();
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
    if (recipe.dislikes.includes(user._id)) {
      addNotification("You can't like a recipe if you have disliked it before.");
      return;
    }

    likeService.like(user._id, recipeId).then(() => {
      setRecipe((state) => ({ ...state, likes: [...state.likes, user._id] }));

      addNotification("Successfuly liked a recipe.");
    });
  };


  const dislikeButtonClick = () => {
    if (user._id === recipe._ownerId) {
      return;
    }

    if (recipe.dislikes.includes(user._id)) {
      addNotification("You cannot dislike a recipe more than once.");
      return;
    }

    if (recipe.likes.includes(user._id)) {
      addNotification("You can't dislike the recipe if you have liked it before.");
      return;
    }

    dislikeService.dislike(user._id, recipeId).then(() => {
      setRecipe((state) => ({ ...state, dislikes: [...state.dislikes, user._id] }));

      addNotification("Successfuly disliked a recipe.");
    });
  }; 

  const ownerButtons = (
    <>
      <Link className="button" to={`/edit/${recipe._id}`}>
        <button className="details-owner-button"> Edit </button>
      </Link>
      <button className="details-owner-button" onClick={deleteClickHandler}>
        {" "}
        Delete{" "}
      </button>
    </>
  );

  const userButtons = (
    <>
      <button className="details-guest-button" onClick={likeButtonClick}>
        Like
      </button>
      <button className="details-guest-button" onClick={dislikeButtonClick}>
        Dislike
      </button>
    </>
  );

  return (
    <>
      <ConfirmDialog
        show={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onSave={deleteHandler}
      />
      <section id="details">
        <article className="details-top">
          <section className="details-top-left">
            <h2 className="details-title">{recipe.name}</h2>
            <h3 className="details-type">Type: {recipe.type} </h3>
            <p className="details-likes-count">
              Likes: {recipe.likes?.length || 0}{" "}
            </p>
            <p className="details-likes-count">
              Dislikes: {recipe.dislikes?.length || 0}{" "}
            </p>

            <article className="details-buttons">
              {user._id &&
                (user._id == recipe._ownerId ? ownerButtons : userButtons)}
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
          <p className="details-description-text">{recipe.description}</p>
        </article>
      </section>
    </>
  );
};

export default Details;
