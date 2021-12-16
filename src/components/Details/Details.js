import { Link } from "react-router-dom";
import "./Details.css";

export default function Details() {


  return (
    <>
      <section id="details">

        <article className="details-top">
          <section className="details-top-left">
            <h2 className="details-title">Recipe Title</h2>
            <h3 className="details-type">Recipe Type: </h3>
            <p className="details-likes-count">Likes: 0 </p>

            <article className="details-buttons">
              <button className="details-owner-button"> Edit </button>
              <button className="details-owner-button"> Delete </button>
              <button className="details-guest-button"> Like </button>
            </article>
          </section>

          <section className="details-top-right">
            <img className="details-top-right-img" src="./images/food3.jpg" alt="recipe" />
          </section>
        </article>

        <article className="details-bottom">
          <h2 className="details-description-title">Description:</h2>
          <p className="details-description-text">
            Lorem ipsum dolor sit amet consectetur loren Lorem ipsum Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ab eius vero nemo rerum, magnam voluptate cupiditate exercitationem, culpa ipsa minus deleniti possimus? Distinctio ad ut repellendus! Deserunt ea ipsum hic. dolor sit amet consectetur adipisicing elit. Laboriosam, quam sed fuga fugiat assumenda saepe hic voluptatum nulla accusamus, harum dolore vitae nihil eius dolorum facilis modi asperiores soluta architecto. adipisicing. Quisqus doloribus tempora earum! Facilis porro eos necessitatibus accusamus beatae obcaecati culpa!
          </p>
        </article>

      </section>
    </>
  );
}
