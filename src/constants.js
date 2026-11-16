// Galician Swimming Federation (FEGAN) League Constants & Game Configuration
// Based on Circular 26-14 "LIGA GALEGA DE CLUBS DE NATACIÓN"

export const DIVISIONS = {
  HONRA: 'División de Honra',
  DIV1: '1ª División',
  DIV2: '2ª División',
  DIV3: '3ª División'
};

export const DIVISION_ORDER = [
  DIVISIONS.DIV3,
  DIVISIONS.DIV2,
  DIVISIONS.DIV1,
  DIVISIONS.HONRA
];

export const INITIAL_CLUBS = {
  [DIVISIONS.HONRA]: [
    { id: 'portamina', name: 'CN Portamiñá', city: 'Lugo', primaryColor: '#0284c7', secondaryColor: '#ffffff' },
    { id: 'galaico', name: 'CN Galaico', city: 'Pontevedra', primaryColor: '#2563eb', secondaryColor: '#f59e0b' },
    { id: 'ferrol', name: 'CN Ferrol', city: 'Ferrol', primaryColor: '#16a34a', secondaryColor: '#ffffff' },
    { id: 'pabellon', name: 'CN Pabellón Ourense', city: 'Ourense', primaryColor: '#dc2626', secondaryColor: '#fbbf24' },
    { id: 'fluvial', name: 'C Fluvial Lugo', city: 'Lugo', primaryColor: '#0d9488', secondaryColor: '#ffffff' },
    { id: 'arteixo', name: 'CN Arteixo', city: 'Arteixo', primaryColor: '#9333ea', secondaryColor: '#ffffff' }
  ],
  [DIVISIONS.DIV1]: [
    { id: 'ponteareas', name: 'CN Ponteareas', city: 'Ponteareas', primaryColor: '#ea580c', secondaryColor: '#ffffff' },
    { id: 'santiago', name: 'CDN Cidade Santiago', city: 'Santiago', primaryColor: '#059669', secondaryColor: '#ffffff' },
    { id: 'sporting', name: 'Sporting Casino A Coruña', city: 'A Coruña', primaryColor: '#e11d48', secondaryColor: '#ffffff' },
    { id: 'fogar', name: 'AD Fogar', city: 'Carballo', primaryColor: '#4f46e5', secondaryColor: '#38bdf8' },
    { id: 'rcnvigo', name: 'RCN Vigo', city: 'Vigo', primaryColor: '#1d4ed8', secondaryColor: '#f43f5e' },
    { id: 'naron', name: 'ADN Narón', city: 'Narón', primaryColor: '#ca8a04', secondaryColor: '#0f172a' }
  ],
  [DIVISIONS.DIV2]: [
    { id: 'coruna', name: 'CN Coruña', city: 'A Coruña', primaryColor: '#3b82f6', secondaryColor: '#ffffff' },
    { id: 'riasbaixas', name: 'CN Vigo Rías Baixas', city: 'Vigo', primaryColor: '#06b6d4', secondaryColor: '#0284c7' },
    { id: 'panas', name: 'CN Panas', city: 'A Coruña', primaryColor: '#84cc16', secondaryColor: '#1e293b' },
    { id: 'mos', name: 'CN Mos', city: 'Mos', primaryColor: '#d97706', secondaryColor: '#ffffff' },
    { id: 'delmar', name: 'C Del Mar', city: 'A Coruña', primaryColor: '#0284c7', secondaryColor: '#f1f5f9' },
    { id: 'boiro', name: 'SD Boiro', city: 'Boiro', primaryColor: '#ef4444', secondaryColor: '#ffffff' }
  ],
  [DIVISIONS.DIV3]: [
    { id: 'marina', name: 'C Marina Ferrol', city: 'Ferrol', primaryColor: '#1e3a8a', secondaryColor: '#ffffff' },
    { id: 'monforte', name: 'CN Monforte', city: 'Monforte', primaryColor: '#047857', secondaryColor: '#ffffff' },
    { id: 'liceo', name: 'CN Liceo', city: 'A Coruña', primaryColor: '#15803d', secondaryColor: '#facc15' },
    { id: 'xove', name: 'CN Xove', city: 'Xove', primaryColor: '#0e7490', secondaryColor: '#ffffff' },
    { id: 'ordes', name: 'CN Ordes', city: 'Ordes', primaryColor: '#c2410c', secondaryColor: '#ffffff' },
    { id: 'vilagarcia', name: 'CN Vilagarcía', city: 'Vilagarcía', primaryColor: '#4338ca', secondaryColor: '#ffffff' },
    { id: 'redondela', name: 'CN Redondela', city: 'Redondela', primaryColor: '#be123c', secondaryColor: '#ffffff' }
  ]
};

export const STROKES = {
  FREE: 'freestyle',
  BACK: 'backstroke',
  BREAST: 'breaststroke',
  FLY: 'butterfly',
  IM: 'IM'
};

export const STROKE_LABELS = {
  [STROKES.FREE]: 'Libre (Crol)',
  [STROKES.BACK]: 'Costas',
  [STROKES.BREAST]: 'Braza',
  [STROKES.FLY]: 'Bolboreta',
  [STROKES.IM]: 'Estilos (IM)'
};

export const STAT_KEYS = [
  'speed',
  'distance',
  'strength',
  'freestyle',
  'backstroke',
  'breaststroke',
  'butterfly',
  'IM'
];

export const STAT_LABELS = {
  speed: 'Velocidade',
  distance: 'Fondo / Resistencia',
  strength: 'Forza / Potencia',
  freestyle: 'Técnica Crol',
  backstroke: 'Técnica Costas',
  breaststroke: 'Técnica Braza',
  butterfly: 'Técnica Bolboreta',
  IM: 'Técnica Estilos'
};

// Event programs defined in Circular 26-14 Page 2
export const MEET_PROGRAMS = {
  XORNADA_A: [
    { id: 'A1', name: '4 x 50 m Estilos Fem.', gender: 'F', distance: 200, stroke: STROKES.IM, isRelay: true, legs: [STROKES.BACK, STROKES.BREAST, STROKES.FLY, STROKES.FREE], legDist: 50 },
    { id: 'A2', name: '4 x 50 m Estilos Mas.', gender: 'M', distance: 200, stroke: STROKES.IM, isRelay: true, legs: [STROKES.BACK, STROKES.BREAST, STROKES.FLY, STROKES.FREE], legDist: 50 },
    { id: 'A3', name: '400 m Libre Fem.', gender: 'F', distance: 400, stroke: STROKES.FREE },
    { id: 'A4', name: '400 m Libre Mas.', gender: 'M', distance: 400, stroke: STROKES.FREE },
    { id: 'A5', name: '100 m Braza Fem.', gender: 'F', distance: 100, stroke: STROKES.BREAST },
    { id: 'A6', name: '100 m Braza Mas.', gender: 'M', distance: 100, stroke: STROKES.BREAST },
    { id: 'A7', name: '100 m Bolboreta Fem.', gender: 'F', distance: 100, stroke: STROKES.FLY },
    { id: 'A8', name: '100 m Bolboreta Mas.', gender: 'M', distance: 100, stroke: STROKES.FLY },
    { id: 'A9', name: '200 m Costas Fem.', gender: 'F', distance: 200, stroke: STROKES.BACK },
    { id: 'A10', name: '200 m Costas Mas.', gender: 'M', distance: 200, stroke: STROKES.BACK },
    { id: 'A11', name: '200 m Estilos Fem.', gender: 'F', distance: 200, stroke: STROKES.IM },
    { id: 'A12', name: '200 m Estilos Mas.', gender: 'M', distance: 200, stroke: STROKES.IM },
    { id: 'A13', name: '100 m Libre Fem.', gender: 'F', distance: 100, stroke: STROKES.FREE },
    { id: 'A14', name: '50 m Libre Mas.', gender: 'M', distance: 50, stroke: STROKES.FREE },
    { id: 'A15', name: '4 x 200 m Libre Fem.', gender: 'F', distance: 800, stroke: STROKES.FREE, isRelay: true, legs: [STROKES.FREE, STROKES.FREE, STROKES.FREE, STROKES.FREE], legDist: 200 },
    { id: 'A16', name: '4 x 100 m Libre Mas.', gender: 'M', distance: 400, stroke: STROKES.FREE, isRelay: true, legs: [STROKES.FREE, STROKES.FREE, STROKES.FREE, STROKES.FREE], legDist: 100 }
  ],
  XORNADA_B: [
    { id: 'B17', name: '4 x 50 m Libre Fem.', gender: 'F', distance: 200, stroke: STROKES.FREE, isRelay: true, legs: [STROKES.FREE, STROKES.FREE, STROKES.FREE, STROKES.FREE], legDist: 50 },
    { id: 'B18', name: '4 x 50 m Libre Mas.', gender: 'M', distance: 200, stroke: STROKES.FREE, isRelay: true, legs: [STROKES.FREE, STROKES.FREE, STROKES.FREE, STROKES.FREE], legDist: 50 },
    { id: 'B19', name: '1500 m Libre Fem.', gender: 'F', distance: 1500, stroke: STROKES.FREE },
    { id: 'B20', name: '200 m Libre Mas.', gender: 'M', distance: 200, stroke: STROKES.FREE },
    { id: 'B21', name: '50 m Bolboreta Fem.', gender: 'F', distance: 50, stroke: STROKES.FLY },
    { id: 'B22', name: '50 m Bolboreta Mas.', gender: 'M', distance: 50, stroke: STROKES.FLY },
    { id: 'B23', name: '200 m Braza Fem.', gender: 'F', distance: 200, stroke: STROKES.BREAST },
    { id: 'B24', name: '200 m Braza Mas.', gender: 'M', distance: 200, stroke: STROKES.BREAST },
    { id: 'B25', name: '50 m Costas Fem.', gender: 'F', distance: 50, stroke: STROKES.BACK },
    { id: 'B26', name: '50 m Costas Mas.', gender: 'M', distance: 50, stroke: STROKES.BACK },
    { id: 'B27', name: '400 m Estilos Fem.', gender: 'F', distance: 400, stroke: STROKES.IM },
    { id: 'B28', name: '400 m Estilos Mas.', gender: 'M', distance: 400, stroke: STROKES.IM },
    { id: 'B29', name: '4 x 100 m Estilos Fem.', gender: 'F', distance: 400, stroke: STROKES.IM, isRelay: true, legs: [STROKES.BACK, STROKES.BREAST, STROKES.FLY, STROKES.FREE], legDist: 100 },
    { id: 'B30', name: '4 x 100 m Estilos Mas.', gender: 'M', distance: 400, stroke: STROKES.IM, isRelay: true, legs: [STROKES.BACK, STROKES.BREAST, STROKES.FLY, STROKES.FREE], legDist: 100 }
  ],
  XORNADA_C: [
    { id: 'C31', name: '100 m Estilos Mas.', gender: 'M', distance: 100, stroke: STROKES.IM },
    { id: 'C32', name: '100 m Estilos Fem.', gender: 'F', distance: 100, stroke: STROKES.IM },
    { id: 'C33', name: '1500 m Libre Mas.', gender: 'M', distance: 1500, stroke: STROKES.FREE },
    { id: 'C34', name: '200 m Libre Fem.', gender: 'F', distance: 200, stroke: STROKES.FREE },
    { id: 'C35', name: '50 m Braza Mas.', gender: 'M', distance: 50, stroke: STROKES.BREAST },
    { id: 'C36', name: '50 m Braza Fem.', gender: 'F', distance: 50, stroke: STROKES.BREAST },
    { id: 'C37', name: '200 m Bolboreta Mas.', gender: 'M', distance: 200, stroke: STROKES.FLY },
    { id: 'C38', name: '200 m Bolboreta Fem.', gender: 'F', distance: 200, stroke: STROKES.FLY },
    { id: 'C39', name: '100 m Libre Mas.', gender: 'M', distance: 100, stroke: STROKES.FREE },
    { id: 'C40', name: '50 m Libre Fem.', gender: 'F', distance: 50, stroke: STROKES.FREE },
    { id: 'C41', name: '100 m Costas Mas.', gender: 'M', distance: 100, stroke: STROKES.BACK },
    { id: 'C42', name: '100 m Costas Fem.', gender: 'F', distance: 100, stroke: STROKES.BACK },
    { id: 'C43', name: '4 x 200 m Libre Mas.', gender: 'M', distance: 800, stroke: STROKES.FREE, isRelay: true, legs: [STROKES.FREE, STROKES.FREE, STROKES.FREE, STROKES.FREE], legDist: 200 },
    { id: 'C44', name: '4 x 100 m Libre Fem.', gender: 'F', distance: 400, stroke: STROKES.FREE, isRelay: true, legs: [STROKES.FREE, STROKES.FREE, STROKES.FREE, STROKES.FREE], legDist: 100 }
  ],
  FASE_FINAL_S1: [
    { id: 'F1', name: '4 x 50 m Libre Fem.', gender: 'F', distance: 200, stroke: STROKES.FREE, isRelay: true, legs: [STROKES.FREE, STROKES.FREE, STROKES.FREE, STROKES.FREE], legDist: 50 },
    { id: 'F2', name: '4 x 50 m Libre Mas.', gender: 'M', distance: 200, stroke: STROKES.FREE, isRelay: true, legs: [STROKES.FREE, STROKES.FREE, STROKES.FREE, STROKES.FREE], legDist: 50 },
    { id: 'F3', name: '200 m Libre Fem.', gender: 'F', distance: 200, stroke: STROKES.FREE },
    { id: 'F4', name: '400 m Libre Mas.', gender: 'M', distance: 400, stroke: STROKES.FREE },
    { id: 'F5', name: '200 m Bolboreta Fem.', gender: 'F', distance: 200, stroke: STROKES.FLY },
    { id: 'F6', name: '200 m Bolboreta Mas.', gender: 'M', distance: 200, stroke: STROKES.FLY },
    { id: 'F7', name: '50 m Costas Fem.', gender: 'F', distance: 50, stroke: STROKES.BACK },
    { id: 'F8', name: '50 m Costas Mas.', gender: 'M', distance: 50, stroke: STROKES.BACK },
    { id: 'F9', name: '100 m Braza Fem.', gender: 'F', distance: 100, stroke: STROKES.BREAST },
    { id: 'F10', name: '100 m Braza Mas.', gender: 'M', distance: 100, stroke: STROKES.BREAST },
    { id: 'F11', name: '800 m Libre Fem.', gender: 'F', distance: 800, stroke: STROKES.FREE },
    { id: 'F12', name: '100 m Libre Mas.', gender: 'M', distance: 100, stroke: STROKES.FREE },
    { id: 'F13', name: '50 m Libre Fem.', gender: 'F', distance: 50, stroke: STROKES.FREE },
    { id: 'F14', name: '200 m Costas Mas.', gender: 'M', distance: 200, stroke: STROKES.BACK },
    { id: 'F15', name: '200 m Costas Fem.', gender: 'F', distance: 200, stroke: STROKES.BACK },
    { id: 'F16', name: '200 m Estilos Mas.', gender: 'M', distance: 200, stroke: STROKES.IM },
    { id: 'F17', name: '200 m Estilos Fem.', gender: 'F', distance: 200, stroke: STROKES.IM },
    { id: 'F18', name: '50 m Bolboreta Mas.', gender: 'M', distance: 50, stroke: STROKES.FLY },
    { id: 'F19', name: '50 m Bolboreta Fem.', gender: 'F', distance: 50, stroke: STROKES.FLY },
    { id: 'F20', name: '4 x 100 m Estilos Mixto', gender: 'MIXED', distance: 400, stroke: STROKES.IM, isRelay: true, legs: [STROKES.BACK, STROKES.BREAST, STROKES.FLY, STROKES.FREE], legDist: 100, mixedRequirement: { M: 2, F: 2 } }
  ],
  FASE_FINAL_S2: [
    { id: 'F21', name: '4 x 50 m Estilos Mas.', gender: 'M', distance: 200, stroke: STROKES.IM, isRelay: true, legs: [STROKES.BACK, STROKES.BREAST, STROKES.FLY, STROKES.FREE], legDist: 50 },
    { id: 'F22', name: '4 x 50 m Estilos Fem.', gender: 'F', distance: 200, stroke: STROKES.IM, isRelay: true, legs: [STROKES.BACK, STROKES.BREAST, STROKES.FLY, STROKES.FREE], legDist: 50 },
    { id: 'F23', name: '200 m Braza Mas.', gender: 'M', distance: 200, stroke: STROKES.BREAST },
    { id: 'F24', name: '200 m Braza Fem.', gender: 'F', distance: 200, stroke: STROKES.BREAST },
    { id: 'F25', name: '200 m Libre Mas.', gender: 'M', distance: 200, stroke: STROKES.FREE },
    { id: 'F26', name: '400 m Libre Fem.', gender: 'F', distance: 400, stroke: STROKES.FREE },
    { id: 'F27', name: '100 m Costas Mas.', gender: 'M', distance: 100, stroke: STROKES.BACK },
    { id: 'F28', name: '100 m Costas Fem.', gender: 'F', distance: 100, stroke: STROKES.BACK },
    { id: 'F29', name: '100 m Bolboreta Mas.', gender: 'M', distance: 100, stroke: STROKES.FLY },
    { id: 'F30', name: '100 m Bolboreta Fem.', gender: 'F', distance: 100, stroke: STROKES.FLY },
    { id: 'F31', name: '50 m Braza Mas.', gender: 'M', distance: 50, stroke: STROKES.BREAST },
    { id: 'F32', name: '50 m Braza Fem.', gender: 'F', distance: 50, stroke: STROKES.BREAST },
    { id: 'F33', name: '800 m Libre Mas.', gender: 'M', distance: 800, stroke: STROKES.FREE },
    { id: 'F34', name: '100 m Libre Fem.', gender: 'F', distance: 100, stroke: STROKES.FREE },
    { id: 'F35', name: '50 m Libre Mas.', gender: 'M', distance: 50, stroke: STROKES.FREE },
    { id: 'F36', name: '400 m Estilos Fem.', gender: 'F', distance: 400, stroke: STROKES.IM },
    { id: 'F37', name: '400 m Estilos Mas.', gender: 'M', distance: 400, stroke: STROKES.IM },
    { id: 'F38', name: '4 x 100 m Libre Mixto', gender: 'MIXED', distance: 400, stroke: STROKES.FREE, isRelay: true, legs: [STROKES.FREE, STROKES.FREE, STROKES.FREE, STROKES.FREE], legDist: 100, mixedRequirement: { M: 2, F: 2 } }
  ]
};

// Official Galician League Scoring Tables (Circular 26-14 Page 3)
export const SCORING_RULES = {
  PRELIM_POINTS_6_CLUBS: {
    INDIVIDUAL: [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    RELAY: [30, 24, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2],
    XORNADA_RANK: [7, 5, 4, 3, 2, 1]
  },
  PRELIM_POINTS_7_PLUS_CLUBS: {
    INDIVIDUAL: [17, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    RELAY: [34, 28, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2],
    XORNADA_RANK: [8, 6, 5, 4, 3, 2, 1]
  },
  FINAL_POINTS_HONRA_1_2: {
    INDIVIDUAL: [7, 5, 4, 3, 2, 1],
    RELAY: [14, 10, 8, 6, 4, 2]
  },
  FINAL_POINTS_DIV3: {
    INDIVIDUAL: [13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    RELAY: [26, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2]
  }
};

// Participation limits from Circular 26-14 Page 2
export const PARTICIPATION_LIMITS = {
  MAX_INDIVIDUAL_PRELIM_TOTAL: 6,
  MAX_INDIVIDUAL_FINAL_TOTAL: 4,
  MAX_INDIVIDUAL_PER_SESSION: 2,
  MAX_SWIMMERS_PER_EVENT_PER_CLUB: 2,
  MAX_RELAY_TEAMS_PER_EVENT_PER_CLUB: 2,
  DIV3_PRELIM_LONG_DISTANCE_LIMIT: 1 // In 400m, 800m, 1500m when >6 clubs in Div 3
};

// Periodization phases across the 36-week season
export const PERIODIZATION_PHASES = {
  BASE: {
    id: 'base',
    key: 'BASE',
    name: 'Preparación Xeral (Base Aeróbica)',
    shortName: 'Base Aeróbica',
    tag: 'Base',
    icon: '🟢',
    badgeClass: 'badge-success',
    color: '#10b981',
    description: 'Volume alto e intensidade moderada. Constrúe a capacidade aeróbica, fondo e resistencia cardiovascular.',
    volumeModifier: 1.25,
    intensityModifier: 0.8,
    fatigueAccumulation: 0.9,
    fatigueTrend: '+10% fatiga/sem',
    primaryGrowth: ['distance', 'strength'],
    secondaryGrowth: ['freestyle']
  },
  SPECIFIC: {
    id: 'specific',
    key: 'SPECIFIC',
    name: 'Preparación Específica (Forza & Limiar)',
    shortName: 'Forza & Limiar',
    tag: 'Forza',
    icon: '🔵',
    badgeClass: 'badge-primary',
    color: '#3b82f6',
    description: 'Volume medio-alto e intensidade alta. Traballo de limiar láctico, técnica de estilos, pesas e forza específica.',
    volumeModifier: 1.0,
    intensityModifier: 1.15,
    fatigueAccumulation: 1.2,
    fatigueTrend: '+16% fatiga/sem',
    primaryGrowth: ['strength', 'butterfly', 'backstroke', 'breaststroke', 'IM'],
    secondaryGrowth: ['speed', 'distance']
  },
  COMPETITION_PACE: {
    id: 'competition_pace',
    key: 'COMPETITION_PACE',
    name: 'Ritmo Competitivo (Velocidade & VO2Max)',
    shortName: 'Velocidade & Ritmo',
    tag: 'Velocidade',
    icon: '🟡',
    badgeClass: 'badge-warning',
    color: '#f59e0b',
    description: 'Volume moderado e intensidade máxima. Series a ritmo de proba, saídas explosivas, viraxes e velocidade pura.',
    volumeModifier: 0.75,
    intensityModifier: 1.35,
    fatigueAccumulation: 1.3,
    fatigueTrend: '+18% fatiga/sem',
    primaryGrowth: ['speed', 'IM'],
    secondaryGrowth: ['freestyle', 'strength']
  },
  TAPER: {
    id: 'taper',
    key: 'TAPER',
    name: 'Puesta a Punto (Descarga & Taper)',
    shortName: 'Descarga / Taper',
    tag: 'Descarga',
    icon: '🟣',
    badgeClass: 'badge-primary',
    color: '#a855f7',
    description: 'Redución drástica de volume (-50%) mantendo a chispa. Elimina a fatiga acumulada para acadar o pico de rendemento na xornada.',
    volumeModifier: 0.45,
    intensityModifier: 1.0,
    fatigueAccumulation: 0.25,
    fatigueClearanceBonus: 2.2,
    fatigueTrend: '-35% fatiga/sem (Supercompensación)',
    primaryGrowth: ['speed'],
    secondaryGrowth: []
  },
  RECOVERY: {
    id: 'recovery',
    key: 'RECOVERY',
    name: 'Recuperación Activa',
    shortName: 'Recuperación',
    tag: 'Recup.',
    icon: '⚪',
    badgeClass: 'badge-primary',
    color: '#06b6d4',
    description: 'Sesións moi suaves de rexeneración post-competición para desintoxicar e previr o sobreadestramento.',
    volumeModifier: 0.35,
    intensityModifier: 0.5,
    fatigueAccumulation: 0.1,
    fatigueClearanceBonus: 3.0,
    fatigueTrend: '-45% fatiga/sem',
    primaryGrowth: [],
    secondaryGrowth: []
  },
  REST: {
    id: 'rest',
    key: 'REST',
    name: 'Descanso Total / Semana de Descarga Profunda',
    shortName: 'Descanso Total',
    tag: 'Descanso',
    icon: '💤',
    badgeClass: 'badge-danger',
    color: '#64748b',
    description: 'Eliminación máxima de fatiga acumulada. Descanso físico e psicolóxico antes ou despois de grandes campionatos.',
    volumeModifier: 0.15,
    intensityModifier: 0.3,
    fatigueAccumulation: 0.05,
    fatigueClearanceBonus: 4.2,
    fatigueTrend: '-60% fatiga/sem',
    primaryGrowth: [],
    secondaryGrowth: []
  }
};

// Equipment & Facilities upgrades available in the store
export const EQUIPMENT_CATALOG = [
  {
    id: 'pull_kick',
    name: 'Material Auxiliar Básico',
    subtitle: 'Pull-buoys, táboas e palas básicas',
    category: 'Material',
    cost: 450,
    trainingBonus: 0.06,
    icon: '🏊‍♂️',
    description: 'Mellora un 6% o aproveitamento do adestramento xeral de estilos e técnica.'
  },
  {
    id: 'fins_snorkels',
    name: 'Set de Aletas & Tubos Frontais',
    subtitle: 'Aletas curtas de silicona e tubos centrais',
    category: 'Material',
    cost: 1100,
    trainingBonus: 0.10,
    icon: '🤿',
    description: 'Aumenta un 10% a ganancia en velocidade de pés e posición hidrodinámica.'
  },
  {
    id: 'resistance_cords',
    name: 'Gomas de Resistencia & Paracaídas',
    subtitle: 'Sistemas elásticos de sobrecarga e power-towers',
    category: 'Equipamento',
    cost: 2400,
    trainingBonus: 0.15,
    icon: '⚡',
    description: 'Aumenta un 15% o desenvolvemento de velocidade punta e potencia anaeróbica.'
  },
  {
    id: 'gym_conditioning',
    name: 'Ximnasio de Forza & Halterofilia',
    subtitle: 'Banco de calistenia, racks de sentadillas e discos olímpicos',
    category: 'Instalacións',
    cost: 5000,
    trainingBonus: 0.20,
    icon: '🏋️',
    description: 'Incrementa un 20% a ganancia de forza explosiva para saídas e viraxes.'
  },
  {
    id: 'video_analysis',
    name: 'Sistema Subacuático de Análise Biomecánica',
    subtitle: 'Cámaras 4K subacuáticas e software de ángulo de brazada',
    category: 'Tecnoloxía',
    cost: 7500,
    trainingBonus: 0.22,
    icon: '📹',
    description: 'Mellora acelerada en técnica de estilos e eficiencia hidrodinámica.'
  },
  {
    id: 'cryo_recovery',
    name: 'Centro de Crioterapia & Fisioterapia',
    subtitle: 'Baños de xeo, presoterapia e sala de masaxe de descarga',
    category: 'Instalacións',
    cost: 10000,
    fatigueRecoveryBonus: 0.50,
    icon: '🧊',
    description: 'Reduce a fatiga acumulada un 50% máis rápido entre xornadas e sesións.'
  },
  {
    id: 'touchpad_blocks',
    name: 'Plataformas Omega con Cunha & Placas de Crono',
    subtitle: 'Bloques de saída homologados con cuña axustable e placas electrónicas',
    category: 'Tecnoloxía',
    cost: 14000,
    raceStartBonus: 0.15, // Faster reaction times & relay takeoffs
    icon: '⏱️',
    description: 'Reduce tempos de reacción nas saídas e cambios de remudas en 0.15 segundos.'
  }
];

// Difficulty presets influencing AI optimization and economics
export const DIFFICULTY_PRESETS = {
  EASY: {
    id: 'EASY',
    name: 'Promesa (Fácil)',
    tag: 'Fácil',
    description: 'Ideal para principiantes. Máis orzamento inicial, crecemento acelerado e IA máis permisiva.',
    startingFunds: 25000,
    statGrowthMultiplier: 1.3,
    statDecayMultiplier: 0.4,
    fatigueAccumulationMultiplier: 0.75,
    fatigueRecoveryMultiplier: 1.35,
    aiOptimizationLevel: 0.7,
    prizeMoneyMultiplier: 1.3,
    marketCostMultiplier: 0.85
  },
  NORMAL: {
    id: 'NORMAL',
    name: 'Federado (Normal)',
    tag: 'Normal',
    description: 'Experiencia equilibrada e realista coa economía e esixencia da Liga Galega de Clubs.',
    startingFunds: 12000,
    statGrowthMultiplier: 1.0,
    statDecayMultiplier: 1.0,
    fatigueAccumulationMultiplier: 1.0,
    fatigueRecoveryMultiplier: 1.0,
    aiOptimizationLevel: 0.88,
    prizeMoneyMultiplier: 1.0,
    marketCostMultiplier: 1.0
  },
  HARD: {
    id: 'HARD',
    name: 'División de Honra (Difícil)',
    tag: 'Difícil',
    description: 'Para estrategas de natación. Finanzas axustadas, alta fatiga e rivais implacables.',
    startingFunds: 5000,
    statGrowthMultiplier: 0.85,
    statDecayMultiplier: 1.35,
    fatigueAccumulationMultiplier: 1.25,
    fatigueRecoveryMultiplier: 0.85,
    aiOptimizationLevel: 0.98,
    prizeMoneyMultiplier: 0.85,
    marketCostMultiplier: 1.2
  }
};
