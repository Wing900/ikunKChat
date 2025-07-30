
import React, { useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import type { Tokens } from 'marked';
import mermaid from 'mermaid';

// Declare global variables from CDN scripts
declare const DOMPurify: any;
declare const hljs: any;
declare const renderMathInElement: any;

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

    const dirtyHtml = marked.parse(content || '') as string;
    const cleanHtml = typeof DOMPurify !== 'undefined'
      ? DOMPurify.sanitize(dirtyHtml, { USE_PROFILES: { html: true, svg: true, svgFilters: true }})
      : dirtyHtml;
      
    currentRef.innerHTML = cleanHtml;

    if (typeof renderMathInElement !== 'undefined') {
        try {
            renderMathInElement(currentRef, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        } catch (error) {
            console.error('KaTeX rendering error:', error);
        }
    }
    
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