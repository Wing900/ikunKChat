import React, { useState, useEffect } from 'react';

type View = 'chat' | 'personas' | 'editor' | 'archive' | 'translate';

interface ViewContainerProps {
    view: View;
    activeView: View;
    children: React.ReactNode;
}

export const ViewContainer: React.FC<ViewContainerProps> = ({ view, activeView, children }) => {
    const isCurrentlyActive = view === activeView;
    const [isMounted, setIsMounted] = useState(isCurrentlyActive);
    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        if (isCurrentlyActive) {
            setIsMounted(true);
            const id = requestAnimationFrame(() => setIsRendered(true));
            return () => cancelAnimationFrame(id);
        } else {
            setIsRendered(false);
        }
    }, [isCurrentlyActive]);

    const handleTransitionEnd = () => {
        if (!isCurrentlyActive) {
            setIsMounted(false);
        }
    };

    if (!isMounted) {
        return null;
    }

    return (
        <div
            className={`view-container ${isRendered ? 'active' : ''}`}
            onTransitionEnd={handleTransitionEnd}
        >
            {children}
        </div>
    );
};
