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
  } else if (patternType === 'feathered') {
    patternMarkup = `
      <path d="M 100 80 Q 115 70 130 82 M 106 95 Q 120 85 136 97 M 112 110 Q 124 102 140 112" stroke="${accentColor}" stroke-width="2.5" fill="none" opacity="0.6" stroke-linecap="round" />
      <circle cx="110" cy="86" r="2" fill="${darkColor}" opacity="0.5" />
      <circle cx="126" cy="100" r="2.2" fill="${darkColor}" opacity="0.5" />
    `;
  } else if (patternType === 'spikes') {
    patternMarkup = `
      <path d="M 120 62 L 120 74 M 108 70 L 116 78 M 132 70 L 124 78" stroke="${accentColor}" stroke-width="3" stroke-linecap="round" opacity="0.7" />
      <circle cx="114" cy="94" r="3.2" fill="${darkColor}" opacity="0.55" />
      <circle cx="126" cy="94" r="3.2" fill="${darkColor}" opacity="0.55" />
      <circle cx="120" cy="108" r="3" fill="${darkColor}" opacity="0.55" />
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
    <linearGradient id="eggGrad3" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="${baseColor}" />
      <stop offset="60%" stop-color="${baseColor}" />
      <stop offset="100%" stop-color="${darkColor}" />
    </linearGradient>
    <radialGradient id="eggGnd3" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
    <clipPath id="eggShellClip3">
      <path d="M 98 118 C 86 96 94 56 120 50 C 146 56 154 96 142 118 C 134 126 106 126 98 118 Z" />
    </clipPath>
  </defs>

  <g transform="translate(0, 6)">
    <ellipse cx="120" cy="125" rx="44" ry="8" fill="url(#eggGnd3)" />
    <path d="M 76 120 Q 62 114 54 108 M 88 123 Q 78 117 70 111 M 100 125 Q 92 119 82 114" stroke="#362C20" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 164 120 Q 178 114 186 108 M 152 123 Q 162 117 170 111 M 140 125 Q 148 119 158 114" stroke="#362C20" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 94 126 Q 120 131 146 126" stroke="#261E15" stroke-width="4" stroke-linecap="round" fill="none" />

    <path
      d="M 98 118 C 86 96 94 56 120 50 C 146 56 154 96 142 118 C 134 126 106 126 98 118 Z"
      fill="url(#eggGrad3)"
      stroke="#1E1711"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <g clip-path="url(#eggShellClip3)">
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
// 11. CARNOTAURUS (Focus Mode) — Bulldog Snout with Outward Brow Horns
// =========================================================================
function createCarnotaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const hornMarkup = isJuv
    ? '<path d="M 172 40 L 174 34 L 178 39 Z" fill="#FAF6ED" stroke="#1D1713" stroke-width="1.3" stroke-linejoin="round" />'
    : isGrown
    ? '<path d="M 172 40 L 178 26 L 184 38 Z" fill="#FAF6ED" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />\n       <path d="M 175 42 L 182 30 L 187 40 Z" fill="#D4C8B4" stroke="#1D1713" stroke-width="1.5" stroke-linejoin="round" />'
    : '<path d="M 172 40 L 176 30 L 182 38 Z" fill="#FAF6ED" stroke="#1D1713" stroke-width="1.6" stroke-linejoin="round" />';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="carnoSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#4E423C' : '#584C44'}" />
      <stop offset="100%" stop-color="${isGrown ? '#362C27' : '#3E342E'}" />
    </linearGradient>
    <radialGradient id="carnoShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 48 : 56}" ry="7" fill="url(#carnoShad)" />

  <g transform="translate(15, 12)">
    <!-- BACK LEG -->
    <g fill="#2B231F">
      <path d="M 94 76 C 90 86 92 98 96 109 L 106 109 C 104 98 102 87 99 76 Z" />
      <path d="M 91 109 L 109 109 L 107 113 L 89 113 Z" />
      <path d="M 88 113 L 84 116 M 98 113 L 98 117 M 107 113 L 111 116" stroke="#1D1713" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- HEAVY MUSCULAR TAIL -->
    <path d="M 68 74 C 44 67 24 60 8 64 C 22 73 44 85 68 87 Z" fill="url(#carnoSkin)" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
    <path d="M 12 65 C 26 74 46 84 68 86 L 68 83 C 48 81 28 71 16 65 Z" fill="#322822" />

    <!-- DEEP-CHESTED BULLDOG BODY & NECK -->
    <path
      d="M 66 74
         C 66 54, 84 44, 114 46
         C 128 47, 140 52, 146 60
         C 152 48, 162 42, 176 40
         C 188 38, 194 44, 192 53
         C 190 60, 182 63, 172 65
         C 160 67, 148 69, 140 69
         C 134 78, 122 88, 98 88
         C 78 88, 68 82, 66 74 Z"
      fill="url(#carnoSkin)"
      stroke="#1D1713"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Cream Underbelly -->
    <path
      d="M 76 75
         C 90 85, 114 85, 132 75
         C 136 71, 144 68, 152 64
         C 144 64, 136 67, 130 68
         C 122 81, 106 86, 90 85
         C 82 84, 77 80, 76 75 Z"
      fill="#D4C8B4"
      opacity="0.85"
    />

    <!-- TINY VESTIGIAL 4-FINGERED FORELIMB (High on chest) -->
    <g>
      <path d="M 134 68 C 137 69 138 72 136 75 L 133 76" stroke="#1D1713" stroke-width="2.2" stroke-linecap="round" fill="none" />
      <circle cx="136" cy="76" r="0.8" fill="#FAF6ED" />
      <circle cx="134" cy="77" r="0.8" fill="#FAF6ED" />
    </g>

    <!-- FOREGROUND RUNNER LEG -->
    <g>
      <path d="M 98 58 C 114 60 124 72 120 88 C 116 97 106 101 96 97 C 88 91 88 76 94 65 Z" fill="#4E423C" stroke="#1D1713" stroke-width="2" stroke-linejoin="round" />
      <path d="M 104 86 L 100 110 L 112 110 L 114 86 Z" fill="#3E342E" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 96 110 L 120 110 L 118 115 L 94 115 Z" fill="#2E2520" stroke="#1D1713" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 94 114 L 88 117 M 107 114 L 107 118 M 118 114 L 124 117" stroke="#1D1713" stroke-width="2.4" stroke-linecap="round" />
    </g>

    <!-- SHARP OUTWARD BROW HORNS (Signature Carnotaurus trait) -->
    ${hornMarkup}

    <!-- BLUNT BULLDOG SNOUT & JAW -->
    <g>
      <path d="M 166 54 L 186 53 C 188 58 180 62 168 61 Z" fill="#322822" stroke="#1D1713" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M 170 54 L 172 57 L 174 54 L 176 57 L 178 54" stroke="#FAF6ED" stroke-width="1.2" stroke-linecap="round" fill="none" />

      <!-- Focused Fierce Eye -->
      <ellipse cx="170" cy="45" rx="3.4" ry="2.9" fill="#1D1713" />
      <circle cx="170.2" cy="45" r="1.9" fill="#E06428" />
      <circle cx="170.5" cy="45" r="1.1" fill="#150E0A" />
      <circle cx="171.1" cy="44.2" r="0.6" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 12. UTAHRAPTOR (Project Pioneer) — Heavy-Bodied Giant Raptor
// =========================================================================
function createUtahraptorSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const sickleSize = isJuv ? 9 : isGrown ? 15 : 12;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="utahSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#8E5028' : '#96582E'}" />
      <stop offset="100%" stop-color="${isGrown ? '#6E3A18' : '#78421E'}" />
    </linearGradient>
    <radialGradient id="utahShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 48 : 56}" ry="7" fill="url(#utahShad)" />

  <g transform="translate(15, 12)">
    <!-- BACK LEG (Heavy, muscular) -->
    <g fill="#4A2610">
      <path d="M 88 74 L 84 90 L 78 103 L 86 103 L 91 92 L 95 77 Z" />
      <path d="M 76 103 L 89 103 L 87 107 L 74 107 Z" />
      <path d="M 73 107 L 70 109 M 83 107 L 83 110 M 88 107 L 91 109" stroke="#1B1108" stroke-width="1.8" stroke-linecap="round" />
    </g>

    <!-- HEAVY TAIL WITH SLATE FEATHER VANE -->
    <path d="M 14 65 C 34 63 56 65 80 66 C 64 76 42 75 14 65 Z" fill="url(#utahSkin)" stroke="#1B1108" stroke-width="2" stroke-linejoin="round" />
    <path d="M 16 64 L 24 56 M 28 65 L 36 57 M 40 66 L 48 58 M 52 66 L 60 59" stroke="#4E5E68" stroke-width="2.6" stroke-linecap="round" />

    <!-- POWERFUL ROBUST RAPTOR TORSO -->
    <path
      d="M 68 67
         C 76 54, 100 52, 124 58
         C 130 53, 140 42, 156 38
         C 172 36, 182 42, 178 51
         C 166 56, 150 57, 138 63
         C 132 70, 128 78, 116 81
         C 96 85, 78 83, 68 67 Z"
      fill="url(#utahSkin)"
      stroke="#1B1108"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Cream Underbelly -->
    <path
      d="M 78 73
         C 94 81, 112 80, 120 77
         C 124 74, 134 67, 142 60
         C 136 61, 128 64, 122 66
         C 112 78, 96 82, 80 80 Z"
      fill="#E8DEC8"
      opacity="0.85"
    />

    <!-- HEAVY FORELIMB WINGLET WITH LETHAL CLAWS -->
    <g>
      <path d="M 120 66 Q 132 72 124 82 L 118 80" stroke="#5A3216" stroke-width="2.8" stroke-linecap="round" fill="none" />
      <path d="M 122 74 L 132 76 M 120 78 L 129 81 M 118 82 L 126 85" stroke="#4E5E68" stroke-width="2" stroke-linecap="round" />
      <path d="M 126 82 L 130 84 M 124 83 L 128 86" stroke="#FAF6ED" stroke-width="1.6" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND MUSCULAR LEG WITH GIANT 9-INCH SICKLE CLAW -->
    <g>
      <path d="M 94 60 C 108 62 112 72 108 84 C 103 92 92 92 88 83 C 84 75 87 65 94 60 Z" fill="#844820" stroke="#1B1108" stroke-width="2" stroke-linejoin="round" />
      <path d="M 96 82 L 98 103 L 89 103 L 87 86 Z" fill="#703A16" stroke="#1B1108" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 87 103 L 106 103 L 104 107 L 85 107 Z" fill="#52280C" stroke="#1B1108" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 94 107 L 94 110 M 103 107 L 106 109" stroke="#1B1108" stroke-width="2" stroke-linecap="round" />
      <!-- Giant Curved Sickle Killing Claw -->
      <path d="M 86 101 Q ${86 - sickleSize} 96 ${88 - sickleSize * 0.8} ${101 - sickleSize} Q ${86 - sickleSize * 0.2} ${101 - sickleSize * 0.6} 88 97 Z" fill="#FAF6ED" stroke="#1B1108" stroke-width="1.8" stroke-linejoin="round" />
    </g>

    <!-- SNOUT, TEETH, EYE -->
    <g>
      <path d="M 160 48 L 176 48 C 173 53 161 54 155 52 Z" fill="#5A3216" stroke="#1B1108" stroke-width="1.4" />
      <path d="M 163 48 L 165 51 L 167 48 L 169 51 L 171 48" stroke="#FAF6ED" stroke-width="1.2" stroke-linecap="round" fill="none" />

      <!-- Pioneer Golden Eye -->
      <circle cx="156" cy="42" r="3.2" fill="#1B1108" />
      <circle cx="156.2" cy="42" r="2" fill="#E5A428" />
      <circle cx="156.5" cy="42" r="1.1" fill="#120A05" />
      <circle cx="157.2" cy="41.2" r="0.7" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 13. ARCHAEOPTERYX (Idea Hatchling) — Proto-Bird with Wings, Teeth & Feather Tail
// =========================================================================
function createArchaeopteryxSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="archSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#4E626E' : '#586C78'}" />
      <stop offset="100%" stop-color="${isGrown ? '#364650' : '#425460'}" />
    </linearGradient>
    <radialGradient id="archShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 42 : 50}" ry="6" fill="url(#archShad)" />

  <g transform="translate(15, 14)">
    <!-- BACK LEG -->
    <g fill="#28343C">
      <path d="M 88 80 L 84 96 L 79 108 L 86 108 L 90 98 L 94 82 Z" />
      <path d="M 77 108 L 89 108 L 87 111 L 75 111 Z" />
    </g>

    <!-- LONG BONY TAIL WITH PAIRED FLIGHT FEATHER FAN -->
    <path d="M 20 74 C 40 70 60 70 80 72 C 60 78 40 80 20 76 Z" fill="url(#archSkin)" stroke="#1A2226" stroke-width="1.6" stroke-linejoin="round" />
    <!-- Feather vanes along tail -->
    <path d="M 22 72 L 14 65 M 34 71 L 26 64 M 46 71 L 38 64 M 58 71 L 50 65" stroke="#C88E3A" stroke-width="2.2" stroke-linecap="round" />
    <path d="M 22 75 L 14 82 M 34 74 L 26 81 M 46 73 L 38 80 M 58 72 L 50 78" stroke="#C88E3A" stroke-width="2.2" stroke-linecap="round" />

    <!-- DELICATE AVIAN-THEROPOD BODY -->
    <path
      d="M 70 70
         C 76 60, 96 58, 118 63
         C 124 57, 134 46, 148 40
         C 160 38, 168 43, 164 51
         C 154 56, 142 58, 132 63
         C 126 70, 122 78, 110 81
         C 92 84, 76 83, 70 70 Z"
      fill="url(#archSkin)"
      stroke="#1A2226"
      stroke-width="1.8"
      stroke-linejoin="round"
    />

    <!-- Warm Cream Breast & Throat -->
    <path
      d="M 78 74
         C 92 81, 108 80, 116 77
         C 120 73, 128 66, 136 58
         C 130 60, 122 63, 116 65
         C 106 76, 92 80, 78 78 Z"
      fill="#F2ECE0"
      opacity="0.9"
    />

    <!-- BROAD FEATHERED FLIGHT WING WITH 3 CLAWED FINGERS -->
    <g>
      <!-- Main wing fan -->
      <path d="M 104 66 C 114 54 130 50 144 58 C 138 72 126 86 108 84 Z" fill="#4B5E6A" stroke="#1A2226" stroke-width="1.6" stroke-linejoin="round" />
      <!-- Primary Flight Feathers with amber edging -->
      <path d="M 112 82 L 122 92 M 120 80 L 132 90 M 128 76 L 140 86 M 136 70 L 148 80" stroke="#C88E3A" stroke-width="2.4" stroke-linecap="round" />
      <!-- 3 Distinct Wing Finger Claws extending from joint -->
      <path d="M 132 54 L 138 52 M 134 56 L 141 55 M 133 58 L 140 59" stroke="#FAF6ED" stroke-width="1.4" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND SLENDER TALON LEG -->
    <g>
      <path d="M 94 66 C 104 68 108 76 104 85 L 96 104 L 86 104 L 88 87 Z" fill="#425460" stroke="#1A2226" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M 84 104 L 100 104 L 98 107 L 82 107 Z" fill="#2D3A42" stroke="#1A2226" stroke-width="1.4" stroke-linejoin="round" />
      <path d="M 88 107 L 88 109 M 94 107 L 96 109" stroke="#1A2226" stroke-width="1.6" stroke-linecap="round" />
    </g>

    <!-- TOOTHED JAW & BRIGHT EYE -->
    <g>
      <path d="M 152 49 L 165 48 C 162 53 152 54 148 52 Z" fill="#364650" stroke="#1A2226" stroke-width="1.3" />
      <!-- Tiny sharp teeth in jaw -->
      <path d="M 154 49 L 156 51 L 158 49 L 160 51" stroke="#FAF6ED" stroke-width="1" stroke-linecap="round" fill="none" />

      <!-- Bright Curious Eye -->
      <circle cx="150" cy="43" r="3" fill="#1A2226" />
      <circle cx="150.2" cy="43" r="1.8" fill="#E8A02C" />
      <circle cx="150.5" cy="43" r="1" fill="#101518" />
      <circle cx="151.1" cy="42.3" r="0.6" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 14. PARASAUROLOPHUS (Calendar Keeper) — Long Backward Tubular Crest
// =========================================================================
function createParasaurolophusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const crestLength = isJuv ? 18 : isGrown ? 44 : 32;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="paraSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#606F4D' : '#6B7A56'}" />
      <stop offset="100%" stop-color="${isGrown ? '#485637' : '#52613E'}" />
    </linearGradient>
    <radialGradient id="paraShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 50 : 58}" ry="7" fill="url(#paraShad)" />

  <g transform="translate(15, 12)">
    <!-- BACK LEGS -->
    <g fill="#333E26">
      <path d="M 76 82 L 72 106 L 82 106 L 84 84 Z" />
      <path d="M 70 106 L 83 106 L 82 109 L 69 109 Z" />
      <path d="M 126 84 L 122 106 L 132 106 L 134 86 Z" />
      <path d="M 120 106 L 133 106 L 132 109 L 119 109 Z" />
    </g>

    <!-- DEEP PADDLE TAIL -->
    <path d="M 68 72 C 46 72 26 78 8 84 C 24 88 46 86 68 83 Z" fill="url(#paraSkin)" stroke="#1C2216" stroke-width="2" stroke-linejoin="round" />

    <!-- HADROSAUR TORSO WITH HIGH BACK RIDGE -->
    <path
      d="M 66 72
         C 68 54, 88 44, 116 48
         C 128 50, 138 58, 146 68
         C 152 56, 160 48, 172 44
         C 184 42, 192 48, 188 56
         C 182 60, 172 63, 160 66
         C 148 70, 140 76, 134 82
         C 124 88, 106 91, 88 89
         C 74 88, 68 82, 66 72 Z"
      fill="url(#paraSkin)"
      stroke="#1C2216"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Cream Throat & Belly -->
    <path
      d="M 76 78
         C 90 86, 112 86, 126 80
         C 134 76, 144 68, 154 62
         C 148 64, 140 67, 134 69
         C 122 80, 106 84, 88 83 Z"
      fill="#DFD8C4"
      opacity="0.85"
    />

    <!-- ICONIC BACKWARD-CURVING TUBULAR CRANIAL CREST -->
    <!-- Extended backward from skull -->
    <path
      d="M 174 44
         C ${174 - crestLength * 0.7} ${44 - crestLength * 0.4}, ${174 - crestLength} ${44 - crestLength * 0.2}, ${174 - crestLength} 36
         C ${174 - crestLength} 32, ${174 - crestLength * 0.8} 36, 170 42 Z"
      fill="#B85834"
      stroke="#1C2216"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
    <!-- Terracotta Accent Stripe on Crest -->
    <path
      d="M 172 43
         C ${172 - crestLength * 0.6} ${43 - crestLength * 0.3}, ${172 - crestLength * 0.9} 38, ${172 - crestLength * 0.95} 35"
      stroke="#FAF6ED"
      stroke-width="1.4"
      fill="none"
      stroke-linecap="round"
    />

    <!-- FOREGROUND HIND LEG -->
    <g>
      <path d="M 80 66 C 92 68 96 76 94 86 L 84 109 L 72 109 L 72 87 C 72 77 76 68 80 66 Z" fill="#546440" stroke="#1C2216" stroke-width="2" stroke-linejoin="round" />
      <path d="M 70 109 L 87 109 L 85 113 L 68 113 Z" fill="#38442A" stroke="#1C2216" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 72 113 L 72 115 M 78 113 L 78 116 M 84 113 L 84 115" stroke="#1C2216" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND FRONT LEG -->
    <g>
      <path d="M 128 72 C 136 74 138 82 136 89 L 126 109 L 115 109 L 116 88 C 118 78 122 72 128 72 Z" fill="#546440" stroke="#1C2216" stroke-width="2" stroke-linejoin="round" />
      <path d="M 113 109 L 128 109 L 127 113 L 112 113 Z" fill="#38442A" stroke="#1C2216" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 116 113 L 116 115 M 121 113 L 121 116 M 126 113 L 126 115" stroke="#1C2216" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- DUCK-LIKE HORNY BILL & EYE -->
    <g>
      <path d="M 178 52 C 184 51 192 53 194 56 C 194 59 188 61 180 60 Z" fill="#D4CCA8" stroke="#1C2216" stroke-width="1.4" stroke-linejoin="round" />

      <!-- Eye -->
      <ellipse cx="174" cy="49" rx="3.2" ry="2.7" fill="#1C2216" />
      <circle cx="174.2" cy="49" r="1.7" fill="${isGrown ? '#E0A830' : '#C49638'}" />
      <circle cx="174.5" cy="49" r="1" fill="#10150E" />
      <circle cx="175.1" cy="48.3" r="0.6" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;
}

// =========================================================================
// 15. STYRACOSAURUS (Report Ranger) — Giant Straight Nose Horn & Spiked Frill
// =========================================================================
function createStyracosaurusSvg(stage) {
  const isJuv = stage === 'juvenile';
  const isGrown = stage === 'grown';

  const nasalHornLength = isJuv ? 18 : isGrown ? 34 : 26;
  const frillSpikes = isJuv
    ? `
      <path d="M 136 34 L 142 22 L 144 32 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="1.4" stroke-linejoin="round" />
      <path d="M 148 32 L 158 20 L 156 30 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="1.4" stroke-linejoin="round" />
    `
    : isGrown
    ? `
      <!-- 6 Grand Radiating Spikes -->
      <path d="M 124 38 L 118 18 L 130 32 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 132 32 L 134 10 L 142 28 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="2" stroke-linejoin="round" />
      <path d="M 144 28 L 152 6 L 154 26 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="2" stroke-linejoin="round" />
      <path d="M 154 28 L 168 10 L 164 28 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="2" stroke-linejoin="round" />
      <path d="M 164 30 L 180 16 L 172 32 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 170 34 L 188 26 L 178 38 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="1.6" stroke-linejoin="round" />
    `
    : `
      <!-- 4 Prominent Spikes -->
      <path d="M 132 34 L 132 14 L 140 30 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 144 30 L 152 10 L 154 28 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 154 30 L 166 14 L 164 30 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 164 32 L 178 20 L 172 34 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="1.6" stroke-linejoin="round" />
    `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <defs>
    <linearGradient id="styraSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isGrown ? '#685E3E' : '#726848'}" />
      <stop offset="100%" stop-color="${isGrown ? '#4E462C' : '#5A5236'}" />
    </linearGradient>
    <radialGradient id="styraShad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14110C" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#14110C" stop-opacity="0" />
    </radialGradient>
  </defs>

  <ellipse cx="120" cy="138" rx="${isJuv ? 50 : 58}" ry="8" fill="url(#styraShad)" />

  <g transform="translate(15, 12)">
    <!-- BACK LEGS -->
    <g fill="#383321">
      <path d="M 68 84 L 64 107 L 76 107 L 78 86 Z" />
      <path d="M 62 107 L 77 107 L 75 111 L 61 111 Z" />
      <path d="M 126 86 L 122 107 L 132 107 L 134 88 Z" />
      <path d="M 120 107 L 133 107 L 132 111 L 119 111 Z" />
    </g>

    <!-- SHORT TAIL -->
    <path d="M 50 74 C 32 78 20 88 10 97 C 24 95 38 88 50 84 Z" fill="url(#styraSkin)" stroke="#1F1B12" stroke-width="2" stroke-linejoin="round" />

    <!-- STURDY TORSO -->
    <path
      d="M 48 75
         C 50 58, 68 48, 98 51
         C 118 53, 132 61, 138 74
         C 132 87, 116 92, 94 92
         C 70 92, 52 87, 48 75 Z"
      fill="url(#styraSkin)"
      stroke="#1F1B12"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <path d="M 60 83 C 76 90 100 90 118 83 C 106 89 88 91 72 89 Z" fill="#D8D0BA" opacity="0.85" />

    <!-- FOREGROUND HIND LEG -->
    <g>
      <path d="M 72 66 C 84 68 88 77 86 88 L 76 109 L 64 109 L 64 88 C 64 77 68 68 72 66 Z" fill="#5A5236" stroke="#1F1B12" stroke-width="2" stroke-linejoin="round" />
      <path d="M 62 109 L 78 109 L 76 113 L 60 113 Z" fill="#3D3724" stroke="#1F1B12" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 64 113 L 64 115 M 70 113 L 70 116 M 75 113 L 75 115" stroke="#1F1B12" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- FOREGROUND FRONT LEG -->
    <g>
      <path d="M 128 72 C 136 75 138 82 136 90 L 126 109 L 115 109 L 116 88 C 118 79 122 73 128 72 Z" fill="#5A5236" stroke="#1F1B12" stroke-width="2" stroke-linejoin="round" />
      <path d="M 113 109 L 128 109 L 127 113 L 112 113 Z" fill="#3D3724" stroke="#1F1B12" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M 116 113 L 116 115 M 121 113 L 121 116 M 126 113 L 126 115" stroke="#1F1B12" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- RADIATING FRILL SPIKES -->
    ${frillSpikes}

    <!-- COMPACT FRILL BASE -->
    <path
      d="M 124 64 C 118 45 128 32 148 26 C 168 24 176 38 166 58 Z"
      fill="#4E462C"
      stroke="#1F1B12"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <ellipse cx="146" cy="38" rx="5.5" ry="3.8" fill="#A4522E" opacity="0.85" />
    <ellipse cx="158" cy="46" rx="4.5" ry="3.2" fill="#A4522E" opacity="0.85" />

    <!-- ENORMOUS STRAIGHT NASAL HORN (Signature Styracosaurus Spear) -->
    <path
      d="M 174 65
         L ${174 + nasalHornLength * 0.25} ${65 - nasalHornLength}
         L ${184} 68 Z"
      fill="#FAF6ED"
      stroke="#1F1B12"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- SNOUT & PARROT BEAK -->
    <path d="M 148 60 C 156 58 170 60 182 67 C 188 72 186 77 178 80 L 152 77 Z" fill="url(#styraSkin)" stroke="#1F1B12" stroke-width="2" stroke-linejoin="round" />
    <path d="M 178 72 L 188 76 L 176 80 Z" fill="#FAF6ED" stroke="#1F1B12" stroke-width="1.8" stroke-linejoin="round" />

    <!-- EYE -->
    <ellipse cx="154" cy="59" rx="3.5" ry="3" fill="#1F1B12" />
    <circle cx="154.2" cy="59" r="2" fill="${isGrown ? '#D4A034' : '#C49A45'}" />
    <circle cx="154.5" cy="59" r="1.1" fill="#100E0A" />
    <circle cx="155.2" cy="58.2" r="0.7" fill="#FFFFFF" />
  </g>
</svg>`;
}

// =========================================================================
// RUN BATCH 3 GENERATION
// =========================================================================

const BATCH_3_CONFIG = [
  {
    slug: 'focus-mode',
    name: 'Carnotaurus',
    eggOptions: {
      baseColor: '#584C44',
      darkColor: '#362C27',
      accentColor: '#B85C38',
      fissureColor: '#1D1713',
      patternType: 'bands'
    },
    fn: createCarnotaurusSvg
  },
  {
    slug: 'project-pioneer',
    name: 'Utahraptor',
    eggOptions: {
      baseColor: '#96582E',
      darkColor: '#52280C',
      accentColor: '#4E5E68',
      fissureColor: '#1B1108',
      patternType: 'feathered'
    },
    fn: createUtahraptorSvg
  },
  {
    slug: 'idea-hatchling',
    name: 'Archaeopteryx',
    eggOptions: {
      baseColor: '#586C78',
      darkColor: '#2D3A42',
      accentColor: '#C88E3A',
      fissureColor: '#1A2226',
      patternType: 'feathered'
    },
    fn: createArchaeopteryxSvg
  },
  {
    slug: 'calendar-keeper',
    name: 'Parasaurolophus',
    eggOptions: {
      baseColor: '#6B7A56',
      darkColor: '#38442A',
      accentColor: '#B85834',
      fissureColor: '#1C2216',
      patternType: 'bands'
    },
    fn: createParasaurolophusSvg
  },
  {
    slug: 'report-ranger',
    name: 'Styracosaurus',
    eggOptions: {
      baseColor: '#726848',
      darkColor: '#3D3724',
      accentColor: '#A4522E',
      fissureColor: '#1F1B12',
      patternType: 'spikes'
    },
    fn: createStyracosaurusSvg
  }
];

export function run() {
  console.log('--- Generating Polished Batch 3 (11-15) ---');
  for (const item of BATCH_3_CONFIG) {
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
