import { Block, BlockFormatter } from '../../core/types';

/**
 * Formatter for Slack-compatible markdown
 */
export class SlackFormatter implements BlockFormatter {
  /**
   * Convert a block to Slack-friendly format
   * @param block The block to convert
   * @param level Indentation level
   * @returns Formatted text for Slack
   */
  format(block: Block, level: number = 0): string {
    let result = '';
    const content = block.content.trim();

    // Format indentation for nested levels
    let indent = '';
    for (let i = 0; i < level; i++) {
      indent += '    '; // 4 spaces for each level
    }

    // Process content
    if (!content) {
      return '';
    } else if (content === '---') {
      return `${indent}---\n`;
    }

    // Clean up Logseq syntax
    let formattedContent = content;

    // Convert wiki-style links [[text]] to just text
    formattedContent = formattedContent.replace(/\[\[(.*?)\]\]/g, '$1');

    // Convert TODO to emoji checkbox
    formattedContent = formattedContent.replace(/TODO\s/g, '☐ ');

    // Bold: Convert **text** to *text* (Slack uses single asterisks)
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '*$1*');

    // Italic: Convert __text__ to _text_ (Slack italic)
    formattedContent = formattedContent.replace(/__(.*?)__/g, '_$1_');
    // Make sure single underscore italic is preserved
    formattedContent = formattedContent.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '_$1_');

    // Strikethrough: Convert ~~text~~ to ~text~ (Slack strikethrough)
    formattedContent = formattedContent.replace(/\~\~(.*?)\~\~/g, '~$1~');

    // Fix links for Slack format

    // 1. First normalize any existing malformed Slack-style links that have the format <url|text>
    // but aren't properly enclosed in brackets
    formattedContent = formattedContent.replace(/(?<!")https?:\/\/\S+\|\w+/g, (match) => {
      const parts = match.split('|');
      if (parts.length === 2) {
        return `<${parts[0]}|${parts[1]}>`;
      }
      return match;
    });

    // 2. Convert markdown [text](url) to Slack format <url|text>
    // Use a more precise approach to handle URLs with special characters
    formattedContent = formattedContent.replace(/\[(.*?)\]\((.*?)\)/g, (_, text, url) => {
      // Make sure URL is properly encoded if it contains special characters
      return `<${url}|${text}>`;
    });

    // 3. Normalize any raw URLs that aren't part of an existing link
    // This regex avoids matching URLs already in Slack format
    formattedContent = formattedContent.replace(/(?<![<|"])(https?:\/\/\S+)(?![>|"])/g, '<$1>');

    // Add bullet or indentation based on level
    if (level === 0) {
      // First level: No bullet, no space
      result = `${formattedContent.trimStart()}\n`;
    } else if (level === 1) {
      // Second level: No indentation for clarity
      result = `${formattedContent.trimStart()}\n`;
    } else {
      // Third level and beyond: Keep the dash/bullet with indentation
      result = `${indent}- ${formattedContent}\n`;
    }

    // Process children
    if (block.children && block.children.length > 0) {
      for (const child of block.children) {
        result += this.format(child, level + 1);
      }
    }

    return result;
  }
}