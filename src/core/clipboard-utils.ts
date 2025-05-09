import * as clipboard from 'clipboard-polyfill';
import { ClipboardHandler } from './types';

/**
 * Converts markdown to HTML for better clipboard formatting
 * @param markdown The markdown text to convert
 * @returns HTML representation of the markdown
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Convert bullets to list items
  html = html.replace(/^•\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/^-\s+(.*)$/gm, '<li>$1</li>');

  // Wrap lists in <ul>
  html = html.replace(/<li>.*?<\/li>/gs, (match) => {
    return '<ul>' + match + '</ul>';
  });

  // Fix nested lists
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Convert bold
  html = html.replace(/\*([^*]+)\*/g, '<b>$1</b>');

  // Convert italic - use a more specific regex to handle various formats
  html = html.replace(/_(.*?)_/g, '<i>$1</i>');

  // Convert strikethrough - use a more specific regex
  html = html.replace(/~(.*?)~/g, '<s>$1</s>');

  // Convert code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert links
  html = html.replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '<a href="$1">$2</a>');

  // Convert newlines to <br>
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * Base clipboard handler using clipboard-polyfill
 */
export class BaseClipboardHandler implements ClipboardHandler {
  /**
   * Copy text to clipboard, optionally with HTML formatting
   * @param text The text to copy
   * @param html Optional HTML content for rich text clipboard
   * @returns Promise that resolves when copying is complete
   */
  async copyToClipboard(text: string, html?: string): Promise<void> {
    try {
      if (html) {
        // When HTML is provided, use the ClipboardItem API
        // Create a Blob with HTML content
        const htmlBlob = new Blob([html], { type: 'text/html' });
        // Create a Blob with plain text content
        const textBlob = new Blob([text], { type: 'text/plain' });

        // Create a ClipboardItem with both formats
        const clipboardItem = new clipboard.ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        });

        // Write the ClipboardItem to the clipboard
        await clipboard.write([clipboardItem]);
      } else {
        // For plain text only, use the simpler writeText API
        await clipboard.writeText(text);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);

      // Try DOM-based clipboard as last resort
      await this.tryExecCommandCopy(text, html);
    }
  }

  /**
   * Fallback copy method using execCommand
   * @param text The text to copy
   * @param htmlContent Optional HTML content
   * @returns Promise that resolves when copying is complete
   */
  private async tryExecCommandCopy(text: string, htmlContent?: string): Promise<void> {
    // Create temporary element
    const tempElement = document.createElement('div');
    tempElement.setAttribute('contenteditable', 'true');

    if (htmlContent) {
      tempElement.innerHTML = htmlContent;
    } else {
      tempElement.textContent = text;
    }

    document.body.appendChild(tempElement);

    try {
      // Select the content
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(tempElement);
        selection.removeAllRanges();
        selection.addRange(range);

        // Execute copy command
        const successful = document.execCommand('copy');
        if (!successful) {
          throw new Error('execCommand copy failed');
        }
      } else {
        throw new Error('Selection API not available');
      }
    } finally {
      // Clean up
      document.body.removeChild(tempElement);
    }
  }
}