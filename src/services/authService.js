// async function request(path, data) {
//     const response = await fetch(`http://localhost:3030/users${path}`, {
//         method: 'POST',
//         headers: {
//             'content-type': 'application/json'
//         },
//         body: JSON.stringify(data)
//     });

//     const resData = await response.json();
//     if(!response.ok) {
//         throw new Error(resData.message);
//     }

//     return resData;
// }

// export const login = async (email, password) => {
//     return request('/login', { email, password });

// };

// export const register = (email, password) => {
//     return request('/register', { email, password });
// }

const baseUrl = "http://localhost:3030";

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
    return jsonResult;
  } else {
    throw jsonResult.message;
  }
};

export const register = (email, password) => {
  return fetch(`${baseUrl}/users/register`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  }).then((res) => res.json());
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
