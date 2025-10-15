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
// In newer versions of marked, the listitem renderer receives a single token object.
renderer.listitem = (item: Tokens.ListItem): string => {
    // We need to manually parse the inner content of the list item.
    // `item.text` is the raw markdown content. `marked.parseInline` will handle it.
    const textAsHtml = marked.parseInline(item.text);

    if (item.task) {
        // Handle GFM task list items.
        const checkboxHtml = `<input type="checkbox" ${item.checked ? 'checked' : ''} disabled />`;
        return `<li class="task-list-item">${checkboxHtml}<div>${textAsHtml}</div></li>`;
    }
    
    // Handle regular list items.
    return `<li>${textAsHtml}</li>`;
};


marked.setOptions({
    gfm: true,
    breaks: false,
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
        const code = wrapper?.querySelector('code')?.innerText;
        if (code) {
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

    // --- KaTeX Two-Pass Rendering ---

    // 1. Extract and replace math blocks with placeholders
    const mathExpressions: { type: 'inline' | 'display'; content: string }[] = [];
    let processedContent = content || '';

    // Handle display math ($$ ... $$ and \[ ... \])
    processedContent = processedContent.replace(/\$\$([\s\S]*?)\$\$|\[([\s\S]*?)\]/g, (match, p1, p2) => {
        const mathContent = p1 || p2;
        mathExpressions.push({ type: 'display', content: mathContent });
        return `<span class="katex-placeholder" data-katex-id="${mathExpressions.length - 1}"></span>`;
    });

    // Handle inline math ($ ... $ and \( ... \))
    processedContent = processedContent.replace(/\$([^\$]+?)\$|\\((.+?)\\)/g, (match, p1, p2) => {
        const mathContent = p1 || p2;
        mathExpressions.push({ type: 'inline', content: mathContent });
        return `<span class="katex-placeholder" data-katex-id="${mathExpressions.length - 1}"></span>`;
    });

    // 2. Parse Markdown to HTML
    const rawHtml = marked.parse(processedContent) as string;

    // 3. Sanitize HTML
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

    // 4. Inject into DOM
    currentRef.innerHTML = cleanHtml;

    // 5. Render KaTeX expressions
    currentRef.querySelectorAll('.katex-placeholder').forEach(placeholder => {
        const id = parseInt(placeholder.getAttribute('data-katex-id') || '-1', 10);
        if (id !== -1 && mathExpressions[id]) {
            const { type, content } = mathExpressions[id];
            try {
                katex.render(content, placeholder as HTMLElement, {
                    throwOnError: false,
                    displayMode: type === 'display',
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
                placeholder.textContent = `[KaTeX Error: ${ (error as Error).message }]`;
            }
        }
    });

    // 6. Highlight code blocks
    currentRef.querySelectorAll('pre code').forEach((block) => {
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(block as HTMLElement);
        }
    });

    // 7. Render Mermaid diagrams
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
