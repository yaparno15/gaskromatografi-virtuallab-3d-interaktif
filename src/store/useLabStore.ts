import { create } from 'zustand';
import { soundEffects } from '../utils/soundEffects';
import {
  SampleId,
  ColumnId,
  OvenMode,
  RunPhysicsParams,
  SAMPLE_BOTTLE_SPECS,
  COLUMN_SPECS,
} from '../utils/chromatographyPhysics';

export type LabTheme = 'light' | 'dark';

export type SyringeState = 'empty' | 'cleaned' | 'filled' | 'injected';

export const SYRINGE_STATE_LABELS: Record<SyringeState, string> = {
  empty: 'Kosong',
  cleaned: 'Bersih (Siap Ambil)',
  filled: 'Terisi Sampel',
  injected: 'Disuntikkan',
};

export type SyringeAnimPhase =
  | 'idle'
  | 'selected'
  | 'washing_acetone'
  | 'washing_waste'
  | 'drawing_sample'
  | 'ready_to_inject'
  | 'injecting_gc';

export type SampleType = string;

export type CameraTargetId =
  | 'overview'
  | 'gas_cylinder'
  | 'gc_unit'
  | 'injection_closeup'
  | 'vials'
  | 'syringe'
  | 'monitor';

export const CAMERA_TARGET_LABELS_ID: Record<CameraTargetId, string> = {
  overview: 'Meja Lab',
  gas_cylinder: 'Tabung Gas',
  gc_unit: 'Mesin GC',
  injection_closeup: 'Port Injektor',
  vials: 'Rak 5 Botol',
  syringe: 'Suntikan Mikro',
  monitor: 'Monitor PC',
};

export const TOTAL_RUN_DURATION = 10.0; // detik

export interface PracticumStepInfo {
  step: number;
  title: string;
  shortTitle: string;
  instruction: string;
  actionHint: string;
  scientificNote: string;
  cameraTarget: CameraTargetId;
}

export const PRACTICUM_STEPS: PracticumStepInfo[] = [
  {
    step: 0,
    title: 'Persiapan Praktikum Kromatografi Gas',
    shortTitle: 'Persiapan & Orientasi Lab',
    instruction:
      'Selamat datang di Laboratorium Virtual GC-FID. Periksa Buku Data Sampel (MSDS) atau arahkan kursor ke botol sampel, lalu klik katup regulator Helium untuk memulai.',
    actionHint: 'Klik katup regulator tabung gas Helium (He).',
    scientificNote:
      'Kromatografi Gas (GC) memisahkan senyawa volatil berdasarkan titik didih dan kecocokan kepolaran fasa diam kolom kapiler.',
    cameraTarget: 'overview',
  },
  {
    step: 1,
    title: 'Langkah 1: Buka Gas Pembawa (Carrier Gas)',
    shortTitle: 'Buka Gas Pembawa (40 psi)',
    instruction:
      'Klik knob katup regulator pada tabung gas Helium (He 99.999%) di sisi kiri meja untuk mengalirkan gas pembawa hingga tekanan mencapai 40 psi.',
    actionHint: 'Klik knob bulat pada regulator tabung Helium.',
    scientificNote:
      'Gas pembawa inert (fasa gerak) mendorong uap analit melewati kolom kapiler. Tanpa gas pembawa (0 psi), elusi gagal total (flatline).',
    cameraTarget: 'gas_cylinder',
  },
  {
    step: 2,
    title: 'Langkah 2: Pilih Kolom Kapiler & Atur Suhu GC',
    shortTitle: 'Pilih Kolom & Atur Suhu GC',
    instruction:
      'Klik panel kontrol mesin GC untuk memilih Kolom Kapiler (Tab 1: DB-5 Non-Polar atau DB-WAX Polar) dan mengatur Suhu Injektor, Oven, serta Detektor FID (Tab 2) sesuai karakteristik sampel.',
    actionHint: 'Klik layar panel kontrol pada unit utama GC.',
    scientificNote:
      'Prinsip "Like Dissolves Like": Kolom DB-5 cocok untuk senyawa non-polar (Sampel A & C), sedangkan DB-WAX cocok untuk alkohol polar (Sampel B, maks 240 °C).',
    cameraTarget: 'gc_unit',
  },
  {
    step: 3,
    title: 'Langkah 3: Bilas Suntikan Mikro (Washing)',
    shortTitle: 'Bilas Suntikan dengan Aseton',
    instruction:
      'Klik Suntikan Mikro 10 µL lalu klik "Pelarut Pencuci (Aseton)" untuk membilas jarum dan membuang bilasan ke "Botol Limbah (Waste)".',
    actionHint: 'Klik Suntikan Mikro lalu klik Botol Pelarut Aseton.',
    scientificNote:
      'Pembilasan aseton menghilangkan residu dan mencegah kontaminasi silang (carryover) antar sampel yang berbeda.',
    cameraTarget: 'vials',
  },
  {
    step: 4,
    title: 'Langkah 4: Pilih & Ambil 1 µL Sampel di Meja',
    shortTitle: 'Pilih & Ambil Sampel (A / B / C)',
    instruction:
      'Klik langsung salah satu dari 3 Botol Sampel di rak meja (Sampel A: Hidrokarbon, Sampel B: Alkohol, atau Sampel C: Minyak Atsiri) untuk menyedot 1,0 µL sampel.',
    actionHint: 'Klik Botol Sampel A, B, atau C pada rak meja lab.',
    scientificNote:
      'Setelah suntikan terisi satu sampel, botol sampel lain dikunci otomatis untuk mencegah kontaminasi silang! Bilas ulang dengan Aseton jika ingin mengganti sampel.',
    cameraTarget: 'vials',
  },
  {
    step: 5,
    title: 'Langkah 5: Injeksi Sampel ke Port Injektor GC',
    shortTitle: 'Injeksi ke Port Injektor GC',
    instruction:
      'Klik "Port Injektor" di bagian kiri-atas mesin GC untuk menyuntikkan 1 µL sampel menembus septum dan memulai pemisahan kromatografi.',
    actionHint: 'Klik Port Injektor di bagian kiri-atas mesin GC.',
    scientificNote:
      'Pelarut akan keluar paling awal (Solvent Peak, tR ≈ 0,8 dtk) diikuti ketiga komponen analit sesuai titik didih dan interaksinya dengan kolom.',
    cameraTarget: 'gc_unit',
  },
  {
    step: 6,
    title: 'Langkah 6: Pemisahan Kolom & Kromatogram Dinamis',
    shortTitle: 'Pemisahan Kolom & Kromatogram',
    instruction:
      'Amati pergerakan partikel molekul melalui jendela kaca pintu oven kapiler serta pembentukan Puncak Pelarut dan 3 Puncak Analit secara real-time!',
    actionHint: 'Perhatikan resolusi puncak, bentuk ekor, dan kestabilan garis dasar.',
    scientificNote:
      'Ketidakcocokan kepolaran kolom atau suhu oven terlalu tinggi memicu co-elution; suhu oven melebihi batas kolom DB-WAX (>240 °C) memicu column bleeding.',
    cameraTarget: 'injection_closeup',
  },
  {
    step: 7,
    title: 'Langkah 7: Evaluasi Metode & Laporan Hasil',
    shortTitle: 'Evaluasi & Laporan Akhir',
    instruction:
      'Pemisahan selesai! Periksa Tabel Hasil Praktikum adaptif, baca Diagnosis & Saran Perbaikan Metode, jawab kuis, atau uji sampel lainnya.',
    actionHint: 'Klik "Diagnosis & Laporan" untuk melihat evaluasi lengkap.',
    scientificNote:
      'Kromatogram yang valid membutuhkan resolusi Rs > 1,5, faktor asimetri Tf mendekati 1,0, jumlah pelat teoritis N tinggi, dan tanpa degradasi termal.',
    cameraTarget: 'monitor',
  },
];

export interface LabWarningAlert {
  id: number;
  severity: 'error' | 'warning';
  title: string;
  message: string;
  scientificReason?: string;
  actionLabel?: string;
  actionType?:
    | 'close_oven_door'
    | 'open_gc_modal'
    | 'focus_gas'
    | 'focus_vials'
    | 'wash_syringe';
}

export interface LabState {
  // Tema ruangan lab & pengaturan suara
  labTheme: LabTheme;
  soundMuted: boolean;

  // Status utama praktikum
  currentStep: number; // 0 s/d 7
  gasValveOpen: boolean;
  gasPressure: number; // psi
  injectorTemp: number; // °C
  ovenTemp: number; // °C
  detectorTemp: number; // °C
  syringeState: SyringeState;

  // Sampel Fisik di Meja & Kolom Kapiler di GC
  selectedSampleId: SampleId;
  filledSampleId: SampleId | null;
  hoveredSampleId: SampleId | null;
  msdsModalOpen: boolean;
  selectedColumnId: ColumnId;

  isRunning: boolean;

  // Pengaturan Suhu & Mode Oven Dinamis
  ovenMode: OvenMode;
  targetInjectorTemp: number;
  targetOvenTemp: number;
  ovenRampMaxTemp: number;
  targetDetectorTemp: number;
  isConditioning: boolean;
  isConditioned: boolean;
  gcModalOpen: boolean;

  // Status Pintu Oven & Safety Thermal Interlock
  ovenDoorOpen: boolean;

  // Snapshot parameter fisika pada saat injeksi/run berjalan
  activeRunParams: RunPhysicsParams | null;

  // Sistem Peringatan / Interlock Laboratorium
  labWarning: LabWarningAlert | null;

  syringeSelected: boolean;
  syringeAnimPhase: SyringeAnimPhase;

  runElapsed: number;
  runCompleted: boolean;
  chartExpanded: boolean;
  reportModalOpen: boolean;

  activeCameraTarget: CameraTargetId;
  cameraResetCount: number;

  // Actions
  setLabTheme: (theme: LabTheme) => void;
  toggleLabTheme: () => void;
  setSoundMuted: (muted: boolean) => void;
  toggleSoundMuted: () => void;

  showLabWarning: (warning: Omit<LabWarningAlert, 'id'>) => void;
  dismissLabWarning: () => void;

  setHoveredSampleId: (id: SampleId | null) => void;
  setMsdsModalOpen: (open: boolean) => void;
  setSelectedColumnId: (colId: ColumnId) => void;

  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setGasValveOpen: (open: boolean) => void;
  setGasPressure: (pressure: number) => void;
  setInjectorTemp: (temp: number) => void;
  setOvenTemp: (temp: number) => void;
  setDetectorTemp: (temp: number) => void;
  setOvenMode: (mode: OvenMode) => void;
  setTargetTemperatures: (
    inj: number,
    oven: number,
    rampMax: number,
    det: number,
    mode?: OvenMode,
    colId?: ColumnId
  ) => void;
  setIsConditioning: (cond: boolean) => void;
  setIsConditioned: (done: boolean) => void;
  setGcModalOpen: (open: boolean) => void;

  setOvenDoorOpen: (open: boolean) => void;
  toggleOvenDoor: () => void;

  setSyringeState: (state: SyringeState) => void;
  setSyringeSelected: (selected: boolean) => void;
  setSyringeAnimPhase: (phase: SyringeAnimPhase) => void;

  // Validated workflow actions (Interlock Praktikum & Anti-Kontaminasi)
  attemptWashSyringe: () => void;
  attemptDrawSample: (targetSampleId?: SampleId) => boolean;
  attemptInjectGC: () => boolean;

  setIsRunning: (running: boolean) => void;
  setRunElapsed: (elapsed: number) => void;
  setRunCompleted: (completed: boolean) => void;
  setChartExpanded: (expanded: boolean) => void;
  setReportModalOpen: (open: boolean) => void;
  startSeparationRun: () => void;
  setActiveCameraTarget: (target: CameraTargetId) => void;
  resetCamera: () => void;
  resetLab: () => void;
}

const INITIAL_STATE = {
  labTheme: 'light' as LabTheme,
  soundMuted: false,
  currentStep: 1,
  gasValveOpen: false,
  gasPressure: 0,
  injectorTemp: 25,
  ovenTemp: 25,
  detectorTemp: 25,
  selectedSampleId: 'sample_a' as SampleId,
  filledSampleId: null as SampleId | null,
  hoveredSampleId: null as SampleId | null,
  msdsModalOpen: false,
  selectedColumnId: 'db5' as ColumnId,
  ovenMode: 'temperature_program' as OvenMode,
  targetInjectorTemp: 240,
  targetOvenTemp: 60,
  ovenRampMaxTemp: 200,
  targetDetectorTemp: 280,
  isConditioning: false,
  isConditioned: false,
  gcModalOpen: false,
  ovenDoorOpen: false,
  activeRunParams: null as RunPhysicsParams | null,
  labWarning: null as LabWarningAlert | null,
  syringeState: 'empty' as SyringeState,
  syringeSelected: false,
  syringeAnimPhase: 'idle' as SyringeAnimPhase,
  isRunning: false,
  runElapsed: 0,
  runCompleted: false,
  chartExpanded: false,
  reportModalOpen: false,
  activeCameraTarget: 'gas_cylinder' as CameraTargetId,
  cameraResetCount: 0,
};

export const useLabStore = create<LabState>((set, get) => ({
  ...INITIAL_STATE,

  setLabTheme: (labTheme) => {
    soundEffects.playUiClick();
    set({ labTheme });
  },

  toggleLabTheme: () =>
    set((state) => {
      soundEffects.playUiClick();
      return { labTheme: state.labTheme === 'light' ? 'dark' : 'light' };
    }),

  setSoundMuted: (soundMuted) => {
    soundEffects.setMuted(soundMuted);
    set({ soundMuted });
  },

  toggleSoundMuted: () =>
    set((state) => {
      const next = !state.soundMuted;
      soundEffects.setMuted(next);
      if (!next) {
        soundEffects.playUiClick();
      }
      return { soundMuted: next };
    }),

  showLabWarning: (warning) => {
    soundEffects.playWarningBeep();
    set({
      labWarning: {
        ...warning,
        id: Date.now(),
      },
    });
  },

  dismissLabWarning: () => {
    soundEffects.playUiClick();
    set({ labWarning: null });
  },

  setHoveredSampleId: (hoveredSampleId) => set({ hoveredSampleId }),

  setMsdsModalOpen: (msdsModalOpen) => {
    soundEffects.playUiClick();
    set({ msdsModalOpen });
  },

  setSelectedColumnId: (selectedColumnId) => {
    soundEffects.playUiClick();
    set({ selectedColumnId });
  },

  setCurrentStep: (step) =>
    set((state) => {
      soundEffects.playUiClick();
      const clamped = Math.max(0, Math.min(7, step));
      const target =
        PRACTICUM_STEPS[clamped]?.cameraTarget ?? state.activeCameraTarget;
      return {
        currentStep: clamped,
        activeCameraTarget: target,
      };
    }),

  nextStep: () =>
    set((state) => {
      soundEffects.playUiClick();
      const next = Math.min(7, state.currentStep + 1);
      const target =
        PRACTICUM_STEPS[next]?.cameraTarget ?? state.activeCameraTarget;
      return {
        currentStep: next,
        activeCameraTarget: target,
      };
    }),

  prevStep: () =>
    set((state) => {
      soundEffects.playUiClick();
      const prev = Math.max(0, state.currentStep - 1);
      const target =
        PRACTICUM_STEPS[prev]?.cameraTarget ?? state.activeCameraTarget;
      return {
        currentStep: prev,
        activeCameraTarget: target,
      };
    }),

  setGasValveOpen: (open) => {
    if (open) {
      soundEffects.playGasValveOpen();
    } else {
      soundEffects.playUiClick();
    }
    set({ gasValveOpen: open });
  },

  setGasPressure: (pressure) => set({ gasPressure: pressure }),
  setInjectorTemp: (temp) => set({ injectorTemp: temp }),
  setOvenTemp: (temp) => set({ ovenTemp: temp }),
  setDetectorTemp: (temp) => set({ detectorTemp: temp }),
  setOvenMode: (ovenMode) => set({ ovenMode }),

  setTargetTemperatures: (inj, oven, rampMax, det, mode, colId) =>
    set((state) => ({
      targetInjectorTemp: inj,
      targetOvenTemp: oven,
      ovenRampMaxTemp: rampMax,
      targetDetectorTemp: det,
      ovenMode: mode ?? state.ovenMode,
      selectedColumnId: colId ?? state.selectedColumnId,
    })),

  setIsConditioning: (isConditioning) => {
    const state = get();
    if (isConditioning && state.ovenDoorOpen) {
      soundEffects.playWarningBeep();
      set({
        isConditioning: false,
        labWarning: {
          id: Date.now(),
          severity: 'error',
          title: 'PERINGATAN INTERLOCK OVEN',
          message:
            'PERINGATAN INTERLOCK OVEN: Pintu oven kolom sedang terbuka! Pemanas dinonaktifkan otomatis karena panas lepas ke lingkungan. Tutup pintu oven terlebih dahulu untuk menstabilkan suhu kolom.',
          scientificReason:
            'Sistem keselamatan GC (Safety Thermal Interlock) memutus arus elemen pemanas saat pintu terbuka agar koil pemanas tidak terbakar dan menjaga kestabilan termodinamika kolom kapiler.',
          actionLabel: 'Tutup Pintu Oven Sekarang',
          actionType: 'close_oven_door',
        },
      });
      return;
    }

    if (isConditioning) {
      soundEffects.playGCHeatingStart();
    }
    set({ isConditioning });
  },

  setIsConditioned: (isConditioned) => set({ isConditioned }),

  setGcModalOpen: (gcModalOpen) => {
    soundEffects.playUiClick();
    set({ gcModalOpen });
  },

  setOvenDoorOpen: (open) => {
    const state = get();
    soundEffects.playOvenDoorToggle(open);

    if (open) {
      const updatedRunParams =
        state.isRunning && state.activeRunParams
          ? {
              ...state.activeRunParams,
              doorOpenedAtTime:
                state.activeRunParams.doorOpenedAtTime ?? state.runElapsed,
            }
          : state.activeRunParams;

      const shouldWarn =
        state.isConditioning || state.isRunning || state.ovenTemp > 35;

      if (shouldWarn) {
        soundEffects.playWarningBeep();
      }

      set({
        ovenDoorOpen: true,
        isConditioning: false,
        isConditioned: false,
        activeRunParams: updatedRunParams,
        labWarning: shouldWarn
          ? {
              id: Date.now(),
              severity: 'error',
              title: 'PERINGATAN INTERLOCK OVEN (PINTU TERBUKA)',
              message:
                'PERINGATAN INTERLOCK OVEN: Pintu oven kolom sedang terbuka! Pemanas dinonaktifkan otomatis karena panas lepas ke lingkungan. Tutup pintu oven terlebih dahulu untuk menstabilkan suhu kolom.',
              scientificReason: state.isRunning
                ? 'Membuka pintu oven di tengah proses elusi membuat suhu kolom anjlok drastis ke 25 °C! Tekanan uap analit langsung turun, pergerakan partikel di dalam kolom macet, dan puncak kromatogram melebar ekstrem.'
                : 'Saat pintu terbuka, konveksi udara ruang (25 °C) mendinginkan kolom kapiler dengan cepat sehingga gradien suhu tidak dapat dipertahankan.',
              actionLabel: 'Tutup Pintu Oven Sekarang',
              actionType: 'close_oven_door',
            }
          : state.labWarning,
      });
    } else {
      set({
        ovenDoorOpen: false,
        labWarning:
          state.labWarning?.actionType === 'close_oven_door'
            ? null
            : state.labWarning,
      });
    }
  },

  toggleOvenDoor: () => {
    const state = get();
    state.setOvenDoorOpen(!state.ovenDoorOpen);
  },

  setSyringeState: (syringeState) => set({ syringeState }),

  setSyringeSelected: (syringeSelected) => {
    if (syringeSelected) {
      soundEffects.playUiClick();
    }
    set({ syringeSelected });
  },

  setSyringeAnimPhase: (syringeAnimPhase) => {
    if (syringeAnimPhase === 'washing_acetone') {
      soundEffects.playSyringeWashSequence();
    } else if (syringeAnimPhase === 'drawing_sample') {
      soundEffects.playSyringeSampleUptakeSequence();
    } else if (syringeAnimPhase === 'injecting_gc') {
      soundEffects.playGCInjectionSequence();
    }
    set({ syringeAnimPhase });
  },

  /**
   * Membilas suntikan mikro dengan Pelarut Aseton (juga membuang sampel jika ingin ganti sampel)
   */
  attemptWashSyringe: () => {
    set({
      activeCameraTarget: 'vials',
      syringeSelected: true,
      filledSampleId: null,
      syringeAnimPhase: 'washing_acetone',
      labWarning: null,
    });
    soundEffects.playSyringeWashSequence();
  },

  /**
   * Mengambil 1,0 µL sampel dari salah satu dari 3 botol sampel fisik di meja (Sampel A, B, atau C)
   * Lengkap dengan Kunci Anti-Kontaminasi Silang!
   */
  attemptDrawSample: (targetSampleId) => {
    const state = get();
    const chosenId: SampleId = targetSampleId ?? state.selectedSampleId;
    const chosenSpec = SAMPLE_BOTTLE_SPECS[chosenId];

    // 1. CEK KUNCI ANTI-KONTAMINASI SILANG: Jika suntikan sudah terisi sampel!
    if (state.syringeState === 'filled' && state.filledSampleId) {
      const currentFilledSpec = SAMPLE_BOTTLE_SPECS[state.filledSampleId];
      soundEffects.playWarningBeep();

      if (state.filledSampleId !== chosenId) {
        set({
          activeCameraTarget: 'vials',
          labWarning: {
            id: Date.now(),
            severity: 'error',
            title: 'PERINGATAN KONTAMINASI SILANG!',
            message: `PERINGATAN KONTAMINASI SILANG: Suntikan mikro sudah berisi ${currentFilledSpec.code} (${currentFilledSpec.shortTitle})! Anda tidak boleh mencampur sampel berbeda di dalam satu suntikan. Jika ingin mengganti sampel ke ${chosenSpec.code}, klik 'Pelarut Pencuci (Aseton)' untuk membuang dan membilas ulang suntikan terlebih dahulu.`,
            scientificReason:
              'Menyedot sampel kedua tanpa membilas spuit dengan pelarut pencuci akan mencemari botol sampel murni dan menghasilkan puncak campuran palsu (cross-contamination).',
            actionLabel: 'Bilas Ulang dengan Aseton Sekarang',
            actionType: 'wash_syringe',
          },
        });
      } else {
        set({
          activeCameraTarget: 'vials',
          labWarning: {
            id: Date.now(),
            severity: 'warning',
            title: `Suntikan Sudah Berisi ${currentFilledSpec.code}`,
            message: `Suntikan mikro sudah terisi 1,0 µL ${currentFilledSpec.shortTitle}. Silakan langsung klik Port Injektor GC pada Langkah 5, atau klik 'Pelarut Pencuci (Aseton)' jika ingin membuang dan mengganti sampel.`,
            actionLabel: 'Bilas Ulang dengan Aseton',
            actionType: 'wash_syringe',
          },
        });
      }
      return false;
    }

    // 2. CEK APAKAH SUNTIKAN SUDAH DIBILAS ASETON
    if (state.syringeState !== 'cleaned') {
      soundEffects.playWarningBeep();
      set({
        activeCameraTarget: 'vials',
        labWarning: {
          id: Date.now(),
          severity: 'warning',
          title: 'Suntikan Mikro Belum Dibilas Aseton!',
          message:
            'Prosedur Ditolak! Anda TIDAK BISA mengambil sampel dari botol vial sebelum membilas suntikan mikro dengan Pelarut Pencuci (Aseton) pada Langkah 3.',
          scientificReason:
            'Jarum suntik mikro yang belum dibilas pelarut aseton mengandung sisa pengotor/residu yang akan mencemari botol sampel dan menimbulkan puncak pengotor (carryover).',
          actionLabel: 'Bilas dengan Aseton Sekarang',
          actionType: 'wash_syringe',
        },
      });
      return false;
    }

    // 3. VALID: Sedot 1,0 µL dari botol sampel yang dipilih
    set({
      activeCameraTarget: 'vials',
      selectedSampleId: chosenId,
      filledSampleId: chosenId,
      syringeSelected: true,
      syringeAnimPhase: 'drawing_sample',
      labWarning: null,
    });
    soundEffects.playSyringeSampleUptakeSequence();
    return true;
  },

  attemptInjectGC: () => {
    const state = get();

    // 1. Cek Interlock Pintu Oven Terbuka
    if (state.ovenDoorOpen) {
      soundEffects.playWarningBeep();
      set({
        activeCameraTarget: 'gc_unit',
        labWarning: {
          id: Date.now(),
          severity: 'error',
          title: 'PERINGATAN INTERLOCK OVEN',
          message:
            'PERINGATAN INTERLOCK OVEN: Pintu oven kolom sedang terbuka! Pemanas dinonaktifkan otomatis karena panas lepas ke lingkungan. Tutup pintu oven terlebih dahulu untuk menstabilkan suhu kolom.',
          scientificReason:
            'Injeksi tidak dapat dilakukan saat pintu oven terbuka karena sistem Safety Thermal Interlock memutus pemanas kolom.',
          actionLabel: 'Tutup Pintu Oven Sekarang',
          actionType: 'close_oven_door',
        },
      });
      return false;
    }

    // 2. Cek Validasi Urutan Suntikan Mikro (Harus sudah dibilas & terisi sampel)
    if (state.syringeState !== 'filled' || !state.filledSampleId) {
      soundEffects.playWarningBeep();
      set({
        labWarning: {
          id: Date.now(),
          severity: 'warning',
          title: 'Suntikan Mikro Masih Kosong!',
          message:
            state.syringeState === 'empty'
              ? 'Suntikan Mikro Masih Kosong! Anda belum membilas suntikan dengan Aseton (Langkah 3) dan belum mengambil sampel dari botol vial di meja (Langkah 4).'
              : 'Suntikan Mikro Masih Kosong! Anda sudah membilas suntikan dengan Aseton, tetapi belum mengklik Botol Sampel A, B, atau C di meja untuk mengambil 1,0 µL sampel (Langkah 4).',
          scientificReason:
            'Menyuntikkan spuit kosong (udara) ke dalam Port Injektor GC tidak akan memasukkan molekul analit apa pun ke dalam kolom kapiler.',
          actionLabel: 'Ke Rak Botol Sampel',
          actionType: 'focus_vials',
        },
      });
      return false;
    }

    set({
      activeCameraTarget: 'injection_closeup',
      syringeAnimPhase: 'injecting_gc',
    });
    soundEffects.playGCInjectionSequence();
    return true;
  },

  setIsRunning: (isRunning) => set({ isRunning }),
  setRunElapsed: (runElapsed) => set({ runElapsed }),
  setRunCompleted: (runCompleted) => set({ runCompleted }),

  setChartExpanded: (chartExpanded) => {
    soundEffects.playUiClick();
    set({ chartExpanded });
  },

  setReportModalOpen: (reportModalOpen) => {
    soundEffects.playUiClick();
    set({ reportModalOpen });
  },

  startSeparationRun: () => {
    const state = get();

    // Cek Interlock Pintu Oven Terbuka
    if (state.ovenDoorOpen) {
      soundEffects.playWarningBeep();
      set({
        labWarning: {
          id: Date.now(),
          severity: 'error',
          title: 'PERINGATAN INTERLOCK OVEN',
          message:
            'PERINGATAN INTERLOCK OVEN: Pintu oven kolom sedang terbuka! Pemanas dinonaktifkan otomatis karena panas lepas ke lingkungan. Tutup pintu oven terlebih dahulu untuk menstabilkan suhu kolom.',
          actionLabel: 'Tutup Pintu Oven Sekarang',
          actionType: 'close_oven_door',
        },
      });
      return;
    }

    // Jika belum pernah mengisi sampel, jalankan validasi injeksi
    if (
      state.syringeState !== 'filled' &&
      state.syringeState !== 'injected' &&
      state.syringeAnimPhase !== 'injecting_gc'
    ) {
      state.attemptInjectGC();
      return;
    }

    const effectiveOvenStart =
      state.ovenTemp >= 38 ? state.targetOvenTemp : state.ovenTemp;
    const effectiveOvenEnd =
      state.ovenTemp >= 38 ? state.ovenRampMaxTemp : state.ovenTemp;
    const activeSampleId = state.filledSampleId ?? state.selectedSampleId;

    const runSnapshot: RunPhysicsParams = {
      sampleId: activeSampleId,
      columnId: state.selectedColumnId,
      gasValveOpen: state.gasValveOpen,
      gasPressure: state.gasPressure,
      injectorTemp: state.injectorTemp,
      ovenMode: state.ovenMode,
      ovenStartTemp: effectiveOvenStart,
      ovenEndTemp: effectiveOvenEnd,
      detectorTemp: state.detectorTemp,
      doorOpenedAtTime: state.ovenDoorOpen ? 0 : null,
    };

    const colSpec = COLUMN_SPECS[state.selectedColumnId];
    let warningAlert: LabWarningAlert | null = null;

    if (!state.gasValveOpen || state.gasPressure <= 5) {
      soundEffects.playWarningBeep();
      warningAlert = {
        id: Date.now(),
        severity: 'error',
        title: 'GAGAL ELUSI: Katup Gas Pembawa Tertutup (0 psi)',
        message:
          'GAGAL ELUSI: Katup Gas Pembawa (Helium) masih tertutup (0 psi). Tanpa aliran fasa gerak, uap sampel tertahan di injektor/awal kolom dan tidak pernah terdorong menuju detektor!',
        scientificReason:
          'Grafik kromatogram hanya menampilkan GARIS DATAR (FLATLINE) karena fasa gerak tidak mengalir membawa analit ke detektor FID.',
        actionLabel: 'Lihat Tabung Gas Helium',
        actionType: 'focus_gas',
      };
    } else if (state.injectorTemp < 50 || effectiveOvenStart < 40) {
      soundEffects.playWarningBeep();
      warningAlert = {
        id: Date.now(),
        severity: 'error',
        title: 'GAGAL VAPORISASI: Mesin GC Masih Dingin (25 °C)',
        message:
          'GAGAL VAPORISASI: Mesin GC belum dipanaskan (masih suhu ruang 25°C). Sampel cair mengendap di injektor dan tidak menguap ke kolom!',
        scientificReason:
          'Grafik kromatogram hanya menampilkan GARIS DATAR (FLATLINE) karena suhu injektor/oven berada di bawah titik didih analit.',
        actionLabel: 'Atur & Panaskan Suhu GC',
        actionType: 'open_gc_modal',
      };
    } else if (Math.max(effectiveOvenStart, effectiveOvenEnd) > colSpec.maxTemp) {
      soundEffects.playWarningBeep();
      warningAlert = {
        id: Date.now(),
        severity: 'error',
        title: `PERINGATAN KERUSAKAN KOLOM (COLUMN BLEEDING > ${colSpec.maxTemp} °C)!`,
        message: `Suhu oven (${Math.max(
          effectiveOvenStart,
          effectiveOvenEnd
        )} °C) melampaui batas suhu maksimum ${colSpec.name} (${
          colSpec.maxTemp
        } °C)! Fasa diam polimer mengalami peluruhan termal (column bleeding) yang menyebabkan garis dasar menanjak drastis di paruh akhir kromatogram.`,
        actionLabel: 'Buka Pengaturan Kolom & Suhu',
        actionType: 'open_gc_modal',
      };
    } else {
      soundEffects.playUiClick();
    }

    set({
      selectedSampleId: activeSampleId,
      syringeState: 'injected',
      syringeSelected: false,
      syringeAnimPhase: 'idle',
      activeRunParams: runSnapshot,
      labWarning: warningAlert ?? state.labWarning,
      runElapsed: 0,
      runCompleted: false,
      isRunning: true,
      currentStep: 6,
      activeCameraTarget: 'injection_closeup',
    });
  },

  setActiveCameraTarget: (target) =>
    set((state) => {
      soundEffects.playCameraFocus();
      return {
        activeCameraTarget: target,
        cameraResetCount: state.cameraResetCount + 1,
      };
    }),

  resetCamera: () =>
    set((state) => {
      soundEffects.playCameraFocus();
      return {
        activeCameraTarget: 'overview',
        cameraResetCount: state.cameraResetCount + 1,
      };
    }),

  resetLab: () =>
    set((state) => {
      soundEffects.clearScheduled();
      soundEffects.playUiClick();
      return {
        ...INITIAL_STATE,
        labTheme: state.labTheme,
        soundMuted: state.soundMuted,
        cameraResetCount: state.cameraResetCount + 1,
      };
    }),
}));
