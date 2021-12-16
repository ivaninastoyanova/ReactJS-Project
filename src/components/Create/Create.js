import "./Create.css";
import { Link } from "react-router-dom";

export default function Create() {
  return (
    <>
      <section id="create">
        <article className="create-header">
          <h1>Add a New Recipe</h1>
        </article>

        <article className="create-form-container">
          <form className="createForm">
            <div className="createGroup">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Chicken Soup"
              />
            </div>
            <div className="createGroup">
              <label htmlFor="image">Image URL:</label>
              <input
                type="text"
                id="image"
                name="image"
                placeholder="Image URL"
              />
            </div>
            <div className="createGroup">
              <label htmlFor="type">Type:</label>
              <input type="text" id="type" name="type" placeholder="Soup" />
            </div>

            {/* <p className="field">
              <label htmlFor="type">Type: </label>
              <span className="input">
                <select id="type" name="type">
                  <option value="salad">Salad</option>
                  <option value="soup">Soup</option>
                  <option value="starter">Starter</option>
                  <option value="main-course">Main Course</option>
                  <option value="dessert">Dessert</option>
                  <option value="other">Other</option>
                </select>
              </span>
            </p> */}
          
            <div className="createGroup">
              <label htmlFor="type">Description:</label>
              <textarea
                type="text"
                id="description"
                name="description"
                placeholder="Some text"
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
}
