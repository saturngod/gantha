const CODE_BLOCK_PLACEHOLDER_PREFIX = "__GANHTA_CODE_BLOCK__";

function maskCodeBlocks(markdown: string): { masked: string; blocks: string[] } {
  const blocks: string[] = [];
  const masked = markdown.replace(
    /(^|\n)(```|~~~)[^\n]*\n[\s\S]*?\n\2(?=\n|$)/g,
    (match) => {
      const placeholder = `${CODE_BLOCK_PLACEHOLDER_PREFIX}${blocks.length}__`;
      blocks.push(match);
      return placeholder;
    }
  );

  return { masked, blocks };
}

function restoreCodeBlocks(markdown: string, blocks: string[]): string {
  return markdown.replace(
    new RegExp(`${CODE_BLOCK_PLACEHOLDER_PREFIX}(\\d+)__`, "g"),
    (match, index) => blocks[Number(index)] || match
  );
}

export function transformFootnotes(markdown: string): string {
  if (!markdown.includes("[^")) {
    return markdown;
  }

  const { masked, blocks } = maskCodeBlocks(markdown);
  const lines = masked.split(/\r?\n/);
  const definitions = new Map<string, string>();
  const bodyLines: string[] = [];

  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    const definitionMatch = line.match(/^\[\^([^\]]+)\]:\s*(.*)$/);

    if (!definitionMatch) {
      bodyLines.push(line);
      i += 1;
      continue;
    }

    const [, id, firstLine] = definitionMatch;
    const definitionLines = [firstLine];
    i += 1;

    while (i < lines.length) {
      const continuationLine = lines[i];

      if (/^\[\^[^\]]+\]:\s*/.test(continuationLine)) {
        break;
      }

      if (/^( {2,}|\t)/.test(continuationLine)) {
        definitionLines.push(continuationLine.replace(/^( {2,}|\t)/, ""));
        i += 1;
        continue;
      }

      if (continuationLine.trim() === "" && /^( {2,}|\t)/.test(lines[i + 1] || "")) {
        definitionLines.push("");
        i += 1;
        continue;
      }

      break;
    }

    definitions.set(id, definitionLines.join("\n").trimEnd());
  }

  if (definitions.size === 0) {
    return markdown;
  }

  const referenceOrder: string[] = [];
  const referenceNumbers = new Map<string, number>();

  const body = bodyLines
    .join("\n")
    .replace(/\[\^([^\]]+)\]/g, (match, id: string) => {
      if (!definitions.has(id)) {
        return match;
      }

      let number = referenceNumbers.get(id);
      if (!number) {
        referenceOrder.push(id);
        number = referenceOrder.length;
        referenceNumbers.set(id, number);
      }

      return `[${number}]`;
    })
    .trimEnd();

  if (referenceOrder.length === 0) {
    return restoreCodeBlocks(body, blocks);
  }

  const footnotesSection = referenceOrder
    .map((id, index) => `${index + 1}. ${definitions.get(id) || ""}`)
    .join("\n");

  return restoreCodeBlocks(`${body}\n\n---\n\n## Footnotes\n\n${footnotesSection}\n`, blocks);
}
