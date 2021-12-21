const baseUrl = "http://localhost:3030";
const emailRegex = new RegExp(
  "^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}$"
);
const passRegex = new RegExp("^[A-Z0-9a-z._%+-]{5,}$");

export const login = async (email, password) => {
  if (!email) {
    throw "This field must be filled.";
  }
  if (!emailRegex.test(email)) {
    throw "Invalid email address format";
  }
  if (!passRegex.test(password)) {
    throw "The password must be at least five characters long";
  }
  let res = await fetch(`${baseUrl}/users/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  let jsonResult = await res.json();
  if (!res.ok) {
    throw jsonResult.message;
  };
  return jsonResult;
};

export const register = async (email, password) => {
  if (!emailRegex.test(email)) {
    throw "Invalid email address format";
  }

  if (!passRegex.test(password)) {
    throw "The password must be at least five characters long";
  }

  let res = await fetch(`${baseUrl}/users/register`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  let jsonResult = await res.json();

  if (!res.ok) {
    throw jsonResult.message;
  };
  return jsonResult;

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
