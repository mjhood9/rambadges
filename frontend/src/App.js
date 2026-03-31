import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { HelmetProvider } from 'react-helmet-async';
import './assets/styles/global.css';

const App = () => {
    return (
        <div style={styles.container}>
            {/* Triangle background 1 - 30° */}
            <div style={styles.triangle30}></div>

            {/* Triangle background 2 - 45° */}
            <div style={styles.triangle45}></div>

            {/* Main app content */}
            <HelmetProvider>
                <BrowserRouter>
                    <AuthProvider>
                        <div style={styles.content}>
                            <AppRoutes />
                        </div>
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
        background: `linear-gradient(to bottom right, #ede4d4 50%, white 50%)`, // base gradient
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
        background: '#f3ede2', // slightly darker grey
        clipPath: 'polygon(31% 100%, 100% 0%, 0% 100%)',
        zIndex: 0,
    },

    content: {
        position: 'relative',
        zIndex: 1, // main content above triangles
    },
};

export default App;