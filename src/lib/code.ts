import { readFile } from 'fs/promises';
import { extname } from 'path';

export type CodeMeta = {
  ext: string;
  name: string;
  mime: string;
};

// Cache the parsed code.json in memory — it never changes at runtime
let codeMetaCache: CodeMeta[] | null = null;

async function getCodeMeta(): Promise<CodeMeta[]> {
  if (!codeMetaCache) {
    codeMetaCache = JSON.parse(await readFile('./code.json', 'utf8'));
  }
  return codeMetaCache!;
}

export async function isCode(file: string) {
  const codeMeta = await getCodeMeta();
  const ext = extname(file).slice(1);
  return codeMeta.some((meta) => meta.ext === ext);
}
