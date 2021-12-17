import { Link } from "react-router-dom";
import "./AboutUs.css";

export default function AboutUs() {
  return (
    <>
      <div className="about-container">
        <article className="about-img-container">
          <img className="about-img" src="./images/food4.jpg" alt="Image" />
        </article>

        <article className="about-text-container">
          <h1 className="about-title">Hello there,</h1>
          <h4 className="about-subtitle">We are Yummy Recipes.</h4>
          <h4 className="about-text-red">
            Creative people who love to spend time in the kitchen.
          </h4>
        </article>
      </div>
    </>
  );
}
