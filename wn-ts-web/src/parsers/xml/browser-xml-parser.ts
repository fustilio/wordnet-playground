import type { ProgressCallback } from "../../types/progress";

/**
 * Browser-compatible streaming XML parser for large files
 */
export class BrowserXMLParser {
  private xmlText: string;
  private position: number = 0;
  private progress?: ProgressCallback;
  private debug: boolean;

  constructor(
    xmlText: string,
    options: { progress?: ProgressCallback; debug?: boolean } = {}
  ) {
    this.xmlText = xmlText;
    this.progress = options.progress;
    this.debug = options.debug || false;
  }

  /**
   * Parse XML using a streaming approach to avoid stack overflow
   */
  async parse(): Promise<any> {
    const result: any = {};
    let elementStack: any[] = [];
    let elementCount = 0;

    // Skip XML declaration if present
    if (this.xmlText.startsWith("<?xml")) {
      const declEnd = this.xmlText.indexOf("?>");
      if (declEnd !== -1) {
        this.position = declEnd + 2;
      }
    }

    if (this.debug) {
      console.log(
        `[DEBUG] BrowserXMLParser starting with ${this.xmlText.length} characters`
      );
      console.log(`[DEBUG] First 500 chars:`, this.xmlText.substring(0, 500));
    }

    while (this.position < this.xmlText.length) {
      // Skip whitespace
      while (
        this.position < this.xmlText.length &&
        /\s/.test(this.xmlText[this.position])
      ) {
        this.position++;
      }

      if (this.position >= this.xmlText.length) break;

      const char = this.xmlText[this.position];

      if (char === "<") {
        // Found a tag
        if (this.xmlText[this.position + 1] === "/") {
          // Closing tag
          const tagEnd = this.xmlText.indexOf(">", this.position);
          if (tagEnd === -1) break;

          const tagName = this.xmlText.substring(this.position + 2, tagEnd);
          this.position = tagEnd + 1;

          // Pop from stack
          if (elementStack.length > 0) {
            elementStack.pop();
          }

          elementCount++;
          if (this.progress && elementCount % 1000 === 0) {
            this.progress(Math.min(elementCount / 100000, 0.95));
          }
        } else if (this.xmlText[this.position + 1] === "!") {
          // Comment or CDATA - skip
          const commentEnd = this.xmlText.indexOf("-->", this.position);
          const cdataEnd = this.xmlText.indexOf("]]>", this.position);
          if (commentEnd !== -1) {
            this.position = commentEnd + 3;
          } else if (cdataEnd !== -1) {
            this.position = cdataEnd + 3;
          } else {
            this.position++;
          }
        } else {
          // Opening tag
          const tagEnd = this.xmlText.indexOf(">", this.position);
          if (tagEnd === -1) break;

          const tagContent = this.xmlText.substring(this.position + 1, tagEnd);
          const spaceIndex = tagContent.indexOf(" ");

          let tagName: string;
          let attributes: any = {};

          if (spaceIndex === -1) {
            tagName = tagContent;
          } else {
            tagName = tagContent.substring(0, spaceIndex);
            const attrString = tagContent.substring(spaceIndex + 1);
            attributes = this.parseAttributes(attrString);
          }

          // Check if it's a self-closing tag
          const isSelfClosing = tagContent.endsWith("/");
          if (isSelfClosing) {
            tagName = tagName.replace("/", "");
          }

          // Create new element
          const newElement: any = {
            name: tagName,
            attributes,
            children: [],
            text: "",
          };

          if (elementStack.length === 0) {
            result[tagName] = newElement;
            if (this.debug && elementCount < 10) {
              console.log(`[DEBUG] Root element found: ${tagName}`);
            }
          } else {
            const parent = elementStack[elementStack.length - 1];
            if (!parent.children) parent.children = [];
            parent.children.push(newElement);
          }

          if (!isSelfClosing) {
            elementStack.push(newElement);
          }

          this.position = tagEnd + 1;

          elementCount++;
          if (this.progress && elementCount % 1000 === 0) {
            this.progress(Math.min(elementCount / 100000, 0.95));
          }
        }
      } else {
        // Text content - collect until next tag
        let textContent = "";
        while (
          this.position < this.xmlText.length &&
          this.xmlText[this.position] !== "<"
        ) {
          textContent += this.xmlText[this.position];
          this.position++;
        }

        // Trim whitespace and add as a text node
        textContent = textContent.trim();
        if (textContent && elementStack.length > 0) {
          const currentElement = elementStack[elementStack.length - 1];
          currentElement.children.push({ name: "#text", text: textContent });
        }
      }
    }

    if (this.debug) {
      console.log(
        `[DEBUG] BrowserXMLParser completed. Found ${elementCount} elements.`
      );
      console.log(`[DEBUG] Root elements:`, Object.keys(result));
      // console.log(`[DEBUG] Result structure:`, JSON.stringify(result, null, 2));
    }

    return result;
  }

  private parseAttributes(attrString: string): any {
    const attributes: any = {};
    const regex = /(\w+)=["']([^"']*)["']/g;
    let match;

    while ((match = regex.exec(attrString)) !== null) {
      attributes[match[1]] = match[2];
    }

    return attributes;
  }
}
