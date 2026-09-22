import fs from 'node:fs';
import path from 'node:path';

// =========================================================================
// UNIVERSAL PREHISTORIC EGG GENERATOR
// =========================================================================
function createEggSvg(options) {
  const {
    baseColor = '#7A8E58',
    darkColor = '#4A5A30',
    accentColor = '#5A6B40',
    fissureColor = '#2D381E',
    patternType = 'speckles'
  } = options;

  let patternMarkup = '';
  if (patternType === 'bands') {
    patternMarkup = `
      <path d="M 88 100 Q 120 115 152 100" stroke="${accentColor}" stroke-width="6" fill="none" opacity="0.45" stroke-linecap="round" />
      <path d="M 94 80 Q 120 95 146 80" stroke="${accentColor}" stroke-width="5" fill="none" opacity="0.45" stroke-linecap="round" />
      <circle cx="114" cy="92" r="3" fill="${darkColor}" opacity="0.5" />
      <circle cx="128" cy="85" r="2.5" fill="${darkColor}" opacity="0.5" />
      <circle cx="106" cy="110" r="3" fill="${darkColor}" opacity="0.5" />
    `;
  } else if (patternType === 'legendary') {
    patternMarkup = `
      <path d="M 120 54 L 120 76 M 106 64 L 114 82 M 134 64 L 126 82" stroke="#E5B650" stroke-width="3" stroke-linecap="round" opacity="0.8" />
      <path d="M 96 95 Q 120 108 144 95" stroke="#E5B650" stroke-width="4.5" fill="none" opacity="0.75" stroke-linecap="round" />
      <circle cx="112" cy="88" r="3.2" fill="#E5B650" opacity="0.7" />
      <circle cx="128" cy="88" r="3.2" fill="#E5B650" opacity="0.7" />
      <circle cx="120" cy="108" r="3.5" fill="#E5B650" opacity="0.75" />
    `;
  } else if (patternType === 'club') {
    patternMarkup = `
      <ellipse cx="120" cy="85" rx="14" ry="9" fill="${accentColor}" opacity="0.5" />
      <ellipse cx="108" cy="104" rx="8" ry="6" fill="${accentColor}" opacity="0.5" />
      <ellipse cx="132" cy="104" rx="8" ry="6" fill="${accentColor}" opacity="0.5" />
      <circle cx="120" cy="85" r="3" fill="${darkColor}" opacity="0.6" />
      <circle cx="108" cy="104" r="2.5" fill="${darkColor}" opacity="0.6" />
      <circle cx="132" cy="104" r="2.5" fill="${darkColor}" opacity="0.6" />
    `;
  } else if (patternType === 'spikes') {
    patternMarkup = `
      <path d="M 120 62 L 120 74 M 108 70 L 116 78 M 132 70 L 124 78" stroke="${accentColor}" stroke-width="3" stroke-linecap="round" opacity="0.7" />
      <circle cx="114" cy="94" r="3.2" fill="${darkColor}" opacity="0.55" />
      <circle cx="126" cy="94" r="3.2" fill="${darkColor}" opacity="0.55" />
      <circle cx="120" cy="108" r="3" fill="${darkColor}" opacity="0.55" />
    `;
  } else {
    // speckles
    patternMarkup = `
      <circle cx="112" cy="82" r="3" fill="${darkColor}" opacity="0.6" />
      <circle cx="126" cy="74" r="2.5" fill="${darkColor}" opacity="0.6" />
      <circle cx="135" cy="92" r="3.5" fill="${darkColor}" opacity="0.6" />
      <circle cx="116" cy="100" r="2.8" fill="${darkColor}" opacity="0.6" />
      <circle cx="106" cy="108" r="2.5" fill="${darkColor}" opacity="0.6" />
      <circle cx="128" cy="114" r="3.2" fill="${darkColor}" opacity="0.6" />
      <circle cx="138" cy="104" r="2" fill="${darkColor}" opacity="0.6" />
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="eggGrad5" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="${baseColor}" />
      <stop offset="60%" stop-color="${baseColor}" />
      <stop offset="100%" stop-color="${darkColor}" />
    </linearGradient>
    <radialGradient id="eggGnd5" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
    <clipPath id="eggShellClip5">
      <path d="M 98 118 C 86 96 94 56 120 50 C 146 56 154 96 142 118 C 134 126 106 126 98 118 Z" />
    </clipPath>
  </defs>

  <g transform="translate(0, 6)">
    <ellipse cx="120" cy="125" rx="44" ry="8" fill="url(#eggGnd5)" />
    <path d="M 76 120 Q 62 114 54 108 M 88 123 Q 78 117 70 111 M 100 125 Q 92 119 82 114" stroke="#362C20" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 164 120 Q 178 114 186 108 M 152 123 Q 162 117 170 111 M 140 125 Q 148 119 158 114" stroke="#362C20" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 94 126 Q 120 131 146 126" stroke="#261E15" stroke-width="4" stroke-linecap="round" fill="none" />

    <path
      d="M 98 118 C 86 96 94 56 120 50 C 146 56 154 96 142 118 C 134 126 106 126 98 118 Z"
      fill="url(#eggGrad5)"
      stroke="#1E1711"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <g clip-path="url(#eggShellClip5)">
      <ellipse cx="134" cy="90" rx="20" ry="28" fill="${darkColor}" opacity="0.3" />
      <ellipse cx="106" cy="108" rx="16" ry="14" fill="#FAF6ED" opacity="0.25" />
      ${patternMarkup}
    </g>

    <path
      d="M 104 110 C 96 96 100 66 120 56"
      stroke="#FAF6ED"
      stroke-width="2.2"
      fill="none"
      stroke-linecap="round"
      opacity="0.65"
    />

    <path
      d="M 116 66 L 121 71 L 118 76 L 124 81 L 127 78"
      stroke="${fissureColor}"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
      opacity="0.85"
    />
  </g>
</svg>`;
}

// =========================================================================
// 21. EDMONTOSAURUS (Night Owl) — Duck-Billed Hadrosaur with Fleshy Comb
// =========================================================================
function createEdmontosaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  // Fleshy soft-tissue skull comb
  const combMarkup = isJuv
    ? '<path d="M 178 40 C 182 36, 186 36, 190 40 Z" fill="#688E8E" stroke="#1D1713" stroke-width="1.2" stroke-linejoin="round" />'
    : isGrown
    ? '<path d="M 174 40 C 180 28, 192 28, 198 40 Z" fill="#688E8E" stroke="#1D1713" stroke-width="1.6" stroke-linejoin="round" />\n       <circle cx="186" cy="34" r="2" fill="#E5B650" opacity="0.8" />'
    : '<path d="M 176 40 C 180 32, 188 32, 194 40 Z" fill="#688E8E" stroke="#1D1713" stroke-width="1.4" stroke-linejoin="round" />';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="edmonSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#364050' : '#414D60'}" />
      <stop offset="100%" stop-color="${isGrown ? '#222934' : '#2C3442'}" />
    </linearGradient>
    <radialGradient id="edmonShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 52 : 62}" ry="7" fill="url(#edmonShad)" />

  <g transform="translate(12, 14)">
    <!-- BACK LEGS -->
    <g fill="#1A202A">
      <path d="M 80 78 C 76 88 78 98 82 108 L 90 108 C 89 99 87 89 85 78 Z" />
      <path d="M 78 108 L 94 108 L 92 112 L 76 112 Z" />
      <path d="M 132 82 L 130 108 L 138 108 L 140 82 Z" />
      <path d="M 128 108 L 142 108 L 140 112 L 126 112 Z" />
    </g>

    <!-- DEEP DUCK-BILL TAIL -->
    <path
      d="M 64 70
         C 44 64, 24 60, 6 66
         C 18 76, 42 86, 64 86 Z"
      fill="url(#edmonSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <path d="M 10 67 C 26 76 46 84 64 85 L 64 82 C 46 81 28 72 14 67 Z" fill="#1A202A" />

    <!-- HEAVY HADROSAUR BODY -->
    <path
      d="M 64 70
         C 64 54, 82 46, 110 46
         C 128 46, 140 52, 148 60
         C 156 50, 168 44, 180 42
         C 194 40, 204 46, 212 50
         C 214 56, 206 60, 194 62
         C 178 64, 164 68, 144 74
         C 134 84, 120 90, 96 90
         C 78 90, 66 84, 64 70 Z"
      fill="url(#edmonSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Pale Sand Underbelly -->
    <path
      d="M 76 76
         C 90 85, 114 85, 132 76
         C 140 70, 152 66, 168 61
         C 156 61, 144 65, 136 70
         C 122 81, 106 85, 88 84
         C 80 83, 76 80, 76 76 Z"
      fill="#E2DCCF"
      opacity="0.85"
    />

    <!-- FOREGROUND FORELIMB -->
    <g>
      <path d="M 136 68 C 142 74 144 84 140 96 L 134 109" stroke="#1D1713" stroke-width="2.6" stroke-linecap="round" fill="none" />
      <path d="M 126 109 L 142 109 L 140 113 L 124 113 Z" fill="#1A202A" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <!-- Hadrosaur mitten hoof -->
      <circle cx="130" cy="112" r="1.3" fill="#FAF6ED" />
      <circle cx="135" cy="112" r="1.3" fill="#FAF6ED" />
    </g>

    <!-- FOREGROUND HIND LEG -->
    <g>
      <path d="M 90 58 C 106 60 114 72 112 86 C 108 95 100 98 90 95 C 82 89 82 75 86 65 Z" fill="#364050" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 96 84 L 92 108 L 104 108 L 106 84 Z" fill="#2C3442" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 88 108 L 110 108 L 108 113 L 86 113 Z" fill="#1A202A" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 86 112 L 80 115 M 99 112 L 99 116 M 110 112 L 116 115" stroke="#1D1713" stroke-width="2.4" stroke-linecap="round" />
    </g>

    <!-- SOFT-TISSUE CRANIAL COMB -->
    ${combMarkup}

    <!-- BROAD SPOON-SHAPED DUCK BILL & HEAD -->
    <g>
      <!-- Head Base -->
      <path
        d="M 174 44
           C 182 42, 192 42, 202 46
           C 214 50, 216 56, 206 59
           C 194 62, 178 62, 172 54 Z"
        fill="#2C3442"
        stroke="#1D1713"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <!-- Broad Duck Bill (Keratinous spoon shape) -->
      <path d="M 202 46 C 214 47, 218 52, 214 56 C 208 58, 200 58, 198 56 Z" fill="#1A202A" stroke="#1D1713" stroke-width="1.5" stroke-linejoin="round" />

      <!-- Nocturnal Amber Eye -->
      <ellipse cx="178" cy="48" rx="3.3" ry="2.8" fill="#1D1713" />
      <circle cx="178.2" cy="48" r="1.8" fill="#D4A853" />
      <circle cx="178.5" cy="48" r="1.1" fill="#150E0A" />
      <circle cx="179" cy="47.2" r="0.6" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 22. ALBERTOSAURUS (Water Break) — Sleek Runner Tyrannosaurid
// =========================================================================
function createAlbertosaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  // Lacrimal horn size in front of eye
  const crestMarkup = isJuv
    ? '<path d="M 174 42 L 176 36 L 179 41 Z" fill="#FAF6ED" stroke="#1D1713" stroke-width="1.2" stroke-linejoin="round" />'
    : isGrown
    ? '<path d="M 172 42 L 176 31 L 181 40 Z" fill="#FAF6ED" stroke="#1D1713" stroke-width="1.6" stroke-linejoin="round" />'
    : '<path d="M 173 42 L 176 34 L 180 41 Z" fill="#FAF6ED" stroke="#1D1713" stroke-width="1.4" stroke-linejoin="round" />';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="albertSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#324E45' : '#3E5C52'}" />
      <stop offset="100%" stop-color="${isGrown ? '#20342E' : '#2A3F38'}" />
    </linearGradient>
    <radialGradient id="albertShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 48 : 58}" ry="7" fill="url(#albertShad)" />

  <g transform="translate(14, 12)">
    <!-- BACK RUNNER LEG -->
    <g fill="#1B2824">
      <path d="M 92 76 C 88 86 90 98 94 109 L 104 109 C 102 98 100 87 97 76 Z" />
      <path d="M 89 109 L 107 109 L 105 113 L 87 113 Z" />
      <path d="M 86 113 L 82 116 M 96 113 L 96 117 M 105 113 L 109 116" stroke="#1D1713" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- LONG MUSCULAR COUNTERBALANCE TAIL -->
    <path
      d="M 68 74
         C 46 66, 24 60, 6 64
         C 20 73, 44 85, 68 87 Z"
      fill="url(#albertSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <path d="M 10 65 C 24 74 46 84 68 86 L 68 83 C 48 81 26 71 14 65 Z" fill="#1B2824" />

    <!-- ATHLETIC TYRANNOSAUR BODY & S-NECK -->
    <path
      d="M 68 74
         C 68 56, 84 48, 114 48
         C 128 48, 140 54, 146 62
         C 154 50, 166 44, 180 42
         C 194 40, 204 46, 206 54
         C 204 60, 196 64, 184 64
         C 168 66, 154 68, 142 74
         C 134 84, 122 88, 98 88
         C 78 88, 68 82, 68 74 Z"
      fill="url(#albertSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Cream Underbelly -->
    <path
      d="M 76 76
         C 90 85, 114 85, 132 76
         C 140 70, 152 66, 168 61
         C 156 61, 144 65, 136 70
         C 122 81, 106 85, 88 84
         C 80 83, 76 80, 76 76 Z"
      fill="#E6DEC8"
      opacity="0.85"
    />

    <!-- SHORT 2-FINGERED FORELIMB -->
    <g>
      <path d="M 136 68 C 140 72 142 76 139 80 L 136 81" stroke="#1D1713" stroke-width="2.2" stroke-linecap="round" fill="none" />
      <circle cx="139" cy="81" r="0.8" fill="#FAF6ED" />
      <circle cx="137" cy="82" r="0.8" fill="#FAF6ED" />
    </g>

    <!-- FOREGROUND ATHLETIC LEG (Long runner tibiae) -->
    <g>
      <path d="M 96 58 C 112 60 122 72 118 88 C 114 97 104 101 94 97 C 86 91 86 76 92 65 Z" fill="#3E5C52" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 102 86 L 98 110 L 110 110 L 112 86 Z" fill="#2A3F38" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 94 110 L 118 110 L 116 115 L 92 115 Z" fill="#1B2824" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 92 114 L 86 117 M 105 114 L 105 118 M 116 114 L 122 117" stroke="#1D1713" stroke-width="2.4" stroke-linecap="round" />
    </g>

    <!-- LACRIMAL BROW CREST (Key Albertosaurus signature) -->
    ${crestMarkup}

    <!-- TYRANNOSAURID HEAD & SNOUT -->
    <g>
      <!-- Upper jaw -->
      <path d="M 174 48 L 206 48 C 204 54 196 58 184 58 L 174 55 Z" fill="#20342E" stroke="#1D1713" stroke-width="1.5" stroke-linejoin="round" />
      <!-- Sharp serrated teeth -->
      <path d="M 180 49 L 181 52 L 183 49 M 187 49 L 188 52 L 190 49 M 194 49 L 195 52 L 197 49 M 200 49 L 201 52 L 203 49" stroke="#FAF6ED" stroke-width="1.1" stroke-linecap="round" fill="none" />

      <!-- Lower Jaw -->
      <path d="M 176 56 L 202 56 C 199 61 191 63 180 62 Z" fill="#1B2824" stroke="#1D1713" stroke-width="1.3" stroke-linejoin="round" />

      <!-- Keen Predatory Eye -->
      <ellipse cx="174" cy="44" rx="3.3" ry="2.8" fill="#1D1713" />
      <circle cx="174.2" cy="44" r="1.8" fill="#48B89E" />
      <circle cx="174.5" cy="44" r="1.1" fill="#150E0A" />
      <circle cx="175" cy="43.2" r="0.6" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 23. EUOPLOCEPHALUS (Move More) — Banded Armor & Double-Lobed Tail Club
// =========================================================================
function createEuoplocephalusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const clubRadius = isJuv ? 4.5 : isGrown ? 8.5 : 6.5;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="euopSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#5A4634' : '#6A533E'}" />
      <stop offset="100%" stop-color="${isGrown ? '#3C2E22' : '#463628'}" />
    </linearGradient>
    <radialGradient id="euopShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 52 : 64}" ry="7" fill="url(#euopShad)" />

  <g transform="translate(10, 16)">
    <!-- BACK LEGS -->
    <g fill="#2A2017">
      <path d="M 74 80 L 70 108 L 82 108 L 86 80 Z" />
      <path d="M 66 108 L 86 108 L 84 112 L 64 112 Z" />
      <path d="M 128 82 L 126 108 L 136 108 L 138 82 Z" />
      <path d="M 124 108 L 140 108 L 138 112 L 122 112 Z" />
    </g>

    <!-- HEAVY ARMORED TAIL WITH BONY TAIL CLUB -->
    <g>
      <!-- Tail Handle (Fused stiffened vertebrae) -->
      <path
        d="M 64 74
           C 46 75, 26 78, 12 80
           C 26 84, 46 86, 64 88 Z"
        fill="url(#euopSkin)"
        stroke="#1D1713"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- THE BONY DOUBLE-LOBED TAIL CLUB -->
      <ellipse cx="12" cy="80" rx="${clubRadius + 3}" ry="${clubRadius}" fill="#E8DEC8" stroke="#1D1713" stroke-width="1.6" />
      <circle cx="12" cy="77" r="${clubRadius * 0.4}" fill="#786B5A" opacity="0.6" />
      <circle cx="12" cy="83" r="${clubRadius * 0.4}" fill="#786B5A" opacity="0.6" />
    </g>

    <!-- BROAD LOW-SLUNG TANK BODY -->
    <path
      d="M 64 74
         C 64 56, 84 48, 114 48
         C 134 48, 148 54, 154 62
         C 152 74, 148 86, 134 90
         C 114 94, 78 94, 64 88 Z"
      fill="url(#euopSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- TRANSVERSE BANDS OF KEELED ARMOR SCUTES -->
    <g fill="#E8DEC8" stroke="#1D1713" stroke-width="1.2">
      <!-- Band 1 over shoulders -->
      <ellipse cx="134" cy="62" rx="4" ry="2.5" />
      <ellipse cx="144" cy="68" rx="3.5" ry="2.2" />
      <!-- Band 2 mid-torso -->
      <ellipse cx="114" cy="56" rx="4.5" ry="2.8" />
      <ellipse cx="116" cy="66" rx="4.5" ry="2.8" />
      <ellipse cx="118" cy="76" rx="4" ry="2.5" />
      <!-- Band 3 pelvic region -->
      <ellipse cx="90" cy="58" rx="4.5" ry="2.8" />
      <ellipse cx="92" cy="68" rx="4.5" ry="2.8" />
      <ellipse cx="94" cy="78" rx="4" ry="2.5" />
      <!-- Band 4 tail base -->
      <ellipse cx="72" cy="68" rx="3.5" ry="2.2" />
      <ellipse cx="74" cy="78" rx="3.5" ry="2.2" />
    </g>

    <!-- FOREGROUND PILLAR LEGS -->
    <!-- Foreleg -->
    <g>
      <path d="M 134 68 C 142 70 146 78 144 88 L 136 109 L 124 109 L 126 86 C 126 76 130 68 134 68 Z" fill="#5A4634" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 120 109 L 140 109 L 138 114 L 118 114 Z" fill="#2A2017" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <circle cx="123" cy="113" r="1.4" fill="#FAF6ED" />
      <circle cx="129" cy="113" r="1.4" fill="#FAF6ED" />
      <circle cx="135" cy="113" r="1.4" fill="#FAF6ED" />
    </g>

    <!-- Hind Leg -->
    <g>
      <path d="M 80 62 C 94 64 100 74 98 86 C 96 95 90 100 82 98 L 76 109 L 64 109 L 68 86 C 70 76 74 64 80 62 Z" fill="#5A4634" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 60 109 L 80 109 L 78 114 L 58 114 Z" fill="#2A2017" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <circle cx="63" cy="113" r="1.4" fill="#FAF6ED" />
      <circle cx="69" cy="113" r="1.4" fill="#FAF6ED" />
      <circle cx="75" cy="113" r="1.4" fill="#FAF6ED" />
    </g>

    <!-- BROAD TRIANGULAR HEAD WITH PYRAMIDAL SQUAMOSAL HORNS -->
    <g>
      <!-- Skull Base -->
      <path
        d="M 152 64
           C 158 52, 172 50, 186 54
           C 196 58, 198 68, 192 74
           C 182 78, 168 76, 154 72 Z"
        fill="#463628"
        stroke="#1D1713"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- Rear Squamosal Horns (Backward triangular horns) -->
      <path d="M 160 52 L 154 44 L 168 50 Z" fill="#E8DEC8" stroke="#1D1713" stroke-width="1.3" stroke-linejoin="round" />
      <path d="M 158 66 L 150 72 L 162 70 Z" fill="#E8DEC8" stroke="#1D1713" stroke-width="1.3" stroke-linejoin="round" />

      <!-- Broad Beak -->
      <path d="M 188 64 L 198 68 C 196 74 190 76 185 74 Z" fill="#2A2017" stroke="#1D1713" stroke-width="1.4" stroke-linejoin="round" />

      <!-- Armored Eyelid & Eye -->
      <path d="M 170 54 Q 175 51 180 54" stroke="#E8DEC8" stroke-width="2" fill="none" stroke-linecap="round" />
      <ellipse cx="175" cy="57" rx="3.1" ry="2.6" fill="#1D1713" />
      <circle cx="175.2" cy="57" r="1.6" fill="#C88E36" />
      <circle cx="175.5" cy="57" r="1.0" fill="#150E0A" />
      <circle cx="176" cy="56.2" r="0.5" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 24. NODOSAURUS (Mindful One) — Outward Shoulder Spines & Tapered Tail
// =========================================================================
function createNodosaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const spineLen = isJuv ? 6 : isGrown ? 15 : 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="nodoSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#4B5341' : '#57604C'}" />
      <stop offset="100%" stop-color="${isGrown ? '#2F3527' : '#373D2E'}" />
    </linearGradient>
    <radialGradient id="nodoShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 52 : 62}" ry="7" fill="url(#nodoShad)" />

  <g transform="translate(10, 16)">
    <!-- BACK LEGS -->
    <g fill="#21261B">
      <path d="M 76 80 L 72 108 L 84 108 L 88 80 Z" />
      <path d="M 68 108 L 88 108 L 86 112 L 66 112 Z" />
      <path d="M 126 82 L 124 108 L 134 108 L 136 82 Z" />
      <path d="M 122 108 L 138 108 L 136 112 L 120 112 Z" />
    </g>

    <!-- LONG TAPERING CLUBLESS TAIL (Key distinction from Ankylosaurs!) -->
    <path
      d="M 64 74
         C 46 76, 26 82, 6 90
         C 26 88, 46 84, 64 86 Z"
      fill="url(#nodoSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <path d="M 10 89 C 26 87 46 83 64 85 L 64 82 C 46 81 28 84 14 88 Z" fill="#21261B" />

    <!-- GROUNDED DEFENSIVE BODY -->
    <path
      d="M 64 74
         C 64 56, 84 48, 114 48
         C 134 48, 148 54, 154 62
         C 152 74, 148 86, 134 90
         C 114 94, 78 94, 64 86 Z"
      fill="url(#nodoSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- PROMINENT LATERAL SHOULDER SPINES (Signature Nodosaurid feature) -->
    <g fill="#ECE5D2" stroke="#1D1713" stroke-width="1.4" stroke-linejoin="round">
      <!-- Main giant shoulder spine -->
      <path d="M 138 58 L ${138 + spineLen} 48 L 144 64 Z" />
      <!-- Secondary flank spine -->
      <path d="M 118 56 L ${118 + spineLen * 0.7} 48 L 124 62 Z" />
      <!-- Third spine over hips -->
      <path d="M 96 58 L ${96 + spineLen * 0.5} 52 L 102 64 Z" />
    </g>

    <!-- Dermal nodule bands -->
    <g fill="#ECE5D2" opacity="0.8">
      <circle cx="78" cy="70" r="1.8" />
      <circle cx="88" cy="72" r="1.8" />
      <circle cx="108" cy="72" r="2" />
      <circle cx="128" cy="72" r="2" />
      <circle cx="86" cy="80" r="1.6" />
      <circle cx="104" cy="82" r="1.8" />
    </g>

    <!-- FOREGROUND PILLAR LEGS -->
    <!-- Foreleg -->
    <g>
      <path d="M 132 68 C 140 70 144 78 142 88 L 134 109 L 122 109 L 124 86 C 124 76 128 68 132 68 Z" fill="#4B5341" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 118 109 L 138 109 L 136 114 L 116 114 Z" fill="#21261B" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <circle cx="121" cy="113" r="1.4" fill="#FAF6ED" />
      <circle cx="127" cy="113" r="1.4" fill="#FAF6ED" />
      <circle cx="133" cy="113" r="1.4" fill="#FAF6ED" />
    </g>

    <!-- Hind Leg -->
    <g>
      <path d="M 80 62 C 94 64 100 74 98 86 C 96 95 90 100 82 98 L 76 109 L 64 109 L 68 86 C 70 76 74 64 80 62 Z" fill="#4B5341" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 60 109 L 80 109 L 78 114 L 58 114 Z" fill="#21261B" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <circle cx="63" cy="113" r="1.4" fill="#FAF6ED" />
      <circle cx="69" cy="113" r="1.4" fill="#FAF6ED" />
      <circle cx="75" cy="113" r="1.4" fill="#FAF6ED" />
    </g>

    <!-- NARROW PEAR-SHAPED SKULL (No horns on skull) -->
    <g>
      <path
        d="M 152 62
           C 160 52, 174 50, 186 54
           C 194 58, 196 66, 190 72
           C 180 76, 166 74, 154 70 Z"
        fill="#373D2E"
        stroke="#1D1713"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <!-- Narrow beak -->
      <path d="M 188 62 L 196 66 C 194 71 188 73 184 72 Z" fill="#21261B" stroke="#1D1713" stroke-width="1.3" stroke-linejoin="round" />

      <!-- Mindful, Serene Eye -->
      <path d="M 170 53 Q 175 50 180 53" stroke="#1D1713" stroke-width="1.8" fill="none" stroke-linecap="round" />
      <ellipse cx="175" cy="56" rx="3.1" ry="2.6" fill="#1D1713" />
      <circle cx="175.2" cy="56" r="1.6" fill="#84A462" />
      <circle cx="175.5" cy="56" r="1.0" fill="#150E0A" />
      <circle cx="176" cy="55.2" r="0.5" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 25. LEGENDARY TYRANNOSAURUS REX (Legendary) — Crown of Streakosaurus
// =========================================================================
function createLegendaryTRexSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  // Golden dorsal crest spikes along neck and back
  const crestSpikes = isJuv
    ? '<path d="M 104 46 L 106 42 L 108 46 M 120 46 L 122 42 L 124 46 M 136 48 L 138 44 L 140 48" stroke="#E5B650" stroke-width="1.8" stroke-linecap="round" />'
    : isGrown
    ? `<path d="M 90 48 L 92 38 L 95 48 M 104 44 L 107 32 L 110 44 M 118 44 L 121 32 L 124 44 M 132 46 L 135 34 L 138 46 M 146 50 L 149 38 L 152 50" fill="#E5B650" stroke="#1D1713" stroke-width="1.6" stroke-linejoin="round" />
       <!-- Mythic royal aura sparkles -->
       <circle cx="107" cy="28" r="1.5" fill="#FFF2B2" />
       <circle cx="135" cy="30" r="1.5" fill="#FFF2B2" />`
    : '<path d="M 98 46 L 101 38 L 104 46 M 114 44 L 117 36 L 120 44 M 130 46 L 133 38 L 136 46" fill="#E5B650" stroke="#1D1713" stroke-width="1.4" stroke-linejoin="round" />';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="legSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#2A231E' : '#362E27'}" />
      <stop offset="100%" stop-color="${isGrown ? '#181310' : '#221C17'}" />
    </linearGradient>
    <linearGradient id="legGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F2CA65" />
      <stop offset="100%" stop-color="#C28A22" />
    </linearGradient>
    <radialGradient id="legShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 52 : 64}" ry="7.5" fill="url(#legShad)" />

  <g transform="translate(14, 10)">
    <!-- BACK LEG -->
    <g fill="#140E0A">
      <path d="M 94 76 C 90 86 92 98 96 109 L 106 109 C 104 98 102 87 99 76 Z" />
      <path d="M 91 109 L 109 109 L 107 113 L 89 113 Z" />
      <path d="M 88 113 L 84 116 M 98 113 L 98 117 M 107 113 L 111 116" stroke="#E5B650" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- COLOSSAL TAIL -->
    <path
      d="M 68 74
         C 44 66, 22 58, 4 62
         C 18 73, 44 86, 68 88 Z"
      fill="url(#legSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <path d="M 8 63 C 22 74 46 85 68 87 L 68 84 C 48 82 26 71 12 63 Z" fill="#140E0A" />

    <!-- ROYAL GOLDEN DORSAL CREST -->
    ${crestSpikes}

    <!-- COLOSSAL BARREL-CHESTED TYRANT BODY & S-NECK -->
    <path
      d="M 68 74
         C 68 54, 86 44, 116 46
         C 132 47, 144 54, 150 62
         C 158 50, 170 42, 186 40
         C 202 38, 214 44, 216 54
         C 214 62, 204 66, 190 66
         C 172 68, 156 70, 144 76
         C 134 86, 122 90, 98 90
         C 78 90, 68 84, 68 74 Z"
      fill="url(#legSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Rich Golden-Amber Underbelly -->
    <path
      d="M 76 76
         C 90 85, 114 85, 132 76
         C 140 70, 152 66, 168 61
         C 156 61, 144 65, 136 70
         C 122 81, 106 85, 88 84
         C 80 83, 76 80, 76 76 Z"
      fill="url(#legGold)"
      opacity="0.9"
    />

    <!-- FOREARM WITH GOLD-TIPPED CLAWS -->
    <g>
      <path d="M 136 70 C 140 74 142 78 139 82 L 136 83" stroke="#1D1713" stroke-width="2.4" stroke-linecap="round" fill="none" />
      <circle cx="139" cy="83" r="0.9" fill="#E5B650" />
      <circle cx="137" cy="84" r="0.9" fill="#E5B650" />
    </g>

    <!-- FOREGROUND COLOSSAL TYRANNOSAUR LEG -->
    <g>
      <path d="M 98 58 C 116 60 126 72 122 88 C 118 97 106 101 96 97 C 88 91 88 76 94 65 Z" fill="#2A231E" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 104 86 L 100 110 L 112 110 L 114 86 Z" fill="#221C17" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 96 110 L 120 110 L 118 115 L 94 115 Z" fill="#140E0A" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 94 114 L 88 117 M 107 114 L 107 118 M 118 114 L 124 117" stroke="#E5B650" stroke-width="2.6" stroke-linecap="round" />
    </g>

    <!-- MASSIVE BONE-CRUSHING SKULL & GLOWING EYES -->
    <g>
      <!-- Heavy lacrimal brow crest -->
      <path d="M 176 40 L 182 32 L 188 40 Z" fill="#E5B650" stroke="#1D1713" stroke-width="1.6" stroke-linejoin="round" />

      <!-- Upper jaw -->
      <path d="M 176 48 L 214 48 C 212 56 202 61 188 61 L 176 57 Z" fill="#181310" stroke="#1D1713" stroke-width="1.6" stroke-linejoin="round" />
      <!-- Gleaming ivory teeth -->
      <path d="M 182 49 L 183 53 L 185 49 M 190 49 L 191 54 L 193 49 M 198 49 L 200 54 L 202 49 M 207 49 L 208 53 L 210 49" stroke="#FFF8E7" stroke-width="1.4" stroke-linecap="round" fill="none" />

      <!-- Lower Jaw -->
      <path d="M 178 58 L 210 58 C 206 64 196 66 182 65 Z" fill="#140E0A" stroke="#1D1713" stroke-width="1.4" stroke-linejoin="round" />

      <!-- Piercing Glowing Amber-Gold Gaze -->
      <ellipse cx="178" cy="43" rx="3.6" ry="3.0" fill="#1D1713" />
      <circle cx="178.2" cy="43" r="2.0" fill="#FFC738" />
      <circle cx="178.5" cy="43" r="1.1" fill="#150E0A" />
      <circle cx="179.1" cy="42.2" r="0.7" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// RUN GENERATOR FOR BATCH 5 (21–25)
// =========================================================================
const BASE_DIR = path.resolve('src', 'assets', 'dinos');

const dinosBatch5 = [
  {
    slug: 'night-owl',
    egg: { baseColor: '#455366', darkColor: '#252D38', accentColor: '#688E8E', fissureColor: '#E5B650', patternType: 'speckles' },
    generate: createEdmontosaurusSvg
  },
  {
    slug: 'water-break',
    egg: { baseColor: '#4B6B60', darkColor: '#263B34', accentColor: '#3E5C52', fissureColor: '#48B89E', patternType: 'bands' },
    generate: createAlbertosaurusSvg
  },
  {
    slug: 'move-more',
    egg: { baseColor: '#7A624A', darkColor: '#423324', accentColor: '#E8DEC8', fissureColor: '#2A2017', patternType: 'club' },
    generate: createEuoplocephalusSvg
  },
  {
    slug: 'mindful-one',
    egg: { baseColor: '#626C56', darkColor: '#343B2C', accentColor: '#ECE5D2', fissureColor: '#21261B', patternType: 'spikes' },
    generate: createNodosaurusSvg
  },
  {
    slug: 'legendary',
    egg: { baseColor: '#362E27', darkColor: '#181310', accentColor: '#E5B650', fissureColor: '#E5B650', patternType: 'legendary' },
    generate: createLegendaryTRexSvg
  }
];

const stages = ['juvenile', 'adult', 'grown'];

for (const dino of dinosBatch5) {
  const dir = path.join(BASE_DIR, dino.slug);
  fs.mkdirSync(dir, { recursive: true });

  // 1. Egg
  const eggSvg = createEggSvg(dino.egg);
  fs.writeFileSync(path.join(dir, 'egg.svg'), eggSvg, 'utf8');

  // 2. Stages
  for (const st of stages) {
    const svg = dino.generate(st);
    fs.writeFileSync(path.join(dir, `${st}.svg`), svg, 'utf8');
  }

  console.log(`Generated Batch 5: ${dino.slug}`);
}

console.log('Batch 5 generation complete!');
