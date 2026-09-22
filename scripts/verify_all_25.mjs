import fs from 'node:fs';
import path from 'node:path';

const slugs = [
  'no-excuses',
  'early-bird',
  'threepeat',
  'week-warrior',
  'fortnight-fighter',
  'month-master',
  'centurion',
  'brick-by-brick',
  'consistent-creature',
  'growth-spurt',
  'focus-mode',
  'project-pioneer',
  'idea-hatchling',
  'calendar-keeper',
  'report-ranger',
  'dna-researcher',
  'expedition-starter',
  'absolute-unit',
  'extinction-survivor',
  'balance-seeker',
  'night-owl',
  'water-break',
  'move-more',
  'mindful-one',
  'legendary'
];

const stages = ['egg.svg', 'juvenile.svg', 'adult.svg', 'grown.svg'];

let totalFiles = 0;
let missingFiles = [];
let emptyFiles = [];

for (const slug of slugs) {
  const dir = path.resolve('src', 'assets', 'dinos', slug);
  if (!fs.existsSync(dir)) {
    console.error(`MISSING DIRECTORY: ${slug}`);
    missingFiles.push(slug);
    continue;
  }
  for (const st of stages) {
    const filePath = path.join(dir, st);
    if (!fs.existsSync(filePath)) {
      console.error(`MISSING FILE: ${slug}/${st}`);
      missingFiles.push(`${slug}/${st}`);
    } else {
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        console.error(`EMPTY FILE: ${slug}/${st}`);
        emptyFiles.push(`${slug}/${st}`);
      } else {
        totalFiles++;
      }
    }
  }
}

console.log('----------------------------------------------------');
console.log(`VERIFICATION REPORT:`);
console.log(`Total Verified Specimen SVG Files: ${totalFiles} / 100`);
console.log(`Missing Files: ${missingFiles.length}`);
console.log(`Empty Files: ${emptyFiles.length}`);
if (missingFiles.length === 0 && emptyFiles.length === 0 && totalFiles === 100) {
  console.log(`SUCCESS: All 25 dinosaurs have 4 complete evolution stages (100 total assets)!`);
} else {
  console.error(`FAILURE: Some assets are incomplete.`);
}
console.log('----------------------------------------------------');
