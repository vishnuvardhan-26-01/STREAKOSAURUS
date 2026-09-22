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
  } else if (patternType === 'sail') {
    patternMarkup = `
      <path d="M 120 60 L 120 85 M 106 68 L 112 88 M 134 68 L 128 88" stroke="${accentColor}" stroke-width="3.2" stroke-linecap="round" opacity="0.75" />
      <path d="M 104 74 Q 120 84 136 74" stroke="${darkColor}" stroke-width="2.5" fill="none" opacity="0.6" />
      <circle cx="112" cy="102" r="3.2" fill="${darkColor}" opacity="0.5" />
      <circle cx="128" cy="104" r="2.8" fill="${darkColor}" opacity="0.5" />
    `;
  } else if (patternType === 'feathered') {
    patternMarkup = `
      <path d="M 100 80 Q 115 70 130 82 M 106 95 Q 120 85 136 97 M 112 110 Q 124 102 140 112" stroke="${accentColor}" stroke-width="2.5" fill="none" opacity="0.6" stroke-linecap="round" />
      <circle cx="110" cy="86" r="2" fill="${darkColor}" opacity="0.5" />
      <circle cx="126" cy="100" r="2.2" fill="${darkColor}" opacity="0.5" />
    `;
  } else if (patternType === 'boss') {
    patternMarkup = `
      <ellipse cx="120" cy="74" rx="14" ry="9" fill="${accentColor}" opacity="0.6" />
      <circle cx="114" cy="74" r="3" fill="${darkColor}" opacity="0.6" />
      <circle cx="126" cy="74" r="3" fill="${darkColor}" opacity="0.6" />
      <path d="M 94 98 Q 120 110 146 98" stroke="${accentColor}" stroke-width="4.5" fill="none" opacity="0.5" stroke-linecap="round" />
      <circle cx="112" cy="112" r="3" fill="${darkColor}" opacity="0.6" />
      <circle cx="128" cy="112" r="3" fill="${darkColor}" opacity="0.6" />
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
    <linearGradient id="eggGrad4" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="${baseColor}" />
      <stop offset="60%" stop-color="${baseColor}" />
      <stop offset="100%" stop-color="${darkColor}" />
    </linearGradient>
    <radialGradient id="eggGnd4" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
    <clipPath id="eggShellClip4">
      <path d="M 98 118 C 86 96 94 56 120 50 C 146 56 154 96 142 118 C 134 126 106 126 98 118 Z" />
    </clipPath>
  </defs>

  <g transform="translate(0, 6)">
    <ellipse cx="120" cy="125" rx="44" ry="8" fill="url(#eggGnd4)" />
    <path d="M 76 120 Q 62 114 54 108 M 88 123 Q 78 117 70 111 M 100 125 Q 92 119 82 114" stroke="#362C20" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 164 120 Q 178 114 186 108 M 152 123 Q 162 117 170 111 M 140 125 Q 148 119 158 114" stroke="#362C20" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 94 126 Q 120 131 146 126" stroke="#261E15" stroke-width="4" stroke-linecap="round" fill="none" />

    <path
      d="M 98 118 C 86 96 94 56 120 50 C 146 56 154 96 142 118 C 134 126 106 126 98 118 Z"
      fill="url(#eggGrad4)"
      stroke="#1E1711"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <g clip-path="url(#eggShellClip4)">
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
// 16. SPINOSAURUS (DNA Researcher) — High Neural Spine Sail & Croc Snout
// =========================================================================
function createSpinosaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  // Sail height and spines
  const sailPeakY = isJuv ? 42 : isGrown ? 18 : 26;
  const thumbClawSize = isJuv ? 4 : isGrown ? 9 : 6.5;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="spinoSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#394B4F' : '#45565A'}" />
      <stop offset="100%" stop-color="${isGrown ? '#263336' : '#2D3B3E'}" />
    </linearGradient>
    <linearGradient id="spinoSail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#C46238' : '#B25630'}" />
      <stop offset="100%" stop-color="${isGrown ? '#823719' : '#722E13'}" />
    </linearGradient>
    <radialGradient id="spinoShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 52 : 62}" ry="7" fill="url(#spinoShad)" />

  <g transform="translate(14, 10)">
    <!-- BACK LEG -->
    <g fill="#212C2F">
      <path d="M 88 80 C 85 90 86 100 90 110 L 98 110 C 97 101 95 91 93 80 Z" />
      <path d="M 85 110 L 102 110 L 100 114 L 83 114 Z" />
      <path d="M 82 114 L 78 117 M 93 114 L 93 118 M 100 114 L 104 117" stroke="#1D1713" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- PADDLE TAIL (Broad semi-aquatic swimming tail) -->
    <path
      d="M 64 72
         C 46 64, 26 58, 6 62
         C 12 70, 22 84, 40 88
         C 50 88, 58 84, 66 82 Z"
      fill="url(#spinoSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <!-- Tail dorsal fin crest -->
    <path
      d="M 64 72 C 44 64, 24 58, 6 62 C 20 62, 40 68, 64 74 Z"
      fill="#A44D28"
      stroke="#1D1713"
      stroke-width="1.2"
    />

    <!-- ICONIC TALL DORSAL SAIL -->
    <path
      d="M 64 72
         C 68 ${sailPeakY + 22}, 78 ${sailPeakY + 8}, 88 ${sailPeakY + 2}
         C 98 ${sailPeakY}, 108 ${sailPeakY + 4}, 118 ${sailPeakY + 14}
         C 126 ${sailPeakY + 24}, 132 58, 136 64
         L 64 72 Z"
      fill="url(#spinoSail)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <!-- Neural spine structural ribs -->
    <g stroke="#1D1713" stroke-width="1.4" opacity="0.6" stroke-linecap="round">
      <path d="M 74 72 L 78 ${sailPeakY + 12}" />
      <path d="M 86 70 L 88 ${sailPeakY + 3}" />
      <path d="M 98 68 L 98 ${sailPeakY + 1}" />
      <path d="M 110 68 L 109 ${sailPeakY + 5}" />
      <path d="M 122 66 L 120 ${sailPeakY + 16}" />
    </g>
    <!-- Sail eyelet/wave pattern -->
    ${isGrown ? `
      <path d="M 78 ${sailPeakY + 18} Q 98 ${sailPeakY + 8} 118 ${sailPeakY + 22}" stroke="#FAF6ED" stroke-width="2" fill="none" opacity="0.8" stroke-linecap="round" />
      <circle cx="98" cy="${sailPeakY + 16}" r="3" fill="#FAF6ED" opacity="0.9" />
    ` : ''}

    <!-- MUSCULAR BODY & NECK -->
    <path
      d="M 64 72
         C 64 62, 76 56, 94 56
         C 112 56, 126 58, 136 64
         C 142 54, 154 48, 168 46
         C 182 45, 196 48, 202 52
         C 204 56, 196 60, 186 62
         C 168 64, 154 66, 142 74
         C 134 84, 120 90, 96 90
         C 78 90, 66 84, 64 72 Z"
      fill="url(#spinoSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Sandstone Underbelly -->
    <path
      d="M 76 78
         C 90 87, 114 87, 130 78
         C 140 70, 152 68, 164 64
         C 154 64, 142 68, 134 72
         C 122 83, 104 88, 88 86
         C 80 84, 76 81, 76 78 Z"
      fill="#DDD2BC"
      opacity="0.85"
    />

    <!-- FOREARM WITH ENLARGED CURVED THUMB CLAW -->
    <g>
      <path d="M 132 70 C 136 76 138 84 135 90 L 131 92" stroke="#1D1713" stroke-width="2.6" stroke-linecap="round" fill="none" />
      <!-- Giant Thumb Claw (Hooked Spinosaurid weapon) -->
      <path d="M 131 92 Q 138 94 140 ${92 + thumbClawSize} Q 135 ${93 + thumbClawSize/2} 131 92 Z" fill="#FAF6ED" stroke="#1D1713" stroke-width="1.2" stroke-linejoin="round" />
      <circle cx="134" cy="94" r="0.8" fill="#FAF6ED" />
    </g>

    <!-- FOREGROUND HIND LEG -->
    <g>
      <path d="M 92 62 C 108 64 116 76 114 90 C 110 98 102 101 92 98 C 84 92 84 78 88 68 Z" fill="#3B4A4E" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 98 88 L 94 111 L 106 111 L 108 88 Z" fill="#2D3B3E" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 90 111 L 114 111 L 112 116 L 88 116 Z" fill="#212C2F" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 88 115 L 82 118 M 101 115 L 101 119 M 112 115 L 118 118" stroke="#1D1713" stroke-width="2.4" stroke-linecap="round" />
    </g>

    <!-- ELONGATED CROCODILIAN SNOUT & TOOTHED JAWS -->
    <g>
      <!-- Pre-orbital crest -->
      <path d="M 168 46 L 172 41 L 176 46 Z" fill="#FAF6ED" stroke="#1D1713" stroke-width="1.2" />

      <!-- Upper jaw with rosette curve -->
      <path d="M 166 52 L 202 52 C 204 56 196 58 184 59 L 166 58 Z" fill="#263336" stroke="#1D1713" stroke-width="1.5" stroke-linejoin="round" />
      <!-- Sharp interlocking conical teeth -->
      <path d="M 174 53 L 176 56 L 178 53 M 182 53 L 184 56 L 186 53 M 190 53 L 192 56 L 194 53 M 198 53 L 200 56 L 201 53" stroke="#FAF6ED" stroke-width="1.2" stroke-linecap="round" fill="none" />

      <!-- Lower Jaw -->
      <path d="M 168 59 L 198 58 C 196 62 188 64 174 63 Z" fill="#212C2F" stroke="#1D1713" stroke-width="1.3" stroke-linejoin="round" />

      <!-- Predatory Eye -->
      <ellipse cx="166" cy="48" rx="3.3" ry="2.8" fill="#1D1713" />
      <circle cx="166.2" cy="48" r="1.8" fill="#D8782E" />
      <circle cx="166.5" cy="48" r="1.1" fill="#150E0A" />
      <circle cx="167" cy="47.2" r="0.6" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 17. BARYONYX (Expedition Starter) — Heavy-Claw Fish Hunter
// =========================================================================
function createBaryonyxSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const heavyClawSize = isJuv ? 6 : isGrown ? 13 : 9.5;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="barySkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#425336' : '#4E6140'}" />
      <stop offset="100%" stop-color="${isGrown ? '#2A3622' : '#334229'}" />
    </linearGradient>
    <radialGradient id="baryShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 50 : 60}" ry="7" fill="url(#baryShad)" />

  <g transform="translate(12, 12)">
    <!-- BACK LEG -->
    <g fill="#242F1C">
      <path d="M 88 80 C 85 90 86 100 90 110 L 98 110 C 97 101 95 91 93 80 Z" />
      <path d="M 85 110 L 102 110 L 100 114 L 83 114 Z" />
      <path d="M 82 114 L 78 117 M 93 114 L 93 118 M 100 114 L 104 117" stroke="#1D1713" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- LONG BALANCED TAIL -->
    <path
      d="M 66 74
         C 46 66, 26 58, 6 62
         C 18 73, 40 85, 66 86 Z"
      fill="url(#barySkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <path d="M 10 63 C 24 72 44 82 66 84 L 66 81 C 46 79 26 70 14 63 Z" fill="#242F1C" />

    <!-- LOW DORSAL KEEL & SCUTES -->
    <path
      d="M 66 74
         C 68 62, 80 54, 102 54
         C 120 54, 134 58, 142 64
         L 142 67 C 130 63, 114 60, 96 61 C 78 62, 68 70, 66 74 Z"
      fill="#283520"
      stroke="#1D1713"
      stroke-width="1.2"
    />

    <!-- STREAMLINED BODY & S-CURVED NECK -->
    <path
      d="M 66 74
         C 66 60, 80 54, 106 54
         C 122 54, 136 60, 144 66
         C 152 56, 164 50, 178 48
         C 192 46, 204 50, 208 55
         C 206 60, 196 63, 184 64
         C 168 65, 154 68, 142 74
         C 134 84, 122 90, 98 90
         C 78 90, 68 84, 66 74 Z"
      fill="url(#barySkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Warm Cream Throat & Belly -->
    <path
      d="M 76 78
         C 90 87, 114 87, 132 78
         C 142 71, 156 68, 172 63
         C 160 63, 148 68, 138 72
         C 124 83, 106 87, 88 86
         C 80 84, 76 81, 76 78 Z"
      fill="#EADFC8"
      opacity="0.85"
    />

    <!-- HEAVY FORELIMB WITH ENORMOUS SICKLE THUMB CLAW ("HEAVY CLAW") -->
    <g>
      <path d="M 134 72 C 140 78 142 86 138 94 L 132 96" stroke="#1D1713" stroke-width="2.8" stroke-linecap="round" fill="none" />
      <!-- Signature 31cm curved thumb claw -->
      <path
        d="M 132 96
           Q 142 98 144 ${96 + heavyClawSize}
           Q 136 ${98 + heavyClawSize/2} 132 96 Z"
        fill="#FAF6ED"
        stroke="#1D1713"
        stroke-width="1.3"
        stroke-linejoin="round"
      />
      <!-- Other fingers -->
      <circle cx="136" cy="98" r="0.9" fill="#FAF6ED" />
      <circle cx="138" cy="96" r="0.9" fill="#FAF6ED" />
    </g>

    <!-- FOREGROUND HIND LEG -->
    <g>
      <path d="M 94 62 C 110 64 118 76 116 90 C 112 98 104 101 94 98 C 86 92 86 78 90 68 Z" fill="#425336" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 100 88 L 96 111 L 108 111 L 110 88 Z" fill="#334229" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 92 111 L 116 111 L 114 116 L 90 116 Z" fill="#242F1C" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 90 115 L 84 118 M 103 115 L 103 119 M 114 115 L 120 118" stroke="#1D1713" stroke-width="2.4" stroke-linecap="round" />
    </g>

    <!-- CROC SNOUT WITH TRIANGULAR NASAL CREST -->
    <g>
      <!-- Sub-nasal triangular crest -->
      <path d="M 180 48 L 183 43 L 186 48 Z" fill="#FAF6ED" stroke="#1D1713" stroke-width="1.2" />

      <!-- Upper jaw -->
      <path d="M 174 53 L 208 55 C 206 59 198 61 186 61 L 174 58 Z" fill="#2A3622" stroke="#1D1713" stroke-width="1.5" stroke-linejoin="round" />
      <!-- Serrated fine fish-catching teeth -->
      <path d="M 182 55 L 184 58 L 186 55 M 190 55 L 192 58 L 194 55 M 198 56 L 200 59 L 202 56 M 204 56 L 206 59 L 207 56" stroke="#FAF6ED" stroke-width="1.1" stroke-linecap="round" fill="none" />

      <!-- Lower Jaw -->
      <path d="M 176 60 L 205 60 C 202 63 194 65 182 64 Z" fill="#242F1C" stroke="#1D1713" stroke-width="1.3" stroke-linejoin="round" />

      <!-- Alert Amber Eye -->
      <ellipse cx="174" cy="49" rx="3.3" ry="2.8" fill="#1D1713" />
      <circle cx="174.2" cy="49" r="1.8" fill="#E2A628" />
      <circle cx="174.5" cy="49" r="1.1" fill="#150E0A" />
      <circle cx="175" cy="48.2" r="0.6" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 18. DEINONYCHUS (Absolute Unit) — Terrible Claw Pack Hunter
// =========================================================================
function createDeinonychusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const sickleSize = isJuv ? 10 : isGrown ? 17 : 13.5;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="deinoSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#6B381E' : '#7D4428'}" />
      <stop offset="100%" stop-color="${isGrown ? '#4A2311' : '#572B16'}" />
    </linearGradient>
    <radialGradient id="deinoShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 48 : 58}" ry="7" fill="url(#deinoShad)" />

  <g transform="translate(14, 12)">
    <!-- BACK LEG -->
    <g fill="#3D1C0D">
      <path d="M 88 78 C 84 88 84 98 88 108 L 96 108 C 96 99 94 89 92 78 Z" />
      <path d="M 86 108 L 102 108 L 100 112 L 84 112 Z" />
      <path d="M 82 112 L 78 115 M 92 112 L 92 116 M 100 112 L 104 115" stroke="#1D1713" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- STIFF ROD TAIL WITH TERMINAL FEATHER FAN -->
    <path
      d="M 68 72
         C 46 64, 26 58, 6 60
         C 18 69, 42 79, 68 81 Z"
      fill="url(#deinoSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <!-- Tail Feather Fan Plumes -->
    <path d="M 6 60 L -6 56 L 0 62 L -8 63 L 2 67 L -4 70 L 8 70 Z" fill="#C28E4A" stroke="#1D1713" stroke-width="1.3" stroke-linejoin="round" />

    <!-- ATHLETIC PREDATORY BODY & HORIZONTAL NECK -->
    <path
      d="M 68 72
         C 68 56, 84 50, 110 50
         C 126 50, 138 56, 146 62
         C 154 52, 166 46, 180 44
         C 194 42, 204 48, 206 56
         C 204 62, 196 66, 184 66
         C 168 67, 154 69, 142 74
         C 134 84, 122 88, 98 88
         C 78 88, 68 82, 68 72 Z"
      fill="url(#deinoSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Countershaded Underbelly & Throat -->
    <path
      d="M 76 76
         C 90 85, 114 85, 132 76
         C 140 70, 152 66, 168 61
         C 156 61, 144 65, 136 70
         C 122 81, 106 85, 88 84
         C 80 83, 76 80, 76 76 Z"
      fill="#F4E8D4"
      opacity="0.85"
    />

    <!-- WING FEATHER PLUMAGE (Along forelimb) -->
    <g>
      <path d="M 132 66 C 138 72 142 80 146 88 L 138 90" stroke="#1D1713" stroke-width="2" stroke-linecap="round" fill="none" />
      <!-- Primary flight/display feathers -->
      <path d="M 136 74 L 126 84 M 140 78 L 130 90 M 144 83 L 134 96" stroke="#C28E4A" stroke-width="2.6" stroke-linecap="round" />
      <path d="M 137 75 L 128 84 M 141 79 L 132 90 M 145 84 L 136 96" stroke="#1D1713" stroke-width="1.2" stroke-linecap="round" />
      <!-- Sharp grasping hand claws -->
      <path d="M 146 88 L 152 92 M 144 90 L 149 95 M 141 91 L 145 97" stroke="#FAF6ED" stroke-width="1.6" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND HIND LEG WITH RAISED SICKLE CLAW -->
    <g>
      <path d="M 94 58 C 110 60 118 72 116 86 C 112 95 104 98 94 95 C 86 89 86 75 90 65 Z" fill="#6B381E" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 100 84 L 96 108 L 108 108 L 110 84 Z" fill="#572B16" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <!-- Foot base (resting on 3rd & 4th toes) -->
      <path d="M 96 108 L 116 108 L 114 113 L 94 113 Z" fill="#3D1C0D" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 105 113 L 105 117 M 114 113 L 120 116" stroke="#1D1713" stroke-width="2.4" stroke-linecap="round" />

      <!-- THE HYPER-EXTENSIBLE 2ND TOE SICKLE CLAW (Held aloft!) -->
      <g>
        <!-- Elevated toe joint -->
        <path d="M 96 108 Q 90 102 91 97" stroke="#572B16" stroke-width="3" stroke-linecap="round" fill="none" />
        <!-- Massive curved lethal sickle claw -->
        <path
          d="M 91 97
             C 86 92, 80 91, 74 ${97 - sickleSize * 0.4}
             C 79 97, 85 102, 91 103 Z"
          fill="#FAF6ED"
          stroke="#1D1713"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </g>
    </g>

    <!-- SLEEK SKULL & JAWS -->
    <g>
      <!-- Upper jaw -->
      <path d="M 174 50 L 206 50 C 204 56 196 60 184 60 L 174 57 Z" fill="#4A2311" stroke="#1D1713" stroke-width="1.5" stroke-linejoin="round" />
      <!-- Sharp backward-curved predatory teeth -->
      <path d="M 180 51 L 181 54 L 183 51 M 187 51 L 188 54 L 190 51 M 194 51 L 195 54 L 197 51 M 200 51 L 201 54 L 203 51" stroke="#FAF6ED" stroke-width="1.1" stroke-linecap="round" fill="none" />

      <!-- Lower Jaw -->
      <path d="M 176 58 L 202 58 C 199 63 191 65 180 64 Z" fill="#3D1C0D" stroke="#1D1713" stroke-width="1.3" stroke-linejoin="round" />

      <!-- Fierce Amber Eye -->
      <ellipse cx="174" cy="46" rx="3.3" ry="2.8" fill="#1D1713" />
      <circle cx="174.2" cy="46" r="1.8" fill="#F0C032" />
      <circle cx="174.5" cy="46" r="1.1" fill="#150E0A" />
      <circle cx="175" cy="45.2" r="0.6" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 19. PACHYRHINOSAURUS (Extinction Survivor) — Massive Rugose Nasal Boss
// =========================================================================
function createPachyrhinosaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  // Nasal boss size & frill horn length
  const bossRadius = isJuv ? 4.5 : isGrown ? 8.5 : 6.5;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="pachySkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#4E5346' : '#5C6354'}" />
      <stop offset="100%" stop-color="${isGrown ? '#32372C' : '#3D4235'}" />
    </linearGradient>
    <radialGradient id="pachyShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 52 : 62}" ry="7" fill="url(#pachyShad)" />

  <g transform="translate(10, 14)">
    <!-- BACK LEGS -->
    <g fill="#282D23">
      <!-- Back Hind Leg -->
      <path d="M 76 80 L 72 108 L 84 108 L 88 80 Z" />
      <path d="M 68 108 L 88 108 L 86 112 L 66 112 Z" />
      <!-- Back Foreleg -->
      <path d="M 126 82 L 124 108 L 134 108 L 136 82 Z" />
      <path d="M 122 108 L 138 108 L 136 112 L 120 112 Z" />
    </g>

    <!-- HEAVY SHORT CERATOPSIAN TAIL -->
    <path
      d="M 64 74
         C 46 76, 26 84, 8 96
         C 26 95, 46 90, 64 88 Z"
      fill="url(#pachySkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- MASSIVE BARREL-CHESTED QUADRUPED BODY -->
    <path
      d="M 64 74
         C 64 56, 84 48, 114 48
         C 134 48, 148 54, 154 62
         C 152 74, 148 86, 134 90
         C 114 94, 78 94, 64 88 Z"
      fill="url(#pachySkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Cream Underbelly -->
    <path
      d="M 72 82
         C 90 90, 118 90, 132 84
         C 134 86, 126 90, 114 92
         C 96 92, 80 88, 72 82 Z"
      fill="#DDD5C0"
      opacity="0.8"
    />

    <!-- FOREGROUND PILLAR LEGS -->
    <!-- Foreleg -->
    <g>
      <path d="M 132 68 C 140 70 144 78 142 88 L 134 109 L 122 109 L 124 86 C 124 76 128 68 132 68 Z" fill="#4E5346" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 118 109 L 138 109 L 136 114 L 116 114 Z" fill="#282D23" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <!-- Rounded hoof claws -->
      <circle cx="121" cy="113" r="1.4" fill="#FAF6ED" />
      <circle cx="127" cy="113" r="1.4" fill="#FAF6ED" />
      <circle cx="133" cy="113" r="1.4" fill="#FAF6ED" />
    </g>

    <!-- Hind Leg -->
    <g>
      <path d="M 80 62 C 94 64 100 74 98 86 C 96 95 90 100 82 98 L 76 109 L 64 109 L 68 86 C 70 76 74 64 80 62 Z" fill="#4E5346" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 60 109 L 80 109 L 78 114 L 58 114 Z" fill="#282D23" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <!-- Hoof claws -->
      <circle cx="63" cy="113" r="1.4" fill="#FAF6ED" />
      <circle cx="69" cy="113" r="1.4" fill="#FAF6ED" />
      <circle cx="75" cy="113" r="1.4" fill="#FAF6ED" />
    </g>

    <!-- WIDE NECK FRILL WITH FORWARD-CURVING HORNS -->
    <g>
      <!-- Frill base shield -->
      <path
        d="M 148 58
           C 152 40, 164 28, 180 24
           C 186 28, 184 40, 178 54
           C 168 62, 158 64, 148 58 Z"
        fill="#3D4235"
        stroke="#1D1713"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- Frill border horns (Pachyrhinosaurus signature curved horns on frill top) -->
      <path d="M 178 24 L 186 16 L 183 26 Z" fill="#FAF6ED" stroke="#1D1713" stroke-width="1.3" stroke-linejoin="round" />
      <path d="M 183 28 L 192 23 L 186 33 Z" fill="#FAF6ED" stroke="#1D1713" stroke-width="1.3" stroke-linejoin="round" />
      ${isGrown ? '<path d="M 172 26 L 176 18 L 176 27 Z" fill="#FAF6ED" stroke="#1D1713" stroke-width="1.2" stroke-linejoin="round" />' : ''}
    </g>

    <!-- MASSIVE SKULL & RUGATED NASAL BOSS (Battering Ram - NO HORN!) -->
    <g>
      <!-- Head base -->
      <path
        d="M 160 54
           C 168 46, 182 46, 194 50
           C 202 54, 206 62, 202 70
           C 198 76, 186 78, 174 74
           C 164 70, 158 62, 160 54 Z"
        fill="#4E5346"
        stroke="#1D1713"
        stroke-width="2"
        stroke-linejoin="round"
      />

      <!-- THE MASSIVE BONY NASAL BOSS (Rugose bone battering plate) -->
      <path
        d="M 186 48
           C 188 42, 196 40, 202 44
           C 208 48, 208 54, 204 57
           C 198 60, 188 56, 186 48 Z"
        fill="#E0D5BE"
        stroke="#1D1713"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <!-- Boss surface pits and rugosity -->
      <circle cx="194" cy="46" r="1.2" fill="#8C7F65" />
      <circle cx="199" cy="48" r="1.4" fill="#8C7F65" />
      <circle cx="193" cy="51" r="1.1" fill="#8C7F65" />
      <circle cx="201" cy="53" r="1.2" fill="#8C7F65" />

      <!-- Parrot-like Beak -->
      <path d="M 200 64 L 208 67 C 206 73 200 76 195 74 Z" fill="#282D23" stroke="#1D1713" stroke-width="1.4" stroke-linejoin="round" />

      <!-- Deep Calm Eye under heavy brow -->
      <path d="M 172 50 Q 177 47 182 50" stroke="#1D1713" stroke-width="2" fill="none" stroke-linecap="round" />
      <ellipse cx="177" cy="53" rx="3.2" ry="2.7" fill="#1D1713" />
      <circle cx="177.2" cy="53" r="1.7" fill="#8E6A36" />
      <circle cx="177.5" cy="53" r="1.0" fill="#150E0A" />
      <circle cx="178" cy="52.2" r="0.5" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 20. IGUANODON (Balance Seeker) — Conical Thumb Spike & Balanced Stance
// =========================================================================
function createIguanodonSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const thumbSpikeLen = isJuv ? 5 : isGrown ? 11 : 8;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="iguaSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#485B3D' : '#546A47'}" />
      <stop offset="100%" stop-color="${isGrown ? '#2D3B25' : '#37472E'}" />
    </linearGradient>
    <radialGradient id="iguaShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 52 : 62}" ry="7" fill="url(#iguaShad)" />

  <g transform="translate(12, 14)">
    <!-- BACK LEGS (Balanced facultative biped stance) -->
    <g fill="#24301D">
      <!-- Back Hind Leg -->
      <path d="M 80 78 C 76 88 78 98 82 108 L 90 108 C 89 99 87 89 85 78 Z" />
      <path d="M 78 108 L 94 108 L 92 112 L 76 112 Z" />
      <!-- Back Forelimb (Grounded) -->
      <path d="M 132 82 L 130 108 L 138 108 L 140 82 Z" />
      <path d="M 128 108 L 142 108 L 140 112 L 126 112 Z" />
    </g>

    <!-- DEEP COUNTERWEIGHT HERBIVORE TAIL -->
    <path
      d="M 64 70
         C 44 64, 24 60, 6 66
         C 18 76, 42 86, 64 86 Z"
      fill="url(#iguaSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <path d="M 10 67 C 26 76 46 84 64 85 L 64 82 C 46 81 28 72 14 67 Z" fill="#24301D" />

    <!-- HARMONIOUS BALANCED BODY & S-CURVED NECK -->
    <path
      d="M 64 70
         C 64 54, 82 46, 110 46
         C 128 46, 140 52, 148 60
         C 156 50, 168 44, 182 42
         C 196 40, 206 46, 208 54
         C 204 60, 194 63, 182 64
         C 168 64, 156 68, 144 74
         C 134 84, 120 90, 96 90
         C 78 90, 66 84, 64 70 Z"
      fill="url(#iguaSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Warm Cream Belly & Throat -->
    <path
      d="M 76 76
         C 90 85, 114 85, 132 76
         C 140 70, 152 66, 168 61
         C 156 61, 144 65, 136 70
         C 122 81, 106 85, 88 84
         C 80 83, 76 80, 76 76 Z"
      fill="#ECE4D0"
      opacity="0.85"
    />

    <!-- Decorative dorsal camouflage stripes -->
    ${isGrown ? `
      <path d="M 88 47 Q 90 56 86 64 M 102 47 Q 104 56 100 64 M 116 47 Q 118 56 114 64" stroke="#2D3B25" stroke-width="2.6" stroke-linecap="round" fill="none" opacity="0.75" />
    ` : ''}

    <!-- FOREGROUND FORELIMB WITH FAMOUS CONICAL THUMB SPIKE -->
    <g>
      <!-- Arm extending downwards -->
      <path d="M 136 68 C 142 74 144 84 140 96 L 134 109" stroke="#1D1713" stroke-width="2.6" stroke-linecap="round" fill="none" />
      <path d="M 126 109 L 142 109 L 140 113 L 124 113 Z" fill="#24301D" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <!-- Middle 3 hoof pads -->
      <circle cx="130" cy="112" r="1.3" fill="#FAF6ED" />
      <circle cx="135" cy="112" r="1.3" fill="#FAF6ED" />
      <circle cx="139" cy="112" r="1.3" fill="#FAF6ED" />

      <!-- THE CONICAL DEFENSIVE THUMB SPIKE (Held perpendicular!) -->
      <g>
        <path
          d="M 134 100
             L ${134 + thumbSpikeLen} 96
             L 137 104 Z"
          fill="#FAF6ED"
          stroke="#1D1713"
          stroke-width="1.4"
          stroke-linejoin="round"
        />
      </g>
    </g>

    <!-- FOREGROUND HIND LEG (Powerful balance pillar) -->
    <g>
      <path d="M 90 58 C 106 60 114 72 112 86 C 108 95 100 98 90 95 C 82 89 82 75 86 65 Z" fill="#485B3D" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 96 84 L 92 108 L 104 108 L 106 84 Z" fill="#37472E" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 88 108 L 110 108 L 108 113 L 86 113 Z" fill="#24301D" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 86 112 L 80 115 M 99 112 L 99 116 M 110 112 L 116 115" stroke="#1D1713" stroke-width="2.4" stroke-linecap="round" />
    </g>

    <!-- ELONGATED HORSE-LIKE HEAD WITH KERATINOUS BEAK -->
    <g>
      <!-- Snout & Cheek -->
      <path
        d="M 176 46
           C 184 42, 196 42, 206 48
           C 208 54, 202 60, 192 61
           C 180 62, 172 56, 176 46 Z"
        fill="#37472E"
        stroke="#1D1713"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <!-- Horny cropped browsing beak -->
      <path d="M 204 48 L 210 52 C 208 56 202 58 198 57 Z" fill="#24301D" stroke="#1D1713" stroke-width="1.4" stroke-linejoin="round" />

      <!-- Lower jaw -->
      <path d="M 178 57 L 202 57 C 199 61 190 63 182 62 Z" fill="#24301D" stroke="#1D1713" stroke-width="1.3" stroke-linejoin="round" />

      <!-- Calm Herbivore Eye -->
      <ellipse cx="178" cy="48" rx="3.3" ry="2.8" fill="#1D1713" />
      <circle cx="178.2" cy="48" r="1.8" fill="#C89E38" />
      <circle cx="178.5" cy="48" r="1.1" fill="#150E0A" />
      <circle cx="179" cy="47.2" r="0.6" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// RUN GENERATOR FOR BATCH 4 (16–20)
// =========================================================================
const BASE_DIR = path.resolve('src', 'assets', 'dinos');

const dinosBatch4 = [
  {
    slug: 'dna-researcher',
    egg: { baseColor: '#526970', darkColor: '#2B383C', accentColor: '#B85C38', fissureColor: '#B85C38', patternType: 'sail' },
    generate: createSpinosaurusSvg
  },
  {
    slug: 'expedition-starter',
    egg: { baseColor: '#6B7A56', darkColor: '#364028', accentColor: '#4C5B3E', fissureColor: '#252D1B', patternType: 'bands' },
    generate: createBaryonyxSvg
  },
  {
    slug: 'absolute-unit',
    egg: { baseColor: '#965E3E', darkColor: '#4A2B19', accentColor: '#C28E4A', fissureColor: '#3D1C0D', patternType: 'feathered' },
    generate: createDeinonychusSvg
  },
  {
    slug: 'extinction-survivor',
    egg: { baseColor: '#6E7364', darkColor: '#3D4235', accentColor: '#E0D5BE', fissureColor: '#282D23', patternType: 'boss' },
    generate: createPachyrhinosaurusSvg
  },
  {
    slug: 'balance-seeker',
    egg: { baseColor: '#6B825B', darkColor: '#3B4A30', accentColor: '#FAF6ED', fissureColor: '#24301D', patternType: 'speckles' },
    generate: createIguanodonSvg
  }
];

const stages = ['juvenile', 'adult', 'grown'];

for (const dino of dinosBatch4) {
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

  console.log(`Generated Batch 4: ${dino.slug}`);
}

console.log('Batch 4 generation complete!');
