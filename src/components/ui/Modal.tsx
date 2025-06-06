import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full mx-4 z-50 transform transition-all scale-100 opacity-100 ${className}`}>
        <div className="absolute right-4 top-4">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-8">
          {title && (
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;