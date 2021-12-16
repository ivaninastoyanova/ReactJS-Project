import { useState } from "react";

export default function useLocalStorage(key, initialValue) {
    const [state, setState] = useState(() => {
        try {
            const item = localStorage.getItem(key);

            if(item) {
                return JSON.parse(item);
            }

            return initialValue;
        } catch (err) {
            console.log(err);
            return initialValue;
        }
    });

    const setItem = (data) => {
        try {
            const stringifiedData = JSON.stringify(data);
            localStorage.setItem(key, stringifiedData);
            setState(data);
        } catch (err) {
            console.log(err.message);
        } 
    }

    return [
        state,
        setItem
    ];
}