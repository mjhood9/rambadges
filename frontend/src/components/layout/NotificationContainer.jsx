import Toast from './Toast';

const NotificationContainer = ({ toasts, removeNotification }) => {
    return (
        <div style={styles.container}>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={() => removeNotification(toast.id)}
                />
            ))}
        </div>
    );
};

const styles = {
    container: {
        position: 'fixed',
        top: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 9999,
    },
};

export default NotificationContainer;