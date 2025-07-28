import React from 'react';
import { Icon } from './Icon';

interface CitationPanelProps {
  chunks: { web: { uri: string; title: string } }[];
}

export const CitationPanel: React.FC<CitationPanelProps> = ({ chunks }) => {
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="citations-panel">
      {chunks.map((chunk, index) => (
        <a
          href={chunk.web.uri}
          key={index}
          target="_blank"
          rel="noopener noreferrer"
          className="citation-item"
        >
          <div className="citation-index">{index + 1}</div>
          <div className="citation-content">
            <p className="citation-title">{chunk.web.title}</p>
            <p className="citation-uri">{chunk.web.uri}</p>
          </div>
        </a>
      ))}
    </div>
  );
};
