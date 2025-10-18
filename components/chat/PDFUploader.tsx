import React, { useState, useRef } from 'react';
import { parsePDFFile, validatePDFFile, formatFileSize, PDFParseProgress, PDFParseResult } from '../../services/pdfService';
import { savePDFDocument } from '../../services/indexedDBService';

interface PDFUploaderProps {
  onPDFParsed: (result: PDFParseResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({ 
  onPDFParsed, 
  onError,
  disabled = false 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<PDFParseProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // 验证文件
    const validation = validatePDFFile(file);
    if (!validation.valid) {
      onError?.(validation.error || '文件验证失败');
      return;
    }

    setIsProcessing(true);
    setProgress({
      current: 0,
      total: 100,
      percentage: 0,
      status: 'parsing',
      message: '准备解析...'
    });

    try {
      // 解析PDF
      console.log('[PDFUploader] 开始解析PDF:', file.name);
      const result = await parsePDFFile(file, (prog) => {
        setProgress(prog);
      });
      console.log('[PDFUploader] PDF解析完成:', result);

      // 保存到IndexedDB
      console.log('[PDFUploader] 开始保存到IndexedDB...');
      await savePDFDocument(result);
      console.log('[PDFUploader] 保存成功');

      // 通知父组件
      onPDFParsed(result);

      setProgress({
        current: 100,
        total: 100,
        percentage: 100,
        status: 'completed',
        message: '✓ 解析完成'
      });

      // 2秒后清除进度
      setTimeout(() => {
        setProgress(null);
        setIsProcessing(false);
      }, 2000);

    } catch (error) {
      console.error('[PDFUploader] 错误:', error);
      const errorMessage = error instanceof Error ? error.message : '解析失败';
      onError?.(errorMessage);
      setProgress({
        current: 0,
        total: 0,
        percentage: 0,
        status: 'error',
        message: `✗ ${errorMessage}`
      });
      
      setTimeout(() => {
        setProgress(null);
        setIsProcessing(false);
      }, 3000);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="pdf-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || isProcessing}
      />
      
      <button
        onClick={handleButtonClick}
        disabled={disabled || isProcessing}
        className="pdf-upload-button"
        title="上传PDF文件"
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          background: 'var(--background-secondary)',
          cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          opacity: disabled || isProcessing ? 0.5 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        {isProcessing ? '解析中...' : 'PDF'}
      </button>

      {progress && (
        <div 
          className="pdf-progress-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div 
            className="pdf-progress-card"
            style={{
              background: 'var(--background-primary)',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '320px',
              maxWidth: '400px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '18px',
              fontWeight: 600 
            }}>
              PDF 解析进度
            </h3>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}>
                <span>{progress.message}</span>
                <span>{progress.percentage}%</span>
              </div>
              
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--background-secondary)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress.percentage}%`,
                  height: '100%',
                  backgroundColor: progress.status === 'error' 
                    ? '#ef4444' 
                    : progress.status === 'completed' 
                    ? '#10b981' 
                    : '#3b82f6',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {progress.total > 0 && progress.status === 'parsing' && (
              <div style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                {progress.current} / {progress.total} 页
              </div>
            )}

            {progress.status === 'completed' && (
              <div style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '6px',
                color: '#10b981',
                fontSize: '13px',
                textAlign: 'center'
              }}>
                ✓ 文档已保存到本地数据库
              </div>
            )}

            {progress.status === 'error' && (
              <div style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '6px',
                color: '#ef4444',
                fontSize: '13px',
                textAlign: 'center'
              }}>
                {progress.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};