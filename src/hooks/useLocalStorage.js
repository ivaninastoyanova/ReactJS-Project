// import { useState } from "react";

// export default function useLocalStorage(key, initialValue) {
//     const [state, setState] = useState(() => {
//         try {
//             const item = localStorage.getItem(key);

//             if(item) {
//                 return JSON.parse(item);
//             }

//             return initialValue;
//         } catch (err) {
//             console.log(err);
//             return initialValue;
//         }
//     });

//     const setItem = (data) => {
//         try {
//             const stringifiedData = JSON.stringify(data);
//             localStorage.setItem(key, stringifiedData);
//             setState(data);
//         } catch (err) {
//             console.log(err.message);
//         }
//     }

//     return [
//         state,
//         setItem
//     ];
// }

import { useState } from "react";

const useLocalStorage = (key, initialValue) => {
  const [state, setState] = useState(() => {
    try {
      let item = localStorage.getItem(key);

      return item ? JSON.parse(item) : initialValue;
    } catch (err) {
      console.log(err);
      return initialValue;
    }
  });

  const setItem = (value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));

      setState(value);
    } catch (err) {
      console.log(err);
    }
  };

  return [state, setItem];
};

export default useLocalStorage;
