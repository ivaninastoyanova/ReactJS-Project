async function request(path, data) {
    const response = await fetch(`http://localhost:3030/users${path}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const resData = await response.json();
    if(!response.ok) {
        throw new Error(resData.message);
    } 
    
    return resData;
}

export const login = async (email, password) => {
    return request('/login', { email, password });

};

export const register = (email, password) => {
    return request('/register', { email, password });
}