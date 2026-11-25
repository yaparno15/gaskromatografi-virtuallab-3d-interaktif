import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  RotateCcw,
  FlaskConical,
  Gauge,
  Thermometer,
  Syringe,
  Play,
  ChevronRight,
  ChevronLeft,
  Compass,
  Sparkles,
  Eye,
  EyeOff,
  Flame,
  Wind,
  Sliders,
  X,
  Activity,
  Award,
  FileText,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  AlertTriangle,
  ShieldAlert,
  Lock,
  Unlock,
  Stethoscope,
  BookOpen,
  Layers,
  Wrench,
  ArrowLeft,
} from 'lucide-react';
import {
  useLabStore,
  PRACTICUM_STEPS,
  CameraTargetId,
  SYRINGE_STATE_LABELS,
  CAMERA_TARGET_LABELS_ID,
} from '../store/useLabStore';
import {
  SampleId,
  ColumnId,
  OvenMode,
  OVEN_MODE_INFO,
  COLUMN_SPECS,
  SAMPLE_BOTTLE_SPECS,
  RunPhysicsParams,
  computeChromatogramProfile,
} from '../utils/chromatographyPhysics';
import { CAMERA_PRESETS } from './LabScene';
import { ChromatogramChart } from './ChromatogramChart';

const CAMERA_TARGETS: { id: CameraTargetId; shortLabel: string }[] = [
  { id: 'overview', shortLabel: 'Meja Lab' },
  { id: 'gas_cylinder', shortLabel: 'Tabung Gas' },
  { id: 'vials', shortLabel: 'Rak 5 Botol' },
  { id: 'gc_unit', shortLabel: 'Mesin GC' },
  { id: 'injection_closeup', shortLabel: 'Injektor & Oven' },
  { id: 'monitor', shortLabel: 'Monitor PC' },
];

export const LabHUD: React.FC = () => {
  const {
    labTheme,
    soundMuted,
    currentStep,
    gasValveOpen,
    gasPressure,
    injectorTemp,
    ovenTemp,
    detectorTemp,
    selectedSampleId,
    filledSampleId,
    hoveredSampleId,
    msdsModalOpen,
    selectedColumnId,
    ovenMode,
    targetInjectorTemp,
    targetOvenTemp,
    ovenRampMaxTemp,
    targetDetectorTemp,
    isConditioning,
    isConditioned,
    gcModalOpen,
    ovenDoorOpen,
    activeRunParams,
    labWarning,
    syringeState,
    syringeSelected,
    syringeAnimPhase,
    isRunning,
    runElapsed,
    runCompleted,
    chartExpanded,
    reportModalOpen,
    activeCameraTarget,
    toggleLabTheme,
    toggleSoundMuted,
    dismissLabWarning,
    setMsdsModalOpen,
    setCurrentStep,
    nextStep,
    prevStep,
    setGasValveOpen,
    setTargetTemperatures,
    setIsConditioning,
    setGcModalOpen,
    setOvenDoorOpen,
    toggleOvenDoor,
    setSyringeSelected,
    setSyringeAnimPhase,
    attemptWashSyringe,
    attemptDrawSample,
    attemptInjectGC,
    setChartExpanded,
    setReportModalOpen,
    startSeparationRun,
    setActiveCameraTarget,
    resetCamera,
    resetLab,
  } = useLabStore();

  const [gcModalTab, setGcModalTab] = useState<'column' | 'temperature'>(
    'column'
  );
  const [formColumnId, setFormColumnId] = useState<ColumnId>(selectedColumnId);
  const [formOvenMode, setFormOvenMode] = useState<OvenMode>(ovenMode);
  const [formInjTemp, setFormInjTemp] = useState(targetInjectorTemp);
  const [formOvenTemp, setFormOvenTemp] = useState(targetOvenTemp);
  const [formRampMax, setFormRampMax] = useState(ovenRampMaxTemp);
  const [formDetTemp, setFormDetTemp] = useState(targetDetectorTemp);
  const [showFloatingChart, setShowFloatingChart] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [allMenusHidden, setAllMenusHidden] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(
    null
  );

  const prevIsRunningRef = useRef(isRunning);
  const prevRunCompletedRef = useRef(runCompleted);
  const prevStepRef = useRef(currentStep);

  // Buka grafik 2D otomatis saat run dimulai, selesai, atau memasuki langkah 6+,
  // namun tetap bisa ditutup kapan saja lewat tombol tutup atau tombol Grafik 2D.
  useEffect(() => {
    const wasRunning = prevIsRunningRef.current;
    const wasCompleted = prevRunCompletedRef.current;
    const prevStep = prevStepRef.current;

    if ((!wasRunning && isRunning) || (!wasCompleted && runCompleted)) {
      setShowFloatingChart(true);
    } else if (prevStep < 6 && currentStep >= 6) {
      setShowFloatingChart(true);
    }

    prevIsRunningRef.current = isRunning;
    prevRunCompletedRef.current = runCompleted;
    prevStepRef.current = currentStep;
  }, [isRunning, runCompleted, currentStep]);

  // Sinkronkan nilai form saat modal GC dibuka
  useEffect(() => {
    if (gcModalOpen) {
      setFormColumnId(selectedColumnId);
      setFormOvenMode(ovenMode);
      setFormInjTemp(targetInjectorTemp);
      setFormOvenTemp(targetOvenTemp);
      setFormRampMax(ovenRampMaxTemp);
      setFormDetTemp(targetDetectorTemp);
    }
  }, [
    gcModalOpen,
    selectedColumnId,
    ovenMode,
    targetInjectorTemp,
    targetOvenTemp,
    ovenRampMaxTemp,
    targetDetectorTemp,
  ]);

  const isLight = labTheme === 'light';
  const activeStepData = PRACTICUM_STEPS[currentStep] ?? PRACTICUM_STEPS[1];
  const workflowSteps = PRACTICUM_STEPS.slice(1);
  const completedCount = Math.max(0, currentStep - 1);
  const progressPercent = Math.round(
    (completedCount / Math.max(1, workflowSteps.length - 1)) * 100
  );

  const effectiveParams: RunPhysicsParams = useMemo(() => {
    if ((isRunning || runCompleted) && activeRunParams) {
      return activeRunParams;
    }
    return {
      sampleId: filledSampleId ?? selectedSampleId,
      columnId: selectedColumnId,
      gasValveOpen,
      gasPressure,
      injectorTemp,
      ovenMode,
      ovenStartTemp: ovenTemp >= 38 ? targetOvenTemp : ovenTemp,
      ovenEndTemp: ovenTemp >= 38 ? ovenRampMaxTemp : ovenTemp,
      detectorTemp,
      doorOpenedAtTime: ovenDoorOpen ? 0 : null,
    };
  }, [
    isRunning,
    runCompleted,
    activeRunParams,
    filledSampleId,
    selectedSampleId,
    selectedColumnId,
    gasValveOpen,
    gasPressure,
    injectorTemp,
    ovenMode,
    ovenTemp,
    targetOvenTemp,
    ovenRampMaxTemp,
    detectorTemp,
    ovenDoorOpen,
  ]);

  const activeProfile = useMemo(
    () => computeChromatogramProfile(effectiveParams),
    [effectiveParams]
  );

  const activeSampleSpec = activeProfile.sampleSpec;
  const activeColumnSpec = activeProfile.columnSpec;
  const hoveredSampleSpec = hoveredSampleId
    ? SAMPLE_BOTTLE_SPECS[hoveredSampleId]
    : null;

  // Opsi Kuis Dinamis sesuai sampel yang dianalisis
  const quizOptions = useMemo(() => {
    const c1 = activeSampleSpec.compounds[0];
    const c2 = activeSampleSpec.compounds[1];
    const c3 = activeSampleSpec.compounds[2];
    return [
      {
        id: 'first_correct',
        label: `${c1.name} (${c1.formula}, Tb = ${c1.boilingPoint} °C) — Memiliki titik didih paling rendah di antara komponen analit sehingga tekanan uapnya paling tinggi dan terelusi paling awal setelah puncak pelarut.`,
        isCorrect: true,
        explanation: `Benar! Pada ${activeSampleSpec.shortTitle}, ${c1.name} memiliki titik didih paling rendah (${c1.boilingPoint} °C) sehingga paling mudah menguap ke fasa gerak Helium dan keluar lebih dulu dibanding ${c2.name} (${c2.boilingPoint} °C) maupun ${c3.name} (${c3.boilingPoint} °C).`,
      },
      {
        id: 'second_wrong',
        label: `${c2.name} (${c2.formula}, Tb = ${c2.boilingPoint} °C) — Memiliki kepolaran menengah sehingga tidak tertahan oleh kolom.`,
        isCorrect: false,
        explanation: `Kurang tepat. ${c2.name} (Tb = ${c2.boilingPoint} °C) keluar pada urutan kedua setelah ${c1.name}.`,
      },
      {
        id: 'third_wrong',
        label: `${c3.name} (${c3.formula}, Tb = ${c3.boilingPoint} °C) — Titik didih paling tinggi membuatnya terdorong keluar paling cepat.`,
        isCorrect: false,
        explanation: `Kurang tepat. Senyawa bertitik didih paling tinggi seperti ${c3.name} (${c3.boilingPoint} °C) tertahan paling lama oleh fasa diam kolom dan terelusi paling akhir.`,
      },
    ];
  }, [activeSampleSpec]);

  const selectedQuizData = quizOptions.find((o) => o.id === selectedQuizOption);

  const handleSelectOvenPreset = (mode: OvenMode) => {
    setFormOvenMode(mode);
    const info = OVEN_MODE_INFO[mode];
    setFormOvenTemp(info.defaultStartTemp);
    setFormRampMax(info.defaultEndTemp);
  };

  const handleApplyConditioning = (e: React.FormEvent) => {
    e.preventDefault();
    setTargetTemperatures(
      formInjTemp,
      formOvenTemp,
      formRampMax,
      formDetTemp,
      formOvenMode,
      formColumnId
    );
    if (ovenDoorOpen) {
      setIsConditioning(true);
      return;
    }
    setGcModalOpen(false);
    setIsConditioning(true);
    setActiveCameraTarget('gc_unit');
  };

  const handleWarningAction = () => {
    if (!labWarning) return;
    const type = labWarning.actionType;
    dismissLabWarning();
    if (type === 'close_oven_door') {
      setOvenDoorOpen(false);
    } else if (type === 'open_gc_modal') {
      setActiveCameraTarget('gc_unit');
      setGcModalOpen(true);
    } else if (type === 'focus_gas') {
      setActiveCameraTarget('gas_cylinder');
    } else if (type === 'focus_vials') {
      setActiveCameraTarget('vials');
    } else if (type === 'wash_syringe') {
      attemptWashSyringe();
    }
  };

  const handleFixFailedRun = () => {
    setReportModalOpen(false);
    if (activeProfile.failureKind === 'no_carrier_gas') {
      setCurrentStep(1);
      setActiveCameraTarget('gas_cylinder');
    } else if (activeProfile.failureKind === 'oven_door_open_start') {
      setOvenDoorOpen(false);
      setActiveCameraTarget('gc_unit');
      setGcModalOpen(true);
    } else {
      setCurrentStep(2);
      setActiveCameraTarget('gc_unit');
      setGcModalOpen(true);
    }
  };

  const handleRestartPracticum = () => {
    setSelectedQuizOption(null);
    setShowFloatingChart(false);
    setChartExpanded(false);
    setAllMenusHidden(false);
    resetLab();
  };

  const shouldShow2DChart = showFloatingChart || chartExpanded;

  const hudCardClass = isLight
    ? 'border-slate-700/80 bg-slate-900/95 shadow-2xl ring-1 ring-slate-950/20'
    : 'border-slate-800/90 bg-slate-900/90 shadow-2xl';

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col justify-between p-2.5 md:p-3.5">
      {/* TOMBOL TAMPILKAN MENU (Muncul saat seluruh HUD disembunyikan) */}
      <AnimatePresence>
        {allMenusHidden && (
          <motion.button
            key="restore-hud-btn"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={() => setAllMenusHidden(false)}
            title="Tampilkan kembali navbar, panduan, dan kontrol lab"
            className={`pointer-events-auto fixed right-3 top-3 z-50 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold text-sky-300 backdrop-blur-md transition hover:border-sky-400 hover:bg-slate-800 hover:text-white active:scale-95 ${hudCardClass}`}
          >
            <Eye className="h-3.5 w-3.5 text-sky-400" />
            <span>Tampilkan Menu</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* BAR ATAS: Navbar Tunggal Ramping (Tetap di atas & tidak menumpuk di kanan) */}
      {!allMenusHidden && (
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`pointer-events-auto flex w-full shrink-0 items-center justify-between gap-2 overflow-x-auto rounded-2xl border px-2.5 py-1.5 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${hudCardClass}`}
        >
          {/* Kiri: Tombol Kembali ke Beranda + Identitas Lab */}
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="/"
              title="Kembali ke Beranda"
              className="group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-700/80 bg-slate-950/70 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-sky-500/50 hover:bg-slate-800 hover:text-sky-300 active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-sky-400 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden xl:inline">Kembali ke Beranda</span>
              <span className="xl:hidden">Kembali</span>
            </a>

            <div className="hidden h-5 w-px bg-slate-800 sm:block" />

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30">
                <FlaskConical className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <h1 className="text-[11px] md:text-xs font-bold tracking-wide text-slate-100">
                  LABORATORIUM VIRTUAL GC-FID
                </h1>
                <span className="hidden min-[1680px]:inline rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[9px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                  MULTI-SAMPEL & KOLOM
                </span>
              </div>
            </div>
          </div>

          {/* Tengah: Telemetri Instrumen Ringkas */}
          <div className="hidden 2xl:flex shrink-0 items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 px-2.5 py-1 text-[10.5px] whitespace-nowrap">
            <button
              type="button"
              onClick={() => setActiveCameraTarget('gas_cylinder')}
              className="flex items-center gap-1 border-r border-slate-800 pr-2.5 transition hover:opacity-80"
              title="Klik untuk melihat Tabung Gas Helium"
            >
              <Gauge
                className={`h-3.5 w-3.5 ${
                  gasValveOpen ? 'text-emerald-400' : 'text-rose-400'
                }`}
              />
              <span className="font-mono font-semibold text-slate-200">
                He {gasPressure} psi
              </span>
            </button>

            <button
              type="button"
              onClick={() => setGcModalOpen(true)}
              className="flex items-center gap-1 border-r border-slate-800 pr-2.5 transition hover:opacity-80"
              title="Klik untuk memilih Kolom Kapiler & Mengatur Suhu GC"
            >
              <Thermometer
                className={`h-3.5 w-3.5 ${
                  isConditioning
                    ? 'text-amber-400 animate-bounce'
                    : isConditioned
                    ? 'text-orange-400'
                    : 'text-slate-400'
                }`}
              />
              <span className="font-mono font-semibold text-slate-200">
                {COLUMN_SPECS[selectedColumnId].id.toUpperCase()} • {injectorTemp}°/{ovenTemp}°/{detectorTemp}°C
              </span>
            </button>

            <button
              type="button"
              onClick={toggleOvenDoor}
              className="flex items-center gap-1 border-r border-slate-800 pr-2.5 transition hover:opacity-80"
              title="Klik untuk Buka / Tutup Pintu Oven Kolom"
            >
              {ovenDoorOpen ? (
                <Unlock className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span
                className={`font-mono font-bold ${
                  ovenDoorOpen ? 'text-rose-400' : 'text-emerald-300'
                }`}
              >
                {ovenDoorOpen ? 'TERBUKA' : 'TERTUTUP'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCameraTarget('vials')}
              className="flex items-center gap-1 transition hover:opacity-80"
              title="Klik untuk melihat Rak Sampel & Suntikan"
            >
              <Syringe className="h-3.5 w-3.5 text-purple-400" />
              <span className="font-mono font-semibold text-slate-200">
                {syringeState === 'filled' && filledSampleId
                  ? SAMPLE_BOTTLE_SPECS[filledSampleId].code.toUpperCase()
                  : SYRINGE_STATE_LABELS[syringeState].toUpperCase()}
              </span>
            </button>
          </div>

          {/* Kanan: Tombol Aksi & Pengaturan (Single row) */}
          <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
            {/* Tombol Toggle Panduan */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={
                isSidebarCollapsed
                  ? 'Tampilkan Panel Panduan Praktikum'
                  : 'Sembunyikan Panel Panduan Praktikum'
              }
              className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition active:scale-95 ${
                !isSidebarCollapsed
                  ? 'border-sky-500/50 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                  : 'border-slate-700/80 bg-slate-950/70 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-3.5 w-3.5" />
              ) : (
                <PanelLeftClose className="h-3.5 w-3.5" />
              )}
              <span>Panduan</span>
            </button>

            {/* Tombol Buku Data Sampel (MSDS) */}
            <button
              onClick={() => setMsdsModalOpen(true)}
              title="Buka Kartu Data Fisikokimia Sampel (Titik Didih, Kepolaran & Rekomendasi Kolom)"
              className="flex items-center gap-1 rounded-xl border border-amber-500/50 bg-slate-950/70 px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 transition hover:bg-slate-800 active:scale-95"
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden xl:inline">Data Sampel (MSDS)</span>
              <span className="xl:hidden">MSDS</span>
            </button>

            {/* Tombol Mute / Unmute Suara */}
            <button
              onClick={toggleSoundMuted}
              title={soundMuted ? 'Nyalakan Efek Suara' : 'Bisukan Efek Suara'}
              className={`flex items-center justify-center rounded-xl border p-1.5 text-[11px] font-semibold transition active:scale-95 ${
                soundMuted
                  ? 'border-rose-500/40 bg-slate-950/70 text-rose-300 hover:bg-slate-800'
                  : 'border-emerald-500/40 bg-slate-950/70 text-emerald-300 hover:bg-slate-800'
              }`}
            >
              {soundMuted ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Tombol Toggle Mode Terang / Mode Gelap */}
            <button
              onClick={toggleLabTheme}
              title={
                isLight
                  ? 'Ubah ke Mode Gelap Ruangan Lab'
                  : 'Ubah ke Mode Terang Ruangan Lab'
              }
              className={`flex items-center gap-1 rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition active:scale-95 ${
                isLight
                  ? 'border-amber-500/50 bg-slate-950/70 text-amber-300 hover:bg-slate-800'
                  : 'border-indigo-500/50 bg-slate-950/70 text-indigo-300 hover:bg-slate-800'
              }`}
            >
              {isLight ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden xl:inline">Terang</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="hidden xl:inline">Gelap</span>
                </>
              )}
            </button>

            {/* Tombol Grafik Kromatogram 2D */}
            <button
              onClick={() => {
                if (shouldShow2DChart) {
                  setShowFloatingChart(false);
                  setChartExpanded(false);
                } else {
                  setShowFloatingChart(true);
                }
              }}
              title={
                shouldShow2DChart
                  ? 'Tutup Grafik Kromatogram 2D'
                  : 'Tampilkan Grafik Kromatogram 2D'
              }
              className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition active:scale-95 ${
                shouldShow2DChart
                  ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
                  : 'border-slate-700/80 bg-slate-950/70 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span>Grafik 2D</span>
            </button>

            {runCompleted && (
              <button
                onClick={() => setReportModalOpen(true)}
                title="Buka Laporan Evaluasi Akhir"
                className="flex items-center gap-1 rounded-xl border border-emerald-500/50 bg-slate-950/70 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-slate-800 active:scale-95"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Laporan Akhir</span>
                <span className="xl:hidden">Laporan</span>
              </button>
            )}

            {/* Tombol Reset Kamera */}
            <button
              onClick={resetCamera}
              title="Kembalikan Kamera 3D ke Tampilan Penuh Meja"
              className="flex items-center gap-1 rounded-xl border border-sky-500/50 bg-slate-950/70 px-2.5 py-1.5 text-[11px] font-semibold text-sky-300 transition hover:bg-slate-800 hover:text-white active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Reset Kamera</span>
            </button>

            {/* Tombol Ulangi */}
            <button
              onClick={handleRestartPracticum}
              title="Atur Ulang Seluruh Praktikum dari Awal"
              className="flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-950/70 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white active:scale-95"
            >
              <span>Ulangi</span>
            </button>

            {/* Tombol Sembunyikan Semua Menu */}
            <button
              onClick={() => setAllMenusHidden(true)}
              title="Sembunyikan semua menu agar alat lab dan ruangan terlihat penuh"
              className="flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-950/70 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-sky-400/60 hover:bg-slate-800 hover:text-white active:scale-95"
            >
              <EyeOff className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden lg:inline">Sembunyikan Menu</span>
            </button>
          </div>
        </motion.header>
      )}

      {/* KARTU DATA FISIKOKIMIA SAMPEL MENGAMBANG (Muncul saat kursor diarahkan ke Botol Sampel di meja) */}
      <AnimatePresence>
        {!allMenusHidden && hoveredSampleSpec && !gcModalOpen && !reportModalOpen && !msdsModalOpen && (
          <motion.div
            key={hoveredSampleSpec.id}
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className={`pointer-events-none fixed top-16 z-40 w-72 rounded-2xl border border-amber-500/50 bg-slate-950/95 p-3.5 text-slate-100 shadow-2xl backdrop-blur-xl ${
              shouldShow2DChart ? 'left-1/2 -translate-x-1/2' : 'right-3.5'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: hoveredSampleSpec.liquidColor }}
                />
                <span className="text-xs font-bold text-amber-300">
                  {hoveredSampleSpec.shortTitle}
                </span>
              </div>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9.5px] text-sky-300">
                {hoveredSampleSpec.polarityLabel}
              </span>
            </div>

            <div className="mt-2 space-y-1 text-[10.5px]">
              <div className="text-slate-400">
                Pelarut:{' '}
                <strong className="text-slate-200">
                  {hoveredSampleSpec.solvent.name} (Tb ={' '}
                  {hoveredSampleSpec.solvent.boilingPoint} °C)
                </strong>
              </div>
              <div className="font-semibold text-slate-300">
                Komponen Analit & Titik Didih (Tb):
              </div>
              {hoveredSampleSpec.compounds.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded bg-slate-900/90 px-2 py-1 font-mono text-[10px]"
                >
                  <span className="text-white">
                    {c.peakNumber}. {c.name} ({c.formula})
                  </span>
                  <span className="font-bold text-amber-300">
                    Tb = {c.boilingPoint} °C
                  </span>
                </div>
              ))}
              <div className="mt-1.5 rounded-lg border border-sky-500/30 bg-sky-950/40 p-2 text-[10px] leading-relaxed text-sky-200">
                <div>
                  <strong>Kolom Cocok:</strong>{' '}
                  {hoveredSampleSpec.recommendedColumnText}
                </div>
                <div className="mt-0.5 text-slate-300">
                  {hoveredSampleSpec.thermalWarningNote}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST / MODAL PERINGATAN INTERLOCK & ANTI-KONTAMINASI LABORATORIUM */}
      <AnimatePresence>
        {!allMenusHidden && labWarning && (
          <motion.div
            key={labWarning.id}
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto fixed left-1/2 top-16 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
              labWarning.severity === 'error'
                ? 'border-rose-500/80 bg-rose-950/95 text-rose-100 ring-2 ring-rose-500/30'
                : 'border-amber-500/80 bg-slate-900/95 text-amber-100 ring-2 ring-amber-500/30'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    labWarning.severity === 'error'
                      ? 'bg-rose-500/25 text-rose-300 ring-1 ring-rose-400/50'
                      : 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/50'
                  }`}
                >
                  {labWarning.severity === 'error' ? (
                    <ShieldAlert className="h-5 w-5 animate-pulse" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4
                    className={`text-xs md:text-sm font-bold uppercase tracking-wide ${
                      labWarning.severity === 'error'
                        ? 'text-rose-300'
                        : 'text-amber-300'
                    }`}
                  >
                    {labWarning.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-white font-medium">
                    {labWarning.message}
                  </p>
                  {labWarning.scientificReason && (
                    <p className="mt-1.5 rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-200">
                      <strong className="text-sky-300">
                        Penjelasan Kimia Analitik:{' '}
                      </strong>
                      {labWarning.scientificReason}
                    </p>
                  )}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {labWarning.actionLabel && (
                      <button
                        onClick={handleWarningAction}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold shadow transition ${
                          labWarning.severity === 'error'
                            ? 'bg-rose-500 text-white hover:bg-rose-400'
                            : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                        }`}
                      >
                        {labWarning.actionLabel}
                      </button>
                    )}
                    <button
                      onClick={dismissLabWarning}
                      className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                    >
                      Tutup Peringatan
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={dismissLabWarning}
                className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BAGIAN TENGAH: Panel Instruksi Kiri (Ramping & Terdock di Kiri Atas) + Grafik 2D Kanan */}
      {!allMenusHidden ? (
        <div className="flex flex-1 items-start justify-between gap-3 py-2 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {isSidebarCollapsed ? (
              <motion.button
                key="collapsed-btn"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                onClick={() => setIsSidebarCollapsed(false)}
                title="Tampilkan kembali panel panduan praktikum"
                className={`pointer-events-auto flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold text-sky-300 backdrop-blur-xl transition hover:border-sky-400 hover:bg-slate-800 hover:text-white ${hudCardClass}`}
              >
                <PanelLeftOpen className="h-3.5 w-3.5" />
                <span>
                  Tampilkan Panduan ({Math.max(1, currentStep)}/7)
                </span>
              </motion.button>
            ) : (
              <motion.aside
                key="expanded-sidebar"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
                className={`pointer-events-auto flex max-h-full w-[264px] md:w-[276px] shrink-0 flex-col gap-2.5 overflow-y-auto rounded-2xl border p-3 backdrop-blur-xl ${hudCardClass}`}
              >
              {/* Baris Atas Panel: Tombol Sembunyikan Panel */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Panduan Praktikum
                </span>
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2 py-1 text-[10px] font-medium text-slate-300 transition hover:border-sky-400 hover:text-white"
                  title="Sembunyikan Panel Instruksi"
                >
                  <PanelLeftClose className="h-3.5 w-3.5 text-sky-400" />
                  <span>Sembunyikan</span>
                </button>
              </div>

              {/* Kartu Instruksi Langkah Saat Ini */}
              <div className="rounded-xl border border-sky-500/25 bg-gradient-to-br from-sky-950/60 via-slate-900/90 to-slate-900/90 p-3 shadow-inner">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300 ring-1 ring-sky-500/30">
                    <Sparkles className="h-3 w-3" />
                    LANGKAH {Math.max(1, currentStep)} DARI 7
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {progressPercent}% Selesai
                  </span>
                </div>

                {/* Bar Progres */}
                <div className="mb-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                    initial={false}
                    animate={{ width: `${Math.max(10, progressPercent)}%` }}
                    transition={{ duration: 0.35 }}
                  />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStepData.step}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.18 }}
                  >
                    <h2 className="text-xs font-bold text-white">
                      {activeStepData.title}
                    </h2>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-200">
                      {activeStepData.instruction}
                    </p>

                    <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10.5px] font-medium text-amber-200">
                      🎯 {activeStepData.actionHint}
                    </div>

                    {/* Indikator Status Kolom, Suntikan & Pintu Oven */}
                    <div className="mt-2 space-y-1 rounded-lg border border-slate-800 bg-slate-950/70 p-2 font-mono text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Kolom Terpasang:</span>
                        <span className="font-bold text-sky-300">
                          {COLUMN_SPECS[selectedColumnId].id === 'db5'
                            ? 'DB-5 (Non-Polar)'
                            : 'DB-WAX (Polar)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Isi Suntikan:</span>
                        <span
                          className={`font-bold ${
                            syringeState === 'filled'
                              ? 'text-emerald-300'
                              : 'text-slate-300'
                          }`}
                        >
                          {syringeState === 'filled' && filledSampleId
                            ? `1,0 µL ${SAMPLE_BOTTLE_SPECS[filledSampleId].code}`
                            : SYRINGE_STATE_LABELS[syringeState]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Pintu Oven:</span>
                        <button
                          type="button"
                          onClick={toggleOvenDoor}
                          className={`font-bold underline ${
                            ovenDoorOpen ? 'text-rose-400' : 'text-emerald-300'
                          }`}
                        >
                          {ovenDoorOpen
                            ? 'TERBUKA (Klik Tutup)'
                            : 'TERTUTUP (Terkunci)'}
                        </button>
                      </div>
                    </div>

                    {/* Indikator Animasi Aktif */}
                    {syringeAnimPhase === 'washing_acetone' && (
                      <div className="mt-2 rounded-lg border border-sky-400/40 bg-sky-500/20 px-2 py-1 font-mono text-[10px] font-semibold text-sky-200 animate-pulse">
                        💧 Membilas suntikan dengan Aseton & membuang ke Botol
                        Limbah...
                      </div>
                    )}
                    {syringeAnimPhase === 'drawing_sample' && (
                      <div className="mt-2 rounded-lg border border-amber-400/40 bg-amber-500/20 px-2 py-1 font-mono text-[10px] font-semibold text-amber-200 animate-pulse">
                        🧪 Menarik 1,0 µL{' '}
                        {SAMPLE_BOTTLE_SPECS[selectedSampleId].code} ke dalam
                        Suntikan Mikro...
                      </div>
                    )}
                    {syringeAnimPhase === 'injecting_gc' && (
                      <div className="mt-2 rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-2 py-1 font-mono text-[10px] font-semibold text-emerald-200 animate-pulse">
                        💉 Menyuntikkan 1,0 µL sampel ke Port Injektor GC...
                      </div>
                    )}
                    {isConditioning && (
                      <div className="mt-2 rounded-lg border border-orange-400/40 bg-orange-500/20 px-2 py-1 font-mono text-[10px] font-semibold text-orange-200 animate-pulse">
                        🔥 Menyesuaikan suhu GC ({injectorTemp}° / {ovenTemp}° /{' '}
                        {detectorTemp} °C)...
                      </div>
                    )}

                    {/* Tombol Aksi Cepat Kontekstual */}
                    <div className="mt-2 space-y-1.5">
                      {currentStep <= 1 && !gasValveOpen && (
                        <button
                          onClick={() => {
                            setActiveCameraTarget('gas_cylinder');
                            setGasValveOpen(true);
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500/25 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/40 transition hover:bg-emerald-500/35"
                        >
                          <Wind className="h-3.5 w-3.5" />
                          Buka Regulator Helium (40 psi)
                        </button>
                      )}

                      {currentStep === 2 && (
                        <button
                          onClick={() => {
                            setActiveCameraTarget('gc_unit');
                            setGcModalOpen(true);
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500/25 px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-500/40 transition hover:bg-amber-500/35"
                        >
                          <Sliders className="h-3.5 w-3.5" />
                          Pilih Kolom & Atur Suhu GC
                        </button>
                      )}

                      {currentStep === 3 && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setActiveCameraTarget('vials');
                              setSyringeSelected(true);
                              setSyringeAnimPhase('selected');
                            }}
                            disabled={syringeSelected}
                            className="flex-1 rounded-lg bg-purple-500/25 px-2 py-1.5 text-[10.5px] font-semibold text-purple-300 ring-1 ring-purple-500/40 transition hover:bg-purple-500/35 disabled:opacity-45"
                          >
                            1. Ambil Suntikan
                          </button>
                          <button
                            onClick={attemptWashSyringe}
                            className="flex-1 rounded-lg bg-sky-500/25 px-2 py-1.5 text-[10.5px] font-semibold text-sky-300 ring-1 ring-sky-500/40 transition hover:bg-sky-500/35"
                          >
                            2. Bilas Aseton
                          </button>
                        </div>
                      )}

                      {currentStep === 4 && (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-3 gap-1">
                            {(
                              ['sample_a', 'sample_b', 'sample_c'] as SampleId[]
                            ).map((sId) => {
                              const spec = SAMPLE_BOTTLE_SPECS[sId];
                              const isLocked =
                                syringeState === 'filled' &&
                                filledSampleId !== null &&
                                filledSampleId !== sId;
                              const isChosen =
                                syringeState === 'filled' &&
                                filledSampleId === sId;
                              return (
                                <button
                                  key={sId}
                                  type="button"
                                  onClick={() => attemptDrawSample(sId)}
                                  className={`rounded-lg border px-1.5 py-1.5 text-center font-mono text-[10px] font-bold transition ${
                                    isChosen
                                      ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                                      : isLocked
                                      ? 'border-rose-500/40 bg-rose-950/40 text-rose-300'
                                      : 'border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/30'
                                  }`}
                                >
                                  {isLocked ? '🔒 ' : isChosen ? '✓ ' : ''}
                                  {spec.code}
                                </button>
                              );
                            })}
                          </div>
                          {syringeState === 'filled' && (
                            <button
                              type="button"
                              onClick={attemptWashSyringe}
                              className="flex w-full items-center justify-center gap-1 rounded-lg border border-sky-500/40 bg-sky-500/15 px-2 py-1 text-[10px] font-semibold text-sky-300 hover:bg-sky-500/25"
                            >
                              💧 Bilas Ulang Aseton (Ganti Sampel)
                            </button>
                          )}
                        </div>
                      )}

                      {currentStep === 5 && !isRunning && (
                        <div className="space-y-1.5">
                          <button
                            onClick={attemptInjectGC}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500/25 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/40 transition hover:bg-emerald-500/35"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Suntikkan Sampel ke Port Injektor
                          </button>
                          {syringeState === 'filled' && (
                            <button
                              type="button"
                              onClick={attemptWashSyringe}
                              className="flex w-full items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1 text-[10px] text-slate-300 hover:text-white"
                            >
                              Buang & Bilas Ulang dengan Aseton
                            </button>
                          )}
                        </div>
                      )}

                      {(currentStep === 6 || currentStep === 7) && (
                        <div className="flex gap-1.5">
                          {!isRunning && (
                            <button
                              onClick={startSeparationRun}
                              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-cyan-500/25 px-2 py-1.5 text-[10.5px] font-semibold text-cyan-300 ring-1 ring-cyan-500/40 transition hover:bg-cyan-500/35"
                            >
                              <Play className="h-3 w-3" />
                              {runCompleted ? 'Putar Ulang' : 'Mulai Pemisahan'}
                            </button>
                          )}
                          {runCompleted && (
                            <button
                              onClick={() => setReportModalOpen(true)}
                              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-500/25 px-2 py-1.5 text-[10.5px] font-semibold text-amber-300 ring-1 ring-amber-500/40 transition hover:bg-amber-500/35"
                            >
                              <FileText className="h-3 w-3" />
                              Evaluasi & Laporan
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2 text-[10.5px] leading-relaxed text-slate-400">
                      <span className="font-semibold text-sky-400">
                        Prinsip Kimia:{' '}
                      </span>
                      {activeStepData.scientificNote}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Tombol Navigasi Langkah: Sebelumnya / Selanjutnya */}
                <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={prevStep}
                    disabled={currentStep <= 1}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/70 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:bg-slate-700/80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Sebelumnya
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={currentStep >= 7}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-sky-500 px-2.5 py-1.5 text-[11px] font-semibold text-slate-950 shadow transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Selanjutnya
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Daftar Checklist Langkah Praktikum (Langkah 1 s/d 7) */}
              <div>
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Daftar Langkah Praktikum
                  </h3>
                  <span className="font-mono text-[9.5px] text-slate-500">
                    Klik untuk fokus
                  </span>
                </div>

                <div className="space-y-1">
                  {workflowSteps.map((stepItem) => {
                    const isCompleted = stepItem.step < currentStep;
                    const isCurrent = stepItem.step === currentStep;

                    return (
                      <button
                        key={stepItem.step}
                        onClick={() => setCurrentStep(stepItem.step)}
                        className={`group flex w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition ${
                          isCurrent
                            ? 'border-sky-500/50 bg-sky-500/15 text-white shadow-sm'
                            : isCompleted
                            ? 'border-emerald-500/25 bg-emerald-950/25 text-slate-300 hover:bg-emerald-950/40'
                            : 'border-slate-800/70 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                      >
                        <div className="shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : isCurrent ? (
                            <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-50" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
                            </div>
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={`truncate text-[11px] font-medium ${
                                isCompleted ? 'line-through opacity-75' : ''
                              }`}
                            >
                              {stepItem.step}. {stepItem.shortTitle}
                            </span>
                            <span className="shrink-0 rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[9px] text-slate-300">
                              {CAMERA_TARGET_LABELS_ID[stepItem.cameraTarget]}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

          {/* GRAFIK KROMATOGRAM 2D MENGAMBANG / DAPAT DIPERBESAR & DITUTUP DI SISI KANAN */}
          <AnimatePresence>
            {shouldShow2DChart && (
              <motion.div
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className={`pointer-events-auto ml-auto self-start max-h-full overflow-y-auto transition-all ${
                  chartExpanded
                    ? 'w-full max-w-2xl h-[420px]'
                    : 'w-full max-w-md h-[315px]'
                }`}
              >
                <ChromatogramChart
                  variant="hud"
                  onClose={() => {
                    setShowFloatingChart(false);
                    setChartExpanded(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* =================================================================== */}
      {/* MODAL BUKU DATA FISIKOKIMIA SAMPEL (MSDS)                           */}
      {/* =================================================================== */}
      <AnimatePresence>
        {msdsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-amber-500/40 bg-slate-900 p-6 text-slate-100 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Buku Data Fisikokimia Sampel & Panduan Pemilihan Kolom (MSDS)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Gunakan data titik didih (Tb) dan sifat kepolaran di bawah ini sebagai acuan sebelum mengatur Kolom & Suhu GC pada Langkah 2
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMsdsModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {(['sample_a', 'sample_b', 'sample_c'] as SampleId[]).map(
                  (sId) => {
                    const spec = SAMPLE_BOTTLE_SPECS[sId];
                    return (
                      <div
                        key={sId}
                        className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-4"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-bold text-slate-950"
                              style={{ backgroundColor: spec.liquidColor }}
                            >
                              {spec.code}
                            </span>
                            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300">
                              {spec.polarityLabel}
                            </span>
                          </div>

                          <h3 className="mt-2.5 text-sm font-bold text-white">
                            {spec.name}
                          </h3>
                          <p className="mt-1 text-[11px] text-slate-400">
                            Pelarut:{' '}
                            <strong className="text-slate-200">
                              {spec.solvent.name} ({spec.solvent.formula}, Tb ={' '}
                              {spec.solvent.boilingPoint} °C)
                            </strong>
                          </p>

                          <div className="mt-3 space-y-1.5">
                            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                              Komponen Analit & Titik Didih:
                            </div>
                            {spec.compounds.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900 px-2.5 py-1.5 font-mono text-xs"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: c.color }}
                                  />
                                  <span className="text-slate-100">
                                    {c.name} ({c.formula})
                                  </span>
                                </div>
                                <strong className="text-amber-300">
                                  Tb {c.boilingPoint} °C
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-[11px]">
                          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2 text-emerald-200">
                            <div className="font-bold text-emerald-300">
                              Kolom yang Cocok:
                            </div>
                            <div>{spec.recommendedColumnText}</div>
                          </div>
                          <div className="rounded-lg border border-sky-500/30 bg-sky-950/30 p-2 text-sky-200">
                            <div className="font-bold text-sky-300">
                              Acuan Suhu Optimal:
                            </div>
                            <div>
                              • Oven: {spec.idealTempGuide.ovenModeText}
                            </div>
                            <div>
                              • Injektor: {spec.idealTempGuide.injectorRange[0]}–
                              {spec.idealTempGuide.injectorRange[1]} °C
                            </div>
                            <div>
                              • Detektor FID:{' '}
                              {spec.idealTempGuide.detectorRange[0]}–
                              {spec.idealTempGuide.detectorRange[1]} °C
                            </div>
                          </div>
                          <p className="text-[10.5px] leading-relaxed text-amber-200/90">
                            ⚠️ {spec.thermalWarningNote}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                <span className="text-xs text-slate-400">
                  💡 Tip: Pilih sampel dengan mengklik langsung botol sampel A, B, atau C di atas meja pada Langkah 4.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMsdsModalOpen(false);
                      setGcModalOpen(true);
                    }}
                    className="rounded-xl border border-amber-500/50 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/25"
                  >
                    Buka Pengaturan Kolom & Suhu GC
                  </button>
                  <button
                    type="button"
                    onClick={() => setMsdsModalOpen(false)}
                    className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
                  >
                    Mengerti & Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* MODAL LANGKAH 2: 2 TAB (TAB 1: KOLOM KAPILER, TAB 2: SUHU GC)       */}
      {/* (TANPA PEMILIHAN SAMPEL DI DALAM MODAL GC!)                         */}
      {/* =================================================================== */}
      <AnimatePresence>
        {gcModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-sky-500/40 bg-slate-900 p-5 text-slate-100 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Konfigurasi Instrumen GC-2030 (Langkah 2)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Pilih spesifikasi Kolom Kapiler (Tab 1) dan atur Zona Suhu (Tab 2)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setGcModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Indikator Status Pintu Oven & Safety Thermal Interlock */}
              <div
                className={`mt-3.5 flex items-center justify-between rounded-xl border p-3 ${
                  ovenDoorOpen
                    ? 'border-rose-500/70 bg-rose-950/70 text-rose-100'
                    : 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {ovenDoorOpen ? (
                    <Unlock className="h-5 w-5 shrink-0 text-rose-400 animate-pulse" />
                  ) : (
                    <Lock className="h-5 w-5 shrink-0 text-emerald-400" />
                  )}
                  <div>
                    <div className="text-xs font-bold">
                      Pintu Oven:{' '}
                      <span
                        className={
                          ovenDoorOpen ? 'text-rose-300' : 'text-emerald-300'
                        }
                      >
                        {ovenDoorOpen
                          ? 'TERBUKA (Pendinginan • Interlock Aktif)'
                          : 'TERTUTUP (Terkunci Termal)'}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-300">
                      {ovenDoorOpen
                        ? 'PERINGATAN: Pemanas oven mati otomatis karena panas terbuang ke ruangan!'
                        : 'Jendela kaca tengah memungkinkan pengamatan kolom tanpa membuka pintu.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleOvenDoor}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    ovenDoorOpen
                      ? 'bg-rose-500 text-white hover:bg-rose-400'
                      : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {ovenDoorOpen ? 'Tutup Pintu Oven' : 'Buka Pintu Oven'}
                </button>
              </div>

              {/* Navigasi 2 Tab Rapi: Tab 1 (Kolom Kapiler) & Tab 2 (Pengaturan Suhu) */}
              <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950/90 p-1">
                <button
                  type="button"
                  onClick={() => setGcModalTab('column')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                    gcModalTab === 'column'
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Tab 1: Kolom Kapiler ({formColumnId.toUpperCase()})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGcModalTab('temperature')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                    gcModalTab === 'temperature'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Thermometer className="h-3.5 w-3.5" />
                  <span>Tab 2: Pengaturan Suhu GC</span>
                </button>
              </div>

              <form onSubmit={handleApplyConditioning} className="mt-3.5">
                {gcModalTab === 'column' ? (
                  /* TAB 1: KONFIGURASI KOLOM KAPILER */
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300">
                      Pilih fasa diam kolom kapiler yang sesuai dengan kepolaran sampel yang akan Anda ambil di meja lab:
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                      {(['db5', 'dbwax'] as ColumnId[]).map((colKey) => {
                        const col = COLUMN_SPECS[colKey];
                        const isSelected = formColumnId === colKey;
                        return (
                          <div
                            key={colKey}
                            onClick={() => setFormColumnId(colKey)}
                            className={`cursor-pointer rounded-xl border p-3.5 transition ${
                              isSelected
                                ? 'border-sky-400 bg-sky-500/15 ring-1 ring-sky-400/40'
                                : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-3.5 w-3.5 rounded-full border-2 ${
                                    isSelected
                                      ? 'border-sky-300 bg-sky-400'
                                      : 'border-slate-600'
                                  }`}
                                />
                                <span className="text-sm font-bold text-white">
                                  {col.name}
                                </span>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                                  colKey === 'db5'
                                    ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                                    : 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40'
                                }`}
                              >
                                Batas Suhu Maks: {col.maxTemp} °C
                              </span>
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-900/90 p-2 font-mono text-[10.5px] text-slate-300">
                              <div>
                                <span className="text-slate-500">Fasa Diam: </span>
                                {col.stationaryPhase}
                              </div>
                              <div>
                                <span className="text-slate-500">Dimensi: </span>
                                {col.dimensions}
                              </div>
                            </div>

                            <p className="mt-2 text-xs font-medium text-emerald-300">
                              ✓ {col.suitableSamplesText}
                            </p>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                              {col.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setGcModalTab('temperature')}
                        className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
                      >
                        <span>Lanjut ke Tab 2: Pengaturan Suhu</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: PENGATURAN SUHU (INJEKTOR, OVEN, DETEKTOR FID) */
                  <div className="space-y-3">
                    {/* Peringatan jika Suhu Oven > Batas Maksimum Kolom (Column Bleeding) */}
                    {Math.max(formOvenTemp, formRampMax) >
                      COLUMN_SPECS[formColumnId].maxTemp && (
                      <div className="rounded-xl border border-rose-500/60 bg-rose-950/70 p-2.5 text-[11px] text-rose-200">
                        <strong className="text-rose-300">
                          ⚠️ PERINGATAN COLUMN BLEEDING:{' '}
                        </strong>
                        Suhu oven ({Math.max(formOvenTemp, formRampMax)} °C)
                        melebihi batas suhu maksimum{' '}
                        {COLUMN_SPECS[formColumnId].name} (
                        {COLUMN_SPECS[formColumnId].maxTemp} °C)! Fasa diam akan
                        rusak/luruh saat pemisahan.
                      </div>
                    )}

                    {/* 1. MODE & SUHU OVEN KOLOM */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-orange-400">
                          1. Suhu Oven Kolom ({COLUMN_SPECS[formColumnId].shortName})
                        </label>
                        <span className="font-mono text-xs font-bold text-white">
                          {formOvenTemp === formRampMax
                            ? `Isotermal ${formOvenTemp} °C`
                            : `Gradien ${formOvenTemp} °C → ${formRampMax} °C`}
                        </span>
                      </div>

                      {/* Tombol Preset Cepat Mode Oven */}
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {(
                          [
                            'isothermal_low',
                            'temperature_program',
                            'isothermal_high',
                          ] as OvenMode[]
                        ).map((modeKey) => {
                          const info = OVEN_MODE_INFO[modeKey];
                          const active = formOvenMode === modeKey;
                          return (
                            <button
                              key={modeKey}
                              type="button"
                              onClick={() => handleSelectOvenPreset(modeKey)}
                              className={`rounded-lg border px-2 py-1.5 text-left transition ${
                                active
                                  ? 'border-orange-400 bg-orange-500/20 text-white shadow'
                                  : 'border-slate-800 bg-slate-900/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              }`}
                            >
                              <div className="font-mono text-[10px] font-bold text-orange-300">
                                {info.shortLabel}
                              </div>
                              <div className="mt-0.5 text-[9px] leading-tight text-slate-300">
                                {modeKey === 'isothermal_low'
                                  ? '75 °C Konstan'
                                  : modeKey === 'temperature_program'
                                  ? '60 → 200 °C'
                                  : '220 °C Konstan'}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Slider Manual Suhu Oven Awal & Akhir */}
                      <div className="mt-2.5 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-2">
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-300">
                            <span>Suhu Awal Oven</span>
                            <strong className="font-mono text-orange-300">
                              {formOvenTemp} °C
                            </strong>
                          </div>
                          <input
                            type="range"
                            min={25}
                            max={260}
                            step={5}
                            value={formOvenTemp}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setFormOvenTemp(val);
                              if (val < 85 && formRampMax < 90) {
                                setFormOvenMode('isothermal_low');
                              } else if (val > 180) {
                                setFormOvenMode('isothermal_high');
                              } else {
                                setFormOvenMode('temperature_program');
                              }
                            }}
                            className="mt-1 w-full accent-orange-400"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-300">
                            <span>Suhu Akhir Oven</span>
                            <strong className="font-mono text-orange-300">
                              {formRampMax} °C
                            </strong>
                          </div>
                          <input
                            type="range"
                            min={25}
                            max={260}
                            step={5}
                            value={formRampMax}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setFormRampMax(val);
                              if (val < 85) {
                                setFormOvenMode('isothermal_low');
                              } else if (formOvenTemp > 180 && val > 180) {
                                setFormOvenMode('isothermal_high');
                              } else {
                                setFormOvenMode('temperature_program');
                              }
                            }}
                            className="mt-1 w-full accent-orange-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. SUHU PORT INJEKTOR (25°C - 350°C) */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-amber-300">
                          2. Suhu Port Injektor (25 °C – 350 °C)
                        </label>
                        <span className="font-mono text-xs font-bold text-white">
                          {formInjTemp} °C
                        </span>
                      </div>
                      <input
                        type="range"
                        min={25}
                        max={350}
                        step={5}
                        value={formInjTemp}
                        onChange={(e) => setFormInjTemp(Number(e.target.value))}
                        className="mt-2 w-full accent-amber-400"
                      />
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                        <span>
                          Geser sesuai titik didih sampel (Awas: Eugenol rusak{' '}
                          {'>'}265 °C!)
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setFormInjTemp(175)}
                            className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[9.5px] text-purple-300 hover:border-purple-400"
                          >
                            175°C
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormInjTemp(245)}
                            className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[9.5px] text-sky-300 hover:border-sky-400"
                          >
                            245°C
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormInjTemp(295)}
                            className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[9.5px] text-rose-300 hover:border-rose-400"
                          >
                            295°C
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. SUHU DETEKTOR FID (25°C - 350°C) */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-cyan-300">
                          3. Suhu Unit Detektor FID (25 °C – 350 °C)
                        </label>
                        <span className="font-mono text-xs font-bold text-white">
                          {formDetTemp} °C
                        </span>
                      </div>
                      <input
                        type="range"
                        min={25}
                        max={350}
                        step={5}
                        value={formDetTemp}
                        onChange={(e) => setFormDetTemp(Number(e.target.value))}
                        className="mt-2 w-full accent-cyan-400"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>
                          Aturan: Minimal 20–30 °C di atas suhu maks oven (
                          {Math.max(formOvenTemp, formRampMax)} °C) agar bebas
                          kondensasi
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormDetTemp(280)}
                          className="font-mono text-sky-400 hover:underline"
                        >
                          280 °C
                        </button>
                      </div>
                    </div>

                    {/* Referensi Singkat Titik Didih 3 Botol Sampel di Meja */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-[10px]">
                      <div className="mb-1 flex items-center justify-between font-bold text-amber-300">
                        <span>
                          📋 Referensi Titik Didih 3 Botol Sampel di Meja Lab:
                        </span>
                        <button
                          type="button"
                          onClick={() => setMsdsModalOpen(true)}
                          className="text-sky-400 underline"
                        >
                          Buka MSDS Lengkap
                        </button>
                      </div>
                      <div className="space-y-0.5 text-slate-300 font-mono">
                        <div>
                          • <strong className="text-amber-300">Sampel A (Alkana Non-Polar):</strong>{' '}
                          Tb 69–174 °C | Kolom DB-5 | Oven 60→200 °C, Inj 240 °C
                        </div>
                        <div>
                          • <strong className="text-purple-300">Sampel B (Alkohol Polar):</strong>{' '}
                          Tb 64–97 °C | Kolom DB-WAX | Oven 60→105 °C (Jangan {'>'}140°C!), Inj 175 °C
                        </div>
                        <div>
                          • <strong className="text-emerald-300">Sampel C (Terpena):</strong>{' '}
                          Tb 156–254 °C | Kolom DB-5 | Oven 100→240 °C, Inj 245 °C (Rusak {'>'}265°C!)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setGcModalOpen(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg transition hover:from-amber-400 hover:to-orange-400"
                  >
                    <Flame className="h-4 w-4" />
                    Pasang {COLUMN_SPECS[formColumnId].id.toUpperCase()} & Terapkan Suhu
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* MODAL LANGKAH 7: EVALUASI ADAPTIF (3 KONDISI: GAGAL, CACAT, OPTIMAL)*/}
      {/* =================================================================== */}
      <AnimatePresence>
        {reportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 14 }}
              className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl"
            >
              {/* Header Modal Langkah 7 */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${
                      activeProfile.isFlatline
                        ? 'bg-rose-500/20 text-rose-400 ring-rose-500/40'
                        : activeProfile.isOptimalMethod
                        ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 ring-amber-500/30'
                    }`}
                  >
                    {activeProfile.isFlatline ? (
                      <ShieldAlert className="h-5 w-5" />
                    ) : (
                      <Award className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Langkah 7: Laporan Hasil & Evaluasi Metode GC-FID
                    </h2>
                    <p className="text-xs text-slate-400">
                      Sampel:{' '}
                      <strong className="text-amber-300">
                        {activeSampleSpec.shortTitle}
                      </strong>{' '}
                      • Kolom:{' '}
                      <strong className="text-sky-300">
                        {activeColumnSpec.name}
                      </strong>{' '}
                      • Suhu: Inj {effectiveParams.injectorTemp}°C | Oven{' '}
                      {effectiveParams.ovenStartTemp}→
                      {effectiveParams.ovenEndTemp}°C | FID{' '}
                      {effectiveParams.detectorTemp}°C
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ============================================================= */}
              {/* KONDISI 1: JIKA ANALISIS GAGAL TOTAL (FLATLINE)               */}
              {/* JANGAN tampilkan Tabel Puncak & JANGAN tampilkan Evaluasi!    */}
              {/* ============================================================= */}
              {activeProfile.isFlatline ? (
                <div className="mt-5 rounded-2xl border-2 border-rose-500/80 bg-rose-950/60 p-6 text-center shadow-xl">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/25 text-rose-300 ring-2 ring-rose-500/50">
                    <ShieldAlert className="h-8 w-8 animate-pulse" />
                  </div>
                  <h3 className="mt-3 text-base md:text-lg font-extrabold tracking-wide text-rose-300">
                    ANALISIS GAGAL (TIDAK ADA PUNCAK TERDETEKSI)
                  </h3>
                  <div className="mt-2 inline-block rounded-full border border-rose-400/40 bg-rose-900/60 px-3.5 py-1 font-mono text-xs font-bold text-rose-200">
                    Penyebab Utama: {activeProfile.failureCauseShort}
                  </div>
                  <p className="mx-auto mt-3 max-w-xl text-xs md:text-sm leading-relaxed text-rose-100">
                    {activeProfile.failureExplanation}
                  </p>
                  <p className="mt-2 text-xs text-slate-300">
                    Karena tidak ada analit yang mencapai detektor FID (sinyal garis datar / flatline), tabel integrasi puncak tidak dapat dihitung.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleFixFailedRun}
                      className="flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-xs md:text-sm font-bold text-white shadow-lg transition hover:bg-rose-400"
                    >
                      <Wrench className="h-4 w-4" />
                      <span>Kembali & Perbaiki Pengaturan</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRestartPracticum}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Ulangi dari Awal</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ============================================================= */
                /* KONDISI 2 (SUB-OPTIMAL) & KONDISI 3 (OPTIMAL / VALID)         */
                /* ============================================================= */
                <>
                  {/* Banner Status Metode (Optimal vs Sub-Optimal) */}
                  <div
                    className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3.5 ${
                      activeProfile.isOptimalMethod
                        ? 'border-emerald-500/50 bg-emerald-950/35'
                        : 'border-amber-500/55 bg-amber-950/35'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Stethoscope
                        className={`h-5 w-5 ${
                          activeProfile.isOptimalMethod
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      />
                      <div>
                        <div className="text-xs md:text-sm font-bold text-white">
                          {activeProfile.isOptimalMethod
                            ? `Metode Kromatografi Valid untuk ${activeSampleSpec.shortTitle}`
                            : `Metode Kromatografi Belum Optimal (Terdapat Cacat Puncak / Baseline)`}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          Puncak Pelarut ({activeProfile.solventPeak.name})
                          terelusi pada tR ={' '}
                          {activeProfile.solventPeak.retentionTime} dtk •
                          Resolusi Rs(1-2) = {activeProfile.resolutionHexOct} •
                          Rs(2-3) = {activeProfile.resolutionOctDec}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-[10.5px] font-bold ${
                        activeProfile.isOptimalMethod
                          ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/50'
                          : 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/50'
                      }`}
                    >
                      {activeProfile.isOptimalMethod
                        ? '✓ METODE VALID & PEMISAHAN OPTIMAL'
                        : '⚠️ KROMATOGRAM SUB-OPTIMAL (PERLU PERBAIKAN)'}
                    </span>
                  </div>

                  {/* TABEL HASIL PRAKTIKUM ADAPTIF */}
                  <div className="mt-4">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                      Tabel Hasil Praktikum (Integrasi & Parameter Kualitas Puncak)
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/90 text-[10px] uppercase text-slate-400">
                            <th className="px-2.5 py-2.5">Puncak</th>
                            <th className="px-2.5 py-2.5">Nama Senyawa / Identifikasi</th>
                            <th className="px-2.5 py-2.5">tR</th>
                            <th className="px-2.5 py-2.5" title="Lebar Dasar Puncak (4σ)">
                              Lebar (Wb)
                            </th>
                            <th className="px-2.5 py-2.5" title="Jumlah Pelat Teoritis N">
                              Pelat (N)
                            </th>
                            <th className="px-2.5 py-2.5" title="Faktor Asimetri / Tailing (Tf)">
                              Tf
                            </th>
                            <th className="px-2.5 py-2.5 text-right">% Area</th>
                            <th className="px-2.5 py-2.5">Status Evaluasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                          {activeProfile.adaptiveTableRows.map((row) => (
                            <tr
                              key={row.rowId}
                              className="hover:bg-slate-900/50"
                            >
                              <td className="px-2.5 py-2.5 font-bold text-slate-200">
                                {row.peakLabel}
                              </td>
                              <td className="px-2.5 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: row.color }}
                                  />
                                  <span className="font-semibold text-white">
                                    {row.compoundName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-2.5 py-2.5 font-bold text-sky-300">
                                {row.retentionTimeText}
                              </td>
                              <td className="px-2.5 py-2.5 text-slate-300">
                                {row.baseWidthText}
                              </td>
                              <td className="px-2.5 py-2.5 text-slate-300">
                                {row.platesNText}
                              </td>
                              <td className="px-2.5 py-2.5 text-slate-300">
                                {row.tailingFactorText}
                              </td>
                              <td className="px-2.5 py-2.5 text-right font-bold text-emerald-400">
                                {row.percentArea.toFixed(1)} %
                              </td>
                              <td className="px-2.5 py-2.5">
                                <span
                                  className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                                    row.statusTone === 'optimal'
                                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                                      : row.statusTone === 'error'
                                      ? 'bg-rose-500/25 text-rose-300 ring-1 ring-rose-500/40'
                                      : 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/40'
                                  }`}
                                >
                                  {row.statusBadge}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* KARTU DIAGNOSIS & SARAN PERBAIKAN METODE (Khusus Kondisi 2: Sub-Optimal) */}
                  {!activeProfile.isOptimalMethod && (
                    <div className="mt-4 rounded-2xl border border-amber-500/50 bg-amber-950/30 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-amber-300">
                          <Wrench className="h-4 w-4" />
                          <span>
                            Diagnosis & Saran Perbaikan Metode untuk{' '}
                            {activeSampleSpec.shortTitle}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReportModalOpen(false);
                            setGcModalOpen(true);
                          }}
                          className="rounded-lg bg-amber-400 px-3 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-300"
                        >
                          Perbaiki Kolom & Suhu GC
                        </button>
                      </div>

                      <div className="mt-3 space-y-2.5">
                        {activeProfile.repairAdvices.map((adv, idx) => (
                          <div
                            key={idx}
                            className={`rounded-xl border p-3 text-xs ${
                              adv.tone === 'error'
                                ? 'border-rose-500/50 bg-rose-950/50'
                                : 'border-amber-500/45 bg-slate-950/75'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <strong
                                className={
                                  adv.tone === 'error'
                                    ? 'text-rose-300'
                                    : 'text-amber-300'
                                }
                              >
                                • {adv.parameterName}
                              </strong>
                              <div className="font-mono text-[10.5px]">
                                <span className="text-rose-300 line-through mr-2">
                                  Saat ini: {adv.currentValueText}
                                </span>
                                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold text-emerald-300">
                                  Saran: {adv.recommendedValueText}
                                </span>
                              </div>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-200">
                              {adv.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* KUIS EVALUASI & KESIMPULAN */}
                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                      <HelpCircle className="h-4 w-4" />
                      <span>
                        Kuis Evaluasi ({activeSampleSpec.code}): Di antara 3
                        komponen analit dalam sampel ini, senyawa manakah yang
                        terelusi paling awal dan mengapa?
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {quizOptions.map((opt) => {
                        const isSelected = selectedQuizOption === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedQuizOption(opt.id)}
                            className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-xs transition ${
                              isSelected
                                ? opt.isCorrect
                                  ? 'border-emerald-500/60 bg-emerald-500/15 text-white'
                                  : 'border-rose-500/60 bg-rose-500/15 text-white'
                                : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isSelected ? (
                                <CheckCircle2
                                  className={`h-4 w-4 ${
                                    opt.isCorrect
                                      ? 'text-emerald-400'
                                      : 'text-rose-400'
                                  }`}
                                />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedQuizData && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-3 rounded-lg border p-3 text-xs leading-relaxed ${
                          selectedQuizData.isCorrect
                            ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
                            : 'border-rose-500/40 bg-rose-950/40 text-rose-200'
                        }`}
                      >
                        {selectedQuizData.explanation}
                      </motion.div>
                    )}
                  </div>

                  {/* Footer Tombol Modal Langkah 7 */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReportModalOpen(false)}
                        className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
                      >
                        Tutup & Lihat Alat 3D
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReportModalOpen(false);
                          setGcModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/25"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        <span>Ubah Kolom / Suhu GC</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleRestartPracticum}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition hover:from-sky-400 hover:to-emerald-400"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Ulangi Praktikum</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BAR BAWAH: Pemilih Fokus Kamera & Petunjuk Navigasi (Tetap ramping di bawah) */}
      {!allMenusHidden && (
        <footer className="pointer-events-auto flex w-full shrink-0 items-center justify-between gap-2">
          <div
            className={`flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border px-1.5 py-1 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${hudCardClass}`}
          >
            <div className="flex shrink-0 items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-slate-400">
              <Eye className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">Fokus Kamera:</span>
            </div>
            {CAMERA_TARGETS.map((t) => {
              const active = activeCameraTarget === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveCameraTarget(t.id)}
                  className={`shrink-0 whitespace-nowrap rounded-xl px-2.5 py-1 text-[11px] font-medium transition ${
                    active
                      ? 'bg-sky-500 text-slate-950 font-semibold shadow'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {t.shortLabel}
                </button>
              );
            })}
          </div>

          <div
            className={`hidden xl:flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-md ${hudCardClass}`}
          >
            <Compass className="h-3.5 w-3.5 text-sky-400" />
            <span>
              Sudut Pandang:{' '}
              <strong className="text-white">
                {CAMERA_PRESETS[activeCameraTarget]?.label}
              </strong>{' '}
              • Klik Kiri: Putar • Klik Kanan: Geser • Scroll: Zoom
            </span>
          </div>
        </footer>
      )}
    </div>
  );
};

export default LabHUD;
