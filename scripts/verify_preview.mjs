import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

export function createPreviewHtml(dinoSlugs, title = 'Dino Preview') {
  let cardsHtml = '';
  for (const slug of dinoSlugs) {
    const dir = path.resolve('src/assets/dinos', slug);
    const stages = ['egg', 'juvenile', 'adult', 'grown'];
    for (const stage of stages) {
      const svgPath = path.join(dir, `${stage}.svg`);
      let svgContent = '';
      if (fs.existsSync(svgPath)) {
        svgContent = fs.readFileSync(svgPath, 'utf-8');
      } else {
        svgContent = `<div style="color:red">MISSING</div>`;
      }

      cardsHtml += `
      <div style="background: #1C1813; border: 1px solid #362E24; border-radius: 8px; padding: 12px; width: 220px; text-align: center; margin: 8px;">
        <div style="font-family: monospace; font-size: 11px; color: #BFA985; text-transform: uppercase; margin-bottom: 4px;">${slug} (${stage})</div>
        <div style="width: 200px; height: 130px; display: flex; align-items: flex-end; justify-content: center;">
          ${svgContent}
        </div>
      </div>`;
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0; padding: 24px; background: #12100D; color: #FAF6ED; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  h2 { margin: 0 0 16px 8px; color: #E5B650; }
  .grid { display: flex; flex-wrap: wrap; }
</style>
</head>
<body>
  <h2>${title}</h2>
  <div class="grid">${cardsHtml}</div>
</body>
</html>`;
}

async function main() {
  const batch5Slugs = ['night-owl', 'water-break', 'move-more', 'mindful-one', 'legendary'];
  const html = createPreviewHtml(batch5Slugs, 'Streakosaurus Dino Artwork — Batch 5 (21-25)');
  const outHtml = path.resolve('preview_batch5.html');
  const outPng = path.resolve('preview_batch5.png');

  fs.writeFileSync(outHtml, html, 'utf-8');
  console.log('Saved preview HTML to:', outHtml);

  execSync(`"${edgePath}" --headless --disable-gpu --window-size=1200,1200 --screenshot="${outPng}" "${outHtml}"`, { stdio: 'ignore' });
  console.log('Screenshot captured:', outPng);
}

main().catch(console.error);
