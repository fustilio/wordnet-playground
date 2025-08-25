// Helper to escape attribute values
function escapeAttr(value: string): string {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Helper to escape text content
function escapeText(value: string): string {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;');
}

function _toXml(node: any, indentLevel: number): string {
    const indent = '  '.repeat(indentLevel);
    
    if (node.type === 'element') {
        const element = node as any;
        let xml = indent + `<${element.name}`;

        for (const [name, value] of Object.entries(element.attributes || {})) {
            xml += ` ${name}="${escapeAttr(String(value))}"`;
        }

        if (element.children && element.children.length > 0) {
            const onlyTextChildren = element.children.every((c: any) => c.type === 'text' && !c.value.trim().includes('\n'));
            const textContent = element.children.map((c: any) => c.value).join('').trim();

            if (onlyTextChildren && textContent) {
                xml += `>${escapeText(textContent)}</${element.name}>\n`;
            } else if (element.children.length > 0) {
                xml += '>\n';
                for (const child of element.children) {
                    xml += _toXml(child, indentLevel + 1);
                }
                xml += indent + `</${element.name}>\n`;
            } else {
                 xml += ' />\n';
            }
        } else {
            xml += ' />\n';
        }
        return xml;
    }

    if (node.type === 'text') {
        const text = node as any;
        const trimmedValue = text.value.trim();
        if (trimmedValue) {
            return indent + escapeText(trimmedValue) + '\n';
        }
        return '';
    }

    if (node.type === 'instruction' || node.type === 'processingInstruction') {
      const instruction = node as any;
      return `<?${instruction.name} ${instruction.value}?>\n`;
    }

    if (node.type === 'root') {
      const root = node as any;
      let xml = '';
      for (const child of root.children) {
        xml += _toXml(child, indentLevel);
      }
      return xml;
    }
    
    return '';
}

export function toXmlPretty(tree: any): string {
    const node = Array.isArray(tree) ? {type: 'root', children: tree} : tree;
    return _toXml(node, 0).trim();
}
