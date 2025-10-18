import React, { useState, useEffect } from 'react';
import { Icon } from '../Icon';
import { 
  getAllPDFDocumentsList, 
  getPDFDocument, 
  deletePDFDocument,
  clearAllPDFDocuments,
  searchPDFDocuments 
} from '../../services/indexedDBService';
import { formatFileSize } from '../../services/pdfService';

interface PDFManagementProps {
  visibleIds: Set<string>;
}

export const PDFManagement: React.FC<PDFManagementProps> = ({ visibleIds }) => {
  const [pdfList, setPdfList] = useState<Array<{
    id: string;
    fileName: string;
    fileSize: number;
    pageCount: number;
    parsedAt: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPdf, setSelectedPdf] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadPDFList();
  }, []);

  const loadPDFList = async () => {
    setIsLoading(true);
    try {
      const list = await getAllPDFDocumentsList();
      setPdfList(list.sort((a, b) => b.parsedAt - a.parsedAt));
    } catch (error) {
      console.error('加载PDF列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPDFList();
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchPDFDocuments(searchQuery);
      setPdfList(results);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm(`确定要删除 "${fileName}" 吗？`)) return;
    
    try {
      await deletePDFDocument(id);
      setPdfList(prev => prev.filter(pdf => pdf.id !== id));
      if (selectedPdf?.id === id) {
        setSelectedPdf(null);
        setShowPreview(false);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleClearAll = async () => {
    if (!confirm(`确定要清除所有 ${pdfList.length} 个PDF文档吗？此操作不可恢复！`)) return;
    
    try {
      await clearAllPDFDocuments();
      setPdfList([]);
      setSelectedPdf(null);
      setShowPreview(false);
    } catch (error) {
      console.error('清除失败:', error);
      alert('清除失败');
    }
  };

  const handleViewDetails = async (pdf: any) => {
    try {
      const fullPdf = await getPDFDocument(pdf.id);
      setSelectedPdf(fullPdf);
      setShowPreview(true);
    } catch (error) {
      console.error('加载PDF详情失败:', error);
      alert('加载失败');
    }
  };

  // PDF管理界面始终显示在数据标签中，不受搜索过滤
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-[var(--text-color-secondary)] uppercase tracking-wider">
            PDF文档库 ({pdfList.length})
          </h4>
          {pdfList.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <Icon icon="delete" className="w-3 h-3" />
              清除全部
            </button>
          )}
        </div>

        {/* 搜索框 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索PDF文件名..."
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background-secondary)] text-[var(--text-color)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
          />
          <button
            onClick={handleSearch}
            className="btn-outline px-4 py-2 text-sm"
          >
            <Icon icon="search" className="w-4 h-4" />
          </button>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                loadPDFList();
              }}
              className="btn-outline px-4 py-2 text-sm"
            >
              重置
            </button>
          )}
        </div>

        {/* PDF列表 */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-[var(--text-color-secondary)]">
              加载中...
            </div>
          ) : pdfList.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-color-secondary)]">
              {searchQuery ? '未找到匹配的PDF文档' : '暂无PDF文档'}
            </div>
          ) : (
            pdfList.map((pdf) => (
              <div
                key={pdf.id}
                className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded bg-red-500 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-[var(--text-color)] truncate">
                      {pdf.fileName}
                    </h5>
                    <div className="flex gap-3 mt-1 text-xs text-[var(--text-color-secondary)]">
                      <span>📄 {pdf.pageCount}页</span>
                      <span>💾 {formatFileSize(pdf.fileSize)}</span>
                      <span>🕒 {new Date(pdf.parsedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleViewDetails(pdf)}
                      className="p-1.5 rounded hover:bg-[var(--background-primary)] text-[var(--text-color-secondary)] hover:text-[var(--accent-color)]"
                      title="查看详情"
                    >
                      <Icon icon="eye" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pdf.id, pdf.fileName)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-color-secondary)] hover:text-red-500"
                      title="删除"
                    >
                      <Icon icon="delete" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PDF预览模态框 */}
      {showPreview && selectedPdf && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-[var(--background-primary)] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text-color)]">
                PDF详情
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--text-color-secondary)]"
              >
                <Icon icon="close" className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-color-secondary)] mb-2">
                    文件信息
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-[var(--text-color-secondary)]">文件名：</span>
                      <span className="text-[var(--text-color)]">{selectedPdf.fileName}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-color-secondary)]">大小：</span>
                      <span className="text-[var(--text-color)]">{formatFileSize(selectedPdf.fileSize)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-color-secondary)]">页数：</span>
                      <span className="text-[var(--text-color)]">{selectedPdf.pageCount}页</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-color-secondary)]">字符数：</span>
                      <span className="text-[var(--text-color)]">{selectedPdf.extractedText.length.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedPdf.metadata && (selectedPdf.metadata.title || selectedPdf.metadata.author) && (
                  <div>
                    <h4 className="text-sm font-medium text-[var(--text-color-secondary)] mb-2">
                      元数据
                    </h4>
                    <div className="space-y-1 text-sm">
                      {selectedPdf.metadata.title && (
                        <div>
                          <span className="text-[var(--text-color-secondary)]">标题：</span>
                          <span className="text-[var(--text-color)]">{selectedPdf.metadata.title}</span>
                        </div>
                      )}
                      {selectedPdf.metadata.author && (
                        <div>
                          <span className="text-[var(--text-color-secondary)]">作者：</span>
                          <span className="text-[var(--text-color)]">{selectedPdf.metadata.author}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-[var(--text-color-secondary)] mb-2">
                    文本内容预览（前500字符）
                  </h4>
                  <div className="p-3 rounded-lg bg-[var(--background-secondary)] text-sm text-[var(--text-color)] whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {selectedPdf.extractedText.substring(0, 500)}
                    {selectedPdf.extractedText.length > 500 && '...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};