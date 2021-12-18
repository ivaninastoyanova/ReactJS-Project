const baseUrl = "http://localhost:3030";
// const emailRegex = new RegExp("^[\w'+-]+(\.[\w'+-]+)*@\w+([-.]\w+)*\.\w{1,24}$");
const emailRegex = new RegExp("^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}$");

export const login = async (email, password) => {
  let res = await fetch(`${baseUrl}/users/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  let jsonResult = await res.json();

  if (res.ok) {
    if (!jsonResult.email) {
      throw jsonResult.message;
    }
    if (!emailRegex.test(jsonResult.email)) {
      throw "Invalid email address format";
    }

    return jsonResult;
  } else {
    throw jsonResult.message;
  }
};

export const register = async (email, password) => {
  let res = await fetch(`${baseUrl}/users/register`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  let jsonResult = await res.json();

   if (res.ok) {
    if (!emailRegex.test(jsonResult.email)) {
      throw "Invalid email address format";
    }
    return jsonResult;
  } else {
    throw jsonResult.message;
  }
};


export const logout = (token) => {
  return fetch(`${baseUrl}/users/logout`, {
    headers: {
      "X-Authorization": token,
    },
  });
};

export const getUser = () => {
  let username = localStorage.getItem("username");

  return username;
};

export const isAuthenticated = () => {
  return Boolean(getUser());
};
