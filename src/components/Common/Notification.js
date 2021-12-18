import { Toast } from 'react-bootstrap';
import { useNotificationContext } from '../../contexts/NotificationContext';
import './Notification.css';

const Notification = () => {
    const { notification, hideNotification } = useNotificationContext();

    if (!notification.show) {
        return null;
    }

    return (
        <Toast className="notification d-inline-block m-1" bg={notification.type} onClose={hideNotification} position="middle-center">
            
            <Toast.Body>
                {notification.message}
            </Toast.Body>
        </Toast>
    );
};

export default Notification;