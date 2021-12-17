import * as request from "./requester";

const baseUrl = "http://localhost:3030/data";

export const like = (userId, recipeId) =>
  request.post(`${baseUrl}/likes`, { userId, recipeId });

export const getRecipeLikes = (recipeId) => {
  const query = encodeURIComponent(`recipeId="${recipeId}"`);

  return request
    .get(`${baseUrl}/likes?select=userId&where=${query}`)
    .then((res) => res.map((x) => x.userId));
};
