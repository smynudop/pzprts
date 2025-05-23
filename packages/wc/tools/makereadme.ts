import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ja } from "@udop/penpa-player-lib"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. wc/player ディレクトリのパス
const playerDir = path.resolve(__dirname, '../src/player');
const readmePath = path.resolve(__dirname, '../readme.md');

// 2. ディレクトリ内の .ts ファイルを再帰的に取得
function getAllTsFiles(dir: string): string[] {
    const files = fs.readdirSync(dir);
    let tsFiles: string[] = [];
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            tsFiles = tsFiles.concat(getAllTsFiles(fullPath));
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            tsFiles.push(fullPath);
        }
    }
    return tsFiles;
}

// 3. ファイルからexportされている識別子を抽出
function parseExports(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const exportRegex = /export\s+(?:const|let|var|function|class|type|interface|enum)\s+([A-Za-z0-9_]+)/g;
    const exportList: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = exportRegex.exec(content)) !== null) {
        exportList.push(match[1]);
    }
    // export { foo, bar } 形式も対応
    const exportListRegex = /export\s*{\s*([^}]+)\s*}/g;
    while ((match = exportListRegex.exec(content)) !== null) {
        const names = match[1].split(',').map(s => s.trim().split(' as ')[0]);
        exportList.push(...names);
    }
    return Array.from(new Set(exportList));
}

// 4. Markdown表を生成
function generateMarkdownTable(exportsByFile: Record<string, string[]>): string {
    let md = `
| パズル名 | ファイル | Export名 |
|---|---|---|
`;
    for (const [file, exports] of Object.entries(exportsByFile)) {
        if (exports.length === 0) continue;
        const fileName = path.relative(playerDir, file).replace(".ts", ".es.js")
        const puzzleId = fileName.replace(".es.js", "")
        md += `|${ja.puzzleName[puzzleId as any] || fileName}| \`${fileName}\` | ${exports.map(e => `\`${e}\``).join(', ')} |\n`;
    }
    return md;
}

// 5. readme.md の所定セクションを更新
function updateReadme(readmePath: string, table: string) {
    let readme = '';
    if (fs.existsSync(readmePath)) {
        readme = fs.readFileSync(readmePath, 'utf8');
    }
    const start = '<!-- EXPORTS_TABLE_START -->';
    const end = '<!-- EXPORTS_TABLE_END -->';
    const regex = new RegExp(`${start}[\\s\\S]*?${end}`, 'm');
    const newSection = `${start}\n${table}${end}`;
    if (readme.match(regex)) {
        readme = readme.replace(regex, newSection);
    } else {
        readme += `\n\n${newSection}\n`;
    }
    fs.writeFileSync(readmePath, readme, 'utf8');
}

// メイン処理
function main() {
    const tsFiles = getAllTsFiles(playerDir);
    const exportsByFile: Record<string, string[]> = {};
    for (const file of tsFiles) {
        const exports = parseExports(file);
        exportsByFile[file] = exports;
    }
    const table = generateMarkdownTable(exportsByFile);
    updateReadme(readmePath, table);
    console.log('readme.md updated.');
}

main();
