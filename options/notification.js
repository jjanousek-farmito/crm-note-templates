export function Notification(content) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = content;

    document.querySelector(".notifications").appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}