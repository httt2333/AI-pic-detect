import type { TOCItemType as FumadocsTOCItemType } from 'fumadocs-core/server';
import { slug } from 'github-slugger';

export type TOCItemType = FumadocsTOCItemType;

/**
 * Generate TOC (Table of Contents) from markdown/MDX content
 * Compatible with fumadocs TOCItemType format
 */
export function generateTOC(content: string): TOCItemType[] {
  if (!content) return [];

  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc: TOCItemType[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const url = `#${generateHeadingId(text)}`;

    toc.push({
      title: text,
      url,
      depth: level,
    });
  }

  return toc;
}

/**
 * Generate heading ID from text
 * Uses github-slugger to match rehype-slug behavior
 */
function generateHeadingId(text: string): string {
  return slug(text);
}
