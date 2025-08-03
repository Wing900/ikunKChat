import React from 'react';

interface InternalViewProps {
    active: boolean;
    children: React.ReactNode;
}

export const InternalView: React.FC<InternalViewProps> = ({ active, children }) => {
    return (
        <div 
            className="absolute inset-0 flex flex-col transition-all duration-300 ease-in-out"
            style={{
                opacity: active ? 1 : 0,
                transform: `scale(${active ? 1 : 0.98})`,
                pointerEvents: active ? 'auto' : 'none',
            }}
        >
            {children}
        </div>
    );
};
