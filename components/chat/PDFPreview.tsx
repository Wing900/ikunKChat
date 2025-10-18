import React from 'react';
import { PDFParseResult } from '../../services/pdfService';
import { formatFileSize } from '../../services/pdfService';

interface PDFPreviewProps {
  pdf: PDFParseResult;
  onRemove?: () => void;
  showFullText?: boolean;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ 
  pdf, 
  onRemove,
  showFullText = false 
}) => {
  const textPreview = showFullText 
    ? pdf.extractedText 
    : pdf.extractedText.substring(0, 300) + (pdf.extractedText.length > 300 ? '...' : '');

  return (
    <div 
      className="pdf-preview-card"
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '12px',
        backgroundColor: 'var(--background-secondary)',
        marginBottom: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* PDF图标 */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '6px',
          backgroundColor: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>

        {/* 文件信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '4px' 
          }}>
            <h4 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              {pdf.fileName}
            </h4>
            {onRemove && (
              <button
                onClick={onRemove}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
                title="移除PDF"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '8px'
          }}>
            <span>📄 {pdf.pageCount} 页</span>
            <span>💾 {formatFileSize(pdf.fileSize)}</span>
            <span>📝 {pdf.extractedText.length.toLocaleString()} 字符</span>
          </div>

          {/* 元数据 */}
          {pdf.metadata?.author && (
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginTop: '4px'
            }}>
              <strong>作者:</strong> {pdf.metadata.author}
            </div>
          )}

          {/* 状态标签 */}
          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#10b981'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            已解析并保存到本地
          </div>
        </div>
      </div>
    </div>
  );
};