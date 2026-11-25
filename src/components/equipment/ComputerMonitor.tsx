import React, { useEffect, useMemo, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  useLabStore,
  TOTAL_RUN_DURATION,
} from '../../store/useLabStore';
import {
  computeChromatogramProfile,
  evaluateDynamicSignalAtTime,
  RunPhysicsParams,
} from '../../utils/chromatographyPhysics';
import { LabPinLabel } from './LabPinLabel';

interface ComputerMonitorProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const ComputerMonitor: React.FC<ComputerMonitorProps> = ({
  position = [2.22, 0, -0.05],
  rotation = [0, -0.18, 0],
}) => {
  const currentStep = useLabStore((s) => s.currentStep);
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
  const setActiveCameraTarget = useLabStore((s) => s.setActiveCameraTarget);
  const setReportModalOpen = useLabStore((s) => s.setReportModalOpen);

  const [hovered, setHovered] = useState(false);

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

  // Tekstur Kanvas 3D untuk Layar Monitor PC (Murni di ruang 3D WebGL, tanpa <Html transform>)
  const monitorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 320;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => {
    const canvas = monitorTexture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Latar belakang layar
    ctx.fillStyle = '#050b14';
    ctx.fillRect(0, 0, W, H);

    // Header Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, 36);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('STASIUN AKUISISI DATA KROMATOGRAFI GAS (GC-FID)', 14, 23);

    // Area Grafik Kiri
    const plotX = 42;
    const plotY = 50;
    const plotW = 365;
    const plotH = 225;

    ctx.fillStyle = '#09111e';
    ctx.fillRect(plotX, plotY, plotW, plotH);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(plotX, plotY, plotW, plotH);

    // Garis Grid
    ctx.strokeStyle = '#1e293b';
    for (let i = 1; i <= 4; i++) {
      const gy = plotY + (plotH * i) / 5;
      ctx.beginPath();
      ctx.moveTo(plotX, gy);
      ctx.lineTo(plotX + plotW, gy);
      ctx.stroke();
    }
    for (let sec = 2; sec <= 8; sec += 2) {
      const gx = plotX + (sec / TOTAL_RUN_DURATION) * plotW;
      ctx.beginPath();
      ctx.moveTo(gx, plotY);
      ctx.lineTo(gx, plotY + plotH);
      ctx.stroke();
    }

    // Kurva Sinyal Kromatogram
    const effectiveTime = isRunning
      ? runElapsed
      : runCompleted
      ? TOTAL_RUN_DURATION
      : 0;

    if (effectiveTime > 0.02) {
      ctx.strokeStyle = profile.isFlatline ? '#f43f5e' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const dt = 0.04;
      let first = true;
      for (let t = 0; t <= effectiveTime; t += dt) {
        const mv = evaluateDynamicSignalAtTime(t, effectiveParams);
        const px = plotX + (t / TOTAL_RUN_DURATION) * plotW;
        const py = plotY + plotH - (Math.min(180, mv) / 180) * (plotH - 16);
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      if (profile.isFlatline) {
        ctx.fillStyle = '#fda4af';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(
          profile.failureKind === 'no_carrier_gas'
            ? 'GAGAL ELUSI: GAS He TERTUTUP (FLATLINE)'
            : 'GAGAL VAPORISASI: GC DINGIN (FLATLINE)',
          plotX + 26,
          plotY + plotH / 2
        );
      } else {
        // Label Puncak yang sudah muncul
        profile.peaks.forEach((p) => {
          if (p.retentionTime > 0 && effectiveTime >= p.retentionTime) {
            const mv = evaluateDynamicSignalAtTime(
              p.retentionTime,
              effectiveParams
            );
            const px = plotX + (p.retentionTime / TOTAL_RUN_DURATION) * plotW;
            const py = plotY + plotH - (Math.min(180, mv) / 180) * (plotH - 16);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = 'bold 11px monospace';
            ctx.fillText(
              `${p.name} (${p.retentionTime.toFixed(1)}s)`,
              px - 36,
              Math.max(plotY + 14, py - 8)
            );
          }
        });
      }
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.fillText(
        'Menunggu Injeksi Sampel (Langkah 5)...',
        plotX + 60,
        plotY + plotH / 2
      );
    }

    // Label Sumbu
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      'Waktu Retensi tR (0 - 10 detik)',
      plotX + 95,
      plotY + plotH + 20
    );

    // Panel Status Kanan di dalam Layar Monitor
    const sideX = 420;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sideX, plotY, 126, plotH);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(sideX, plotY, 126, plotH);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('PORT INJEKTOR', sideX + 10, plotY + 24);
    ctx.fillText('OVEN KOLOM', sideX + 10, plotY + 74);
    ctx.fillText('DETEKTOR FID', sideX + 10, plotY + 124);
    ctx.fillText('TEKANAN He', sideX + 10, plotY + 174);

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#fcd34d';
    ctx.fillText(`${injectorTemp} °C`, sideX + 10, plotY + 44);
    ctx.fillStyle = ovenDoorOpen ? '#f87171' : '#fb923c';
    ctx.fillText(`${ovenTemp} °C`, sideX + 10, plotY + 94);
    ctx.fillStyle = '#67e8f9';
    ctx.fillText(`${detectorTemp} °C`, sideX + 10, plotY + 144);
    ctx.fillStyle = gasValveOpen ? '#34d399' : '#f87171';
    ctx.fillText(`${gasPressure} psi`, sideX + 10, plotY + 194);

    monitorTexture.needsUpdate = true;
  }, [
    runElapsed,
    isRunning,
    runCompleted,
    effectiveParams,
    profile,
    injectorTemp,
    ovenTemp,
    detectorTemp,
    gasPressure,
    gasValveOpen,
    ovenDoorOpen,
    monitorTexture,
  ]);

  const handleMonitorClick = (e: any) => {
    e.stopPropagation();
    setActiveCameraTarget('monitor');
    if (runCompleted) {
      setReportModalOpen(true);
    }
  };

  const isStep7Target = currentStep === 7;

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={handleMonitorClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Dudukan Kaki Monitor */}
      <RoundedBox
        args={[0.46, 0.022, 0.32]}
        position={[0, 0.011, 0]}
        radius={0.008}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
      </RoundedBox>

      {/* Tiang Penyangga Monitor */}
      <RoundedBox
        args={[0.085, 0.44, 0.045]}
        position={[0, 0.23, -0.08]}
        rotation={[-0.08, 0, 0]}
        radius={0.008}
        smoothness={4}
        castShadow
      >
        <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.22} />
      </RoundedBox>

      {/* Bingkai Layar Monitor 27" */}
      <group position={[0, 0.56, -0.02]}>
        <RoundedBox
          args={[1.18, 0.72, 0.042]}
          radius={0.016}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#0f172a"
            emissive="#06b6d4"
            emissiveIntensity={hovered || isStep7Target ? 0.32 : 0.04}
            metalness={0.75}
            roughness={0.25}
          />
        </RoundedBox>

        {/* Permukaan Layar Monitor dengan Tekstur Kanvas 3D Murni */}
        <mesh position={[0, 0.01, 0.022]}>
          <planeGeometry args={[1.12, 0.65]} />
          <meshBasicMaterial map={monitorTexture} />
        </mesh>

        {/* Lampu Indikator Daya */}
        <mesh position={[0.51, -0.335, 0.023]}>
          <sphereGeometry args={[0.007, 12, 12]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      </group>

      {/* Papan Ketik (Keyboard) & Tetikus (Mouse) */}
      <group position={[0, 0.015, 0.34]}>
        <RoundedBox
          args={[0.48, 0.018, 0.16]}
          position={[-0.08, 0, 0]}
          radius={0.005}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
        </RoundedBox>
        <mesh position={[-0.08, 0.011, 0]}>
          <boxGeometry args={[0.44, 0.004, 0.13]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>

        <RoundedBox
          args={[0.068, 0.024, 0.11]}
          position={[0.26, 0.004, 0.01]}
          radius={0.01}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
        </RoundedBox>
      </group>

      {/* Label 3D Monitor PC (Hanya muncul saat di-hover atau saat Langkah 7) */}
      <LabPinLabel
        position={[0, 0.98, 0]}
        title="Monitor PC Akuisisi Data"
        subtitle={
          isRunning
            ? `Akuisisi: ${runElapsed.toFixed(1)} dtk`
            : runCompleted
            ? 'Akuisisi Selesai (3 Puncak)'
            : 'Grafik Kromatogram & Suhu'
        }
        badgeText={isStep7Target ? 'Klik Buka Laporan' : undefined}
        isActiveOrHovered={hovered || isStep7Target}
        isStepTarget={isStep7Target}
        dotColor="#06b6d4"
      />
    </group>
  );
};

export default ComputerMonitor;
