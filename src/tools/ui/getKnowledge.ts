import { promises as fs } from 'fs';
import { join } from 'path';

export interface UIKnowledgeQuery {
  topic: 'oklch';
  asset_type: 'all' | 'interactive_guide' | 'components' | 'documentation';
}

const UI_ENGINE_PATH = join(process.cwd(), 'central-mcp', 'ui-engine');

async function readFileContent(filename: string): Promise<string> {
  try {
    return await fs.readFile(join(UI_ENGINE_PATH, filename), 'utf-8');
  } catch (error) {
    return `Error reading ${filename}: ${(error as Error).message}`;
  }
}

export async function getKnowledge(query: UIKnowledgeQuery): Promise<string> {
  if (query.topic !== 'oklch') {
    return 'Unknown topic. Currently, only \'oklch\' is supported.';
  }

  const filesToRead: string[] = [];

  switch (query.asset_type) {
    case 'interactive_guide':
      filesToRead.push('OKLCH-HYPERDIMENSIONAL-SYSTEM.html', 'OKLCH-LIVE-DEPENDENCY-SYSTEM.html');
      break;
    case 'components':
      filesToRead.push(
        'OKLCH-HUE-WHEEL-COMPONENT.html',
        'OKLCH-CHROMA-SELECTOR-COMPONENT.html',
        'OKLCH-LIGHTNESS-SELECTOR-COMPONENT.html',
        'OKLCH-3D-SNIPPET.html'
      );
      break;
    case 'documentation':
      filesToRead.push(
        'OKLCH-COMPLETE-SYSTEM-GUIDE.md',
        'OKLCH-HYPERDIMENSIONAL-GUIDE.md',
        'OKLCH-LIVE-DEPENDENCY-GUIDE.md',
        'OKLCH-SYSTEM-INDEX.md',
        'OKLCH-SNIPPET-USAGE-GUIDE.md'
      );
      break;
    case 'all':
      filesToRead.push(
        'OKLCH-LIVE-DEPENDENCY-SYSTEM.html',
        'OKLCH-LIVE-DEPENDENCY-GUIDE.md',
        'OKLCH-HYPERDIMENSIONAL-SYSTEM.html',
        'OKLCH-HYPERDIMENSIONAL-GUIDE.md',
        'OKLCH-COLOR-SYSTEM-ARCHITECT.html',
        'OKLCH-RULE-ENGINE-COMPLETE.html',
        'OKLCH-COMPONENTS-GALLERY.html',
        'OKLCH-COUNTERWEIGHT-GALLERY.html',
        'OKLCH-DESIGN-SYSTEM-GALLERY.html',
        'OKLCH-HUE-WHEEL-COMPONENT.html',
        'OKLCH-CHROMA-SELECTOR-COMPONENT.html',
        'OKLCH-LIGHTNESS-SELECTOR-COMPONENT.html',
        'OKLCH-3D-SNIPPET.html',
        'OKLCH-COMPLETE-SYSTEM-GUIDE.md',
        'OKLCH-SYSTEM-INDEX.md',
        'OKLCH-SNIPPET-USAGE-GUIDE.md'
      );
      break;
  }

  if (filesToRead.length === 0) {
    return 'No assets found for the given query.';
  }

  const contents = await Promise.all(filesToRead.map(readFileContent));

  return contents.join('\n\n---\n\n');
}
