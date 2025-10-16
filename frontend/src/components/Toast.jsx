import ReactDOM from 'react-dom';

export const Toast = ({ isVisible, message, type }) => {
  if (!isVisible) return null;

  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
  };

  const bgColor = typeClasses[type] || 'bg-gray-500';

  return ReactDOM.createPortal(
    <div className={`fixed bottom-5 right-5 text-white py-3 px-5 rounded-lg shadow-xl animate-fade-in-up ${bgColor}`}>
      {message}
    </div>,
    document.body
  );
};
