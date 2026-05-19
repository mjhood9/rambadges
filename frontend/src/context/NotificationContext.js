// context/NotificationContext.jsx
import { createContext, useContext, useState } from 'react';
import NotificationContainer from '../components/layout/NotificationContainer';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addNotification = (message, type = 'info') => {
        const id = Date.now();

        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeNotification(id);
        }, 4000);
    };

    const removeNotification = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <NotificationContainer
                toasts={toasts}
                removeNotification={removeNotification}
            />
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);