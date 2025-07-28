import React, { useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from './Icon';
import { CitationPanel } from './CitationPanel';

interface CitationDrawerProps {
  chunks: { web: { uri: string; title: string } }[];
  onClose: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({ chunks, onClose }) => {
  const handleClose = useCallback(() => {
    document.body.classList.remove('drawer-open');
    setTimeout(onClose, 400); // Allow animation to finish, matches --transition-fluid
  }, [onClose]);
  
  useEffect(() => {
    // Add class to body to show drawer and backdrop
    // Use requestAnimationFrame to ensure the transition is applied
    requestAnimationFrame(() => {
        document.body.classList.add('drawer-open');
    });
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Failsafe in case component unmounts unexpectedly.
      // The primary removal is in handleClose to time it with the animation.
      document.body.classList.remove('drawer-open');
    };
  }, [handleClose]);

  return ReactDOM.createPortal(
    <>
      <div 
        className="drawer-backdrop" // visibility controlled by parent body class
        onClick={handleClose}
      />
      <aside className="drawer"> {/* visibility controlled by parent body class */}
        <header className="drawer-header">
          <h4 className="text-xl font-bold">Sources</h4>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2" aria-label="Close">
            <Icon icon="close" className="w-5 h-5"/>
          </button>
        </header>
        <div className="drawer-body overflow-y-auto -mr-4 pr-4">
          <CitationPanel chunks={chunks} />
        </div>
      </aside>
    </>,
    document.body
  );
};
