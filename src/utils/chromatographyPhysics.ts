export type SampleId = 'sample_a' | 'sample_b' | 'sample_c';
export type ColumnId = 'db5' | 'dbwax';
export type OvenMode =
  | 'isothermal_low'
  | 'isothermal_high'
  | 'temperature_program';

export interface ColumnSpec {
  id: ColumnId;
  name: string;
  shortName: string;
  stationaryPhase: string;
  polarity: 'Non-Polar' | 'Sangat Polar';
  polarityCode: 'non_polar' | 'polar';
  dimensions: string;
  maxTemp: number; // °C
  suitableSamplesText: string;
  description: string;
}

export const COLUMN_SPECS: Record<ColumnId, ColumnSpec> = {
  db5: {
    id: 'db5',
    name: 'Kolom DB-5 (Non-Polar)',
    shortName: 'DB-5 (Non-Polar • Maks 325°C)',
    stationaryPhase: '5% Fenil - 95% Dimetilpolisiloksan',
    polarity: 'Non-Polar',
    polarityCode: 'non_polar',
    dimensions: '30 m × 0,25 mm × 0,25 µm',
    maxTemp: 325,
    suitableSamplesText:
      'Cocok untuk senyawa Non-Polar & Terpena (Sampel A: Hidrokarbon Alkana & Sampel C: Minyak Atsiri).',
    description:
      'Fasa diam siloksan non-polar dengan ketahanan suhu tinggi hingga 325 °C. Memisahkan analit berdasarkan titik didih dan gaya dispersi van der Waals.',
  },
  dbwax: {
    id: 'dbwax',
    name: 'Kolom DB-WAX (Sangat Polar)',
    shortName: 'DB-WAX (Polar PEG • Maks 240°C)',
    stationaryPhase: '100% Polietilen Glikol (PEG)',
    polarity: 'Sangat Polar',
    polarityCode: 'polar',
    dimensions: '30 m × 0,25 mm × 0,25 µm',
    maxTemp: 240,
    suitableSamplesText:
      'Cocok untuk senyawa Polar pembentuk ikatan hidrogen (Sampel B: Alkohol Volatil).',
    description:
      'Fasa diam polietilen glikol sangat polar. Menahan gugus hidroksil (-OH) secara selektif. PERHATIAN: Batas suhu maksimum 240 °C (di atas 240 °C terjadi Column Bleeding/kerusakan fasa diam)!',
  },
};

export interface SampleCompoundSpec {
  peakNumber: number;
  id: string;
  name: string;
  formula: string;
  boilingPoint: number; // °C
  baseRetentionTime: number; // detik pada kondisi ideal
  baseSigma: number; // detik pada kondisi ideal
  baseHeightMv: number; // mV
  color: string;
  thermalDegradationLimit?: number; // °C jika sensitif panas spesifik (misal Eugenol > 265°C)
}

export interface SampleBottleSpec {
  id: SampleId;
  code: 'Sampel A' | 'Sampel B' | 'Sampel C';
  name: string;
  shortTitle: string;
  subtitle: string;
  polarityLabel: string;
  polarityCode: 'non_polar' | 'polar';
  glassColor: string;
  liquidColor: string;
  capColor: string;
  solvent: {
    name: string;
    formula: string;
    boilingPoint: number;
    retentionTime: number;
  };
  recommendedColumnId: ColumnId;
  recommendedColumnText: string;
  idealTempGuide: {
    ovenModeText: string;
    ovenStartRange: [number, number];
    ovenEndRange: [number, number];
    idealOvenStart: number;
    idealOvenEnd: number;
    injectorRange: [number, number];
    idealInjector: number;
    detectorRange: [number, number];
    idealDetector: number;
  };
  thermalWarningNote: string;
  compounds: [SampleCompoundSpec, SampleCompoundSpec, SampleCompoundSpec];
}

export const SAMPLE_BOTTLE_SPECS: Record<SampleId, SampleBottleSpec> = {
  sample_a: {
    id: 'sample_a',
    code: 'Sampel A',
    name: 'Botol Sampel A: Hidrokarbon Alkana (Non-Polar)',
    shortTitle: 'Sampel A: Hidrokarbon Alkana',
    subtitle: 'n-Heksana, n-Oktana, n-Dekana (dlm Aseton)',
    polarityLabel: 'Non-Polar (Alkana Rantai Lurus)',
    polarityCode: 'non_polar',
    glassColor: '#f8fafc',
    liquidColor: '#f59e0b',
    capColor: '#10b981',
    solvent: {
      name: 'Aseton',
      formula: 'C₃H₆O',
      boilingPoint: 56.0,
      retentionTime: 0.78,
    },
    recommendedColumnId: 'db5',
    recommendedColumnText: 'Kolom DB-5 (Non-Polar, Maks 325 °C)',
    idealTempGuide: {
      ovenModeText: 'Program Suhu (60 °C → 200 °C)',
      ovenStartRange: [50, 85],
      ovenEndRange: [175, 230],
      idealOvenStart: 60,
      idealOvenEnd: 200,
      injectorRange: [210, 270],
      idealInjector: 240,
      detectorRange: [250, 310],
      idealDetector: 280,
    },
    thermalWarningNote:
      'Rentang titik didih lebar (69–174 °C) membutuhkan Program Suhu (60→200 °C). Jika Injektor > 290 °C terjadi pirolisis alkana.',
    compounds: [
      {
        peakNumber: 1,
        id: 'hexane',
        name: 'n-Heksana',
        formula: 'C₆H₁₄',
        boilingPoint: 69.0,
        baseRetentionTime: 2.2,
        baseSigma: 0.22,
        baseHeightMv: 144,
        color: '#22c55e',
      },
      {
        peakNumber: 2,
        id: 'octane',
        name: 'n-Oktana',
        formula: 'C₈H₁₈',
        boilingPoint: 125.0,
        baseRetentionTime: 4.65,
        baseSigma: 0.28,
        baseHeightMv: 122,
        color: '#38bdf8',
      },
      {
        peakNumber: 3,
        id: 'decane',
        name: 'n-Dekana',
        formula: 'C₁₀H₂₂',
        boilingPoint: 174.0,
        baseRetentionTime: 7.45,
        baseSigma: 0.34,
        baseHeightMv: 98,
        color: '#f97316',
        thermalDegradationLimit: 290,
      },
    ],
  },
  sample_b: {
    id: 'sample_b',
    code: 'Sampel B',
    name: 'Botol Sampel B: Alkohol Volatil (Polar)',
    shortTitle: 'Sampel B: Alkohol Volatil',
    subtitle: 'Metanol, Etanol, 1-Propanol (dlm Dietil Eter)',
    polarityLabel: 'Sangat Polar (Gugus -OH)',
    polarityCode: 'polar',
    glassColor: '#ecfeff',
    liquidColor: '#a855f7',
    capColor: '#8b5cf6',
    solvent: {
      name: 'Dietil Eter',
      formula: '(C₂H₅)₂O',
      boilingPoint: 35.0,
      retentionTime: 0.72,
    },
    recommendedColumnId: 'dbwax',
    recommendedColumnText: 'Kolom DB-WAX (Polar PEG, Maks 240 °C)',
    idealTempGuide: {
      ovenModeText: 'Isotermal Rendah (70–85 °C) atau Program (50 °C → 110 °C)',
      ovenStartRange: [45, 90],
      ovenEndRange: [70, 135],
      idealOvenStart: 60,
      idealOvenEnd: 105,
      injectorRange: [150, 200],
      idealInjector: 175,
      detectorRange: [215, 260],
      idealDetector: 235,
    },
    thermalWarningNote:
      'Titik didih rendah (64,7–97,2 °C). Jika suhu oven > 140 °C ketiga alkohol langsung menyatu (co-elution parah). Wajib memakai kolom polar DB-WAX!',
    compounds: [
      {
        peakNumber: 1,
        id: 'methanol',
        name: 'Metanol',
        formula: 'CH₃OH',
        boilingPoint: 64.7,
        baseRetentionTime: 2.35,
        baseSigma: 0.22,
        baseHeightMv: 136,
        color: '#22c55e',
      },
      {
        peakNumber: 2,
        id: 'ethanol',
        name: 'Etanol',
        formula: 'C₂H₅OH',
        boilingPoint: 78.4,
        baseRetentionTime: 4.5,
        baseSigma: 0.27,
        baseHeightMv: 152,
        color: '#38bdf8',
      },
      {
        peakNumber: 3,
        id: 'propanol',
        name: '1-Propanol',
        formula: 'C₃H₇OH',
        boilingPoint: 97.2,
        baseRetentionTime: 6.95,
        baseSigma: 0.33,
        baseHeightMv: 110,
        color: '#f97316',
        thermalDegradationLimit: 265,
      },
    ],
  },
  sample_c: {
    id: 'sample_c',
    code: 'Sampel C',
    name: 'Botol Sampel C: Minyak Atsiri / Terpena (Sensitif Panas)',
    shortTitle: 'Sampel C: Minyak Atsiri (Terpena)',
    subtitle: 'Alfa-Pinena, Limonena, Eugenol (dlm n-Heksana)',
    polarityLabel: 'Non-Polar / Terpena Termolabil',
    polarityCode: 'non_polar',
    glassColor: '#fefce8',
    liquidColor: '#10b981',
    capColor: '#f59e0b',
    solvent: {
      name: 'n-Heksana',
      formula: 'C₆H₁₄',
      boilingPoint: 69.0,
      retentionTime: 0.84,
    },
    recommendedColumnId: 'db5',
    recommendedColumnText: 'Kolom DB-5 (Non-Polar, Maks 325 °C)',
    idealTempGuide: {
      ovenModeText: 'Program Suhu (100 °C → 240 °C)',
      ovenStartRange: [85, 130],
      ovenEndRange: [215, 265],
      idealOvenStart: 100,
      idealOvenEnd: 240,
      injectorRange: [225, 260],
      idealInjector: 245,
      detectorRange: [265, 310],
      idealDetector: 285,
    },
    thermalWarningNote:
      'PERINGATAN TERMOLABIL: Eugenol (Tb = 254 °C) sangat sensitif panas dan akan rusak/terdegradasi parah (>50% hilang) jika Suhu Injektor > 265 °C!',
    compounds: [
      {
        peakNumber: 1,
        id: 'alpha_pinene',
        name: 'Alfa-Pinena',
        formula: 'C₁₀H₁₆',
        boilingPoint: 156.0,
        baseRetentionTime: 2.45,
        baseSigma: 0.23,
        baseHeightMv: 132,
        color: '#22c55e',
      },
      {
        peakNumber: 2,
        id: 'limonene',
        name: 'Limonena',
        formula: 'C₁₀H₁₆',
        boilingPoint: 176.0,
        baseRetentionTime: 4.75,
        baseSigma: 0.28,
        baseHeightMv: 148,
        color: '#38bdf8',
      },
      {
        peakNumber: 3,
        id: 'eugenol',
        name: 'Eugenol',
        formula: 'C₁₀H₁₂O₂',
        boilingPoint: 254.0,
        baseRetentionTime: 7.75,
        baseSigma: 0.35,
        baseHeightMv: 115,
        color: '#f97316',
        thermalDegradationLimit: 265,
      },
    ],
  },
};

export const OVEN_MODE_INFO: Record<
  OvenMode,
  {
    label: string;
    shortLabel: string;
    description: string;
    defaultStartTemp: number;
    defaultEndTemp: number;
  }
> = {
  isothermal_low: {
    label: 'Isotermal Rendah (75 °C Konstan)',
    shortLabel: 'Isotermal Rendah (75°C)',
    description:
      'Suhu oven dijaga konstan rendah. Cocok untuk alkohol bertitik didih rendah (Sampel B), namun terlalu dingin untuk alkana berat/terpena.',
    defaultStartTemp: 75,
    defaultEndTemp: 75,
  },
  temperature_program: {
    label: 'Program Suhu Gradien (60 °C → 200 °C)',
    shortLabel: 'Program Gradien',
    description:
      'Suhu oven naik bertahap selama analisis. Memisahkan senyawa bertitik didih lebar (Sampel A & C) secara tajam dan efisien.',
    defaultStartTemp: 60,
    defaultEndTemp: 200,
  },
  isothermal_high: {
    label: 'Isotermal Tinggi (220 °C Konstan)',
    shortLabel: 'Isotermal Tinggi (220°C)',
    description:
      'Suhu oven konstan tinggi sejak awal. Menyebabkan senyawa volatil keluar serentak dan bertumpuk di awal (Co-elution, Rs < 0,8).',
    defaultStartTemp: 220,
    defaultEndTemp: 220,
  },
};

export interface RunPhysicsParams {
  sampleId: SampleId;
  columnId: ColumnId;
  gasValveOpen: boolean;
  gasPressure: number; // psi
  injectorTemp: number; // °C (25 - 350)
  ovenMode: OvenMode;
  ovenStartTemp: number; // °C (25 - 260)
  ovenEndTemp: number; // °C (25 - 260)
  detectorTemp: number; // °C (25 - 350)
  doorOpenedAtTime: number | null; // null jika pintu oven selalu tertutup selama run
}

export interface SolventPeakResult {
  name: string;
  formula: string;
  boilingPoint: number;
  retentionTime: number;
  sigma: number;
  heightMv: number;
}

export interface DynamicCompoundPeak {
  peakNumber: number;
  id: string;
  name: string;
  formula: string;
  boilingPoint: number;
  color: string;
  retentionTime: number; // detik
  sigma: number; // detik
  tau: number; // konstanta waktu EMG untuk Peak Tailing (detik)
  baseWidthWb: number; // lebar dasar puncak Wb = 4*sigma_eff (detik)
  theoreticalPlatesN: number; // jumlah pelat teoritis N = 16*(tR/Wb)^2
  tailingFactorTf: number; // faktor asimetri/tailing Tf (ideal ~ 1.02)
  heightMv: number; // mV
  areaMvSec: number; // mV·s
  percentArea: number; // %
  isDegraded: boolean;
}

export interface GhostPeakSpec {
  id: string;
  label: string;
  retentionTime: number;
  sigma: number;
  heightMv: number;
  areaMvSec: number;
}

export interface AdaptiveIntegrationRow {
  rowId: string;
  peakLabel: string;
  compoundName: string;
  boilingPointText: string;
  retentionTimeText: string;
  baseWidthText: string;
  platesNText: string;
  tailingFactorText: string;
  areaMvSec: number;
  percentArea: number;
  statusBadge: string;
  statusTone: 'optimal' | 'warning' | 'error';
  color: string;
}

export type FailureKind =
  | 'none'
  | 'no_carrier_gas'
  | 'cold_instrument'
  | 'oven_door_open_start';

export interface MethodRepairAdvice {
  parameterName: string;
  currentValueText: string;
  recommendedValueText: string;
  reason: string;
  tone: 'error' | 'warning';
}

export interface ChromatogramProfile {
  sampleSpec: SampleBottleSpec;
  columnSpec: ColumnSpec;
  isFlatline: boolean;
  failureKind: FailureKind;
  failureTitle: string | null;
  failureCauseShort: string | null;
  failureExplanation: string | null;
  solventPeak: SolventPeakResult;
  peaks: DynamicCompoundPeak[];
  ghostPeaks: GhostPeakSpec[];
  adaptiveTableRows: AdaptiveIntegrationRow[];
  repairAdvices: MethodRepairAdvice[];
  resolutionHexOct: number; // Rs antara puncak 1 & 2
  resolutionOctDec: number; // Rs antara puncak 2 & 3
  isOptimalMethod: boolean;
  hasPolarityMismatch: boolean;
  hasColumnBleeding: boolean;
  hasCoElution: boolean;
  hasPeakBroadening: boolean;
  hasPeakTailing: boolean;
  hasThermalDegradation: boolean;
  hasDetectorCondensation: boolean;
  hasDoorThermalCollapse: boolean;
  bleedingSeverity: number;
  condensationSeverity: number;
  tailingSeverity: number;
  degradationSeverity: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Fungsi bentuk puncak Exponentially Modified Gaussian (EMG).
 */
export function evaluateEMGPeakShape(
  t: number,
  tR: number,
  sigma: number,
  tau: number
): number {
  const dt = t - tR;
  if (tau <= 0.01) {
    const z = dt / Math.max(0.035, sigma);
    return Math.exp(-0.5 * z * z);
  }

  const sigmaLead = sigma * 1.1;
  if (dt <= 0) {
    const zLead = dt / Math.max(0.035, sigmaLead);
    return Math.exp(-0.5 * zLead * zLead);
  }

  const u = dt / Math.max(0.045, tau);
  const emgTail = (1 + u) * Math.exp(-u);
  const sigmaTrail = sigma + 0.45 * tau;
  const zTrail = dt / Math.max(0.045, sigmaTrail);
  const gaussTrail = Math.exp(-0.5 * zTrail * zTrail);

  const tailWeight = clamp(tau / (tau + sigma * 0.75), 0.35, 0.85);
  return (1 - tailWeight) * gaussTrail + tailWeight * emgTail;
}

/**
 * Menghitung profil kromatogram lengkap berdasarkan interaksi:
 * Sampel (A / B / C) + Kolom (DB-5 / DB-WAX) + Suhu (Injektor, Oven, Detektor) + Gas + Pintu Oven.
 */
export function computeChromatogramProfile(
  params: RunPhysicsParams
): ChromatogramProfile {
  const {
    sampleId,
    columnId,
    gasValveOpen,
    gasPressure,
    injectorTemp,
    ovenStartTemp,
    ovenEndTemp,
    detectorTemp,
    doorOpenedAtTime,
  } = params;

  const sampleSpec = SAMPLE_BOTTLE_SPECS[sampleId] ?? SAMPLE_BOTTLE_SPECS.sample_a;
  const columnSpec = COLUMN_SPECS[columnId] ?? COLUMN_SPECS.db5;
  const maxOvenConfigured = Math.max(ovenStartTemp, ovenEndTemp);

  const defaultSolventPeak: SolventPeakResult = {
    name: `Pelarut ${sampleSpec.solvent.name}`,
    formula: sampleSpec.solvent.formula,
    boilingPoint: sampleSpec.solvent.boilingPoint,
    retentionTime: sampleSpec.solvent.retentionTime,
    sigma: 0.08,
    heightMv: 148,
  };

  // =========================================================================
  // KONDISI 1: CEK ANALISIS GAGAL TOTAL (FLATLINE)
  // =========================================================================
  const emptyPeaks: DynamicCompoundPeak[] = sampleSpec.compounds.map((c) => ({
    peakNumber: c.peakNumber,
    id: c.id,
    name: c.name,
    formula: c.formula,
    boilingPoint: c.boilingPoint,
    color: c.color,
    retentionTime: 0,
    sigma: c.baseSigma,
    tau: 0,
    baseWidthWb: 0,
    theoreticalPlatesN: 0,
    tailingFactorTf: 1.0,
    heightMv: 0,
    areaMvSec: 0,
    percentArea: 0,
    isDegraded: false,
  }));

  if (!gasValveOpen || gasPressure <= 5) {
    return {
      sampleSpec,
      columnSpec,
      isFlatline: true,
      failureKind: 'no_carrier_gas',
      failureTitle: 'ANALISIS GAGAL (TIDAK ADA PUNCAK TERDETEKSI)',
      failureCauseShort: 'Katup Gas Pembawa (Helium) masih tertutup (0 psi)',
      failureExplanation:
        'GAGAL ELUSI: Katup Gas Pembawa (Helium) masih tertutup (0 psi). Tanpa aliran fasa gerak, uap sampel dan pelarut tertahan di ruang injektor/awal kolom dan tidak pernah terdorong menuju detektor FID!',
      solventPeak: { ...defaultSolventPeak, heightMv: 0 },
      peaks: emptyPeaks,
      ghostPeaks: [],
      adaptiveTableRows: [],
      repairAdvices: [],
      resolutionHexOct: 0,
      resolutionOctDec: 0,
      isOptimalMethod: false,
      hasPolarityMismatch: false,
      hasColumnBleeding: false,
      hasCoElution: false,
      hasPeakBroadening: false,
      hasPeakTailing: false,
      hasThermalDegradation: false,
      hasDetectorCondensation: false,
      hasDoorThermalCollapse: false,
      bleedingSeverity: 0,
      condensationSeverity: 0,
      tailingSeverity: 0,
      degradationSeverity: 0,
    };
  }

  if (doorOpenedAtTime === 0) {
    return {
      sampleSpec,
      columnSpec,
      isFlatline: true,
      failureKind: 'oven_door_open_start',
      failureTitle: 'ANALISIS GAGAL (TIDAK ADA PUNCAK TERDETEKSI)',
      failureCauseShort:
        'Pintu Oven Kolom terbuka terus sejak awal (Safety Interlock mematikan pemanas)',
      failureExplanation:
        'GAGAL TERMAL OVEN: Pintu oven kolom dibiarkan terbuka sehingga pemanas kolom nonaktif dan suhu berada pada suhu ruang (25 °C). Analit mengembun total di pangkal kolom dan tidak terelusi.',
      solventPeak: { ...defaultSolventPeak, heightMv: 0 },
      peaks: emptyPeaks,
      ghostPeaks: [],
      adaptiveTableRows: [],
      repairAdvices: [],
      resolutionHexOct: 0,
      resolutionOctDec: 0,
      isOptimalMethod: false,
      hasPolarityMismatch: false,
      hasColumnBleeding: false,
      hasCoElution: false,
      hasPeakBroadening: false,
      hasPeakTailing: false,
      hasThermalDegradation: false,
      hasDetectorCondensation: false,
      hasDoorThermalCollapse: true,
      bleedingSeverity: 0,
      condensationSeverity: 0,
      tailingSeverity: 0,
      degradationSeverity: 0,
    };
  }

  if (injectorTemp < 50 || maxOvenConfigured < 40) {
    return {
      sampleSpec,
      columnSpec,
      isFlatline: true,
      failureKind: 'cold_instrument',
      failureTitle: 'ANALISIS GAGAL (TIDAK ADA PUNCAK TERDETEKSI)',
      failureCauseShort: `Suhu mesin GC belum dipanaskan (Injektor ${injectorTemp} °C, Oven ${ovenStartTemp} °C)`,
      failureExplanation:
        'GAGAL VAPORISASI: Mesin GC belum dipanaskan (masih suhu ruang 25 °C). Sampel cair mengendap di liner injektor dan tidak menguap masuk ke dalam kolom kapiler!',
      solventPeak: { ...defaultSolventPeak, heightMv: 0 },
      peaks: emptyPeaks,
      ghostPeaks: [],
      adaptiveTableRows: [],
      repairAdvices: [],
      resolutionHexOct: 0,
      resolutionOctDec: 0,
      isOptimalMethod: false,
      hasPolarityMismatch: false,
      hasColumnBleeding: false,
      hasCoElution: false,
      hasPeakBroadening: false,
      hasPeakTailing: false,
      hasThermalDegradation: false,
      hasDetectorCondensation: false,
      hasDoorThermalCollapse: false,
      bleedingSeverity: 0,
      condensationSeverity: 0,
      tailingSeverity: 0,
      degradationSeverity: 0,
    };
  }

  // =========================================================================
  // 2. EVALUASI INTERAKSI SAMPEL + KOLOM + SUHU
  // =========================================================================
  const guide = sampleSpec.idealTempGuide;

  // A. Ketidakcocokan Kepolaran Kolom (Polarity Mismatch)
  // - Sampel B (Polar Alkohol) di Kolom DB-5 (Non-Polar) -> Keluar terlalu cepat, berdempetan (Rs < 0,8), & tailing!
  // - Sampel A / C (Non-Polar) di Kolom DB-WAX (Polar) -> Tidak tertahan dengan baik, menumpuk di awal (co-elution)!
  const hasPolarityMismatch = sampleSpec.recommendedColumnId !== columnId;
  const isPolarInNonPolarCol =
    sampleSpec.polarityCode === 'polar' && columnId === 'db5';

  // B. Kerusakan Kolom (Column Bleeding)
  // - Kolom DB-WAX batas 240°C, disetel > 240°C -> baseline paruh akhir naik drastis!
  // - Kolom DB-5 batas 325°C, disetel > 325°C
  const hasColumnBleeding = maxOvenConfigured > columnSpec.maxTemp;
  const bleedingSeverity = hasColumnBleeding
    ? clamp((maxOvenConfigured - columnSpec.maxTemp) / 35, 0.45, 1.0)
    : 0;

  // C. Evaluasi Suhu Oven Spesifik Sampel
  let coldOvenSeverity = 0;
  let hotOvenSeverity = 0;

  if (sampleId === 'sample_b') {
    // Sampel B (Alkohol Volatil, Tb 64-97°C):
    // Ideal: Isotermal rendah (70-85°C) atau program rendah (50->110°C).
    // Jika oven disetel > 140°C (awal > 125°C atau akhir > 140°C) -> ketiga alkohol langsung menyatu (co-elution parah)!
    if (ovenStartTemp > 125 || ovenEndTemp > 140) {
      const excess = Math.max(ovenStartTemp - 115, ovenEndTemp - 135);
      hotOvenSeverity = clamp(excess / 45, 0.65, 1.0);
    } else if (ovenEndTemp < 62) {
      coldOvenSeverity = clamp((68 - ovenEndTemp) / 25, 0.45, 1.0);
    }
  } else if (sampleId === 'sample_c') {
    // Sampel C (Minyak Atsiri / Terpena, Tb 156-254°C):
    // Ideal: Program suhu 100°C -> 240°C
    if (ovenEndTemp < 195) {
      coldOvenSeverity = clamp((205 - ovenEndTemp) / 70, 0.45, 1.0);
    }
    if (ovenStartTemp > 165) {
      hotOvenSeverity = clamp((ovenStartTemp - 155) / 50, 0.55, 1.0);
    }
  } else {
    // Sampel A (Hidrokarbon Alkana, Tb 69-174°C):
    // Ideal: Program suhu 60°C -> 200°C
    if (ovenEndTemp < 145) {
      coldOvenSeverity = clamp((155 - ovenEndTemp) / 65, 0.45, 1.0);
    }
    if (ovenStartTemp > 130) {
      hotOvenSeverity = clamp((ovenStartTemp - 120) / 65, 0.55, 1.0);
    }
  }

  // D. Evaluasi Suhu Injektor Spesifik Sampel (Peak Tailing vs Degradasi Termal)
  const minIdealInj = guide.injectorRange[0];
  const maxIdealInj = guide.injectorRange[1];

  const hasInjectorTooLow = injectorTemp < minIdealInj - 15;
  const injectorTailingSeverity = hasInjectorTooLow
    ? clamp((minIdealInj - injectorTemp) / 75, 0.35, 1.0)
    : 0;

  // Tailing juga terjadi jika Sampel B (Alkohol Polar) dianalisis pada kolom DB-5 (Non-Polar)
  const polarityTailingSeverity = isPolarInNonPolarCol ? 0.58 : 0;
  const tailingSeverity = Math.max(
    injectorTailingSeverity,
    polarityTailingSeverity
  );
  const hasPeakTailing = tailingSeverity > 0.25;

  // Degradasi Termal:
  // - Sampel C (Eugenol): rusak jika Injektor > 265°C!
  // - Sampel A: rusak jika Injektor > 290°C!
  // - Sampel B: rusak jika Injektor > 265°C!
  const thermalLimit = sampleId === 'sample_a' ? 290 : 265;
  const hasThermalDegradation = injectorTemp > thermalLimit;
  const degradationSeverity = hasThermalDegradation
    ? clamp((injectorTemp - (thermalLimit - 10)) / 50, 0.5, 1.0)
    : 0;

  // E. Evaluasi Suhu Detektor FID (Kondensasi jika <= Suhu Maks Oven atau terlalu dingin)
  const minSafeDetector = Math.max(195, maxOvenConfigured + 5);
  const hasDetectorCondensation = detectorTemp <= minSafeDetector;
  const condensationSeverity = hasDetectorCondensation
    ? clamp((minSafeDetector + 25 - detectorTemp) / 55, 0.4, 1.0)
    : 0;

  // =========================================================================
  // 3. HITUNG PUNCAK KOMPONEN DINAMIS
  // =========================================================================
  const rawPeaks = sampleSpec.compounds.map((comp, idx) => {
    let tR = comp.baseRetentionTime;
    let sigma = comp.baseSigma;
    let heightScale = 1.0;
    let isDegraded = false;

    // 1) Efek Ketidakcocokan Kepolaran Kolom -> Co-elution parah di awal!
    if (hasPolarityMismatch) {
      const mismatchTimes = [1.45, 1.78, 2.14];
      tR = mismatchTimes[idx];
      sigma = comp.baseSigma * 1.18;
      heightScale *= 0.85;
    } else if (hotOvenSeverity > 0 && coldOvenSeverity === 0) {
      // 2) Efek Suhu Oven Terlalu Tinggi -> Co-elution!
      const coEluteTargets = [1.42, 1.76, 2.15];
      tR =
        comp.baseRetentionTime * (1 - hotOvenSeverity) +
        coEluteTargets[idx] * hotOvenSeverity;
      sigma = comp.baseSigma * (1 + 0.14 * hotOvenSeverity);
      heightScale *= 0.9;
    } else if (coldOvenSeverity > 0) {
      // 3) Efek Suhu Oven Terlalu Rendah -> Waktu retensi lama & Peak Broadening!
      const delayOffsets = [1.35, 2.15, 1.85];
      const sigmaMultipliers = [1.95, 2.45, 2.9];
      const heightReductions = [0.52, 0.62, 0.72];

      tR = comp.baseRetentionTime + delayOffsets[idx] * coldOvenSeverity;
      sigma =
        comp.baseSigma * (1 + (sigmaMultipliers[idx] - 1) * coldOvenSeverity);
      heightScale *= 1 - heightReductions[idx] * coldOvenSeverity;
    } else {
      // Penyesuaian halus terhadap slider suhu oven di dalam rentang ideal
      const startDelta = (guide.idealOvenStart - ovenStartTemp) * 0.012;
      const endDelta = (guide.idealOvenEnd - ovenEndTemp) * 0.014;
      tR = clamp(
        comp.baseRetentionTime +
          startDelta * (1 - idx * 0.25) +
          endDelta * (idx * 0.45),
        1.3,
        9.4
      );
    }

    // 4) Efek Peak Tailing (EMG) akibat Injektor Rendah atau Alkohol di DB-5
    let tau = 0;
    if (tailingSeverity > 0) {
      tR = Math.min(9.5, tR + (0.15 + idx * 0.08) * tailingSeverity);
      sigma = sigma * (1 + 0.32 * tailingSeverity);
      tau = (0.45 + idx * 0.22) * tailingSeverity;
      heightScale *= 1 - 0.38 * tailingSeverity;
    }

    // 5) Efek Degradasi Termal (Terutama senyawa ke-3 seperti Eugenol > 265°C atau Dekana > 290°C)
    if (hasThermalDegradation) {
      if (sampleId === 'sample_c') {
        // Eugenol (idx === 2) rusak parah (>55% hilang), Limonena sedikit rusak
        const degFactors = [0.12, 0.28, 0.68];
        heightScale *= 1 - degFactors[idx] * degradationSeverity;
        if (idx === 2) isDegraded = true;
      } else {
        const degFactors = [0.22, 0.48, 0.68];
        heightScale *= 1 - degFactors[idx] * degradationSeverity;
        if (idx >= 1) isDegraded = true;
      }
    }

    // 6) Efek Kondensasi Detektor
    if (condensationSeverity > 0) {
      heightScale *= 1 - 0.35 * condensationSeverity;
    }

    // 7) Efek Pintu Oven Dibuka di Tengah Run
    if (
      doorOpenedAtTime !== null &&
      doorOpenedAtTime > 0 &&
      tR >= doorOpenedAtTime - 0.3
    ) {
      const postOpenDelay = Math.max(
        0.45,
        (tR - doorOpenedAtTime) * 0.65 + 0.85
      );
      tR = Math.min(9.6, tR + postOpenDelay);
      sigma = sigma * 2.6;
      heightScale *= 0.34;
    }

    const heightMv = Math.max(
      6,
      Number((comp.baseHeightMv * heightScale).toFixed(1))
    );
    const effectiveSigma = sigma + tau * 0.42;
    const baseWidthWb = Number((4 * effectiveSigma).toFixed(2));
    const theoreticalPlatesN = Math.max(
      45,
      Math.round(16 * Math.pow(tR / Math.max(0.15, baseWidthWb), 2))
    );
    const tailingFactorTf = Number(
      (1.02 + (tau / Math.max(0.15, sigma)) * 0.68).toFixed(2)
    );
    const effectiveWidthFactor = Math.sqrt(2 * Math.PI) * sigma + tau * 0.85;
    const areaMvSec = Number((heightMv * effectiveWidthFactor).toFixed(1));

    return {
      peakNumber: comp.peakNumber,
      id: comp.id,
      name: comp.name,
      formula: comp.formula,
      boilingPoint: comp.boilingPoint,
      color: comp.color,
      retentionTime: Number(tR.toFixed(2)),
      sigma: Number(sigma.toFixed(3)),
      tau: Number(tau.toFixed(3)),
      baseWidthWb,
      theoreticalPlatesN,
      tailingFactorTf,
      heightMv,
      areaMvSec,
      percentArea: 0,
      isDegraded,
    };
  });

  // 4. GHOST PEAKS (Puncak Artefak Hasil Degradasi Termal)
  const ghostPeaks: GhostPeakSpec[] = [];
  if (hasThermalDegradation) {
    const g1H = Math.round(28 + 34 * degradationSeverity);
    const g2H = Math.round(18 + 24 * degradationSeverity);
    const g1Sigma = 0.12;
    const g2Sigma = 0.14;
    ghostPeaks.push(
      {
        id: 'artifact_1',
        label:
          sampleId === 'sample_c'
            ? 'Artefak Dekomposisi Eugenol'
            : 'Artefak Pirolisis Termal',
        retentionTime: 1.22,
        sigma: g1Sigma,
        heightMv: g1H,
        areaMvSec: Number((g1H * g1Sigma * Math.sqrt(2 * Math.PI)).toFixed(1)),
      },
      {
        id: 'artifact_2',
        label: 'Fragmen Degradasi Volatil',
        retentionTime: 3.18,
        sigma: g2Sigma,
        heightMv: g2H,
        areaMvSec: Number((g2H * g2Sigma * Math.sqrt(2 * Math.PI)).toFixed(1)),
      }
    );
  }

  const artifactTotalArea = ghostPeaks.reduce((s, g) => s + g.areaMvSec, 0);
  const rawTotalArea =
    rawPeaks.reduce((sum, p) => sum + p.areaMvSec, 0) + artifactTotalArea || 1;

  const peaks: DynamicCompoundPeak[] = rawPeaks.map((p) => ({
    ...p,
    percentArea: Number(((p.areaMvSec / rawTotalArea) * 100).toFixed(1)),
  }));

  // 5. HITUNG RESOLUSI KROMATOGRAFI (Rs)
  const resolutionHexOct = Number(
    (
      Math.max(0, 2 * (peaks[1].retentionTime - peaks[0].retentionTime)) /
      Math.max(0.1, peaks[0].baseWidthWb + peaks[1].baseWidthWb)
    ).toFixed(2)
  );
  const resolutionOctDec = Number(
    (
      Math.max(0, 2 * (peaks[2].retentionTime - peaks[1].retentionTime)) /
      Math.max(0.1, peaks[1].baseWidthWb + peaks[2].baseWidthWb)
    ).toFixed(2)
  );

  const coElute12 = resolutionHexOct < 0.85;
  const coElute23 = resolutionOctDec < 0.85;
  const hasCoElution = hasPolarityMismatch || coElute12 || coElute23;
  const hasPeakBroadening = coldOvenSeverity > 0.25;
  const hasDoorThermalCollapse =
    doorOpenedAtTime !== null && doorOpenedAtTime > 0;

  // =========================================================================
  // 6. BANGUN BARIS TABEL HASIL ADAPTIF (KONDISI 2 vs KONDISI 3)
  // =========================================================================
  const adaptiveTableRows: AdaptiveIntegrationRow[] = [];

  const getSinglePeakStatus = (
    p: DynamicCompoundPeak
  ): { badge: string; tone: 'optimal' | 'warning' | 'error' } => {
    if (p.isDegraded) {
      return {
        badge: 'Terdegradasi Termal (Rusak)',
        tone: 'error',
      };
    }
    if (hasDoorThermalCollapse && p.retentionTime >= (doorOpenedAtTime ?? 0)) {
      return {
        badge: 'Puncak Rusak (Pintu Oven Dibuka)',
        tone: 'error',
      };
    }
    if (hasPeakTailing && p.tailingFactorTf >= 1.6) {
      return {
        badge: `Peak Tailing (Tf = ${p.tailingFactorTf.toFixed(2)})`,
        tone: 'warning',
      };
    }
    if (hasPeakBroadening) {
      return {
        badge: 'Puncak Melebar (Sensitivitas Rendah)',
        tone: 'warning',
      };
    }
    if (hasColumnBleeding && p.peakNumber === 3) {
      return {
        badge: 'Terganggu Column Bleeding',
        tone: 'warning',
      };
    }
    if (hasDetectorCondensation) {
      return {
        badge: 'Sensitivitas Turun (Kondensasi FID)',
        tone: 'warning',
      };
    }
    return {
      badge: 'Terpisah Tajam & Valid',
      tone: 'optimal',
    };
  };

  if (coElute12 && coElute23) {
    // Ketiga puncak menyatu seluruhnya!
    const combinedArea = Number(
      (peaks[0].areaMvSec + peaks[1].areaMvSec + peaks[2].areaMvSec).toFixed(1)
    );
    const combinedPct = Number(
      (
        peaks[0].percentArea +
        peaks[1].percentArea +
        peaks[2].percentArea
      ).toFixed(1)
    );
    adaptiveTableRows.push({
      rowId: 'coeluted_123',
      peakLabel: '#1+#2+#3',
      compoundName: `Puncak Menyatu (Co-eluted: ${peaks[0].name} + ${peaks[1].name} + ${peaks[2].name}) — Gagal Dipisahkan`,
      boilingPointText: `${peaks[0].boilingPoint}–${peaks[2].boilingPoint} °C`,
      retentionTimeText: `${peaks[0].retentionTime.toFixed(2)}–${peaks[2].retentionTime.toFixed(2)} dtk`,
      baseWidthText: `${(
        peaks[0].baseWidthWb +
        peaks[1].baseWidthWb +
        peaks[2].baseWidthWb
      ).toFixed(2)} dtk`,
      platesNText: `${Math.min(
        peaks[0].theoreticalPlatesN,
        peaks[1].theoreticalPlatesN
      )} (Buruk)`,
      tailingFactorText: peaks[1].tailingFactorTf.toFixed(2),
      areaMvSec: combinedArea,
      percentArea: combinedPct,
      statusBadge: 'Tidak Terpisahkan (Rs < 0,8)',
      statusTone: 'error',
      color: '#f43f5e',
    });
  } else if (coElute12) {
    // Puncak 1 & 2 menyatu
    const combinedArea = Number(
      (peaks[0].areaMvSec + peaks[1].areaMvSec).toFixed(1)
    );
    const combinedPct = Number(
      (peaks[0].percentArea + peaks[1].percentArea).toFixed(1)
    );
    adaptiveTableRows.push({
      rowId: 'coeluted_12',
      peakLabel: '#1+#2',
      compoundName: `Puncak Menyatu (Co-eluted: ${peaks[0].name} + ${peaks[1].name}) — Gagal Dipisahkan`,
      boilingPointText: `${peaks[0].boilingPoint} & ${peaks[1].boilingPoint} °C`,
      retentionTimeText: `${peaks[0].retentionTime.toFixed(2)}–${peaks[1].retentionTime.toFixed(2)} dtk`,
      baseWidthText: `${(peaks[0].baseWidthWb + peaks[1].baseWidthWb).toFixed(2)} dtk`,
      platesNText: `${peaks[0].theoreticalPlatesN} (Buruk)`,
      tailingFactorText: peaks[0].tailingFactorTf.toFixed(2),
      areaMvSec: combinedArea,
      percentArea: combinedPct,
      statusBadge: `Tidak Terpisahkan (Rs = ${resolutionHexOct})`,
      statusTone: 'error',
      color: '#f43f5e',
    });
    const st3 = getSinglePeakStatus(peaks[2]);
    adaptiveTableRows.push({
      rowId: peaks[2].id,
      peakLabel: `#${peaks[2].peakNumber}`,
      compoundName: `${peaks[2].name} (${peaks[2].formula})`,
      boilingPointText: `${peaks[2].boilingPoint} °C`,
      retentionTimeText: `${peaks[2].retentionTime.toFixed(2)} dtk`,
      baseWidthText: `${peaks[2].baseWidthWb.toFixed(2)} dtk`,
      platesNText: `${peaks[2].theoreticalPlatesN}`,
      tailingFactorText: peaks[2].tailingFactorTf.toFixed(2),
      areaMvSec: peaks[2].areaMvSec,
      percentArea: peaks[2].percentArea,
      statusBadge: st3.badge,
      statusTone: st3.tone,
      color: peaks[2].color,
    });
  } else if (coElute23) {
    // Puncak 1 terpisah, Puncak 2 & 3 menyatu
    const st1 = getSinglePeakStatus(peaks[0]);
    adaptiveTableRows.push({
      rowId: peaks[0].id,
      peakLabel: `#${peaks[0].peakNumber}`,
      compoundName: `${peaks[0].name} (${peaks[0].formula})`,
      boilingPointText: `${peaks[0].boilingPoint} °C`,
      retentionTimeText: `${peaks[0].retentionTime.toFixed(2)} dtk`,
      baseWidthText: `${peaks[0].baseWidthWb.toFixed(2)} dtk`,
      platesNText: `${peaks[0].theoreticalPlatesN}`,
      tailingFactorText: peaks[0].tailingFactorTf.toFixed(2),
      areaMvSec: peaks[0].areaMvSec,
      percentArea: peaks[0].percentArea,
      statusBadge: st1.badge,
      statusTone: st1.tone,
      color: peaks[0].color,
    });
    const combinedArea = Number(
      (peaks[1].areaMvSec + peaks[2].areaMvSec).toFixed(1)
    );
    const combinedPct = Number(
      (peaks[1].percentArea + peaks[2].percentArea).toFixed(1)
    );
    adaptiveTableRows.push({
      rowId: 'coeluted_23',
      peakLabel: '#2+#3',
      compoundName: `Puncak Menyatu (Co-eluted: ${peaks[1].name} + ${peaks[2].name}) — Gagal Dipisahkan`,
      boilingPointText: `${peaks[1].boilingPoint} & ${peaks[2].boilingPoint} °C`,
      retentionTimeText: `${peaks[1].retentionTime.toFixed(2)}–${peaks[2].retentionTime.toFixed(2)} dtk`,
      baseWidthText: `${(peaks[1].baseWidthWb + peaks[2].baseWidthWb).toFixed(2)} dtk`,
      platesNText: `${peaks[1].theoreticalPlatesN} (Buruk)`,
      tailingFactorText: peaks[1].tailingFactorTf.toFixed(2),
      areaMvSec: combinedArea,
      percentArea: combinedPct,
      statusBadge: `Tidak Terpisahkan (Rs = ${resolutionOctDec})`,
      statusTone: 'error',
      color: '#f43f5e',
    });
  } else {
    // Ketiga puncak terpisah menjadi 3 baris
    peaks.forEach((p) => {
      const st = getSinglePeakStatus(p);
      adaptiveTableRows.push({
        rowId: p.id,
        peakLabel: `#${p.peakNumber}`,
        compoundName: `${p.name} (${p.formula})`,
        boilingPointText: `${p.boilingPoint} °C`,
        retentionTimeText: `${p.retentionTime.toFixed(2)} dtk`,
        baseWidthText: `${p.baseWidthWb.toFixed(2)} dtk`,
        platesNText: `${p.theoreticalPlatesN}`,
        tailingFactorText: p.tailingFactorTf.toFixed(2),
        areaMvSec: p.areaMvSec,
        percentArea: p.percentArea,
        statusBadge: st.badge,
        statusTone: st.tone,
        color: p.color,
      });
    });
  }

  // Jika terjadi Degradasi Termal, tambahkan baris "Puncak Artefak (Hasil Degradasi Termal)"
  if (hasThermalDegradation && ghostPeaks.length > 0) {
    const artifactPct = Number(
      ((artifactTotalArea / rawTotalArea) * 100).toFixed(1)
    );
    adaptiveTableRows.push({
      rowId: 'thermal_artifact_row',
      peakLabel: 'Artefak',
      compoundName:
        sampleId === 'sample_c'
          ? 'Puncak Artefak (Hasil Degradasi Termal Eugenol)'
          : 'Puncak Artefak (Hasil Degradasi Termal / Pirolisis)',
      boilingPointText: 'Fragmen Volatil',
      retentionTimeText: `${ghostPeaks[0].retentionTime.toFixed(2)} & ${ghostPeaks[1].retentionTime.toFixed(2)} dtk`,
      baseWidthText: '0,48 dtk',
      platesNText: '—',
      tailingFactorText: '1,15',
      areaMvSec: Number(artifactTotalArea.toFixed(1)),
      percentArea: artifactPct,
      statusBadge: 'Artefak Dekomposisi Termal',
      statusTone: 'error',
      color: '#c084fc',
    });
  }

  // =========================================================================
  // 7. SARAN PERBAIKAN METODE SPESIFIK (DIAGNOSIS & SARAN PERBAIKAN METODE)
  // =========================================================================
  const repairAdvices: MethodRepairAdvice[] = [];

  if (hasPolarityMismatch) {
    repairAdvices.push({
      parameterName: 'Pemilihan Kolom Kapiler (Ketidakcocokan Kepolaran)',
      currentValueText: columnSpec.name,
      recommendedValueText: sampleSpec.recommendedColumnText,
      reason: isPolarInNonPolarCol
        ? `Sampel B (Alkohol Polar) tidak tertahan oleh kolom non-polar DB-5 dan mengalami adsorpsi ekor (tailing) serta menumpuk di awal (Rs < 0,8). Ganti ke kolom polar DB-WAX (PEG)!`
        : `${sampleSpec.code} bersifat Non-Polar sehingga tidak berinteraksi dengan fasa diam polar DB-WAX dan keluar menumpuk di awal (co-elution). Ganti ke kolom non-polar DB-5!`,
      tone: 'error',
    });
  }

  if (hasColumnBleeding) {
    repairAdvices.push({
      parameterName: 'Batas Suhu Maksimum Kolom (Column Bleeding!)',
      currentValueText: `Oven Maks ${maxOvenConfigured} °C pada ${columnSpec.shortName}`,
      recommendedValueText: `Turunkan Suhu Oven ≤ ${columnSpec.maxTemp} °C (atau gunakan Kolom DB-5 hingga 325 °C)`,
      reason: `Suhu oven (${maxOvenConfigured} °C) melampaui batas stabilitas termal fasa diam ${columnSpec.name} (${columnSpec.maxTemp} °C). Polimer fasa diam luruh (bleeding) dan membuat garis dasar menanjak tajam di paruh akhir kromatogram!`,
      tone: 'error',
    });
  }

  if (hasDoorThermalCollapse) {
    repairAdvices.push({
      parameterName: 'Interlock Pintu Oven Kolom',
      currentValueText: `Dibuka pada t = ${doorOpenedAtTime?.toFixed(1)} dtk`,
      recommendedValueText: 'Jaga Pintu Oven TERTUTUP Selama Analisis',
      reason:
        'Membuka pintu oven saat pemisahan berlangsung mengaktifkan Safety Thermal Interlock yang mematikan pemanas dan menjatuhkan suhu kolom ke 25 °C.',
      tone: 'error',
    });
  }

  if (hotOvenSeverity > 0.25) {
    repairAdvices.push({
      parameterName: 'Suhu Oven Kolom (Terlalu Tinggi → Co-Elution)',
      currentValueText: `${ovenStartTemp} °C → ${ovenEndTemp} °C`,
      recommendedValueText: `${guide.ovenModeText} (Awal ${guide.ovenStartRange[0]}–${guide.ovenStartRange[1]} °C, Akhir ${guide.ovenEndRange[0]}–${guide.ovenEndRange[1]} °C)`,
      reason:
        sampleId === 'sample_b'
          ? `Untuk Sampel B (Alkohol, Tb 64–97 °C), suhu oven > 140 °C membuat ketiga alkohol menguap terlalu cepat tanpa pemisahan sehingga menyatu (co-elution, Rs = ${resolutionHexOct}).`
          : `Suhu awal oven (${ovenStartTemp} °C) terlalu tinggi untuk ${sampleSpec.code}, sehingga analit tidak sempat terpartisi di fasa diam dan keluar bertumpuk di awal.`,
      tone: 'error',
    });
  } else if (hasPeakBroadening) {
    repairAdvices.push({
      parameterName: 'Suhu Oven Kolom (Terlalu Rendah → Peak Broadening)',
      currentValueText: `${ovenStartTemp} °C → ${ovenEndTemp} °C`,
      recommendedValueText: `${guide.ovenModeText} (Awal ${guide.idealOvenStart} °C → Akhir ${guide.idealOvenEnd} °C)`,
      reason: `Suhu akhir oven (${ovenEndTemp} °C) terlalu rendah untuk mengelusi senyawa bertitik didih tinggi (${sampleSpec.compounds[2].name}, Tb ${sampleSpec.compounds[2].boilingPoint} °C). Akibatnya waktu retensi sangat lama dan puncak melebar mendatar (N rendah).`,
      tone: 'warning',
    });
  }

  if (hasThermalDegradation) {
    repairAdvices.push({
      parameterName: 'Suhu Port Injektor (Terlalu Tinggi → Degradasi Termal)',
      currentValueText: `${injectorTemp} °C`,
      recommendedValueText: `${guide.injectorRange[0]}–${guide.injectorRange[1]} °C (Ideal: ${guide.idealInjector} °C)`,
      reason:
        sampleId === 'sample_c'
          ? `Eugenol (Tb 254 °C) dalam Sampel C bersifat termolabil dan terdekomposisi parah saat suhu injektor > 265 °C! Turunkan suhu injektor ke 230–255 °C.`
          : `Suhu injektor ${injectorTemp} °C terlalu panas (>${maxIdealInj + 20} °C) sehingga memicu pemutusan ikatan termal (pirolisis) dan memunculkan puncak artefak.`,
      tone: 'error',
    });
  } else if (hasInjectorTooLow) {
    repairAdvices.push({
      parameterName: 'Suhu Port Injektor (Terlalu Rendah → Peak Tailing)',
      currentValueText: `${injectorTemp} °C`,
      recommendedValueText: `${guide.injectorRange[0]}–${guide.injectorRange[1]} °C (Ideal: ${guide.idealInjector} °C)`,
      reason: `Suhu injektor (${injectorTemp} °C) kurang panas untuk menguapkan seluruh komponen ${sampleSpec.code} secara instan (flash vaporization). Penguapan lambat menyebabkan ekor puncak memanjang ke kanan (Tf > 1,8).`,
      tone: 'warning',
    });
  }

  if (hasDetectorCondensation) {
    repairAdvices.push({
      parameterName: 'Suhu Detektor FID (Terlalu Rendah → Kondensasi & Drift)',
      currentValueText: `${detectorTemp} °C (Oven Maks: ${maxOvenConfigured} °C)`,
      recommendedValueText: `${Math.max(guide.detectorRange[0], maxOvenConfigured + 25)}–${Math.max(guide.detectorRange[1], maxOvenConfigured + 40)} °C (Minimal 20–30 °C di atas Suhu Maks Oven)`,
      reason: `Suhu detektor (${detectorTemp} °C) terlalu dekat atau di bawah suhu maksimum oven (${maxOvenConfigured} °C), memicu kondensasi uap di cerobong FID yang menyebabkan baseline bergelombang dan derau kasar.`,
      tone: 'warning',
    });
  }

  const isOptimalMethod = repairAdvices.length === 0;

  return {
    sampleSpec,
    columnSpec,
    isFlatline: false,
    failureKind: 'none',
    failureTitle: null,
    failureCauseShort: null,
    failureExplanation: null,
    solventPeak: defaultSolventPeak,
    peaks,
    ghostPeaks,
    adaptiveTableRows,
    repairAdvices,
    resolutionHexOct,
    resolutionOctDec,
    isOptimalMethod,
    hasPolarityMismatch,
    hasColumnBleeding,
    hasCoElution,
    hasPeakBroadening,
    hasPeakTailing,
    hasThermalDegradation,
    hasDetectorCondensation,
    hasDoorThermalCollapse,
    bleedingSeverity,
    condensationSeverity,
    tailingSeverity,
    degradationSeverity,
  };
}

/**
 * Mengevaluasi sinyal kromatogram (mV) pada waktu `t` (detik) secara dinamis:
 * mencakup Baseline + Column Bleeding + Kondensasi Detektor + Puncak Pelarut + 3 Puncak Analit + Ghost Peaks.
 */
export function evaluateDynamicSignalAtTime(
  t: number,
  params: RunPhysicsParams
): number {
  const profile = computeChromatogramProfile(params);

  // Jika Flatline: hanya garis datar + derau elektronik sangat halus
  if (profile.isFlatline) {
    const flatNoise =
      4.2 + 0.16 * Math.sin(t * 37.0) + 0.11 * Math.cos(t * 83.0);
    return Math.max(1.0, flatNoise);
  }

  // 1. Garis Dasar (Baseline) Normal
  let baseline =
    4.5 +
    0.75 * Math.sin(t * 41.3) +
    0.5 * Math.cos(t * 93.7) +
    0.3 * Math.sin(t * 167.9);

  // 2. Efek Kerusakan Kolom (Column Bleeding) di paruh akhir kromatogram (misal DB-WAX > 240°C)
  if (profile.hasColumnBleeding && t > 3.2) {
    const bleedProgress = clamp((t - 3.2) / 6.8, 0, 1);
    const bleedRise =
      profile.bleedingSeverity *
      115 *
      Math.pow(bleedProgress, 2.15) *
      (1 + 0.06 * Math.sin(t * 29.0));
    baseline += bleedRise;
  }

  // 3. Efek Kondensasi Detektor FID (Baseline Drift bergelombang & High-Frequency Noise kasar)
  if (profile.hasDetectorCondensation) {
    const sev = profile.condensationSeverity;
    const drift =
      sev *
      (13.0 * Math.sin(t * 1.45) +
        8.2 * Math.cos(t * 2.65 - 0.7) +
        5.0 * Math.sin(t * 0.85 + 0.4) +
        10.5);
    const roughNoise =
      sev *
      (6.5 * Math.sin(t * 113.7) +
        5.2 * Math.cos(t * 179.3) +
        4.0 * Math.sin(t * 251.9));
    baseline += drift + roughNoise;
  }

  // 4. Efek Kejut Termal jika Pintu Oven dibuka di tengah analisis
  if (
    params.doorOpenedAtTime !== null &&
    params.doorOpenedAtTime > 0 &&
    t >= params.doorOpenedAtTime
  ) {
    const dtOpen = t - params.doorOpenedAtTime;
    baseline +=
      -2.2 * (1 - Math.exp(-dtOpen * 2.5)) +
      2.4 * Math.sin(dtOpen * 19.5) * Math.exp(-dtOpen * 0.4);
  }

  // 5. Puncak Pelarut (Solvent Peak) sempit di awal grafik (tR ~ 0.72 - 0.85s)
  let peakSum = 0;
  const sp = profile.solventPeak;
  if (sp.heightMv > 0) {
    const zSolvent = (t - sp.retentionTime) / sp.sigma;
    peakSum += sp.heightMv * Math.exp(-0.5 * zSolvent * zSolvent);
  }

  // 6. Kontribusi 3 Puncak Komponen Analit (Gaussian / EMG Peak Tailing)
  for (const peak of profile.peaks) {
    if (peak.retentionTime <= 0) continue;
    const shape = evaluateEMGPeakShape(
      t,
      peak.retentionTime,
      peak.sigma,
      peak.tau
    );
    peakSum += peak.heightMv * shape;
  }

  // 7. Kontribusi Puncak Artefak (Ghost Peaks) jika terjadi Degradasi Termal
  for (const ghost of profile.ghostPeaks) {
    const z = (t - ghost.retentionTime) / ghost.sigma;
    peakSum += ghost.heightMv * Math.exp(-0.5 * z * z);
  }

  return Math.max(0.8, baseline + peakSum);
}

/**
 * Menghitung posisi ternormalisasi (uCenter: 0..1) dan lebar pita (bandSpread)
 * untuk kelompok partikel molekul 3D di dalam kolom kapiler pada waktu `tSim`.
 */
export function computeParticleBandState(
  tSim: number,
  compoundIndex: number,
  params: RunPhysicsParams,
  ovenDoorCurrentlyOpen: boolean
): { uCenter: number; bandSpread: number; visible: boolean } {
  if (!params.gasValveOpen || params.gasPressure <= 5) {
    const stuckU = 0.025 + 0.015 * (1 - Math.exp(-tSim * 0.8));
    return {
      uCenter: stuckU + compoundIndex * 0.008,
      bandSpread: 0.025 + tSim * 0.006,
      visible: true,
    };
  }

  if (
    params.injectorTemp < 50 ||
    Math.max(params.ovenStartTemp, params.ovenEndTemp) < 40 ||
    params.doorOpenedAtTime === 0
  ) {
    return {
      uCenter: 0.012 + compoundIndex * 0.004,
      bandSpread: 0.018,
      visible: true,
    };
  }

  const profile = computeChromatogramProfile(params);
  const peak = profile.peaks[compoundIndex];
  if (!peak || peak.retentionTime <= 0) {
    return { uCenter: 0, bandSpread: 0.03, visible: false };
  }

  let effectiveTime = tSim;
  if (
    params.doorOpenedAtTime !== null &&
    params.doorOpenedAtTime > 0 &&
    tSim > params.doorOpenedAtTime
  ) {
    const beforeOpen = params.doorOpenedAtTime;
    const afterOpen = tSim - params.doorOpenedAtTime;
    const slowFactor = ovenDoorCurrentlyOpen ? 0.18 : 0.45;
    effectiveTime = beforeOpen + afterOpen * slowFactor;
  }

  const uCenter = effectiveTime / peak.retentionTime;
  const baseSigma =
    profile.sampleSpec.compounds[compoundIndex]?.baseSigma || 0.28;
  const sigmaRatio = peak.sigma / baseSigma;
  const tailExtra = peak.tau > 0 ? peak.tau * 0.045 : 0;
  const bandSpread =
    (0.022 + Math.min(1, uCenter) * 0.042) * sigmaRatio + tailExtra;

  return {
    uCenter,
    bandSpread,
    visible: uCenter >= 0 && uCenter <= 1.04,
  };
}
