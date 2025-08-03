import React, { useState, useEffect } from 'react';
import { Icon } from '../Icon';
import type { FileWithId } from './ChatInput';

interface FilePreviewProps {
    files: FileWithId[];
    onRemoveFile: (id: string) => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ files, onRemoveFile }) => {
    const [enteringFileIds, setEnteringFileIds] = useState<Set<string>>(new Set());
    const [deletingFileIds, setDeletingFileIds] = useState<Set<string>>(new Set());
    const prevFileIds = React.useRef<Set<string>>(new Set());

    useEffect(() => {
        const currentFileIds = new Set(files.map(f => f.id));
        const newEnteringIds = new Set([...currentFileIds].filter(id => !prevFileIds.current.has(id)));
        
        if (newEnteringIds.size > 0) {
            setEnteringFileIds(prev => new Set([...prev, ...newEnteringIds]));
            setTimeout(() => {
                setEnteringFileIds(currentEntering => {
                    const nextSet = new Set(currentEntering);
                    newEnteringIds.forEach(id => nextSet.delete(id));
                    return nextSet;
                });
            }, 350);
        }
        prevFileIds.current = currentFileIds;
    }, [files]);
    
    const handleRemove = (idToRemove: string) => {
        setDeletingFileIds(prev => new Set(prev).add(idToRemove));
        setTimeout(() => {
            onRemoveFile(idToRemove);
            setDeletingFileIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(idToRemove);
                return newSet;
            });
        }, 350);
    };

    if (files.length === 0) return null;

    return (
        <div className="file-preview-container">
            {files.map(({ file, id }) => (
                <div key={id} className={`file-preview-wrapper ${enteringFileIds.has(id) ? 'entering' : ''} ${deletingFileIds.has(id) ? 'deleting' : ''}`}>
                    <div className="file-preview-item">
                        {file.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(file)} alt={file.name} onLoad={e => URL.revokeObjectURL(e.currentTarget.src)} />
                        ) : (
                            <div className="file-info"> <Icon icon="file" className="w-8 h-8"/> <span>{file.name}</span> </div>
                        )}
                        <button type="button" className="remove-file-btn" onClick={() => handleRemove(id)} aria-label={`Remove ${file.name}`}>
                            <Icon icon="close" className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
