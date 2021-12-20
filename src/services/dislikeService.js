import * as request from "./requester";

const baseUrl = "http://localhost:3030/data";

export const dislike = (userId, recipeId) =>
  request.post(`${baseUrl}/dislikes`, { userId, recipeId });

export const getRecipeDislikes = (recipeId) => {
  const query = encodeURIComponent(`recipeId="${recipeId}"`);

  return request
    .get(`${baseUrl}/dislikes?select=userId&where=${query}`)
    .then((res) => res.map((x) => x.userId));
};
