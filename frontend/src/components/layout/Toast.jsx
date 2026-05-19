import { useEffect, useState } from 'react';

const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

const colors = {
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#333',
};

const Toast = ({ message, type = 'info', onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // trigger animation
        setTimeout(() => setVisible(true), 10);
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div
            style={{
                ...styles.toast,
                borderLeft: `4px solid ${colors[type]}`,
                transform: visible ? 'translateX(0)' : 'translateX(120%)',
                opacity: visible ? 1 : 0,
            }}
        >
            <div style={styles.icon}>{icons[type]}</div>

            <div style={styles.message}>{message}</div>

            <button onClick={handleClose} style={styles.close}>
                ×
            </button>
        </div>
    );
};

const styles = {
    toast: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#fff',
        color: '#333',
        padding: '12px 16px',
        borderRadius: '10px',
        minWidth: '260px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        fontSize: '14px',
    },

    icon: {
        fontSize: '18px',
        fontWeight: 'bold',
    },

    message: {
        flex: 1,
    },

    close: {
        border: 'none',
        background: 'transparent',
        fontSize: '16px',
        cursor: 'pointer',
        opacity: 0.6,
    },
};

export default Toast;