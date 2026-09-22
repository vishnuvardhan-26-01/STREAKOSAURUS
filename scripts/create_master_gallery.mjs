import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const allDinos = [
  { id: '01', name: 'T-Rex', slug: 'no-excuses', rarity: 'COMMON' },
  { id: '02', name: 'Velociraptor', slug: 'early-bird', rarity: 'COMMON' },
  { id: '03', name: 'Triceratops', slug: 'threepeat', rarity: 'COMMON' },
  { id: '04', name: 'Stegosaurus', slug: 'week-warrior', rarity: 'UNCOMMON' },
  { id: '05', name: 'Brachiosaurus', slug: 'fortnight-fighter', rarity: 'UNCOMMON' },
  { id: '06', name: 'Ankylosaurus', slug: 'month-master', rarity: 'RARE' },
  { id: '07', name: 'Allosaurus', slug: 'centurion', rarity: 'EPIC' },
  { id: '08', name: 'Pachycephalosaurus', slug: 'brick-by-brick', rarity: 'COMMON' },
  { id: '09', name: 'Diplodocus', slug: 'consistent-creature', rarity: 'UNCOMMON' },
  { id: '10', name: 'Dilophosaurus', slug: 'growth-spurt', rarity: 'RARE' },
  { id: '11', name: 'Carnotaurus', slug: 'focus-mode', rarity: 'COMMON' },
  { id: '12', name: 'Utahraptor', slug: 'project-pioneer', rarity: 'COMMON' },
  { id: '13', name: 'Archaeopteryx', slug: 'idea-hatchling', rarity: 'COMMON' },
  { id: '14', name: 'Parasaurolophus', slug: 'calendar-keeper', rarity: 'UNCOMMON' },
  { id: '15', name: 'Styracosaurus', slug: 'report-ranger', rarity: 'COMMON' },
  { id: '16', name: 'Spinosaurus', slug: 'dna-researcher', rarity: 'RARE' },
  { id: '17', name: 'Baryonyx', slug: 'expedition-starter', rarity: 'UNCOMMON' },
  { id: '18', name: 'Deinonychus', slug: 'absolute-unit', rarity: 'EPIC' },
  { id: '19', name: 'Pachyrhinosaurus', slug: 'extinction-survivor', rarity: 'EPIC' },
  { id: '20', name: 'Iguanodon', slug: 'balance-seeker', rarity: 'UNCOMMON' },
  { id: '21', name: 'Edmontosaurus', slug: 'night-owl', rarity: 'RARE' },
  { id: '22', name: 'Albertosaurus', slug: 'water-break', rarity: 'COMMON' },
  { id: '23', name: 'Euoplocephalus', slug: 'move-more', rarity: 'UNCOMMON' },
  { id: '24', name: 'Nodosaurus', slug: 'mindful-one', rarity: 'RARE' },
  { id: '25', name: 'Legendary T-Rex', slug: 'legendary', rarity: 'LEGENDARY' },
];

const rarityColors = {
  COMMON: '#A39985',
  UNCOMMON: '#4E9F76',
  RARE: '#4B88C8',
  EPIC: '#9D65C9',
  LEGENDARY: '#E5B650'
};

let cardsHtml = '';
for (const dino of allDinos) {
  const svgPath = path.resolve('src/assets/dinos', dino.slug, 'grown.svg');
  let svgContent = '';
  if (fs.existsSync(svgPath)) {
    svgContent = fs.readFileSync(svgPath, 'utf-8');
  } else {
    svgContent = `<div style="color:red">MISSING</div>`;
  }

  const badgeColor = rarityColors[dino.rarity] || '#A39985';

  cardsHtml += `
  <div style="background: #1C1813; border: 1px solid #362E24; border-radius: 10px; padding: 12px; width: 200px; margin: 8px; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #E5B650;">#${dino.id}</span>
      <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}44; text-transform: uppercase;">${dino.rarity}</span>
    </div>
    <div style="font-size: 13px; font-weight: 600; color: #FAF6ED; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${dino.name}</div>
    <div style="width: 176px; height: 110px; display: flex; align-items: flex-end; justify-content: center; background: rgba(0,0,0,0.15); border-radius: 6px; padding: 4px;">
      ${svgContent}
    </div>
  </div>`;
}

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Streakosaurus V2 — Complete 25 Dinosaur Master Showcase</title>
<style>
  body {
    margin: 0; padding: 28px; background: #0E0C0A; color: #FAF6ED; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .header {
    margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #2B231B;
  }
  h1 { margin: 0 0 6px 0; font-size: 24px; color: #FAF6ED; font-weight: 700; }
  p { margin: 0; font-size: 13px; color: #A39985; }
  .grid {
    display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 8px; max-width: 1200px;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>Streakosaurus V2 — Complete Dinosaur Roster (Achievements 01–25)</h1>
    <p>2D Polished Collectible Game Art • Handcrafted Believable Anatomy • Earthy Streakosaurus Palette • Fully Grown Specimens</p>
  </div>
  <div class="grid">${cardsHtml}</div>
</body>
</html>`;

const outHtml = path.resolve('master_dino_showcase.html');
const outPng = path.resolve('master_dino_showcase.png');

fs.writeFileSync(outHtml, html, 'utf-8');
console.log('Saved showcase HTML to:', outHtml);

execSync(`"${edgePath}" --headless --disable-gpu --window-size=1260,1500 --screenshot="${outPng}" "${outHtml}"`, { stdio: 'ignore' });
console.log('Master showcase screenshot captured:', outPng);
