import React from 'react';

interface SuggestedRepliesProps {
  suggestions: string[];
  onSendSuggestion: (suggestion: string) => void;
}

export const SuggestedReplies: React.FC<SuggestedRepliesProps> = ({ suggestions, onSendSuggestion }) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="suggestions-container">
      {suggestions.map((text, index) => (
        <button
          key={index}
          onClick={() => onSendSuggestion(text)}
          className="suggestion-chip"
        >
          {text}
        </button>
      ))}
    </div>
  );
};
