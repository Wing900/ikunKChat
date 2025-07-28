
import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import mermaid from 'mermaid';

// Declare global variables from CDN scripts
declare const DOMPurify: any;
declare const hljs: any;
declare const renderMathInElement: any;

// --- One-time configurations ---

// Configure DOMPurify to allow attributes needed for rich content
if (typeof DOMPurify !== 'undefined') {
    // This hook ensures that links open in a new tab.
    DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
        if (node.tagName === 'A') {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

// Configure the 'marked' library for parsing Markdown.
// This is done only once for performance.
let markedInitialized = false;
const initializeMarked = () => {
    if (markedInitialized || typeof hljs === 'undefined') return;
    marked.setOptions({
        gfm: true, // Use GitHub Flavored Markdown
        breaks: false, // FIX: Set to false to prevent single-line breaks from becoming <br>, which interferes with LaTeX block rendering.
        highlight: (code, lang) => {
            // Special handling for Mermaid diagrams
            if (lang === 'mermaid') {
                // Return a placeholder that Mermaid can find later.
                return `<pre class="mermaid">${code}</pre>`;
            }
            // Use highlight.js for all other code blocks
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
    });
    markedInitialized = true;
};

// --- Component ---

interface MarkdownRendererProps {
  content: string;
  theme: 'light' | 'dark';
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, theme }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // This effect re-renders the content whenever the markdown text or theme changes.
  useEffect(() => {
    // Ensure one-time initializations are done.
    initializeMarked();

    if (!contentRef.current) return;

    // 1. Parse the raw Markdown content into HTML.
    const dirtyHtml = marked.parse(content) as string;
    
    // 2. Sanitize the HTML to prevent XSS attacks. Allow SVG for Mermaid diagrams.
    const cleanHtml = typeof DOMPurify !== 'undefined'
      ? DOMPurify.sanitize(dirtyHtml, { USE_PROFILES: { html: true, svg: true, svgFilters: true }})
      : dirtyHtml;
      
    // 3. Set the sanitized HTML to the component's content.
    contentRef.current.innerHTML = cleanHtml;

    // 4. Find and render LaTeX equations using KaTeX.
    if (typeof renderMathInElement !== 'undefined') {
        try {
            renderMathInElement(contentRef.current, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false // Prevents errors from stopping the whole render.
            });
        } catch (error) {
            console.error('KaTeX rendering error:', error);
        }
    }
    
    // 5. Find and render Mermaid diagrams.
    try {
        mermaid.initialize({
            startOnLoad: false,
            theme: theme, // Use the current app theme (light/dark)
            securityLevel: 'loose', // Required for dynamic rendering
            flowchart: { useMaxWidth: true },
            sequence: { useMaxWidth: true },
            gantt: { useMaxWidth: true },
        });
        const mermaidElements = contentRef.current.querySelectorAll<HTMLElement>('.mermaid');
        if (mermaidElements.length > 0) {
            // Tell Mermaid to render the diagrams found in the placeholders.
            mermaid.run({ nodes: mermaidElements });
        }
    } catch (error) {
        console.error('Mermaid rendering error:', error);
    }

  }, [content, theme]);

  return <div ref={contentRef} className="markdown-content" />;
};
