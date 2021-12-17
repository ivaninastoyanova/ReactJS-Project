import { useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import * as recipeService from "../../services/recipeService";
import useRecipeState from "../../hooks/useRecipeState";
import "./Edit.css";

const Edit = () => {

  const { recipeId } = useParams();
  console.log(recipeId);
  const [recipe, setRecipe] = useRecipeState(recipeId);
  console.log(recipe);
//   const [errors, setErrors] = useState({ name: false });

  const navigate = useNavigate();

  const recipeEditSubmitHandler = (e) => {
    e.preventDefault();

    let recipeData = Object.fromEntries(new FormData(e.currentTarget));

    recipeService.update(recipe._id, recipeData)
    .then(result => {
        navigate('/catalog');
    });

    // recipeService.update(recipe._id, recipeData);
    // navigate('/catalog');
  };

  // const nameChangeHandler = (e) => {
  //     let currentName = e.target.value;
  //     if (currentName.length < 3) {
  //         setErrors(state => ({...state, name: 'Your name sould be at least 3 characters!'}))
  //     } else if (currentName.length > 10) {
  //         setErrors(state => ({...state, name: 'Your name sould be max 10 characters!'}))
  //     } else {
  //         setErrors(state => ({...state, name: false}))
  //     }
  // };

  return (
      <section id="edit">
        <article className="edit-header">
          <h1>Edit Your Recipe</h1>
        </article>

        <article className="edit-form-container">
          <form className="editForm" onSubmit={recipeEditSubmitHandler}  method="POST">
            <div className="editGroup">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={recipe.name}
              />
            </div>

            <div className="editGroup">
              <label htmlFor="type">Type:</label>
              <input 
              type="text" 
              id="type" 
              name="type" 
              defaultValue={recipe.type}
              />
            </div>
            <div className="editGroup">
              <label htmlFor="imageUrl">Image URL:</label>
              <input
                type="text"
                id="imageUrl"
                name="imageUrl"
                defaultValue={recipe.imageUrl}             
              />
            </div>

            <div className="editGroup">
              <label htmlFor="description">Description:</label>
              <textarea
                type="text"
                id="description"
                name="description"
                defaultValue={recipe.description}
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
