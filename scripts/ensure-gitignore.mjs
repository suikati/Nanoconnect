import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
const target = join(root, '.gitignore');
const template = join(root, '.gitignore.template');

try {
  const needsRestore = !existsSync(target) || readFileSync(target, 'utf8').trim().length < 5;
  if (needsRestore && existsSync(template)) {
    const data = readFileSync(template, 'utf8');
    writeFileSync(target, data, 'utf8');
    console.log('[ensure-gitignore] restored .gitignore from template');
  } else {
    console.log('[ensure-gitignore] .gitignore present, no action');
  }
} catch (e) {
  console.error('[ensure-gitignore] error', e);
}
