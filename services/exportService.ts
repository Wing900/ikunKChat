import { ChatSession } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';
import katex from 'katex';

// Helper function to render Markdown and LaTeX
const renderContentToHtml = (content: string): string => {
  // First, render LaTeX expressions
  const contentWithLatex = content.replace(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g, (match) => {
    const isBlock = match.startsWith('$$');
    const latex = match.slice(isBlock ? 2 : 1, isBlock ? -2 : -1);
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: isBlock,
      });
    } catch (e) {
      console.error(e);
      return `<span style="color: red;">${match}</span>`; // Show error inline
    }
  });

  // Then, render Markdown
  return marked(contentWithLatex) as string;
};


/**
 * Exports an array of chat sessions to a single PDF file using a rendering approach.
 */
export const exportChatsToPdf = async (
  chats: ChatSession[],
  quality: 'sd' | 'hd' | 'uhd' = 'hd'
) => {
  if (!chats.length) return;

  const qualityScaleMap = {
    sd: 1.5, // Standard Definition
    hd: 2,   // High Definition
    uhd: 3   // Ultra High Definition
  };
  const scale = qualityScaleMap[quality];

  // 1. Create a hidden container for rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '800px'; // A reasonable width for PDF content
  container.style.padding = '20px';
  container.style.fontFamily = 'sans-serif';
  container.style.fontSize = '14px';
  container.style.lineHeight = '1.6';
  container.style.color = '#333';
  document.body.appendChild(container);

  // 2. Populate the container with chat content
  let htmlContent = '';
  chats.forEach(chat => {
    htmlContent += `<h1 style="font-size: 24px; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px;">${chat.title}</h1>`;
    chat.messages.forEach(message => {
      const role = message.role === 'user' ? 'User' : 'Model';
      htmlContent += `<div style="margin-bottom: 20px;">`;
      htmlContent += `<strong style="font-size: 16px;">${role}:</strong>`;
      htmlContent += `<div style="margin-top: 5px;">${renderContentToHtml(message.content)}</div>`;
      htmlContent += `</div>`;
    });
    htmlContent += `<div style="page-break-after: always;"></div>`; // Suggest page break
  });
  container.innerHTML = htmlContent;
  
  // Add KaTeX CSS to the document head to style the formulas
  const katexLink = document.createElement('link');
  katexLink.rel = 'stylesheet';
  katexLink.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
  document.head.appendChild(katexLink);


  // Give images and styles a moment to load
  await new Promise(resolve => setTimeout(resolve, 1000));


  // 3. Use html2canvas to capture the content
  const canvas = await html2canvas(container, {
    scale: scale, // Use dynamic scale for quality
    useCORS: true,
  });

  // 4. Create PDF with jsPDF
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const ratio = canvasWidth / pdfWidth;
  const imgHeight = canvasHeight / ratio;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  const fileName = `kchat_export_${new Date().toISOString()}.pdf`;
  pdf.save(fileName);

  // 5. Clean up
  document.body.removeChild(container);
  document.head.removeChild(katexLink);
};


/**
 * Exports an array of chat sessions to a JSON file.
 */
export const exportChatsToJson = (chats: ChatSession[]) => {
    if (!chats.length) return;
    const dataStr = JSON.stringify(chats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kchat_export_${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};