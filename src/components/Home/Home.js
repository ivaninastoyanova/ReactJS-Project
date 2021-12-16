import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <>
      <section id="home">
        <article className="home-img-container">
          <img className="home-img" src="./images/food.jpg" alt="Image" />
        </article>

        <article className="home-bottom-container">
          <article className="bottom-container-textwrapper">
            <h1 className="home-title">Find the Best Recipes</h1>
            <p className="home-p">Explore our yummy recipes catalog</p>
            <article className="homeButtons">
              <Link to="/catalog" className="homeButton">
                All recipes
              </Link>
            </article>
          </article>
        </article>
      </section>
    </>
  );
}
