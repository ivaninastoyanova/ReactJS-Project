import { createContext, useContext, useState, useCallback } from "react";

export const NotificationContext = createContext();

const initialNotificationState = {
  show: false,
  message: "",
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(initialNotificationState);

  const addNotification = useCallback(
    (message) => {
      setNotification({ show: true, message});

      setTimeout(() => {
        setNotification(initialNotificationState);
      }, 5000);
      
    },
    [initialNotificationState]
  );

  const hideNotification = useCallback(
    () => setNotification(initialNotificationState),
    [initialNotificationState]
  );

  return (
    <NotificationContext.Provider
      value={{ notification, addNotification, hideNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const state = useContext(NotificationContext);

  return state;
};
