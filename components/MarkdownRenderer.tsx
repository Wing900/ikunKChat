import React, { useEffect, useRef, useCallback, useState } from 'react';
import { marked } from 'marked';
import type { Tokens } from 'marked';
import mermaid from 'mermaid';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Declare global variables from CDN scripts
declare const DOMPurify: any;
declare const hljs: any;

const renderer = new marked.Renderer();

// Override for code blocks
renderer.code = ({ text: code, lang }: { text: string; lang?: string; }): string => {
    // Defensive check: ensure code is a string.
    const codeString = String(code || '');
    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';

    if (language === 'mermaid') {
        return `<div class="mermaid">${codeString}</div>`;
    }
    
    // 安全转义代码内容
    const safeCodeString = codeString
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#x27;');
    
    const highlightedCode = hljs.highlight(safeCodeString, { language }).value;

    return `
        <div class="code-block-wrapper">
            <div class="code-block-header">
                <span class="code-block-lang">${language}</span>
                <button class="code-block-copy-btn" data-tooltip="Copy code" data-tooltip-placement="top">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    <span class="copy-text">Copy</span>
                </button>
            </div>
            <pre><code class="hljs language-${language}">${highlightedCode}</code></pre>
        </div>
    `;
};

// Override for task lists to provide custom styling.
// In newer versions of marked, we need to use item.tokens to render nested content properly.
renderer.listitem = (item: Tokens.ListItem): string => {
    // Use the parser to render the tokens, which includes nested lists
    const textAsHtml = item.tokens ? marked.parser(item.tokens) : item.text;

    if (item.task) {
        // Handle GFM task list items.
        const checkboxHtml = `<input type="checkbox" ${item.checked ? 'checked' : ''} disabled />`;
        return `<li class="task-list-item">${checkboxHtml}<div>${textAsHtml}</div></li>`;
    }
    
    // Handle regular list items with nested content.
    return `<li>${textAsHtml}</li>`;
};


marked.setOptions({
    gfm: true,
    breaks: true,
    renderer: renderer,
});


if (typeof DOMPurify !== 'undefined') {
    DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
        if (node.tagName === 'A') {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

interface MarkdownRendererProps {
  content: string;
  theme: 'light' | 'dark';
  isInVirtualView?: boolean; // 是否在虚拟视图中
  messageId?: string; // 消息ID用于追踪
  isBatchRendered?: boolean; // 是否为分批渲染的消息
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  theme,
  isInVirtualView = false,
  messageId,
  isBatchRendered = false
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [mathRendered, setMathRendered] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleCopyClick = useCallback((e: MouseEvent) => {
    const button = (e.target as HTMLElement).closest('.code-block-copy-btn');
    if (button) {
        const wrapper = button.closest('.code-block-wrapper');
        const codeElement = wrapper?.querySelector('code');
        if (codeElement) {
            // 获取原始文本内容，移除所有 katex-placeholder 和其他渲染产物
            let code = codeElement.textContent || '';
            
            // 如果 textContent 仍包含占位符，尝试从原始 HTML 提取
            if (code.includes('katex-placeholder')) {
                // 创建临时元素来解析
                const temp = document.createElement('div');
                temp.innerHTML = codeElement.innerHTML;
                
                // 移除所有 katex 相关元素
                temp.querySelectorAll('.katex, .katex-placeholder, .katex-html, .katex-mathml').forEach(el => el.remove());
                code = temp.textContent || '';
            }
            
            navigator.clipboard.writeText(code);
            const copyTextSpan = button.querySelector('.copy-text');
            if (copyTextSpan) {
                const originalText = copyTextSpan.textContent;
                copyTextSpan.textContent = 'Copied!';
                button.setAttribute('data-tooltip', 'Copied!');
                setTimeout(() => {
                    copyTextSpan.textContent = originalText;
                    button.setAttribute('data-tooltip', 'Copy code');
                }, 2000);
            }
        }
    }
  }, []);
  
  useEffect(() => {
    if (!contentRef.current) return;
    const currentRef = contentRef.current;

// --- Step 1: Protect code blocks and extract math expressions ---
    let processedContent = content || '';
    const mathPlaceholders: { id: string; content: string; isDisplay: boolean }[] = [];
    const codeBlockPlaceholders: { id: string; content: string }[] = [];
    let placeholderIndex = 0;
    let codeBlockIndex = 0;

    // 首先保护代码块（包括行内代码和代码块）
    // 保护代码块 ```...```（必须在行内代码之前处理）
    processedContent = processedContent.replace(/```[\s\S]*?```/g, (match) => {
      const id = `CODE_BLOCK_PLACEHOLDER_${codeBlockIndex++}`;
      codeBlockPlaceholders.push({ id, content: match });
      return id;
    });

    // 保护行内代码 `...`（使用更精确的匹配，避免跨行）
    processedContent = processedContent.replace(/`([^`]+?)`/g, (match) => {
      const id = `CODE_BLOCK_PLACEHOLDER_${codeBlockIndex++}`;
      codeBlockPlaceholders.push({ id, content: match });
      return id;
    });

    // 现在提取数学表达式（代码块已被保护）
    // Extract display math ($$...$$ and \[...\])
    processedContent = processedContent.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
      const id = `MATH_PLACEHOLDER_${placeholderIndex++}`;
      mathPlaceholders.push({ id, content: content, isDisplay: true });
      return id;
    });

    processedContent = processedContent.replace(/\\\[([\s\S]*?)\\\]/g, (match, content) => {
      const id = `MATH_PLACEHOLDER_${placeholderIndex++}`;
      mathPlaceholders.push({ id, content: content, isDisplay: true });
      return id;
    });

    // Extract inline math ($...$ and \(...\))
    processedContent = processedContent.replace(/\$([^\$\n]+?)\$/g, (match, content) => {
      const id = `MATH_PLACEHOLDER_${placeholderIndex++}`;
      mathPlaceholders.push({ id, content: content, isDisplay: false });
      return id;
    });

    processedContent = processedContent.replace(/\\\((.+?)\\\)/g, (match, content) => {
      const id = `MATH_PLACEHOLDER_${placeholderIndex++}`;
      mathPlaceholders.push({ id, content: content, isDisplay: false });
      return id;
    });

    // 恢复代码块
    codeBlockPlaceholders.forEach(({ id, content }) => {
      processedContent = processedContent.replace(id, content);
    });

    // --- Step 2: Parse Markdown to HTML ---
    const rawHtml = marked.parse(processedContent) as string;

    // Sanitize HTML
    const cleanHtml = typeof DOMPurify !== 'undefined'
      ? DOMPurify.sanitize(rawHtml, {
        USE_PROFILES: { html: true, svg: true, svgFilters: true },
        ADD_TAGS: ["iframe", "span", "svg", "path", "style"],
        ADD_ATTR: [
          "allow", "allowfullscreen", "frameborder", "scrolling", "class", "style",
          "aria-hidden", "d", "transform", "viewBox", "xmlns", "version", "width", "height", "data-katex-id"
        ],
        FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout'],
        ALLOW_DATA_URI: false,
      })
      : rawHtml;

    // Inject into DOM
    currentRef.innerHTML = cleanHtml;

    // --- Step 3: Restore and render math expressions with KaTeX ---
    // Use TreeWalker to find text nodes containing placeholders, but skip code blocks
    const walker = document.createTreeWalker(
        currentRef,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                let parent = node.parentElement;
                while (parent && parent !== currentRef) {
                    // Skip code blocks, pre blocks, and code-block-wrapper
                    if (parent.tagName === 'CODE' ||
                        parent.tagName === 'PRE' ||
                        parent.classList.contains('code-block-wrapper') ||
                        parent.classList.contains('code-block-header')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    parent = parent.parentElement;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const textNodes: Text[] = [];
    let currentNode: Node | null;
    while (currentNode = walker.nextNode()) {
        textNodes.push(currentNode as Text);
    }

    // Process text nodes to restore math placeholders
    textNodes.forEach(node => {
        const text = node.textContent || '';
        if (!text.includes('MATH_PLACEHOLDER_')) {
            return; // Skip if no placeholders
        }

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;

        // Find all math placeholders
        const placeholderRegex = /MATH_PLACEHOLDER_(\d+)/g;

        while ((match = placeholderRegex.exec(text)) !== null) {
            // Add text before placeholder
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }

            const placeholderIdx = parseInt(match[1], 10);
            const mathData = mathPlaceholders[placeholderIdx];

            if (mathData) {
                // Create span for KaTeX rendering
                const span = document.createElement('span');
                span.className = 'katex-placeholder';
                
                try {
                    katex.render(mathData.content, span, {
                        throwOnError: false,
                        displayMode: mathData.isDisplay,
                        errorColor: '#cc0000',
                        strict: false,
                        trust: true,
                        macros: {
                            "\\f": "#1f(#2)",
                            "\\R": "\\mathbb{R}",
                            "\\N": "\\mathbb{N}",
                            "\\Z": "\\mathbb{Z}",
                            "\\Q": "\\mathbb{Q}",
                            "\\C": "\\mathbb{C}",
                            "\\abs": "\\left| #1 \\right|",
                            "\\norm": "\\left\\| #1 \\right\|",
                            "\\pdv": "\\frac{\\partial #1}{\\partial #2}",
                            "\\dv": "\\frac{d #1}{d #2}"
                        }
                    });
                } catch (error) {
                    console.error('KaTeX rendering error:', error);
                    span.textContent = `[Math Error: ${mathData.content}]`;
                }

                fragment.appendChild(span);
            } else {
                // Placeholder not found, keep original text
                fragment.appendChild(document.createTextNode(match[0]));
            }

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        // Replace original text node with fragment (only if we found placeholders)
        if (lastIndex > 0) {
            node.replaceWith(fragment);
        }
    });

    // Highlight code blocks
    currentRef.querySelectorAll('pre code').forEach((block) => {
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(block as HTMLElement);
        }
    });

    // Render Mermaid diagrams
    try {
        mermaid.initialize({
            startOnLoad: false,
            theme: theme === 'dark' ? 'dark' : 'default',
            securityLevel: 'loose',
            flowchart: { useMaxWidth: true },
            sequence: { useMaxWidth: true },
            gantt: { useMaxWidth: true },
        });
        const mermaidElements = currentRef.querySelectorAll<HTMLElement>('.mermaid');
        if (mermaidElements.length > 0) {
            mermaid.run({ nodes: mermaidElements });
        }
    } catch (error) {
        console.error('Mermaid rendering error:', error);
    }

    currentRef.addEventListener('click', handleCopyClick);
    return () => {
        currentRef.removeEventListener('click', handleCopyClick);
    }

  }, [content, theme, handleCopyClick]);

  // 分批渲染优化：对于后续批次的消息，延迟渲染公式
  useEffect(() => {
    if (isBatchRendered) {
      // 对于分批渲染的消息，延迟150ms开始公式渲染
      const timer = setTimeout(() => {
        if (!mathRendered) {
          renderMathExpressions();
          setMathRendered(true);
        }
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [isBatchRendered, mathRendered]);

  // 懒加载逻辑：只在组件可见时进行公式渲染
  useEffect(() => {
    if (!contentRef.current) return;

    // 如果不在虚拟视图中，直接渲染
    if (!isInVirtualView) {
      setIsVisible(true);
      return;
    }

    // 使用Intersection Observer检测可见性
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
        
        // 当组件变得可见且数学公式还没有渲染时，开始渲染
        if (entry.isIntersecting && !mathRendered) {
          setTimeout(() => {
            renderMathExpressions();
            setMathRendered(true);
          }, 100); // 延迟100ms渲染，避免频繁触发
        }
      },
      {
        root: null,
        rootMargin: '100px', // 提前100px开始渲染
        threshold: 0.1
      }
    );

    observerRef.current = observer;
    observer.observe(contentRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isInVirtualView, content, mathRendered]);

  // 独立的公式渲染函数
  const renderMathExpressions = useCallback(() => {
    if (!contentRef.current) return;

    const currentRef = contentRef.current;
    
    // 检查是否已经有占位符
    if (currentRef.textContent?.includes('MATH_PLACEHOLDER_')) {
      // 如果有占位符，直接处理
      processMathPlaceholders(currentRef);
    } else {
      // 如果没有占位符，说明公式已经在主渲染流程中处理过了
      console.log('Math expressions already rendered in main flow');
    }
  }, []);

  // 处理数学占位符的函数
  const processMathPlaceholders = useCallback((container: HTMLElement) => {
    // 使用TreeWalker找到包含占位符的文本节点
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                let parent = node.parentElement;
                while (parent && parent !== container) {
                    if (parent.tagName === 'CODE' ||
                        parent.tagName === 'PRE' ||
                        parent.classList.contains('code-block-wrapper') ||
                        parent.classList.contains('code-block-header')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    parent = parent.parentElement;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const textNodes: Text[] = [];
    let currentNode: Node | null;
    while (currentNode = walker.nextNode()) {
        textNodes.push(currentNode as Text);
    }

    // 处理文本节点中的占位符
    textNodes.forEach(node => {
        const text = node.textContent || '';
        if (!text.includes('MATH_PLACEHOLDER_')) {
            return;
        }

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        const placeholderRegex = /MATH_PLACEHOLDER_(\d+)/g;

        while ((match = placeholderRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }

            const placeholderIdx = parseInt(match[1], 10);
            // 创建占位符的span元素
            const span = document.createElement('span');
            span.className = 'katex-placeholder';
            span.setAttribute('data-math-placeholder', `math-${messageId}-${placeholderIdx}`);
            span.textContent = match[0]; // 临时占位符
            fragment.appendChild(span);

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        if (lastIndex > 0) {
            node.replaceWith(fragment);
        }
    });

    // 异步渲染KaTeX
    requestIdleCallback(() => {
        container.querySelectorAll('[data-math-placeholder]').forEach((span, index) => {
            const placeholderElement = span as HTMLElement;
            const content = placeholderElement.textContent || '';
            
            // 清理并渲染
            placeholderElement.textContent = '';
            
            try {
                katex.render(content.replace('MATH_PLACEHOLDER_', ''), placeholderElement, {
                    throwOnError: false,
                    displayMode: false, // 简化模式
                    errorColor: '#cc0000',
                    strict: false,
                    trust: true
                });
            } catch (error) {
                console.error('KaTeX rendering error:', error);
                placeholderElement.textContent = `[Math Error: ${content}]`;
            }
        });
    });
  }, [messageId]);

  return <div ref={contentRef} className="markdown-content" />;
};

