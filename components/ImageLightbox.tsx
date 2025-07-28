import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from './Icon';

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200); // Faster close animation
  };

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Prevent background scroll
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ReactDOM.createPortal(
    <>
      <div
        className={`lightbox-backdrop ${isVisible ? 'visible' : ''} ${isClosing ? 'closing' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      ></div>
      <div className={`lightbox-content ${isVisible ? 'visible' : ''} ${isClosing ? 'closing' : ''}`}>
        <img src={src} alt="Enlarged view" />
        <button
          className="lightbox-close-btn"
          onClick={handleClose}
          aria-label="Close image view"
        >
          <Icon icon="close" className="w-6 h-6" />
        </button>
      </div>
    </>,
    document.body
  );
};
