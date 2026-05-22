import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { HelmetProvider } from 'react-helmet-async';
import './assets/styles/global.css';
import { NotificationProvider } from "./context/NotificationContext";
import { useEffect, useState, createContext } from "react";
import axios from "axios";

// 🌐 Global LP context (lightweight solution)
export const LaissezPasserContext = createContext();

const App = () => {

    const [laissezPasser, setLaissezPasser] = useState([]);

    // 🔁 AUTO REFRESH (scheduler sync)
    useEffect(() => {

        const fetchLP = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await axios.get(
                    "http://localhost:8080/api/laissezpasser",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setLaissezPasser(res.data);

            } catch (err) {
                console.error("LP sync error:", err);
            }
        };

        // initial load
        fetchLP();

        // refresh every 60 seconds
        const interval = setInterval(fetchLP, 60000);

        return () => clearInterval(interval);

    }, []);

    return (
        <div style={styles.container}>

            <div style={styles.triangle30}></div>
            <div style={styles.triangle45}></div>

            <HelmetProvider>
                <BrowserRouter>
                    <AuthProvider>
                        <NotificationProvider>

                            {/* ✅ GLOBAL CONTEXT PROVIDER */}
                            <LaissezPasserContext.Provider value={{
                                laissezPasser,
                                setLaissezPasser
                            }}>
                                <div style={styles.content}>
                                    <AppRoutes />
                                </div>
                            </LaissezPasserContext.Provider>

                        </NotificationProvider>
                    </AuthProvider>
                </BrowserRouter>
            </HelmetProvider>

        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(to bottom right, #ede4d4 50%, white 50%)`,
    },

    triangle30: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#f9f7f2',
        clipPath: 'polygon(50% 100%, 100% 0%, 0% 100%)',
        zIndex: 0,
    },

    triangle45: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#f3ede2',
        clipPath: 'polygon(31% 100%, 100% 0%, 0% 100%)',
        zIndex: 0,
    },

    content: {
        position: 'relative',
        zIndex: 1,
    },
};

export default App;