import React, { useMemo } from 'react';
import {
  Maximize2,
  Minimize2,
  Activity,
  Play,
  FileText,
  RotateCcw,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  useLabStore,
  TOTAL_RUN_DURATION,
} from '../store/useLabStore';
import {
  computeChromatogramProfile,
  evaluateDynamicSignalAtTime,
  RunPhysicsParams,
  COLUMN_SPECS,
  SAMPLE_BOTTLE_SPECS,
} from '../utils/chromatographyPhysics';

interface ChromatogramChartProps {
  variant?: 'monitor' | 'hud';
  onClose?: () => void;
}

export const ChromatogramChart: React.FC<ChromatogramChartProps> = ({
  variant = 'hud',
  onClose,
}) => {
  const runElapsed = useLabStore((s) => s.runElapsed);
  const isRunning = useLabStore((s) => s.isRunning);
  const runCompleted = useLabStore((s) => s.runCompleted);
  const selectedSampleId = useLabStore((s) => s.selectedSampleId);
  const filledSampleId = useLabStore((s) => s.filledSampleId);
  const selectedColumnId = useLabStore((s) => s.selectedColumnId);
  const gasValveOpen = useLabStore((s) => s.gasValveOpen);
  const gasPressure = useLabStore((s) => s.gasPressure);
  const injectorTemp = useLabStore((s) => s.injectorTemp);
  const ovenTemp = useLabStore((s) => s.ovenTemp);
  const detectorTemp = useLabStore((s) => s.detectorTemp);
  const ovenMode = useLabStore((s) => s.ovenMode);
  const targetOvenTemp = useLabStore((s) => s.targetOvenTemp);
  const ovenRampMaxTemp = useLabStore((s) => s.ovenRampMaxTemp);
  const ovenDoorOpen = useLabStore((s) => s.ovenDoorOpen);
  const activeRunParams = useLabStore((s) => s.activeRunParams);
  const chartExpanded = useLabStore((s) => s.chartExpanded);
  const setChartExpanded = useLabStore((s) => s.setChartExpanded);
  const setReportModalOpen = useLabStore((s) => s.setReportModalOpen);
  const startSeparationRun = useLabStore((s) => s.startSeparationRun);

  const effectiveTime = isRunning
    ? runElapsed
    : runCompleted
    ? TOTAL_RUN_DURATION
    : 0;

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

  const profile = useMemo(
    () => computeChromatogramProfile(effectiveParams),
    [effectiveParams]
  );

  const activeSampleSpec =
    SAMPLE_BOTTLE_SPECS[effectiveParams.sampleId] ??
    SAMPLE_BOTTLE_SPECS.sample_a;
  const activeColSpec =
    COLUMN_SPECS[effectiveParams.columnId] ?? COLUMN_SPECS.db5;

  const width = 460;
  const height = 198;
  const padLeft = 40;
  const padRight = 16;
  const padTop = 22;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const maxMv = 180;

  const timeToX = (t: number) =>
    padLeft +
    (Math.min(TOTAL_RUN_DURATION, Math.max(0, t)) / TOTAL_RUN_DURATION) * plotW;
  const mvToY = (mv: number) =>
    padTop + plotH - (Math.min(maxMv, Math.max(0, mv)) / maxMv) * plotH;

  const { linePath, areaPath, currentPoint } = useMemo(() => {
    if (effectiveTime <= 0.02) {
      const y0 = mvToY(4.5);
      return {
        linePath: `M ${padLeft} ${y0}`,
        areaPath: '',
        currentPoint: { x: padLeft, y: y0, mv: 4.5 },
      };
    }

    const step = 0.032;
    const pts: { x: number; y: number; mv: number }[] = [];
    for (let t = 0; t <= effectiveTime; t += step) {
      const mv = evaluateDynamicSignalAtTime(t, effectiveParams);
      pts.push({ x: timeToX(t), y: mvToY(mv), mv });
    }
    const finalMv = evaluateDynamicSignalAtTime(effectiveTime, effectiveParams);
    pts.push({
      x: timeToX(effectiveTime),
      y: mvToY(finalMv),
      mv: finalMv,
    });

    const dLine = pts
      .map(
        (p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      )
      .join(' ');

    const baselineY = mvToY(0);
    const lastPt = pts[pts.length - 1];
    const dArea = `${dLine} L ${lastPt.x.toFixed(1)} ${baselineY.toFixed(
      1
    )} L ${padLeft} ${baselineY.toFixed(1)} Z`;

    return {
      linePath: dLine,
      areaPath: dArea,
      currentPoint: lastPt,
    };
  }, [effectiveTime, effectiveParams]);

  // Badge status / anomali aktif
  const activeAnomalyBadges: { label: string; colorClass: string }[] = [];
  if (isRunning || runCompleted) {
    if (profile.isFlatline) {
      activeAnomalyBadges.push({
        label: `FLATLINE: ${profile.failureCauseShort}`,
        colorClass: 'border-rose-500/50 bg-rose-500/20 text-rose-200',
      });
    } else {
      if (profile.hasPolarityMismatch) {
        activeAnomalyBadges.push({
          label: `Salah Kolom (${activeColSpec.name})`,
          colorClass: 'border-rose-500/50 bg-rose-500/20 text-rose-200',
        });
      }
      if (profile.hasColumnBleeding) {
        activeAnomalyBadges.push({
          label: `Column Bleeding (> ${activeColSpec.maxTemp}°C)!`,
          colorClass: 'border-rose-500/50 bg-rose-500/20 text-rose-200',
        });
      }
      if (profile.hasDoorThermalCollapse) {
        activeAnomalyBadges.push({
          label: 'Interlock: Pintu Oven Terbuka!',
          colorClass: 'border-rose-500/50 bg-rose-500/20 text-rose-200',
        });
      }
      if (profile.hasCoElution) {
        activeAnomalyBadges.push({
          label: `Co-Elution (Rs=${profile.resolutionHexOct})`,
          colorClass: 'border-amber-500/50 bg-amber-500/20 text-amber-200',
        });
      }
      if (profile.hasPeakBroadening) {
        activeAnomalyBadges.push({
          label: 'Peak Broadening (Oven Rendah)',
          colorClass: 'border-amber-500/50 bg-amber-500/20 text-amber-200',
        });
      }
      if (profile.hasPeakTailing) {
        activeAnomalyBadges.push({
          label: 'Peak Tailing (EMG)',
          colorClass: 'border-orange-500/50 bg-orange-500/20 text-orange-200',
        });
      }
      if (profile.hasThermalDegradation) {
        activeAnomalyBadges.push({
          label: 'Degradasi Termal + Artefak',
          colorClass: 'border-purple-500/50 bg-purple-500/20 text-purple-200',
        });
      }
      if (profile.hasDetectorCondensation) {
        activeAnomalyBadges.push({
          label: 'Kondensasi FID (Drift & Noise)',
          colorClass: 'border-yellow-500/50 bg-yellow-500/20 text-yellow-200',
        });
      }
    }
  }

  const strokeColor =
    profile.isFlatline && (isRunning || runCompleted) ? '#f43f5e' : '#38bdf8';

  return (
    <div
      className={`flex flex-col justify-between font-mono text-slate-100 select-none ${
        variant === 'monitor'
          ? 'h-full w-full'
          : 'rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-xl'
      }`}
    >
      {/* Baris Judul Grafik */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity
            className={`h-4 w-4 ${
              profile.isFlatline && (isRunning || runCompleted)
                ? 'text-rose-400 animate-pulse'
                : isRunning
                ? 'text-emerald-400 animate-pulse'
                : 'text-cyan-400'
            }`}
          />
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold tracking-wide text-cyan-300">
                KROMATOGRAM GC-FID ({activeSampleSpec.code.toUpperCase()})
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                t = {effectiveTime.toFixed(2)}s / {TOTAL_RUN_DURATION.toFixed(1)}s
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Kolom:{' '}
              <span className="text-sky-300 font-semibold">
                {activeColSpec.id === 'db5' ? 'DB-5 (Non-Polar)' : 'DB-WAX (Polar)'}
              </span>{' '}
              • Inj:{' '}
              <span className="text-amber-300">
                {effectiveParams.injectorTemp}°C
              </span>{' '}
              • Oven:{' '}
              <span className="text-orange-400">
                {ovenTemp}°C
              </span>{' '}
              • FID:{' '}
              <span className="text-cyan-300">
                {effectiveParams.detectorTemp}°C
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!isRunning && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startSeparationRun();
              }}
              className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/40 transition hover:bg-emerald-500/35"
              title="Jalankan / Putar Ulang Pemisahan Kromatografi"
            >
              {runCompleted ? (
                <>
                  <RotateCcw className="h-3 w-3" />
                  <span>Putar Ulang</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  <span>Mulai Simulasi</span>
                </>
              )}
            </button>
          )}

          {runCompleted && variant === 'hud' && (
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-amber-500/25 px-2.5 py-1 text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/40 transition hover:bg-amber-500/40"
            >
              <FileText className="h-3 w-3" />
              <span>Evaluasi & Laporan</span>
            </button>
          )}

          {variant === 'hud' && (
            <button
              onClick={() => setChartExpanded(!chartExpanded)}
              className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:border-sky-400 hover:text-white"
              title={chartExpanded ? 'Perkecil Grafik' : 'Perbesar Grafik'}
            >
              {chartExpanded ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {variant === 'hud' && onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:border-rose-400 hover:bg-rose-500/15 hover:text-rose-300"
              title="Tutup Grafik Kromatogram"
              aria-label="Tutup Grafik Kromatogram"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Baris Badge Anomali / Diagnosis Real-Time */}
      {activeAnomalyBadges.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {activeAnomalyBadges.map((b, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-semibold ${b.colorClass}`}
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Area Plot SVG Real-Time */}
      <div className="relative my-1.5 flex-1 rounded-xl border border-slate-800/90 bg-slate-900/75 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient id="chromAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.34" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 45, 90, 135, 180].map((mv) => {
            const y = mvToY(mv);
            return (
              <g key={mv}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="8.5"
                >
                  {mv}
                </text>
              </g>
            );
          })}

          {[0, 2, 4, 6, 8, 10].map((sec) => {
            const x = timeToX(sec);
            return (
              <g key={sec}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={height - padBottom}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padBottom + 13}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8.5"
                >
                  {sec.toFixed(1)}s
                </text>
              </g>
            );
          })}

          <text
            x={12}
            y={height / 2}
            transform={`rotate(-90, 12, ${height / 2})`}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="8.5"
          >
            Sinyal (mV)
          </text>
          <text
            x={padLeft + plotW / 2}
            y={height - 3}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="8.5"
          >
            Waktu Retensi tR (detik)
          </text>

          {areaPath && <path d={areaPath} fill="url(#chromAreaGrad)" />}

          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Puncak Pelarut (Solvent Peak) Sempit di Awal */}
          {!profile.isFlatline &&
            effectiveTime >= profile.solventPeak.retentionTime && (
              <g>
                <circle
                  cx={timeToX(profile.solventPeak.retentionTime)}
                  cy={mvToY(
                    evaluateDynamicSignalAtTime(
                      profile.solventPeak.retentionTime,
                      effectiveParams
                    )
                  )}
                  r={3.0}
                  fill="#94a3b8"
                  stroke="#090d16"
                  strokeWidth="1"
                />
                <text
                  x={timeToX(profile.solventPeak.retentionTime) + 4}
                  y={Math.max(
                    11,
                    mvToY(
                      evaluateDynamicSignalAtTime(
                        profile.solventPeak.retentionTime,
                        effectiveParams
                      )
                    ) - 6
                  )}
                  textAnchor="start"
                  fill="#cbd5e1"
                  fontSize="7.4"
                >
                  {profile.solventPeak.name} ({profile.solventPeak.retentionTime}s)
                </text>
              </g>
            )}

          {/* Ghost Peaks (Artefak Degradasi Termal) */}
          {!profile.isFlatline &&
            profile.ghostPeaks.map((ghost) => {
              if (effectiveTime < ghost.retentionTime) return null;
              const gMv = evaluateDynamicSignalAtTime(
                ghost.retentionTime,
                effectiveParams
              );
              const gx = timeToX(ghost.retentionTime);
              const gy = mvToY(gMv);
              return (
                <g key={ghost.id}>
                  <circle
                    cx={gx}
                    cy={gy}
                    r={2.8}
                    fill="#c084fc"
                    stroke="#090d16"
                    strokeWidth="1"
                  />
                  <text
                    x={gx}
                    y={Math.max(14, gy - 6)}
                    textAnchor="middle"
                    fill="#d8b4fe"
                    fontSize="7.2"
                  >
                    Artefak ({ghost.retentionTime}s)
                  </text>
                </g>
              );
            })}

          {/* 3 Puncak Senyawa Analit */}
          {!profile.isFlatline &&
            profile.peaks.map((peak, idx) => {
              if (
                peak.retentionTime <= 0 ||
                effectiveTime < peak.retentionTime - 0.12
              ) {
                return null;
              }
              const peakMv = evaluateDynamicSignalAtTime(
                peak.retentionTime,
                effectiveParams
              );
              const px = timeToX(peak.retentionTime);
              const py = mvToY(peakMv);
              const labelYOffset = profile.hasCoElution
                ? 8 + (idx % 3) * 10
                : 8;

              return (
                <g key={peak.id}>
                  <line
                    x1={px}
                    y1={py}
                    x2={px}
                    y2={height - padBottom}
                    stroke={peak.color}
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                    opacity={0.75}
                  />
                  <circle
                    cx={px}
                    cy={py}
                    r={3.8}
                    fill={peak.color}
                    stroke="#090d16"
                    strokeWidth="1.2"
                  />
                  <text
                    x={px}
                    y={Math.max(11, py - labelYOffset)}
                    textAnchor="middle"
                    fill={peak.color}
                    fontSize="8.0"
                    fontWeight="bold"
                  >
                    #{peak.peakNumber} {peak.name} ({peak.retentionTime.toFixed(1)}s)
                  </text>
                </g>
              );
            })}

          {isRunning && (
            <g>
              <circle
                cx={currentPoint.x}
                cy={currentPoint.y}
                r={4.5}
                fill={profile.isFlatline ? '#f43f5e' : '#22c55e'}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <text
                x={Math.min(width - 42, currentPoint.x + 8)}
                y={Math.max(16, currentPoint.y - 4)}
                fill={profile.isFlatline ? '#fda4af' : '#4ade80'}
                fontSize="8.5"
                fontWeight="bold"
              >
                {currentPoint.mv.toFixed(1)} mV
              </text>
            </g>
          )}
        </svg>

        {/* Banner Peringatan Ilmiah di Atas Grafik saat FLATLINE */}
        {profile.isFlatline && (isRunning || runCompleted) && (
          <div className="pointer-events-none absolute inset-x-3 top-3 rounded-xl border border-rose-500/60 bg-rose-950/90 p-2.5 text-[10px] leading-relaxed text-rose-100 shadow-lg">
            <div className="flex items-center gap-1.5 font-bold text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
              <span>{profile.failureTitle}</span>
            </div>
            <p className="mt-0.5 text-rose-200/95">
              {profile.failureExplanation}
            </p>
          </div>
        )}
      </div>

      {/* Legenda Bawah */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-slate-300">
        <div className="flex flex-wrap items-center gap-1.5">
          {profile.peaks.map((p) => {
            const hasEluted =
              !profile.isFlatline &&
              p.retentionTime > 0 &&
              effectiveTime >= p.retentionTime;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${
                  hasEluted
                    ? 'border-slate-700 bg-slate-900/90 text-white'
                    : 'border-slate-800/70 bg-slate-950/50 text-slate-500'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span>
                  {p.name}:{' '}
                  <strong className="text-sky-300">
                    {profile.isFlatline
                      ? 'Gagal'
                      : `${p.retentionTime.toFixed(2)}s`}
                  </strong>
                </span>
              </div>
            );
          })}
        </div>
        <span className="text-[9px] text-slate-400">
          {profile.isFlatline && (isRunning || runCompleted)
            ? '⚠️ GARIS DATAR (FLATLINE)'
            : isRunning
            ? '● Memisahkan molekul...'
            : runCompleted
            ? `✓ Selesai (Rs = ${profile.resolutionHexOct} & ${profile.resolutionOctDec})`
            : 'Menunggu injeksi sampel (Langkah 5)'}
        </span>
      </div>
    </div>
  );
};

export default ChromatogramChart;
