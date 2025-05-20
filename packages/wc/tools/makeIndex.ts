import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const playerDir = path.resolve(__dirname, '../src/player');
const indexPath = path.join(playerDir, 'index.ts');

const files = fs.readdirSync(playerDir)
    .filter(f =>
        f.endsWith('.ts') &&
        f !== 'index.ts' &&
        f !== 'createPlayer.ts' &&
        fs.statSync(path.join(playerDir, f)).isFile()
    );

const exports = files
    .map(f => `export * from './${path.basename(f, '.ts')}';`)
    .join('\n') + '\n';

fs.writeFileSync(indexPath, exports);

console.log(`Generated ${indexPath} with exports for:`, files);
