import React, { useEffect, useRef, useCallback } from 'react';
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
    
    const highlightedCode = hljs.highlight(codeString, { language }).value;

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
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, theme }) => {
  const contentRef = useRef<HTMLDivElement>(null);

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

// --- Step 1: Extract and protect math expressions before Markdown parsing ---
    let processedContent = content || '';
    const mathPlaceholders: { id: string; content: string; isDisplay: boolean }[] = [];
    let placeholderIndex = 0;

    // Extract display math ($$...$$ and \[...\])
    // 关键修正：只替换公式本身，不捕获或改变周围的换行和空格，以保护 Markdown 列表结构。
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

  return <div ref={contentRef} className="markdown-content" />;
};

