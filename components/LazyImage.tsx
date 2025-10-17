import React from 'react';
import { useLazyImage } from '../hooks/useLazyImage';

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  placeholder?: string; // 占位图
  showLoadingIndicator?: boolean; // 是否显示加载指示器
}

/**
 * 懒加载图片组件
 * 只在图片进入可视区域时才开始加载，提升页面性能
 * 
 * @example
 * <LazyImage 
 *   src="path/to/image.jpg"
 *   alt="描述"
 *   onClick={() => handleClick()}
 * />
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = '',
  className = '',
  style = {},
  onClick,
  placeholder,
  showLoadingIndicator = true
}) => {
  const { imgRef, src: loadedSrc, isLoaded, isInView } = useLazyImage(src, {
    threshold: 0.01,
    rootMargin: '200px' // 提前200px开始加载
  });

  // 默认占位图：灰色背景 + "加载中..." 文字
  const defaultPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3E加载中...%3C/text%3E%3C/svg%3E';

  return (
    <div
      ref={imgRef as any}
      className={`lazy-image-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        display: 'inline-block',
        ...style
      }}
      onClick={onClick}
    >
      {/* 图片元素 */}
      <img
        src={loadedSrc || placeholder || defaultPlaceholder}
        alt={alt}
        className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transition: 'opacity 0.3s ease-in-out',
          opacity: isLoaded ? 1 : 0.5,
          display: 'block'
        }}
      />
      
      {/* 加载指示器 */}
      {showLoadingIndicator && !isLoaded && isInView && (
        <div
          className="loading-indicator"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none'
          }}
        >
          {/* 加载动画 */}
          <div
            className="spinner"
            style={{
              width: '24px',
              height: '24px',
              border: '3px solid #e0e0e0',
              borderTop: '3px solid #666',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <span
            style={{
              color: '#666',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            加载中...
          </span>
        </div>
      )}
      
      {/* 添加旋转动画的样式 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};