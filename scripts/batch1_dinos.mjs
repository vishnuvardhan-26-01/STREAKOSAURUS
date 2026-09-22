import fs from 'node:fs';
import path from 'node:path';

// =========================================================================
// SPECIES-SPECIFIC PREHISTORIC EGG
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
    <linearGradient id="eggGrad" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#FAF6ED" />
      <stop offset="35%" stop-color="${baseColor}" />
      <stop offset="100%" stop-color="${darkColor}" />
    </linearGradient>
    <radialGradient id="eggGnd" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
    <clipPath id="eggShellClip">
      <path d="M 98 118 C 86 96 94 56 120 50 C 146 56 154 96 142 118 C 134 126 106 126 98 118 Z" />
    </clipPath>
  </defs>

  <g transform="translate(0, 6)">
    <!-- Shadow -->
    <ellipse cx="120" cy="125" rx="44" ry="8" fill="url(#eggGnd)" />

    <!-- Nest Twigs -->
    <path d="M 76 120 Q 62 114 54 108 M 88 123 Q 78 117 70 111 M 100 125 Q 92 119 82 114" stroke="#362C20" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 164 120 Q 178 114 186 108 M 152 123 Q 162 117 170 111 M 140 125 Q 148 119 158 114" stroke="#362C20" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 94 126 Q 120 131 146 126" stroke="#261E15" stroke-width="4" stroke-linecap="round" fill="none" />

    <!-- Egg Body -->
    <path
      d="M 98 118 C 86 96 94 56 120 50 C 146 56 154 96 142 118 C 134 126 106 126 98 118 Z"
      fill="url(#eggGrad)"
      stroke="#1E1711"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Internal Shell Patterns -->
    <g clip-path="url(#eggShellClip)">
      <ellipse cx="134" cy="90" rx="20" ry="28" fill="${darkColor}" opacity="0.3" />
      <ellipse cx="106" cy="108" rx="16" ry="14" fill="#FAF6ED" opacity="0.25" />
      ${patternMarkup}
    </g>

    <!-- Shell Highlight Arc -->
    <path
      d="M 104 110 C 96 96 100 66 120 56"
      stroke="#FAF6ED"
      stroke-width="2.2"
      fill="none"
      stroke-linecap="round"
      opacity="0.65"
    />

    <!-- Hairline Fossil Crack -->
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
// 01. TYRANNOSAURUS REX (No Excuses) — Polished Unified Illustration
// =========================================================================
function createTRexSvg(stage) {
  // Variations based on stage
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const bodyScale = isJuv ? 0.88 : 1.0;
  const headSize = isJuv ? 'scale(1.15) translate(-10, -5)' : isGrown ? 'scale(1.04)' : 'scale(1.0)';
  const jawTeeth = isJuv
    ? 'M164 54 L166 57 L168 54 L170 57'
    : isGrown
    ? 'M164 54 L166 58 L168 54 L170 58 L172 54 L174 58 L176 54 L178 58'
    : 'M166 54 L168 57 L170 54 L172 57 L174 54 L176 57';

  const eyeRadius = isJuv ? 2.4 : isGrown ? 2.2 : 2.0;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="rexSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#728750' : '#7A8E58'}" />
      <stop offset="100%" stop-color="${isGrown ? '#566838' : '#647644'}" />
    </linearGradient>
    <radialGradient id="rexShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Ground Contact Shadow -->
  <ellipse cx="120" cy="138" rx="${isJuv ? 48 : 58}" ry="${isJuv ? 7 : 8}" fill="url(#rexShad)" />

  <g transform="translate(10, 10)">
    <!-- BACKGROUND HIND LEG -->
    <g fill="#46542D">
      <path d="M 94 76 C 90 86 92 98 96 109 L 106 109 C 104 98 102 87 99 76 Z" />
      <path d="M 91 109 L 109 109 L 107 113 L 89 113 Z" />
      <path d="M 88 113 L 84 116 M 98 113 L 98 117 M 107 113 L 111 116" stroke="#221C15" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- TAIL (Flows naturally into dorsal body) -->
    <path d="M 70 75 C 44 65 22 55 6 60 C 20 71 44 86 68 88 Z" fill="url(#rexSkin)" stroke="#221C15" stroke-width="2" stroke-linejoin="round" />
    <path d="M 10 62 C 24 72 46 84 68 87 L 68 84 C 48 81 26 70 14 63 Z" fill="#4B5A30" />
    <!-- Dorsal chevrons on tail -->
    <path d="M 22 66 L 26 60 M 38 72 L 42 66 M 54 78 L 58 72" stroke="#8B5A34" stroke-width="2.5" stroke-linecap="round" opacity="0.75" />

    <!-- MAIN TORSO & NECK (Smooth contiguous shape) -->
    <path
      d="M 68 75
         C 66 54, 84 44, 114 46
         C 128 47, 138 52, 144 60
         C 148 48, 156 40, 172 38
         C 188 36, 196 42, 196 50
         C 198 56, 188 61, 178 63
         C 166 65, 152 68, 142 68
         C 134 78, 122 88, 98 88
         C 79 88, 69 83, 68 75 Z"
      fill="url(#rexSkin)"
      stroke="#221C15"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Dorsal Spine Ridge Highlight -->
    <path d="M 76 50 C 90 44 110 44 126 47" stroke="#92A66C" stroke-width="2" fill="none" stroke-linecap="round" />
    <!-- Back chevron stripes -->
    <path d="M 78 54 L 85 63 M 94 53 L 101 64 M 110 55 L 117 66" stroke="#8B5A34" stroke-width="2.6" stroke-linecap="round" opacity="0.65" />

    <!-- Cream Underbelly & Throat Contour -->
    <path
      d="M 78 76
         C 90 86, 116 86, 134 75
         C 138 72, 146 71, 154 66
         C 146 66, 138 67, 132 68
         C 124 82, 108 87, 92 86
         C 84 85, 79 81, 78 76 Z"
      fill="#D8D3B8"
      opacity="0.8"
    />

    <!-- T-REX SHORT FORELIMB -->
    <g>
      <path d="M 134 67 C 139 69 141 73 139 78 L 133 79" stroke="#221C15" stroke-width="2.8" stroke-linecap="round" fill="none" />
      <path d="M 139 78 L 144 80 M 137 79 L 140 83" stroke="#FAF7EE" stroke-width="1.6" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND HIND LEG -->
    <g>
      <path d="M 100 58 C 117 60 126 73 122 89 C 118 98 108 102 98 98 C 89 91 89 76 95 64 Z" fill="#6A7F48" stroke="#221C15" stroke-width="2" stroke-linejoin="round" />
      <path d="M 102 63 C 110 65 117 73 115 83" stroke="#8EA268" stroke-width="1.8" fill="none" stroke-linecap="round" />
      <path d="M 107 87 L 103 111 L 115 111 L 116 87 Z" fill="#586A3A" stroke="#221C15" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 98 111 L 122 111 L 120 116 L 96 116 Z" fill="#48582E" stroke="#221C15" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 96 115 L 90 118 M 109 115 L 109 119 M 120 115 L 126 118" stroke="#221C15" stroke-width="2.4" stroke-linecap="round" />
    </g>

    <!-- HEAD DETAILS: BROW, SNOUT, NOSTRIL, JAW, TEETH -->
    <g transform="${headSize}">
      <!-- Brow Ridge Highlight following skull curve -->
      <path d="M 166 42 C 174 41 182 43 188 46" stroke="#92A66C" stroke-width="1.8" fill="none" stroke-linecap="round" />
      <circle cx="190" cy="48" r="1.3" fill="#2E381C" />

      <!-- Lower Jaw -->
      <path d="M 164 54 L 186 53 C 188 58 180 62 168 61 Z" fill="#4B5A30" stroke="#221C15" stroke-width="1.6" stroke-linejoin="round" />
      <!-- Teeth -->
      <path d="${jawTeeth}" stroke="#FAF7EE" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none" />

      <!-- Eye -->
      <ellipse cx="169" cy="44" rx="3.6" ry="3" fill="#221C15" />
      <circle cx="169.2" cy="44" r="${eyeRadius}" fill="${isGrown ? '#D49E34' : '#C49A45'}" />
      <circle cx="169.5" cy="44" r="1.2" fill="#15120E" />
      <circle cx="170.2" cy="43.2" r="0.7" fill="#FFFFFF" />
      <path d="M 165 41 Q 170 40 174 42" stroke="#384723" stroke-width="1.4" stroke-linecap="round" fill="none" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 02. VELOCIRAPTOR (Early Bird) — Polished Feathered Agile Predator
// =========================================================================
function createRaptorSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const tailFeathers = isJuv
    ? 'M 24 64 L 30 58 M 36 65 L 42 59 M 48 66 L 54 60'
    : isGrown
    ? 'M 14 62 L 24 54 M 26 63 L 36 55 M 38 64 L 48 56 M 50 65 L 60 57 M 62 66 L 72 58'
    : 'M 18 63 L 26 56 M 30 64 L 38 57 M 42 65 L 50 58 M 54 66 L 62 59';

  const crestFeathers = isJuv
    ? 'M 144 40 Q 136 30 126 35 M 148 39 Q 140 27 132 31'
    : isGrown
    ? 'M 154 36 Q 140 20 126 28 M 158 35 Q 144 18 132 24 M 163 36 Q 151 19 140 25'
    : 'M 150 38 Q 138 25 128 31 M 154 37 Q 142 22 134 27 M 158 38 Q 148 24 138 29';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="rapSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#946E42' : '#9E774A'}" />
      <stop offset="100%" stop-color="${isGrown ? '#6E4C26' : '#7D5A34'}" />
    </linearGradient>
    <radialGradient id="rapShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 46 : 54}" ry="7" fill="url(#rapShad)" />

  <g transform="translate(15, 12)">
    <!-- BACK HIND LEG -->
    <g fill="#4A341D">
      <path d="M 88 74 L 84 90 L 78 103 L 86 103 L 91 92 L 95 77 Z" />
      <path d="M 76 103 L 89 103 L 87 107 L 74 107 Z" />
      <path d="M 73 107 L 70 109 M 83 107 L 83 110 M 88 107 L 91 109" stroke="#1D1610" stroke-width="1.6" stroke-linecap="round" />
    </g>

    <!-- STIFF TAIL WITH DYNAMIC FEATHER FAN -->
    <path d="M 16 64 C 34 62 56 64 80 65 C 64 75 42 74 16 64 Z" fill="url(#rapSkin)" stroke="#1D1610" stroke-width="1.8" stroke-linejoin="round" />
    <path d="${tailFeathers}" stroke="${isGrown ? '#C25A2C' : '#B85830'}" stroke-width="2.4" stroke-linecap="round" />

    <!-- SEAMLESS MAIN BODY & NECK -->
    <path
      d="M 70 66
         C 78 55, 100 53, 124 58
         C 130 54, 140 44, 156 38
         C 172 35, 182 40, 178 49
         C 166 55, 152 57, 140 62
         C 134 68, 130 76, 118 79
         C 97 84, 78 82, 70 66 Z"
      fill="url(#rapSkin)"
      stroke="#1D1610"
      stroke-width="1.8"
      stroke-linejoin="round"
    />

    <!-- Cream Underbelly & Throat -->
    <path
      d="M 78 72
         C 94 80, 114 79, 122 76
         C 126 73, 136 66, 144 59
         C 138 60, 130 63, 124 65
         C 114 77, 98 81, 82 79 Z"
      fill="#E2DAC4"
      opacity="0.85"
    />

    <!-- FEATHER CREST ON HEAD -->
    <path d="${crestFeathers}" stroke="${isGrown ? '#C25A2C' : '#B85830'}" stroke-width="${isGrown ? 2.8 : 2.4}" stroke-linecap="round" />

    <!-- FEATHERED WINGLET FORELIMB -->
    <g>
      <path d="M 122 66 Q 134 72 126 80 L 120 78" stroke="#5E4323" stroke-width="2.6" stroke-linecap="round" fill="none" />
      <path d="M 124 72 L 133 74 M 122 76 L 130 78 M 120 80 L 127 82" stroke="${isGrown ? '#C25A2C' : '#B85830'}" stroke-width="1.8" stroke-linecap="round" />
      <path d="M 127 80 L 131 82 M 125 81 L 129 84" stroke="#FAF6ED" stroke-width="1.3" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND RUNNER LEG WITH RAISED SICKLE CLAW -->
    <g>
      <path d="M 94 61 C 106 63 110 72 106 83 C 101 90 91 90 87 82 C 84 75 87 66 94 61 Z" fill="#805F38" stroke="#1D1610" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 96 82 L 98 101 L 89 101 L 87 85 Z" fill="#6E502C" stroke="#1D1610" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M 87 101 L 105 101 L 103 105 L 85 105 Z" fill="#5A3E20" stroke="#1D1610" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M 94 105 L 94 108 M 102 105 L 105 107" stroke="#1D1610" stroke-width="1.8" stroke-linecap="round" />
      <!-- Signature Raised Sickle Claw on Second Toe -->
      <path d="M 86 99 Q 77 95 79 85 Q 83 91 88 96 Z" fill="#FAF6ED" stroke="#1D1610" stroke-width="1.6" stroke-linejoin="round" />
    </g>

    <!-- SNOUT, TEETH, EYE -->
    <g>
      <path d="M 160 48 L 176 48 C 173 53 161 54 155 52 Z" fill="#52391C" stroke="#1D1610" stroke-width="1.4" />
      <path d="M 163 48 L 165 51 L 167 48 L 169 51 L 171 48" stroke="#FAF6ED" stroke-width="1.2" stroke-linecap="round" fill="none" />

      <!-- Sharp Keen Eye -->
      <circle cx="156" cy="42" r="3.2" fill="#1D1610" />
      <circle cx="156.2" cy="42" r="2" fill="#D4A034" />
      <circle cx="156.5" cy="42" r="1.1" fill="#120E09" />
      <circle cx="157.2" cy="41.2" r="0.7" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 03. TRICERATOPS (Threepeat) — Solid Frill, Distinct Horns, Beak
// =========================================================================
function createTriceratopsSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const browHorns = isJuv
    ? '<path d="M 150 48 L 170 36 L 166 44 Z" fill="#FAF6ED" stroke="#19201F" stroke-width="1.5" stroke-linejoin="round" />'
    : isGrown
    ? '<path d="M 148 46 L 190 22 L 184 32 Z" fill="#FAF6ED" stroke="#19201F" stroke-width="1.8" stroke-linejoin="round" />\n       <path d="M 154 50 L 198 26 L 192 37 Z" fill="#FAF6ED" stroke="#19201F" stroke-width="2" stroke-linejoin="round" />'
    : '<path d="M 148 48 L 180 30 L 176 38 Z" fill="#FAF6ED" stroke="#19201F" stroke-width="1.6" stroke-linejoin="round" />\n       <path d="M 154 52 L 188 34 L 183 43 Z" fill="#FAF6ED" stroke="#19201F" stroke-width="1.8" stroke-linejoin="round" />';

  const nasalHorn = isJuv
    ? '<path d="M 168 64 L 178 58 L 174 66 Z" fill="#FAF6ED" stroke="#19201F" stroke-width="1.4" stroke-linejoin="round" />'
    : isGrown
    ? '<path d="M 178 62 L 196 50 L 188 66 Z" fill="#FAF6ED" stroke="#19201F" stroke-width="1.8" stroke-linejoin="round" />'
    : '<path d="M 174 64 L 188 54 L 183 67 Z" fill="#FAF6ED" stroke="#19201F" stroke-width="1.6" stroke-linejoin="round" />';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="triSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#546B66' : '#5E7570'}" />
      <stop offset="100%" stop-color="${isGrown ? '#415350' : '#4A5C58'}" />
    </linearGradient>
    <radialGradient id="triShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 50 : 58}" ry="8" fill="url(#triShad)" />

  <g transform="translate(15, 12)">
    <!-- BACK LEGS (Subtle depth) -->
    <g fill="#333F3D">
      <path d="M 68 84 L 64 107 L 76 107 L 78 86 Z" />
      <path d="M 62 107 L 77 107 L 75 111 L 61 111 Z" />
      <path d="M 126 86 L 122 107 L 132 107 L 134 88 Z" />
      <path d="M 120 107 L 133 107 L 132 111 L 119 111 Z" />
    </g>

    <!-- TAIL -->
    <path d="M 50 74 C 32 78 20 88 10 97 C 24 95 38 88 50 84 Z" fill="url(#triSkin)" stroke="#19201F" stroke-width="2" stroke-linejoin="round" />

    <!-- SEAMLESS QUADRUPEDAL TORSO -->
    <path
      d="M 48 75
         C 50 58, 68 48, 98 51
         C 118 53, 132 61, 138 74
         C 132 87, 116 92, 94 92
         C 70 92, 52 87, 48 75 Z"
      fill="url(#triSkin)"
      stroke="#19201F"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <!-- Underbelly -->
    <path d="M 60 83 C 76 90 100 90 118 83 C 106 89 88 91 72 89 Z" fill="#D2CBC0" opacity="0.8" />

    <!-- FOREGROUND HIND LEG -->
    <g>
      <path d="M 72 66 C 84 68 88 77 86 88 L 76 109 L 64 109 L 64 88 C 64 77 68 68 72 66 Z" fill="#526662" stroke="#19201F" stroke-width="2" stroke-linejoin="round" />
      <path d="M 62 109 L 78 109 L 76 113 L 60 113 Z" fill="#364341" stroke="#19201F" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 64 113 L 64 115 M 70 113 L 70 116 M 75 113 L 75 115" stroke="#19201F" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND FRONT LEG -->
    <g>
      <path d="M 128 72 C 136 75 138 82 136 90 L 126 109 L 115 109 L 116 88 C 118 79 122 73 128 72 Z" fill="#526662" stroke="#19201F" stroke-width="2" stroke-linejoin="round" />
      <path d="M 113 109 L 128 109 L 127 113 L 112 113 Z" fill="#364341" stroke="#19201F" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 116 113 L 116 115 M 121 113 L 121 116 M 126 113 L 126 115" stroke="#19201F" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- SCALLOPED NECK FRILL WITH TERRACOTTA EYELETS -->
    <path
      d="M 124 64 C 118 45 128 30 148 24 C 168 22 178 36 168 56 Z"
      fill="#485A56"
      stroke="#19201F"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <ellipse cx="144" cy="37" rx="6" ry="4" fill="#9E5A38" opacity="0.85" />
    <ellipse cx="156" cy="45" rx="5" ry="3.5" fill="#9E5A38" opacity="0.85" />

    <!-- BROW HORNS -->
    ${browHorns}

    <!-- NASAL HORN -->
    ${nasalHorn}

    <!-- SNOUT & PARROT BEAK -->
    <path d="M 148 59 C 156 57 170 59 182 66 C 188 71 186 76 178 79 L 152 76 Z" fill="url(#triSkin)" stroke="#19201F" stroke-width="2" stroke-linejoin="round" />
    <path d="M 178 71 L 188 75 L 176 79 Z" fill="#FAF6ED" stroke="#19201F" stroke-width="1.8" stroke-linejoin="round" />

    <!-- EYE -->
    <ellipse cx="154" cy="58" rx="3.5" ry="3" fill="#19201F" />
    <circle cx="154.2" cy="58" r="2" fill="${isGrown ? '#D4A034' : '#C49A45'}" />
    <circle cx="154.5" cy="58" r="1.1" fill="#101514" />
    <circle cx="155.2" cy="57.2" r="0.7" fill="#FFFFFF" />
  </g>
</svg>`;
}

// =========================================================================
// 04. STEGOSAURUS (Week Warrior) — Arched Back, Diamond Plates, Thagomizer
// =========================================================================
function createStegosaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="stegSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#5E734E' : '#687E56'}" />
      <stop offset="100%" stop-color="${isGrown ? '#465737' : '#4E613E'}" />
    </linearGradient>
    <radialGradient id="stegShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 52 : 58}" ry="8" fill="url(#stegShad)" />

  <g transform="translate(15, 12)">
    <!-- BACK LEGS -->
    <g fill="#344129">
      <path d="M 80 84 L 76 107 L 87 107 L 89 86 Z" />
      <path d="M 74 107 L 88 107 L 87 111 L 73 111 Z" />
      <path d="M 134 88 L 130 107 L 138 107 L 140 90 Z" />
      <path d="M 128 107 L 139 107 L 138 111 L 127 111 Z" />
    </g>

    <!-- TAIL WITH 4 THAGOMIZER SPIKES -->
    <path d="M 68 75 C 44 74 26 78 10 82 C 26 87 48 85 68 82 Z" fill="url(#stegSkin)" stroke="#1B2217" stroke-width="2" stroke-linejoin="round" />
    <!-- 4 Spikes -->
    <path d="M 16 77 L 4 67 L 14 80 Z" fill="#FAF6ED" stroke="#1B2217" stroke-width="1.6" stroke-linejoin="round" />
    <path d="M 14 81 L 2 78 L 12 84 Z" fill="#FAF6ED" stroke="#1B2217" stroke-width="1.6" stroke-linejoin="round" />
    <path d="M 22 81 L 12 90 L 21 86 Z" fill="#FAF6ED" stroke="#1B2217" stroke-width="1.6" stroke-linejoin="round" />
    <path d="M 26 82 L 20 94 L 27 86 Z" fill="#FAF6ED" stroke="#1B2217" stroke-width="1.6" stroke-linejoin="round" />

    <!-- SEAMLESS ARCHED TORSO & LOW HEAD -->
    <path
      d="M 66 75
         C 68 54, 88 42, 118 46
         C 136 49, 148 61, 152 75
         C 158 72, 168 76, 178 81
         C 182 85, 180 89, 174 91
         C 162 89, 150 86, 144 87
         C 130 92, 106 91, 88 88
         C 76 86, 68 83, 66 75 Z"
      fill="url(#stegSkin)"
      stroke="#1B2217"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <!-- Underbelly -->
    <path d="M 76 82 C 92 89 116 89 132 82 C 122 88 104 90 88 88 Z" fill="#D2CAB4" opacity="0.8" />

    <!-- ALTERNATING DIAMOND DORSAL PLATES IN BURNT ORANGE -->
    <g fill="#B4582E" stroke="#1B2217" stroke-width="${isGrown ? 2 : 1.8}" stroke-linejoin="round">
      <path d="M 72 58 L 80 38 L 88 58 Z" />
      <path d="M 88 50 L 98 28 L 108 50 Z" />
      <path d="M 108 47 L 118 24 L 128 47 Z" />
      <path d="M 128 51 L 138 32 L 146 53 Z" />
      <path d="M 146 58 L 152 44 L 158 60 Z" />
      <!-- Background Row Plates -->
      <path d="M 80 49 L 88 33 L 96 49 Z" fill="#8F3F1C" />
      <path d="M 100 44 L 108 22 L 116 44 Z" fill="#8F3F1C" />
      <path d="M 120 46 L 128 27 L 136 47 Z" fill="#8F3F1C" />
      <path d="M 138 53 L 144 38 L 150 54 Z" fill="#8F3F1C" />
    </g>

    <!-- FOREGROUND HIND LEG -->
    <g>
      <path d="M 84 66 C 98 68 102 77 100 88 L 89 109 L 76 109 L 76 88 C 76 77 80 68 84 66 Z" fill="#586C48" stroke="#1B2217" stroke-width="2" stroke-linejoin="round" />
      <path d="M 74 109 L 91 109 L 89 113 L 72 113 Z" fill="#3B4930" stroke="#1B2217" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 76 113 L 76 115 M 82 113 L 82 116 M 88 113 L 88 115" stroke="#1B2217" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND FRONT LEG -->
    <g>
      <path d="M 138 74 C 144 76 146 83 144 91 L 135 109 L 124 109 L 126 89 C 128 80 132 75 138 74 Z" fill="#586C48" stroke="#1B2217" stroke-width="2" stroke-linejoin="round" />
      <path d="M 122 109 L 137 109 L 136 113 L 121 113 Z" fill="#3B4930" stroke="#1B2217" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 125 113 L 125 115 M 130 113 L 130 116 M 135 113 L 135 115" stroke="#1B2217" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- EYE -->
    <ellipse cx="170" cy="82" rx="3" ry="2.6" fill="#1B2217" />
    <circle cx="170.2" cy="82" r="1.6" fill="${isGrown ? '#D4A034' : '#C49A45'}" />
    <circle cx="170.7" cy="81.4" r="0.6" fill="#FFFFFF" />
  </g>
</svg>`;
}

// =========================================================================
// 05. BRACHIOSAURUS (Fortnight Fighter) — Majestic Sauropod, High Shoulders
// =========================================================================
function createBrachiosaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="brachSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#84613E' : '#8F6A47'}" />
      <stop offset="100%" stop-color="${isGrown ? '#664627' : '#725132'}" />
    </linearGradient>
    <radialGradient id="brachShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 54 : 60}" ry="8" fill="url(#brachShad)" />

  <g transform="translate(15, 8)">
    <!-- BACK LEGS -->
    <g fill="#4A341E">
      <path d="M 68 92 L 64 112 L 75 112 L 78 94 Z" />
      <path d="M 62 112 L 76 112 L 75 115 L 61 115 Z" />
      <path d="M 118 78 L 112 112 L 123 112 L 127 80 Z" />
      <path d="M 110 112 L 124 112 L 123 115 L 109 115 Z" />
    </g>

    <!-- BALANCED TAIL -->
    <path d="M 50 82 C 30 86 16 94 4 102 C 20 99 38 92 50 88 Z" fill="url(#brachSkin)" stroke="#1D150E" stroke-width="2" stroke-linejoin="round" />

    <!-- SEAMLESS SLOPING BODY & TOWERING NECK -->
    <path
      d="M 48 82
         C 52 65, 74 57, 106 55
         C 118 55, 126 44, 136 28
         C 146 14, 156 6, 168 8
         C 178 10, 180 18, 174 24
         C 166 30, 156 44, 146 62
         C 138 74, 134 82, 126 86
         C 112 94, 88 93, 72 92
         C 58 91, 50 88, 48 82 Z"
      fill="url(#brachSkin)"
      stroke="#1D150E"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Cream Throat & Underbelly Contour -->
    <path
      d="M 62 87
         C 78 93, 100 93, 118 86
         C 126 80, 134 68, 142 50
         C 148 36, 154 22, 150 16
         C 144 26, 136 44, 130 62
         C 120 78, 106 88, 88 90
         C 74 91, 64 89, 62 87 Z"
      fill="#DFD4BD"
      opacity="0.85"
    />

    <!-- FOREGROUND HIND LEG (Shorter) -->
    <g>
      <path d="M 72 74 C 84 76 88 84 86 93 L 77 115 L 65 115 L 65 93 C 65 83 68 75 72 74 Z" fill="#7E5B39" stroke="#1D150E" stroke-width="2" stroke-linejoin="round" />
      <path d="M 63 115 L 79 115 L 77 118 L 61 118 Z" fill="#523920" stroke="#1D150E" stroke-width="1.8" stroke-linejoin="round" />
    </g>

    <!-- FOREGROUND FRONT LEG (Tall pillar) -->
    <g>
      <path d="M 124 64 C 132 66 134 75 132 86 L 120 115 L 108 115 L 112 86 C 114 74 118 66 124 64 Z" fill="#7E5B39" stroke="#1D150E" stroke-width="2" stroke-linejoin="round" />
      <path d="M 106 115 L 122 115 L 121 118 L 105 118 Z" fill="#523920" stroke="#1D150E" stroke-width="1.8" stroke-linejoin="round" />
    </g>

    <!-- SCULPTED HEAD WITH CRANIAL DOME -->
    <g>
      <path d="M 154 14 C 154 6 164 4 172 6 C 180 8 182 16 176 22 L 158 20 Z" fill="#7E5B39" stroke="#1D150E" stroke-width="1.8" stroke-linejoin="round" />
      <!-- Nasal Dome -->
      <path d="M 162 6 Q 168 1 174 6" stroke="${isGrown ? '#FAF6ED' : '#1D150E'}" stroke-width="1.6" fill="none" />

      <!-- Eye -->
      <ellipse cx="164" cy="13" rx="2.6" ry="2.2" fill="#1D150E" />
      <circle cx="164.2" cy="13" r="1.5" fill="${isGrown ? '#D4A034' : '#C49A45'}" />
      <circle cx="164.7" cy="12.4" r="0.6" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// RUN BATCH 1 GENERATION
// =========================================================================

const BATCH_1_CONFIG = [
  {
    slug: 'no-excuses',
    name: 'Tyrannosaurus Rex',
    eggOptions: {
      baseColor: '#7A8E58',
      darkColor: '#4A5A30',
      accentColor: '#8B5A34',
      fissureColor: '#241E17',
      patternType: 'mottled'
    },
    fn: createTRexSvg
  },
  {
    slug: 'early-bird',
    name: 'Velociraptor',
    eggOptions: {
      baseColor: '#9E774A',
      darkColor: '#5E4323',
      accentColor: '#B85830',
      fissureColor: '#221C16',
      patternType: 'bands'
    },
    fn: createRaptorSvg
  },
  {
    slug: 'threepeat',
    name: 'Triceratops',
    eggOptions: {
      baseColor: '#5E7570',
      darkColor: '#364341',
      accentColor: '#9E5A38',
      fissureColor: '#19201F',
      patternType: 'speckles'
    },
    fn: createTriceratopsSvg
  },
  {
    slug: 'week-warrior',
    name: 'Stegosaurus',
    eggOptions: {
      baseColor: '#687E56',
      darkColor: '#36452A',
      accentColor: '#B4582E',
      fissureColor: '#1B2217',
      patternType: 'mottled'
    },
    fn: createStegosaurusSvg
  },
  {
    slug: 'fortnight-fighter',
    name: 'Brachiosaurus',
    eggOptions: {
      baseColor: '#8F6A47',
      darkColor: '#523920',
      accentColor: '#DFD4BD',
      fissureColor: '#1D150E',
      patternType: 'speckles'
    },
    fn: createBrachiosaurusSvg
  }
];

export function run() {
  console.log('--- Generating Polished Batch 1 (01-05) ---');
  for (const item of BATCH_1_CONFIG) {
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
