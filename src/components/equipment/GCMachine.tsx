import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  useLabStore,
  TOTAL_RUN_DURATION,
} from '../../store/useLabStore';
import {
  computeChromatogramProfile,
  computeParticleBandState,
  RunPhysicsParams,
  COLUMN_SPECS,
} from '../../utils/chromatographyPhysics';
import { soundEffects } from '../../utils/soundEffects';
import { LabPinLabel } from './LabPinLabel';

interface GCMachineProps {
  position?: [number, number, number];
}

const PARTICLES_PER_COMPOUND = 9;

export const GCMachine: React.FC<GCMachineProps> = ({
  position = [0.32, 0, -0.12],
}) => {
  const currentStep = useLabStore((s) => s.currentStep);
  const gasValveOpen = useLabStore((s) => s.gasValveOpen);
  const gasPressure = useLabStore((s) => s.gasPressure);
  const injectorTemp = useLabStore((s) => s.injectorTemp);
  const ovenTemp = useLabStore((s) => s.ovenTemp);
  const detectorTemp = useLabStore((s) => s.detectorTemp);
  const ovenMode = useLabStore((s) => s.ovenMode);
  const targetInjectorTemp = useLabStore((s) => s.targetInjectorTemp);
  const targetOvenTemp = useLabStore((s) => s.targetOvenTemp);
  const ovenRampMaxTemp = useLabStore((s) => s.ovenRampMaxTemp);
  const targetDetectorTemp = useLabStore((s) => s.targetDetectorTemp);
  const isConditioning = useLabStore((s) => s.isConditioning);
  const isConditioned = useLabStore((s) => s.isConditioned);
  const ovenDoorOpen = useLabStore((s) => s.ovenDoorOpen);
  const activeRunParams = useLabStore((s) => s.activeRunParams);
  const selectedSampleId = useLabStore((s) => s.selectedSampleId);
  const filledSampleId = useLabStore((s) => s.filledSampleId);
  const selectedColumnId = useLabStore((s) => s.selectedColumnId);
  const isRunning = useLabStore((s) => s.isRunning);
  const runElapsed = useLabStore((s) => s.runElapsed);
  const syringeState = useLabStore((s) => s.syringeState);

  const setInjectorTemp = useLabStore((s) => s.setInjectorTemp);
  const setOvenTemp = useLabStore((s) => s.setOvenTemp);
  const setDetectorTemp = useLabStore((s) => s.setDetectorTemp);
  const setIsConditioning = useLabStore((s) => s.setIsConditioning);
  const setIsConditioned = useLabStore((s) => s.setIsConditioned);
  const setGcModalOpen = useLabStore((s) => s.setGcModalOpen);
  const toggleOvenDoor = useLabStore((s) => s.toggleOvenDoor);
  const attemptInjectGC = useLabStore((s) => s.attemptInjectGC);
  const setCurrentStep = useLabStore((s) => s.setCurrentStep);
  const setIsRunning = useLabStore((s) => s.setIsRunning);
  const setRunElapsed = useLabStore((s) => s.setRunElapsed);
  const setRunCompleted = useLabStore((s) => s.setRunCompleted);
  const setReportModalOpen = useLabStore((s) => s.setReportModalOpen);
  const setActiveCameraTarget = useLabStore((s) => s.setActiveCameraTarget);

  const [hoveredPart, setHoveredPart] = useState<
    'injector' | 'oven_door' | 'fid' | 'panel' | null
  >(null);

  const doorPivotRef = useRef<THREE.Group>(null);
  const fanRef = useRef<THREE.Group>(null);

  const hexaneGroupRef = useRef<THREE.Group>(null);
  const octaneGroupRef = useRef<THREE.Group>(null);
  const decaneGroupRef = useRef<THREE.Group>(null);

  const fidFlashMeshRef = useRef<THREE.Mesh>(null);
  const fidFlashLightRef = useRef<THREE.PointLight>(null);

  const tempFloatRef = useRef({
    inj: injectorTemp,
    oven: ovenTemp,
    det: detectorTemp,
  });
  const runTimeRef = useRef<number>(0);
  const wasRunningRef = useRef<boolean>(false);
  const pingedPeaksRef = useRef<Set<number>>(new Set());

  if (isRunning && !wasRunningRef.current) {
    wasRunningRef.current = true;
    runTimeRef.current = 0;
    pingedPeaksRef.current.clear();
  } else if (!isRunning && wasRunningRef.current) {
    wasRunningRef.current = false;
  }

  const effectiveRunParams: RunPhysicsParams = useMemo(() => {
    if (activeRunParams) return activeRunParams;
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
    () => computeChromatogramProfile(effectiveRunParams),
    [effectiveRunParams]
  );

  // Saat pintu oven terbuka, Safety Thermal Interlock mematikan elemen pemanas
  const heaterActive = !ovenDoorOpen && ovenTemp > 30;
  const heatFactor = heaterActive
    ? THREE.MathUtils.clamp((ovenTemp - 25) / 175, 0.08, 1.0)
    : 0;

  // Tekstur Kanvas 3D untuk Layar OLED Panel Kontrol Depan GC
  const oledTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 192;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => {
    const canvas = oledTexture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#060c17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = ovenDoorOpen ? '#ef4444' : '#0284c7';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    ctx.fillStyle = ovenDoorOpen ? '#f87171' : '#38bdf8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      ovenDoorOpen ? 'GC-2030 INTERLOCK AKTIF' : 'GC-2030 KONTROL SUHU',
      14,
      28
    );

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, 38);
    ctx.lineTo(canvas.width - 14, 38);
    ctx.stroke();

    ctx.font = '13px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('INJEKTOR :', 16, 66);
    ctx.fillText('OVEN KOL :', 16, 98);
    ctx.fillText('DET FID  :', 16, 130);

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#fcd34d';
    ctx.fillText(`${injectorTemp} °C`, 132, 66);
    ctx.fillStyle = ovenDoorOpen ? '#f87171' : '#fb923c';
    ctx.fillText(`${ovenTemp} °C`, 132, 98);
    ctx.fillStyle = '#67e8f9';
    ctx.fillText(`${detectorTemp} °C`, 132, 130);

    ctx.fillStyle = ovenDoorOpen
      ? '#dc2626'
      : isConditioning
      ? '#f59e0b'
      : isConditioned
      ? '#10b981'
      : '#334155';
    ctx.fillRect(14, 148, canvas.width - 28, 28);

    ctx.fillStyle = ovenDoorOpen ? '#ffffff' : '#090d16';
    ctx.font = 'bold 12px monospace';
    const statusText = ovenDoorOpen
      ? 'PINTU BUKA: PEMANAS MATI'
      : isConditioning
      ? 'MEMANASKAN ZONA...'
      : isConditioned
      ? 'SUHU SIAP (TERKUNCI)'
      : 'KLIK ATUR SUHU GC';
    ctx.fillText(statusText, 24, 166);

    oledTexture.needsUpdate = true;
  }, [
    injectorTemp,
    ovenTemp,
    detectorTemp,
    isConditioning,
    isConditioned,
    ovenDoorOpen,
    oledTexture,
  ]);

  const { capillaryCurve, capillaryColumnGeometry } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    pts.push(new THREE.Vector3(-0.18, 0.34, 0.02));
    pts.push(new THREE.Vector3(-0.18, 0.16, 0.02));

    const turns = 7;
    const segmentsPerTurn = 24;
    const radius = 0.17;
    for (let i = 0; i <= turns * segmentsPerTurn; i++) {
      const t = i / (turns * segmentsPerTurn);
      const angle = t * turns * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = -0.04 + (t - 0.5) * 0.09;
      pts.push(new THREE.Vector3(x, y, z));
    }

    pts.push(new THREE.Vector3(0.18, 0.16, -0.01));
    pts.push(new THREE.Vector3(0.18, 0.34, -0.01));

    const curve = new THREE.CatmullRomCurve3(pts);
    const geom = new THREE.TubeGeometry(curve, 240, 0.0065, 12, false);
    return { capillaryCurve: curve, capillaryColumnGeometry: geom };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);

    // Animasi Engsel Pintu Oven
    if (doorPivotRef.current) {
      const targetAngle = ovenDoorOpen ? -Math.PI * 0.58 : 0;
      doorPivotRef.current.rotation.y = THREE.MathUtils.lerp(
        doorPivotRef.current.rotation.y,
        targetAngle,
        dt * 6
      );
    }

    // Putaran Kipas Sirkulasi Oven (Mati jika pintu oven dibuka karena Safety Interlock)
    if (fanRef.current) {
      const fanSpeed = ovenDoorOpen
        ? 0.4
        : ovenTemp > 30 || isConditioning || isRunning
        ? 9.0
        : 1.5;
      fanRef.current.rotation.z -= dt * fanSpeed;
    }

    // SAFETY THERMAL INTERLOCK: Jika pintu oven terbuka, pemanas mati & suhu oven turun cepat ke 25°C
    if (ovenDoorOpen) {
      tempFloatRef.current.oven = THREE.MathUtils.lerp(
        tempFloatRef.current.oven,
        25,
        dt * 3.4
      );
      const cooledOven = Math.max(25, Math.round(tempFloatRef.current.oven));
      if (cooledOven !== ovenTemp) {
        setOvenTemp(cooledOven);
      }
    }

    if (isConditioning && !ovenDoorOpen) {
      tempFloatRef.current.inj = THREE.MathUtils.lerp(
        tempFloatRef.current.inj,
        targetInjectorTemp,
        dt * 2.5
      );
      tempFloatRef.current.oven = THREE.MathUtils.lerp(
        tempFloatRef.current.oven,
        targetOvenTemp,
        dt * 2.5
      );
      tempFloatRef.current.det = THREE.MathUtils.lerp(
        tempFloatRef.current.det,
        targetDetectorTemp,
        dt * 2.5
      );

      const newInj = Math.round(tempFloatRef.current.inj);
      const newOven = Math.round(tempFloatRef.current.oven);
      const newDet = Math.round(tempFloatRef.current.det);

      if (newInj !== injectorTemp) setInjectorTemp(newInj);
      if (newOven !== ovenTemp) setOvenTemp(newOven);
      if (newDet !== detectorTemp) setDetectorTemp(newDet);

      if (
        Math.abs(tempFloatRef.current.inj - targetInjectorTemp) < 1.2 &&
        Math.abs(tempFloatRef.current.oven - targetOvenTemp) < 1.2 &&
        Math.abs(tempFloatRef.current.det - targetDetectorTemp) < 1.2
      ) {
        setInjectorTemp(targetInjectorTemp);
        setOvenTemp(targetOvenTemp);
        setDetectorTemp(targetDetectorTemp);
        setIsConditioning(false);
        setIsConditioned(true);
        if (currentStep <= 2) {
          setCurrentStep(3);
        }
      }
    } else if (isRunning) {
      runTimeRef.current += dt;
      const tSim = runTimeRef.current;

      if (Math.abs(tSim - runElapsed) >= 0.04 || tSim >= TOTAL_RUN_DURATION) {
        setRunElapsed(Math.min(TOTAL_RUN_DURATION, Number(tSim.toFixed(2))));
      }

      // Hanya naikkan suhu gradien oven jika pintu tertutup dan mesin tidak dingin
      if (!ovenDoorOpen && effectiveRunParams.ovenStartTemp >= 40) {
        const progress = Math.min(1, tSim / TOTAL_RUN_DURATION);
        const rampedOven = Math.round(
          effectiveRunParams.ovenStartTemp +
            (effectiveRunParams.ovenEndTemp - effectiveRunParams.ovenStartTemp) *
              progress
        );
        if (rampedOven !== ovenTemp) {
          setOvenTemp(rampedOven);
          tempFloatRef.current.oven = rampedOven;
        }
      }

      // Pergerakan 3 Kelompok Partikel Molekul secara dinamis berdasarkan parameter suhu & gas
      const groupRefs = [hexaneGroupRef, octaneGroupRef, decaneGroupRef];
      activeProfile.peaks.forEach((_, cIdx) => {
        const grp = groupRefs[cIdx].current;
        if (!grp) return;

        const bandState = computeParticleBandState(
          tSim,
          cIdx,
          effectiveRunParams,
          ovenDoorOpen
        );

        grp.children.forEach((particleMesh, pIdx) => {
          if (!bandState.visible) {
            particleMesh.visible = false;
            return;
          }
          const normalizedOffset =
            (pIdx - (PARTICLES_PER_COMPOUND - 1) / 2) / PARTICLES_PER_COMPOUND;
          const uParticle =
            bandState.uCenter + normalizedOffset * bandState.bandSpread;

          if (uParticle >= 0 && uParticle <= 1.0) {
            particleMesh.visible = true;
            const pt = capillaryCurve.getPointAt(uParticle);
            particleMesh.position.copy(pt);
          } else {
            particleMesh.visible = false;
          }
        });
      });

      // Kilatan Detektor FID & Bunyi Ping saat masing-masing senyawa mencapai ujung kolom
      let activeFlashColor: string | null = null;
      let flashStrength = 0;

      if (!activeProfile.isFlatline) {
        for (const peak of activeProfile.peaks) {
          if (peak.retentionTime <= 0) continue;
          if (
            tSim >= peak.retentionTime - 0.05 &&
            !pingedPeaksRef.current.has(peak.peakNumber)
          ) {
            pingedPeaksRef.current.add(peak.peakNumber);
            soundEffects.playPeakPing(peak.peakNumber);
          }
          const dist = Math.abs(tSim - peak.retentionTime);
          if (dist < 0.32) {
            const strength = 1 - dist / 0.32;
            if (strength > flashStrength) {
              flashStrength = strength;
              activeFlashColor = peak.color;
            }
          }
        }
      }

      if (fidFlashMeshRef.current && fidFlashLightRef.current) {
        if (activeFlashColor && flashStrength > 0.05) {
          fidFlashMeshRef.current.visible = true;
          const scale = 1 + flashStrength * 1.8;
          fidFlashMeshRef.current.scale.set(scale, scale, scale);
          (
            fidFlashMeshRef.current.material as THREE.MeshBasicMaterial
          ).color.set(activeFlashColor);
          fidFlashLightRef.current.intensity = flashStrength * 4.5;
          fidFlashLightRef.current.color.set(activeFlashColor);
        } else {
          fidFlashMeshRef.current.visible = false;
          fidFlashLightRef.current.intensity = 0;
        }
      }

      if (tSim >= TOTAL_RUN_DURATION) {
        soundEffects.playAnalysisCompleteChime();
        setIsRunning(false);
        setRunCompleted(true);
        setCurrentStep(7);
        setReportModalOpen(true);
      }
    } else {
      tempFloatRef.current.inj = injectorTemp;
      if (!ovenDoorOpen) {
        tempFloatRef.current.oven = ovenTemp;
      }
      tempFloatRef.current.det = detectorTemp;
      // Sembunyikan partikel saat tidak sedang running
      [hexaneGroupRef, octaneGroupRef, decaneGroupRef].forEach((ref) => {
        if (ref.current) {
          ref.current.children.forEach((c) => {
            c.visible = false;
          });
        }
      });
      if (fidFlashMeshRef.current && fidFlashLightRef.current) {
        fidFlashMeshRef.current.visible = false;
        fidFlashLightRef.current.intensity = 0;
      }
    }
  });

  const handlePanelClick = (e: any) => {
    e.stopPropagation();
    setActiveCameraTarget('gc_unit');
    setGcModalOpen(true);
  };

  const handleInjectorClick = (e: any) => {
    e.stopPropagation();
    attemptInjectGC();
  };

  const isStep2Target = currentStep === 2 && !isConditioned;
  const isStep5Target =
    currentStep === 5 ||
    (syringeState === 'filled' && !isRunning && currentStep < 6);

  const elutingCompound =
    isRunning && !activeProfile.isFlatline
      ? activeProfile.peaks.find(
          (p) => Math.abs(runElapsed - p.retentionTime) < 0.35
        )
      : null;

  return (
    <group position={position}>
      {/* =================================================================== */}
      {/* RANGKA UTAMA MESIN GC                                               */}
      {/* =================================================================== */}
      <RoundedBox
        args={[1.52, 0.08, 0.92]}
        position={[0, 0.04, 0]}
        radius={0.015}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.35} />
      </RoundedBox>

      <RoundedBox
        args={[1.5, 0.78, 0.54]}
        position={[0, 0.46, -0.18]}
        radius={0.02}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.35} />
      </RoundedBox>

      <RoundedBox
        args={[0.12, 0.78, 0.38]}
        position={[-0.69, 0.46, 0.26]}
        radius={0.012}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.35} />
      </RoundedBox>

      <RoundedBox
        args={[1.02, 0.11, 0.38]}
        position={[-0.24, 0.795, 0.26]}
        radius={0.012}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
      </RoundedBox>

      <RoundedBox
        args={[0.48, 0.78, 0.4]}
        position={[0.51, 0.46, 0.25]}
        radius={0.016}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#1e293b"
          emissive="#38bdf8"
          emissiveIntensity={hoveredPart === 'panel' || isStep2Target ? 0.16 : 0}
          metalness={0.55}
          roughness={0.32}
        />
      </RoundedBox>

      {/* =================================================================== */}
      {/* RUANG OVEN KOLOM: Elemen Pemanas, Kolom Kapiler & Partikel Molekul  */}
      {/* =================================================================== */}
      <group position={[-0.2, 0.42, 0.14]}>
        <mesh position={[0, 0, -0.05]} receiveShadow>
          <boxGeometry args={[0.76, 0.56, 0.02]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.22} />
        </mesh>

        {/* Cahaya Pemanas Oven (Mati otomatis jika Pintu Oven Terbuka karena Safety Interlock) */}
        <pointLight
          position={[0, 0, 0.08]}
          color={ovenDoorOpen ? '#38bdf8' : '#f97316'}
          intensity={heaterActive ? 1.1 + 2.4 * heatFactor : 0.2}
          distance={1.35}
        />

        <mesh position={[0, 0, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.015, 28]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        <group ref={fanRef} position={[0, 0, -0.02]}>
          {[0, Math.PI / 3, (2 * Math.PI) / 3].map((rot, idx) => (
            <mesh key={idx} rotation={[0, 0, rot]}>
              <boxGeometry args={[0.21, 0.032, 0.006]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
            </mesh>
          ))}
        </group>

        {/* Koil Elemen Pemanas Oven (Menyala Merah/Oranye saat Pintu Tertutup & Dipanaskan) */}
        {[0.11, 0.145].map((r, idx) => (
          <mesh key={idx} position={[0, 0, -0.01]}>
            <torusGeometry args={[r, 0.0095, 16, 40]} />
            <meshStandardMaterial
              color={heaterActive ? '#fb923c' : '#475569'}
              emissive="#f97316"
              emissiveIntensity={heaterActive ? 0.95 + 2.2 * heatFactor : 0.04}
              roughness={0.25}
            />
          </mesh>
        ))}

        {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((rot, idx) => (
          <mesh key={idx} position={[0, 0, 0.03]} rotation={[0, 0, rot]}>
            <cylinderGeometry args={[0.004, 0.004, 0.39, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
          </mesh>
        ))}

        {/* Gulungan Kolom Kapiler Fused-Silica (Terlihat jelas melalui jendela kaca pintu oven) */}
        <mesh geometry={capillaryColumnGeometry} position={[0, 0, 0.03]}>
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={heaterActive ? 0.25 + 0.3 * heatFactor : 0.1}
            metalness={isRunning ? 0.25 : 0.85}
            roughness={0.18}
            transparent
            opacity={isRunning ? 0.35 : 0.92}
            depthWrite={!isRunning}
          />
        </mesh>

        {/* 3 Kelompok Partikel Molekul di dalam Kolom Kapiler */}
        <group position={[0, 0, 0.03]}>
          <group ref={hexaneGroupRef}>
            {Array.from({ length: PARTICLES_PER_COMPOUND }).map((_, i) => (
              <mesh key={`hex-${i}`} visible={false} renderOrder={2}>
                <sphereGeometry args={[0.014, 12, 12]} />
                <meshBasicMaterial color="#22c55e" />
              </mesh>
            ))}
          </group>

          <group ref={octaneGroupRef}>
            {Array.from({ length: PARTICLES_PER_COMPOUND }).map((_, i) => (
              <mesh key={`oct-${i}`} visible={false} renderOrder={2}>
                <sphereGeometry args={[0.015, 12, 12]} />
                <meshBasicMaterial color="#38bdf8" />
              </mesh>
            ))}
          </group>

          <group ref={decaneGroupRef}>
            {Array.from({ length: PARTICLES_PER_COMPOUND }).map((_, i) => (
              <mesh key={`dec-${i}`} visible={false} renderOrder={2}>
                <sphereGeometry args={[0.016, 12, 12]} />
                <meshBasicMaterial color="#f97316" />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      {/* =================================================================== */}
      {/* PINTU OVEN KOLOM DENGAN JENDELA KACA TRANSPARAN (VIEWING WINDOW)    */}
      {/* =================================================================== */}
      <group
        ref={doorPivotRef}
        position={[-0.62, 0.42, 0.44]}
        onClick={(e) => {
          e.stopPropagation();
          toggleOvenDoor();
          setActiveCameraTarget('gc_unit');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart('oven_door');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <group position={[0.42, 0, 0]}>
          {/* Bingkai Logam Luar Pintu Oven (Solid dengan lubang Viewing Window di tengah) */}
          {[
            {
              pos: [0, 0.28, 0] as [number, number, number],
              args: [0.84, 0.065, 0.036] as [number, number, number],
            },
            {
              pos: [0, -0.28, 0] as [number, number, number],
              args: [0.84, 0.065, 0.036] as [number, number, number],
            },
            {
              pos: [-0.39, 0, 0] as [number, number, number],
              args: [0.065, 0.5, 0.036] as [number, number, number],
            },
            {
              pos: [0.39, 0, 0] as [number, number, number],
              args: [0.065, 0.5, 0.036] as [number, number, number],
            },
          ].map((strip, idx) => (
            <mesh key={idx} position={strip.pos} castShadow>
              <boxGeometry args={strip.args} />
              <meshStandardMaterial
                color={ovenDoorOpen ? '#7f1d1d' : '#334155'}
                emissive={ovenDoorOpen ? '#ef4444' : '#38bdf8'}
                emissiveIntensity={
                  hoveredPart === 'oven_door'
                    ? 0.42
                    : ovenDoorOpen
                    ? 0.25
                    : 0
                }
                metalness={0.72}
                roughness={0.28}
              />
            </mesh>
          ))}

          {/* Lis Bezel Dalam Jendela Kaca (Viewing Window Frame) */}
          {[
            {
              pos: [0, 0.242, 0.008] as [number, number, number],
              args: [0.715, 0.014, 0.024] as [number, number, number],
            },
            {
              pos: [0, -0.242, 0.008] as [number, number, number],
              args: [0.715, 0.014, 0.024] as [number, number, number],
            },
            {
              pos: [-0.352, 0, 0.008] as [number, number, number],
              args: [0.014, 0.49, 0.024] as [number, number, number],
            },
            {
              pos: [0.352, 0, 0.008] as [number, number, number],
              args: [0.014, 0.49, 0.024] as [number, number, number],
            },
          ].map((bezel, bIdx) => (
            <mesh key={`bezel-${bIdx}`} position={bezel.pos}>
              <boxGeometry args={bezel.args} />
              <meshStandardMaterial
                color="#94a3b8"
                metalness={0.88}
                roughness={0.2}
              />
            </mesh>
          ))}

          {/* Jendela Kaca Borosilikat Transparan (Viewing Window Tengah) */}
          {/* depthWrite={false} memastikan kolom, elemen pemanas, dan partikel 3D di belakang kaca selalu terlihat jernih */}
          <mesh position={[0, 0, 0.004]} renderOrder={3}>
            <planeGeometry args={[0.7, 0.47]} />
            <meshPhysicalMaterial
              color="#e0f2fe"
              transparent
              opacity={0.11}
              roughness={0.04}
              metalness={0.05}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Pegangan (Handle) Pintu Oven */}
          <mesh position={[0.385, 0, 0.035]}>
            <boxGeometry args={[0.028, 0.24, 0.025]} />
            <meshStandardMaterial
              color={
                ovenDoorOpen
                  ? '#f87171'
                  : hoveredPart === 'oven_door'
                  ? '#38bdf8'
                  : '#cbd5e1'
              }
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>

          {/* Label Pintu Oven */}
          <LabPinLabel
            position={[0, 0.05, 0.04]}
            title={`Oven Kolom (${COLUMN_SPECS[selectedColumnId].name})`}
            subtitle={
              ovenDoorOpen
                ? `TERBUKA (Pendinginan • ${ovenTemp} °C)`
                : `TERTUTUP (Terkunci • ${ovenTemp} °C)`
            }
            badgeText={
              ovenDoorOpen
                ? '⚠️ Interlock Aktif: Klik Tutup Pintu!'
                : 'Klik Buka/Tutup Pintu'
            }
            isActiveOrHovered={hoveredPart === 'oven_door' || ovenDoorOpen}
            isStepTarget={ovenDoorOpen}
            dotColor={ovenDoorOpen ? '#ef4444' : '#f97316'}
          />
        </group>
      </group>

      {/* =================================================================== */}
      {/* KIRI-ATAS: PORT INJEKTOR (SEPTUM)                                   */}
      {/* =================================================================== */}
      <group
        position={[-0.38, 0.85, 0.16]}
        onClick={handleInjectorClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart('injector');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.12, 0.08, 28]} />
          <meshStandardMaterial
            color="#334155"
            emissive="#f59e0b"
            emissiveIntensity={
              hoveredPart === 'injector' || isStep5Target
                ? 0.55
                : injectorTemp > 100
                ? 0.2
                : 0
            }
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>

        <mesh position={[0, 0.095, 0]} castShadow>
          <cylinderGeometry args={[0.068, 0.075, 0.038, 24]} />
          <meshStandardMaterial
            color="#d97706"
            emissive="#38bdf8"
            emissiveIntensity={hoveredPart === 'injector' ? 0.55 : 0.05}
            metalness={0.88}
            roughness={0.2}
          />
        </mesh>

        <mesh position={[0, 0.115, 0]}>
          <cylinderGeometry args={[0.034, 0.034, 0.006, 24]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={
              hoveredPart === 'injector' || isStep5Target ? 0.85 : 0.25
            }
            roughness={0.4}
          />
        </mesh>

        <mesh position={[0, 0.119, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.004, 0.012, 16]} />
          <meshBasicMaterial color="#fef2f2" />
        </mesh>

        <LabPinLabel
          position={[0, 0.23, 0]}
          title="Port Injektor"
          subtitle={`Suhu: ${injectorTemp} °C`}
          badgeText={isStep5Target ? 'Klik Suntik Sampel' : undefined}
          isActiveOrHovered={hoveredPart === 'injector' || isStep5Target}
          isStepTarget={isStep5Target}
          dotColor="#f59e0b"
        />
      </group>

      {/* =================================================================== */}
      {/* KANAN-ATAS: UNIT DETEKTOR FID + EFEK KILATAN ELUSI                  */}
      {/* =================================================================== */}
      <group
        position={[0.02, 0.85, 0.08]}
        onClick={(e) => {
          e.stopPropagation();
          setActiveCameraTarget('gc_unit');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart('fid');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh position={[0, 0.045, 0]} castShadow>
          <cylinderGeometry args={[0.105, 0.115, 0.09, 28]} />
          <meshStandardMaterial
            color="#1e293b"
            emissive="#38bdf8"
            emissiveIntensity={hoveredPart === 'fid' ? 0.45 : 0.05}
            metalness={0.75}
            roughness={0.28}
          />
        </mesh>

        <mesh position={[0, 0.135, 0]} castShadow>
          <cylinderGeometry args={[0.062, 0.068, 0.1, 24]} />
          <meshStandardMaterial
            color="#cbd5e1"
            emissive="#06b6d4"
            emissiveIntensity={hoveredPart === 'fid' ? 0.4 : 0.05}
            metalness={0.92}
            roughness={0.18}
          />
        </mesh>

        <mesh position={[0, 0.188, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.02, 0.045, 24]} />
          <meshBasicMaterial
            color={detectorTemp > 100 || isRunning ? '#38bdf8' : '#475569'}
          />
        </mesh>

        <mesh ref={fidFlashMeshRef} position={[0, 0.21, 0]} visible={false}>
          <sphereGeometry args={[0.055, 20, 20]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.85} />
        </mesh>
        <pointLight
          ref={fidFlashLightRef}
          position={[0, 0.24, 0]}
          intensity={0}
          distance={1.6}
        />

        <mesh
          position={[0.08, 0.12, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.014, 0.014, 0.06, 16]} />
          <meshStandardMaterial
            color="#d97706"
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>

        <LabPinLabel
          position={[0.04, 0.29, 0]}
          title="Unit Detektor FID"
          subtitle={`Suhu: ${detectorTemp} °C`}
          badgeText={
            elutingCompound
              ? `⚡ ${elutingCompound.name} (${elutingCompound.retentionTime}s)`
              : undefined
          }
          isActiveOrHovered={hoveredPart === 'fid' || Boolean(elutingCompound)}
          isStepTarget={Boolean(elutingCompound)}
          dotColor="#06b6d4"
        />
      </group>

      {/* =================================================================== */}
      {/* PANEL KONTROL DEPAN & LAYAR SUHU DIGITAL (Tekstur 3D Murni)         */}
      {/* =================================================================== */}
      <group
        position={[0.51, 0.48, 0.455]}
        onClick={handlePanelClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart('panel');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh position={[0, 0.12, 0.002]}>
          <planeGeometry args={[0.38, 0.28]} />
          <meshBasicMaterial map={oledTexture} />
        </mesh>

        {[-0.12, -0.04, 0.04, 0.12].map((bx, i) => (
          <mesh key={i} position={[bx, -0.1, 0.008]}>
            <boxGeometry args={[0.055, 0.032, 0.012]} />
            <meshStandardMaterial
              color={i === 0 ? '#10b981' : i === 3 ? '#f59e0b' : '#334155'}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        ))}

        <mesh
          position={[0.11, -0.21, 0.018]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.042, 0.046, 0.028, 24]} />
          <meshStandardMaterial
            color={hoveredPart === 'panel' ? '#38bdf8' : '#94a3b8'}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>

        <LabPinLabel
          position={[0, 0.34, 0.02]}
          title="Panel Kontrol Suhu GC"
          subtitle={`${injectorTemp}° / ${ovenTemp}° / ${detectorTemp} °C`}
          badgeText={isStep2Target ? 'Klik Atur Suhu GC' : undefined}
          isActiveOrHovered={hoveredPart === 'panel' || isStep2Target}
          isStepTarget={isStep2Target}
          dotColor="#38bdf8"
        />
      </group>
    </group>
  );
};

export default GCMachine;
