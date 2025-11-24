
import React, { useEffect, useState } from 'react';
import { CheckCircleIcon } from './icons';

interface ToastProps {
  message: string;
  onClear: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClear }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        // Allow time for fade-out animation before clearing message
        setTimeout(onClear, 300); 
      }, 3000); // Display for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  return (
    <div
      className={`fixed top-5 right-5 z-[100] flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-lg transition-all duration-300 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg">
        <CheckCircleIcon className="w-5 h-5" />
      </div>
      <div className="ml-3 text-sm font-normal">{message}</div>
    </div>
  );
};

export default Toast;
