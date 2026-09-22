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
      <path d="M 88 100 Q 120 115 152 100" stroke="${accentColor}" stroke-width="6" fill="none" opacity="0.4" stroke-linecap="round" />
      <path d="M 94 80 Q 120 95 146 80" stroke="${accentColor}" stroke-width="5" fill="none" opacity="0.4" stroke-linecap="round" />
      <circle cx="114" cy="92" r="3" fill="${darkColor}" opacity="0.5" />
      <circle cx="128" cy="85" r="2.5" fill="${darkColor}" opacity="0.5" />
      <circle cx="106" cy="110" r="3" fill="${darkColor}" opacity="0.5" />
    `;
  } else if (patternType === 'mottled') {
    patternMarkup = `
      <ellipse cx="110" cy="85" rx="10" ry="7" fill="${accentColor}" opacity="0.45" />
      <ellipse cx="132" cy="95" rx="12" ry="8" fill="${accentColor}" opacity="0.45" />
      <ellipse cx="118" cy="112" rx="9" ry="6" fill="${accentColor}" opacity="0.45" />
      <circle cx="108" cy="98" r="2.4" fill="${darkColor}" opacity="0.6" />
      <circle cx="125" cy="80" r="2.8" fill="${darkColor}" opacity="0.6" />
      <circle cx="134" cy="110" r="2.2" fill="${darkColor}" opacity="0.6" />
    `;
  } else if (patternType === 'domed') {
    patternMarkup = `
      <circle cx="120" cy="75" r="14" fill="${accentColor}" opacity="0.4" />
      <circle cx="112" cy="95" r="4" fill="${darkColor}" opacity="0.5" />
      <circle cx="128" cy="95" r="4" fill="${darkColor}" opacity="0.5" />
      <circle cx="120" cy="108" r="3.5" fill="${darkColor}" opacity="0.5" />
      <circle cx="105" cy="112" r="2.5" fill="${darkColor}" opacity="0.5" />
      <circle cx="135" cy="112" r="2.5" fill="${darkColor}" opacity="0.5" />
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
    <linearGradient id="eggGrad2" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="${baseColor}" />
      <stop offset="60%" stop-color="${baseColor}" />
      <stop offset="100%" stop-color="${darkColor}" />
    </linearGradient>
    <radialGradient id="eggGnd2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
    <clipPath id="eggShellClip2">
      <path d="M 98 118 C 86 96 94 56 120 50 C 146 56 154 96 142 118 C 134 126 106 126 98 118 Z" />
    </clipPath>
  </defs>

  <g transform="translate(0, 6)">
    <ellipse cx="120" cy="125" rx="44" ry="8" fill="url(#eggGnd2)" />
    <path d="M 76 120 Q 62 114 54 108 M 88 123 Q 78 117 70 111 M 100 125 Q 92 119 82 114" stroke="#362C20" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 164 120 Q 178 114 186 108 M 152 123 Q 162 117 170 111 M 140 125 Q 148 119 158 114" stroke="#362C20" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 94 126 Q 120 131 146 126" stroke="#261E15" stroke-width="4" stroke-linecap="round" fill="none" />

    <path
      d="M 98 118 C 86 96 94 56 120 50 C 146 56 154 96 142 118 C 134 126 106 126 98 118 Z"
      fill="url(#eggGrad2)"
      stroke="#1E1711"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <g clip-path="url(#eggShellClip2)">
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
// 06. ANKYLOSAURUS (Month Master) — Heavily Armored Tank with Tail Club
// =========================================================================
function createAnkylosaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  // Tail club size
  const tailClub = isJuv
    ? '<ellipse cx="14" cy="85" rx="5" ry="4" fill="#544A3D" stroke="#1D1711" stroke-width="1.4" />'
    : isGrown
    ? '<ellipse cx="8" cy="84" rx="10" ry="8" fill="#544A3D" stroke="#1D1711" stroke-width="2" />\n       <circle cx="6" cy="84" r="3" fill="#D8D2BC" opacity="0.7" />\n       <circle cx="11" cy="84" r="3" fill="#D8D2BC" opacity="0.7" />'
    : '<ellipse cx="10" cy="85" rx="8" ry="6.5" fill="#544A3D" stroke="#1D1711" stroke-width="1.8" />\n       <circle cx="10" cy="85" r="2.5" fill="#D8D2BC" opacity="0.7" />';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="ankySkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#5A5040' : '#645846'}" />
      <stop offset="100%" stop-color="${isGrown ? '#423A2E' : '#4C4234'}" />
    </linearGradient>
    <radialGradient id="ankyShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 52 : 60}" ry="8" fill="url(#ankyShad)" />

  <g transform="translate(15, 14)">
    <!-- BACK LEGS (Low, sturdy) -->
    <g fill="#332D23">
      <path d="M 76 86 L 72 106 L 82 106 L 84 88 Z" />
      <path d="M 70 106 L 83 106 L 82 109 L 69 109 Z" />
      <path d="M 132 88 L 128 106 L 136 106 L 138 90 Z" />
      <path d="M 126 106 L 137 106 L 136 109 L 125 109 Z" />
    </g>

    <!-- HEAVY TAIL ENDING IN BONE CLUB -->
    <path d="M 68 78 C 46 78 28 82 12 85 C 28 88 48 86 68 84 Z" fill="url(#ankySkin)" stroke="#1D1711" stroke-width="2" stroke-linejoin="round" />
    ${tailClub}

    <!-- BROAD FLATTENED ARMORED TORSO -->
    <path
      d="M 64 78
         C 64 62, 82 52, 114 54
         C 134 56, 148 64, 154 75
         C 162 73, 172 76, 178 82
         C 182 86, 180 90, 172 92
         C 160 90, 148 88, 140 88
         C 126 92, 102 92, 84 90
         C 72 88, 66 84, 64 78 Z"
      fill="url(#ankySkin)"
      stroke="#1D1711"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- KEELED OSTEODERM ARMOR SCUTES -->
    <g fill="#3D352B" stroke="#1D1711" stroke-width="1.4" stroke-linejoin="round">
      <path d="M 76 68 L 84 64 L 92 68 L 84 72 Z" />
      <path d="M 96 64 L 104 60 L 112 64 L 104 68 Z" />
      <path d="M 116 63 L 124 59 L 132 63 L 124 67 Z" />
      <path d="M 134 68 L 142 64 L 148 68 L 142 72 Z" />
      <!-- Lower row -->
      <path d="M 84 74 L 92 70 L 100 74 L 92 78 Z" fill="#D8D2BC" opacity="0.85" />
      <path d="M 104 72 L 112 68 L 120 72 L 112 76 Z" fill="#D8D2BC" opacity="0.85" />
      <path d="M 124 71 L 132 67 L 140 71 L 132 75 Z" fill="#D8D2BC" opacity="0.85" />
    </g>

    <!-- LATERAL DEFENSIVE SPIKES -->
    <path d="M 70 74 L 62 70 L 68 76 Z" fill="#FAF6ED" stroke="#1D1711" stroke-width="1.4" stroke-linejoin="round" />
    <path d="M 148 76 L 156 73 L 150 79 Z" fill="#FAF6ED" stroke="#1D1711" stroke-width="1.4" stroke-linejoin="round" />

    <!-- FOREGROUND HIND LEG -->
    <g>
      <path d="M 80 72 C 92 74 96 82 94 91 L 85 109 L 72 109 L 72 90 C 72 80 76 73 80 72 Z" fill="#544A3D" stroke="#1D1711" stroke-width="2" stroke-linejoin="round" />
      <path d="M 70 109 L 87 109 L 85 113 L 68 113 Z" fill="#383025" stroke="#1D1711" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 72 113 L 72 115 M 78 113 L 78 116 M 84 113 L 84 115" stroke="#1D1711" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND FRONT LEG -->
    <g>
      <path d="M 134 76 C 140 78 142 85 140 92 L 132 109 L 122 109 L 123 90 C 125 82 129 77 134 76 Z" fill="#544A3D" stroke="#1D1711" stroke-width="2" stroke-linejoin="round" />
      <path d="M 120 109 L 134 109 L 133 113 L 119 113 Z" fill="#383025" stroke="#1D1711" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 122 113 L 122 115 M 127 113 L 127 116 M 132 113 L 132 115" stroke="#1D1711" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- WIDE TRIANGULAR SKULL WITH CHEEK HORNS -->
    <path d="M 152 74 L 146 68 L 154 71 Z" fill="#FAF6ED" stroke="#1D1711" stroke-width="1.4" stroke-linejoin="round" />
    <!-- Eye -->
    <ellipse cx="168" cy="82" rx="2.8" ry="2.4" fill="#1D1711" />
    <circle cx="168.2" cy="82" r="1.5" fill="${isGrown ? '#D4A034' : '#C49A45'}" />
    <circle cx="168.7" cy="81.4" r="0.6" fill="#FFFFFF" />
  </g>
</svg>`;
}

// =========================================================================
// 07. ALLOSAURUS (Centurion) — Athletic Apex Theropod with Lacrimal Crests
// =========================================================================
function createAllosaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const crestMarkup = isJuv
    ? '<path d="M 166 42 L 164 36 L 169 40 Z" fill="#BA4A22" stroke="#20130B" stroke-width="1.3" stroke-linejoin="round" />'
    : isGrown
    ? '<path d="M 166 42 L 162 28 L 171 36 Z" fill="#D4481E" stroke="#20130B" stroke-width="1.8" stroke-linejoin="round" />\n       <path d="M 173 41 L 169 31 L 177 38 Z" fill="#A83614" stroke="#20130B" stroke-width="1.6" stroke-linejoin="round" />'
    : '<path d="M 166 42 L 163 32 L 170 38 Z" fill="#BA4A22" stroke="#20130B" stroke-width="1.6" stroke-linejoin="round" />\n       <path d="M 172 41 L 170 34 L 176 39 Z" fill="#9C3A16" stroke="#20130B" stroke-width="1.4" stroke-linejoin="round" />';

  const teethMarkup = isJuv
    ? 'M 166 53 L 168 55 L 170 53 L 172 55 L 174 53'
    : isGrown
    ? 'M 166 53 L 168 57 L 170 53 L 172 57 L 174 53 L 176 57 L 178 53 L 180 57'
    : 'M 166 53 L 168 56 L 170 53 L 172 56 L 174 53 L 176 56 L 178 53';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="alloSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#8C4E26' : '#965A30'}" />
      <stop offset="100%" stop-color="${isGrown ? '#6E3A18' : '#784420'}" />
    </linearGradient>
    <radialGradient id="alloShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 48 : 56}" ry="7" fill="url(#alloShad)" />

  <g transform="translate(15, 12)">
    <!-- BACK LEG -->
    <g fill="#4E2812">
      <path d="M 92 76 C 88 86 90 98 94 109 L 104 109 C 102 98 100 87 97 76 Z" />
      <path d="M 89 109 L 107 109 L 105 113 L 87 113 Z" />
      <path d="M 86 113 L 82 116 M 96 113 L 96 117 M 105 113 L 109 116" stroke="#20130B" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- HORIZONTAL LONG TAIL -->
    <path d="M 68 74 C 42 66 22 58 6 62 C 22 72 44 85 68 87 Z" fill="url(#alloSkin)" stroke="#20130B" stroke-width="2" stroke-linejoin="round" />
    <path d="M 12 64 C 26 73 46 84 68 86 L 68 83 C 48 81 28 70 16 64 Z" fill="#582E16" />
    <path d="M 24 67 L 28 61 M 38 72 L 42 66 M 52 77 L 56 71" stroke="#BA4A22" stroke-width="2.6" stroke-linecap="round" opacity="0.8" />

    <!-- ATHLETIC SLENDER TORSO & NECK -->
    <path
      d="M 66 74
         C 66 54, 84 46, 114 48
         C 126 49, 138 54, 144 62
         C 148 50, 158 42, 172 40
         C 188 38, 196 44, 194 52
         C 192 57, 184 61, 172 63
         C 160 65, 148 67, 138 67
         C 132 76, 120 86, 96 86
         C 78 86, 68 82, 66 74 Z"
      fill="url(#alloSkin)"
      stroke="#20130B"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Cream Throat & Underbelly -->
    <path
      d="M 76 75
         C 90 84, 114 84, 130 74
         C 136 70, 144 68, 152 64
         C 144 64, 136 66, 130 67
         C 122 80, 106 85, 90 84
         C 82 83, 77 80, 76 75 Z"
      fill="#E2D5BA"
      opacity="0.85"
    />

    <!-- ALLOSAURUS 3-CLAWED POWERFUL FORELIMBS (Longer than Rex) -->
    <g>
      <path d="M 130 66 C 136 69 140 76 137 83 L 130 84" stroke="#20130B" stroke-width="2.8" stroke-linecap="round" fill="none" />
      <path d="M 137 83 L 143 86 M 135 84 L 140 88 M 133 85 L 137 90" stroke="#FAF6ED" stroke-width="1.6" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND RUNNER LEG -->
    <g>
      <path d="M 98 58 C 114 60 122 72 118 87 C 114 96 105 100 95 96 C 87 90 87 76 93 64 Z" fill="#844B24" stroke="#20130B" stroke-width="2" stroke-linejoin="round" />
      <path d="M 104 86 L 100 110 L 112 110 L 113 86 Z" fill="#703C1A" stroke="#20130B" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 96 110 L 120 110 L 118 115 L 94 115 Z" fill="#582E16" stroke="#20130B" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 94 114 L 88 117 M 107 114 L 107 118 M 118 114 L 124 117" stroke="#20130B" stroke-width="2.4" stroke-linecap="round" />
    </g>

    <!-- LACRIMAL CREST HORNS (Dual horns in front of eyes) -->
    ${crestMarkup}

    <!-- SLASHING JAW & RECURVED TEETH -->
    <g>
      <path d="M 162 54 L 184 53 C 186 58 178 61 166 60 Z" fill="#542B14" stroke="#20130B" stroke-width="1.6" stroke-linejoin="round" />
      <path d="${teethMarkup}" stroke="#FAF6ED" stroke-width="1.2" stroke-linecap="round" fill="none" />

      <!-- Piercing Eye -->
      <ellipse cx="166" cy="45" rx="3.5" ry="3" fill="#20130B" />
      <circle cx="166.2" cy="45" r="2" fill="${isGrown ? '#E5A830' : '#D49E34'}" />
      <circle cx="166.5" cy="45" r="1.1" fill="#120A05" />
      <circle cx="167.2" cy="44.2" r="0.7" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 08. PACHYCEPHALOSAURUS (Brick by Brick) — Bone Dome with Studded Spikes
// =========================================================================
function createPachycephalosaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const domeThickness = isJuv ? 10 : isGrown ? 17 : 14;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="pachySkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#988056' : '#A48B60'}" />
      <stop offset="100%" stop-color="${isGrown ? '#766038' : '#80693E'}" />
    </linearGradient>
    <radialGradient id="pachyShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 46 : 54}" ry="7" fill="url(#pachyShad)" />

  <g transform="translate(15, 12)">
    <!-- BACK HIND LEG -->
    <g fill="#4F3F24">
      <path d="M 90 76 C 86 86 88 98 92 108 L 102 108 C 100 98 98 87 95 76 Z" />
      <path d="M 87 108 L 105 108 L 103 112 L 85 112 Z" />
      <path d="M 84 112 L 80 115 M 94 112 L 94 116 M 103 112 L 107 115" stroke="#221C12" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- STIFF HORIZONTAL TAIL -->
    <path d="M 68 74 C 44 68 24 64 8 70 C 24 78 44 86 68 86 Z" fill="url(#pachySkin)" stroke="#221C12" stroke-width="2" stroke-linejoin="round" />

    <!-- BIPEDAL HERBIVORE TORSO -->
    <path
      d="M 66 74
         C 66 56, 82 48, 112 50
         C 124 51, 134 56, 140 64
         C 146 54, 154 44, 168 40
         C 182 38, 192 44, 188 54
         C 182 60, 172 63, 162 65
         C 150 67, 142 70, 134 70
         C 126 80, 116 87, 94 87
         C 76 87, 68 82, 66 74 Z"
      fill="url(#pachySkin)"
      stroke="#221C12"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Cream Underbelly -->
    <path
      d="M 76 76
         C 88 84, 112 85, 126 76
         C 118 82, 104 86, 90 85
         C 82 84, 78 81, 76 76 Z"
      fill="#EDE6D6"
      opacity="0.85"
    />

    <!-- SMALL HERBIVORE FORELIMBS -->
    <g>
      <path d="M 126 68 C 130 70 132 75 130 80 L 126 81" stroke="#221C12" stroke-width="2.4" stroke-linecap="round" fill="none" />
      <path d="M 130 80 L 133 82 M 128 81 L 130 84" stroke="#FAF6ED" stroke-width="1.3" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND RUNNER LEG -->
    <g>
      <path d="M 96 60 C 110 62 116 73 112 87 C 108 96 100 99 92 95 C 84 89 85 76 91 66 Z" fill="#8E754C" stroke="#221C12" stroke-width="2" stroke-linejoin="round" />
      <path d="M 100 86 L 97 109 L 108 109 L 109 86 Z" fill="#78623B" stroke="#221C12" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 93 109 L 115 109 L 113 114 L 91 114 Z" fill="#584628" stroke="#221C12" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 92 114 L 86 117 M 103 114 L 103 118 M 113 114 L 119 117" stroke="#221C12" stroke-width="2.2" stroke-linecap="round" />
    </g>

    <!-- MASSIVE 9-INCH SOLID BONE DOME -->
    <path
      d="M 158 46
         C 156 34, 166 ${46 - domeThickness}, 180 ${46 - domeThickness}
         C 192 ${46 - domeThickness}, 196 38, 190 48 Z"
      fill="#FAF7EE"
      stroke="#221C12"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <!-- Dome Highlight -->
    <path d="M 166 ${44 - domeThickness / 2} Q 180 ${42 - domeThickness} 188 ${46 - domeThickness / 2}" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round" />

    <!-- STUDDED SNOUT & OCCIPUT BONY KNOBS -->
    <circle cx="192" cy="52" r="2" fill="#D8CEB8" stroke="#221C12" stroke-width="1.2" />
    <circle cx="188" cy="55" r="1.8" fill="#D8CEB8" stroke="#221C12" stroke-width="1.2" />
    <circle cx="156" cy="46" r="2.2" fill="#D8CEB8" stroke="#221C12" stroke-width="1.2" />
    <circle cx="154" cy="50" r="1.8" fill="#D8CEB8" stroke="#221C12" stroke-width="1.2" />

    <!-- SNOUT & EYE -->
    <g>
      <!-- Eye -->
      <circle cx="172" cy="50" r="3" fill="#221C12" />
      <circle cx="172.2" cy="50" r="1.8" fill="${isGrown ? '#D4A034' : '#C49A45'}" />
      <circle cx="172.5" cy="50" r="1" fill="#120E08" />
      <circle cx="173.1" cy="49.3" r="0.6" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 09. DIPLODOCUS (Consistent Creature) — Low-Slung Sauropod, Long Whip Tail
// =========================================================================
function createDiplodocusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const tailTip = isJuv ? 18 : isGrown ? -10 : 0;
  const dorsalSpines = isJuv
    ? ''
    : isGrown
    ? '<path d="M 64 67 L 66 61 L 68 67 M 72 65 L 74 59 L 76 65 M 82 62 L 84 56 L 86 62 M 94 60 L 96 54 L 98 60 M 106 60 L 108 54 L 110 60 M 118 62 L 120 56 L 122 62 M 128 64 L 130 58 L 132 64" stroke="#FAF6ED" stroke-width="1.6" fill="none" stroke-linejoin="round" />'
    : '<path d="M 72 65 L 74 61 L 76 65 M 82 62 L 84 58 L 86 62 M 94 60 L 96 56 L 98 60 M 106 60 L 108 56 L 110 60 M 118 62 L 120 58 L 122 62" stroke="#FAF6ED" stroke-width="1.3" fill="none" stroke-linejoin="round" />';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="diploSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#556656' : '#5F7060'}" />
      <stop offset="100%" stop-color="${isGrown ? '#3E4B3F' : '#485549'}" />
    </linearGradient>
    <radialGradient id="diploShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 54 : 62}" ry="8" fill="url(#diploShad)" />

  <g transform="translate(15, 14)">
    <!-- BACK LEGS -->
    <g fill="#2D362E">
      <path d="M 76 84 L 72 106 L 82 106 L 84 86 Z" />
      <path d="M 70 106 L 83 106 L 82 109 L 69 109 Z" />
      <path d="M 126 84 L 122 106 L 132 106 L 134 86 Z" />
      <path d="M 120 106 L 133 106 L 132 109 L 119 109 Z" />
    </g>

    <!-- ULTRA-LONG WHIP TAIL EXTENDING FAR BEHIND -->
    <path d="M 66 74 C 44 75 24 80 ${tailTip} 88 C 22 86 44 83 66 81 Z" fill="url(#diploSkin)" stroke="#19201A" stroke-width="1.8" stroke-linejoin="round" />

    <!-- DORSAL SPINES ALONG MIDLINE -->
    ${dorsalSpines}

    <!-- HORIZONTAL LOW-SLUNG SAUROPOD BODY -->
    <path
      d="M 64 74
         C 64 58, 80 52, 108 52
         C 124 52, 134 56, 146 54
         C 162 52, 178 48, 194 46
         C 202 45, 208 48, 206 53
         C 202 57, 192 58, 180 60
         C 162 62, 146 66, 138 74
         C 130 87, 114 91, 92 90
         C 72 90, 66 85, 64 74 Z"
      fill="url(#diploSkin)"
      stroke="#19201A"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Cream Throat & Underbelly -->
    <path
      d="M 74 81
         C 88 88, 112 88, 126 81
         C 134 76, 150 68, 168 64
         C 182 61, 198 56, 204 54
         C 194 56, 180 59, 164 62
         C 146 66, 134 74, 124 77
         C 108 84, 88 85, 74 81 Z"
      fill="#D8D3C4"
      opacity="0.85"
    />

    <!-- FOREGROUND HIND LEG -->
    <g>
      <path d="M 80 68 C 90 70 94 78 92 88 L 82 109 L 71 109 L 71 88 C 71 78 75 70 80 68 Z" fill="#4B594C" stroke="#19201A" stroke-width="2" stroke-linejoin="round" />
      <path d="M 69 109 L 85 109 L 83 113 L 67 113 Z" fill="#313B32" stroke="#19201A" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 71 113 L 71 115 M 76 113 L 76 116 M 82 113 L 82 115" stroke="#19201A" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND FRONT LEG -->
    <g>
      <path d="M 128 68 C 136 70 138 78 136 88 L 126 109 L 115 109 L 116 88 C 118 78 122 70 128 68 Z" fill="#4B594C" stroke="#19201A" stroke-width="2" stroke-linejoin="round" />
      <path d="M 113 109 L 129 109 L 127 113 L 111 113 Z" fill="#313B32" stroke="#19201A" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 115 113 L 115 115 M 120 113 L 120 116 M 125 113 L 125 115" stroke="#19201A" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- ELONGATED HEAD WITH PEG SNOUT -->
    <g>
      <ellipse cx="196" cy="48" rx="2.5" ry="2.2" fill="#19201A" />
      <circle cx="196.2" cy="48" r="1.3" fill="${isGrown ? '#D4A034' : '#C49A45'}" />
      <circle cx="196.6" cy="47.5" r="0.5" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 10. DILOPHOSAURUS (Growth Spurt) — Slender Agile Theropod with Twin Crests
// =========================================================================
function createDilophosaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const crestRadius = isJuv ? 7 : isGrown ? 13 : 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="diloSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#62764A' : '#6E8254'}" />
      <stop offset="100%" stop-color="${isGrown ? '#485834' : '#52633C'}" />
    </linearGradient>
    <radialGradient id="diloShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 46 : 54}" ry="7" fill="url(#diloShad)" />

  <g transform="translate(15, 12)">
    <!-- BACK LEG -->
    <g fill="#364225">
      <path d="M 88 74 L 84 90 L 78 103 L 86 103 L 91 92 L 95 77 Z" />
      <path d="M 76 103 L 89 103 L 87 107 L 74 107 Z" />
      <path d="M 73 107 L 70 109 M 83 107 L 83 110 M 88 107 L 91 109" stroke="#1B2215" stroke-width="1.6" stroke-linecap="round" />
    </g>

    <!-- LONG SLENDER TAIL -->
    <path d="M 68 66 C 46 64 24 67 4 72 C 22 79 46 76 68 73 Z" fill="url(#diloSkin)" stroke="#1B2215" stroke-width="1.8" stroke-linejoin="round" />
    <path d="M 16 70 L 22 64 M 32 71 L 38 65 M 48 72 L 54 66" stroke="#BA4E26" stroke-width="2" stroke-linecap="round" opacity="0.75" />

    <!-- SLENDER SWIFT TORSO & ARCHING NECK -->
    <path
      d="M 66 68
         C 74 56, 96 54, 120 59
         C 126 53, 134 42, 148 36
         C 164 34, 174 38, 176 46
         C 176 52, 168 55, 156 58
         C 144 62, 136 68, 126 71
         C 114 79, 96 82, 78 80
         C 70 78, 66 74, 66 68 Z"
      fill="url(#diloSkin)"
      stroke="#1B2215"
      stroke-width="1.8"
      stroke-linejoin="round"
    />

    <!-- Cream Underbelly -->
    <path
      d="M 76 73
         C 90 80, 110 79, 118 75
         C 122 71, 130 64, 138 56
         C 132 58, 126 62, 120 64
         C 110 75, 94 78, 80 77 Z"
      fill="#DCD7C2"
      opacity="0.85"
    />

    <!-- TWIN HIGH SEMI-CIRCULAR CRANIAL CRESTS (In Vibrant Burnt Orange) -->
    <!-- Far Crest -->
    <path
      d="M 152 38
         C 152 ${38 - crestRadius * 1.3}, 170 ${38 - crestRadius * 1.3}, 172 38 Z"
      fill="#9C3A16"
      stroke="#1B2215"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <!-- Near Crest with cream highlights -->
    <path
      d="M 156 37
         C 156 ${37 - crestRadius * 1.4}, 176 ${37 - crestRadius * 1.4}, 178 37 Z"
      fill="#BA4E26"
      stroke="#1B2215"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
    <path
      d="M 160 ${37 - crestRadius * 0.9} Q 167 ${37 - crestRadius * 1.3} 174 ${37 - crestRadius * 0.9}"
      stroke="#FAF6ED"
      stroke-width="1.4"
      fill="none"
      stroke-linecap="round"
    />

    <!-- FORELIMB WITH 4 DIGITS -->
    <g>
      <path d="M 120 65 Q 130 71 124 78 L 118 76" stroke="#485834" stroke-width="2.6" stroke-linecap="round" fill="none" />
      <path d="M 124 78 L 129 80 M 122 79 L 127 82 M 120 80 L 124 84" stroke="#FAF6ED" stroke-width="1.4" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND RUNNER LEG -->
    <g>
      <path d="M 92 61 C 104 63 108 72 104 83 C 99 90 90 90 85 82 C 82 75 85 66 92 61 Z" fill="#5C6E44" stroke="#1B2215" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 94 82 L 96 102 L 87 102 L 85 85 Z" fill="#4E5E38" stroke="#1B2215" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M 85 102 L 103 102 L 101 106 L 83 106 Z" fill="#3B482A" stroke="#1B2215" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M 92 106 L 92 109 M 100 106 L 103 108" stroke="#1B2215" stroke-width="1.8" stroke-linecap="round" />
    </g>

    <!-- SNOUT WITH SUBNARIAL NOTCH (Kinked upper jaw) & EYE -->
    <g>
      <!-- Kinked jaw -->
      <path d="M 162 47 L 170 47 L 172 49 L 178 48 C 176 53 166 54 158 51 Z" fill="#485834" stroke="#1B2215" stroke-width="1.4" stroke-linejoin="round" />
      <path d="M 164 47 L 166 50 L 168 47 L 174 49" stroke="#FAF6ED" stroke-width="1" stroke-linecap="round" fill="none" />

      <!-- Eye -->
      <circle cx="158" cy="42" r="3" fill="#1B2215" />
      <circle cx="158.2" cy="42" r="1.8" fill="${isGrown ? '#E0B030' : '#D49E34'}" />
      <circle cx="158.5" cy="42" r="1" fill="#120E08" />
      <circle cx="159.1" cy="41.3" r="0.6" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// RUN BATCH 2 GENERATION
// =========================================================================

const BATCH_2_CONFIG = [
  {
    slug: 'month-master',
    name: 'Ankylosaurus',
    eggOptions: {
      baseColor: '#645846',
      darkColor: '#3D352B',
      accentColor: '#D8D2BC',
      fissureColor: '#1D1711',
      patternType: 'mottled'
    },
    fn: createAnkylosaurusSvg
  },
  {
    slug: 'centurion',
    name: 'Allosaurus',
    eggOptions: {
      baseColor: '#965A30',
      darkColor: '#582E16',
      accentColor: '#BA4A22',
      fissureColor: '#20130B',
      patternType: 'bands'
    },
    fn: createAllosaurusSvg
  },
  {
    slug: 'brick-by-brick',
    name: 'Pachycephalosaurus',
    eggOptions: {
      baseColor: '#A48B60',
      darkColor: '#584628',
      accentColor: '#FAF7EE',
      fissureColor: '#221C12',
      patternType: 'domed'
    },
    fn: createPachycephalosaurusSvg
  },
  {
    slug: 'consistent-creature',
    name: 'Diplodocus',
    eggOptions: {
      baseColor: '#5F7060',
      darkColor: '#313B32',
      accentColor: '#D8D3C4',
      fissureColor: '#19201A',
      patternType: 'mottled'
    },
    fn: createDiplodocusSvg
  },
  {
    slug: 'growth-spurt',
    name: 'Dilophosaurus',
    eggOptions: {
      baseColor: '#6E8254',
      darkColor: '#364225',
      accentColor: '#BA4E26',
      fissureColor: '#1B2215',
      patternType: 'bands'
    },
    fn: createDilophosaurusSvg
  }
];

export function run() {
  console.log('--- Generating Polished Batch 2 (06-10) ---');
  for (const item of BATCH_2_CONFIG) {
    const dir = path.resolve('src/assets/dinos', item.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const egg = createEggSvg(item.eggOptions);
    const juvenile = item.fn('juvenile');
    const adult = item.fn('adult');
    const grown = item.fn('grown');

    fs.writeFileSync(path.join(dir, 'egg.svg'), egg.trim(), 'utf-8');
    fs.writeFileSync(path.join(dir, 'juvenile.svg'), juvenile.trim(), 'utf-8');
    fs.writeFileSync(path.join(dir, 'adult.svg'), adult.trim(), 'utf-8');
    fs.writeFileSync(path.join(dir, 'grown.svg'), grown.trim(), 'utf-8');

    console.log(`[OK] Polished: ${item.slug} (${item.name})`);
  }
}

run();
