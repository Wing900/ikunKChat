import { useEffect, useRef, useState } from 'react';

interface UseLazyImageOptions {
  threshold?: number; // 提前加载的阈值（0-1）
  rootMargin?: string; // 提前加载的距离，如 '200px' 表示距离可视区域200px时开始加载
}

/**
 * 图片懒加载 Hook
 * 使用 Intersection Observer API 实现图片的延迟加载
 * 
 * @param imageSrc - 图片的源地址
 * @param options - 配置选项
 * @returns 包含图片引用、加载状态等的对象
 */
export function useLazyImage(
  imageSrc: string,
  options: UseLazyImageOptions = {}
) {
  const { threshold = 0.01, rootMargin = '200px' } = options;
  const [src, setSrc] = useState<string>(''); // 实际加载的src
  const [isLoaded, setIsLoaded] = useState(false); // 是否已加载完成
  const [isInView, setIsInView] = useState(false); // 是否在可视区域
  const imgRef = useRef<HTMLElement>(null);

  // 监听元素是否进入可视区域
  useEffect(() => {
    if (!imgRef.current) return;

    // 创建 Intersection Observer 实例
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 元素进入可视区域
            setIsInView(true);
            // 一旦进入视口，停止观察（避免重复触发）
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        threshold, // 元素可见比例达到此值时触发
        rootMargin // 提前触发的距离（负值则延迟触发）
      }
    );

    observer.observe(imgRef.current);

    // 清理函数：组件卸载时停止观察
    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [threshold, rootMargin]);

  // 当元素进入可视区域时，开始加载图片
  useEffect(() => {
    if (isInView && imageSrc && !src) {
      // 预加载图片（不直接设置到 img.src，避免渲染未完成的图片）
      const img = new Image();
      
      img.onload = () => {
        // 图片加载成功
        setSrc(imageSrc);
        setIsLoaded(true);
      };
      
      img.onerror = () => {
        // 图片加载失败，仍然设置 src（让浏览器显示损坏图标）
        setSrc(imageSrc);
        setIsLoaded(true);
      };
      
      // 开始加载
      img.src = imageSrc;
    }
  }, [isInView, imageSrc, src]);

  return { 
    imgRef,      // 绑定到目标元素的 ref
    src,         // 实际的图片地址（加载完成后才有值）
    isLoaded,    // 是否已加载完成
    isInView     // 是否在可视区域内
  };
}