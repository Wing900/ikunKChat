import React, { useState } from 'react';
import { PersonaMemory } from '../../types';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';

interface MemoryManagerProps {
  personaId: string;
  memories: PersonaMemory[];
  onAddMemory: (personaId: string, content: string) => void;
  onUpdateMemory: (personaId: string, memoryId: string, content: string) => void;
  onDeleteMemory: (personaId: string, memoryId: string) => void;
}

export const MemoryManager: React.FC<MemoryManagerProps> = ({ personaId, memories, onAddMemory, onUpdateMemory, onDeleteMemory }) => {
  const { t } = useLocalization();
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [editingMemory, setEditingMemory] = useState<{ id: string; content: string } | null>(null);

  const handleAddMemory = () => {
    if (newMemoryContent.trim()) {
      onAddMemory(personaId, newMemoryContent.trim());
      setNewMemoryContent('');
    }
  };

  const handleUpdateMemory = () => {
    if (editingMemory && editingMemory.content.trim()) {
      onUpdateMemory(personaId, editingMemory.id, editingMemory.content.trim());
      setEditingMemory(null);
    }
  };

  return (
    <div className="p-4 rounded-[var(--radius-2xl)] glass-pane flex flex-col gap-4">
      <h3 className="font-semibold">{t('personaMemory')}</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={newMemoryContent}
          onChange={(e) => setNewMemoryContent(e.target.value)}
          placeholder={t('addMemoryPlaceholder')}
          className="input-glass flex-grow"
          onKeyPress={(e) => e.key === 'Enter' && handleAddMemory()}
        />
        <button onClick={handleAddMemory} className="button-glass">
          <Icon icon="plus" />
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-2">
        {memories.map((memory) => (
          <div key={memory.id} className="flex items-center gap-2 p-2 rounded-md bg-black/5 dark:bg-white/5">
            {editingMemory?.id === memory.id ? (
              <input
                type="text"
                value={editingMemory.content}
                onChange={(e) => setEditingMemory({ ...editingMemory, content: e.target.value })}
                className="input-glass flex-grow"
                onBlur={handleUpdateMemory}
                onKeyPress={(e) => e.key === 'Enter' && handleUpdateMemory()}
                autoFocus
              />
            ) : (
              <p className="flex-grow text-sm" onDoubleClick={() => setEditingMemory({ id: memory.id, content: memory.content })}>
                {memory.content}
              </p>
            )}
            <button onClick={() => onDeleteMemory(personaId, memory.id)} className="button-glass-danger">
              <Icon icon="delete" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};