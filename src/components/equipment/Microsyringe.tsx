import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  useLabStore,
  SYRINGE_STATE_LABELS,
} from '../../store/useLabStore';
import { SAMPLE_BOTTLE_SPECS } from '../../utils/chromatographyPhysics';
import { LabPinLabel } from './LabPinLabel';

interface MicrosyringeProps {
  position?: [number, number, number];
}

export const Microsyringe: React.FC<MicrosyringeProps> = ({
  position = [0.44, 0, 0.02],
}) => {
  const currentStep = useLabStore((s) => s.currentStep);
  const syringeState = useLabStore((s) => s.syringeState);
  const syringeSelected = useLabStore((s) => s.syringeSelected);
  const syringeAnimPhase = useLabStore((s) => s.syringeAnimPhase);
  const selectedSampleId = useLabStore((s) => s.selectedSampleId);
  const filledSampleId = useLabStore((s) => s.filledSampleId);
  const setSyringeState = useLabStore((s) => s.setSyringeState);
  const setSyringeSelected = useLabStore((s) => s.setSyringeSelected);
  const setSyringeAnimPhase = useLabStore((s) => s.setSyringeAnimPhase);
  const setCurrentStep = useLabStore((s) => s.setCurrentStep);
  const startSeparationRun = useLabStore((s) => s.startSeparationRun);
  const setActiveCameraTarget = useLabStore((s) => s.setActiveCameraTarget);

  const [hovered, setHovered] = useState(false);

  const syringeBodyRef = useRef<THREE.Group>(null);
  const plungerGroupRef = useRef<THREE.Group>(null);
  const liquidMeshRef = useRef<THREE.Mesh>(null);
  const animElapsedRef = useRef<number>(0);
  const activePhaseRef = useRef<string>('idle');

  if (activePhaseRef.current !== syringeAnimPhase) {
    activePhaseRef.current = syringeAnimPhase;
    animElapsedRef.current = 0;
  }

  // Posisi X relatif botol sampel dari dudukan suntikan (x = 0.44, rak di x = -0.18)
  const sampleVialRelX =
    selectedSampleId === 'sample_a'
      ? -0.62
      : selectedSampleId === 'sample_b'
      ? -0.45
      : -0.28;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (
      !syringeBodyRef.current ||
      !plungerGroupRef.current ||
      !liquidMeshRef.current
    ) {
      return;
    }

    animElapsedRef.current += dt;
    const t = animElapsedRef.current;

    let targetPos = new THREE.Vector3(0, 0.165, -0.01);
    let targetRotX = Math.PI / 2 - 0.34;
    let targetPlunger =
      syringeState === 'filled'
        ? 0.05
        : syringeState === 'cleaned'
        ? 0.005
        : 0.0;
    let targetLiquidScale =
      syringeState === 'filled'
        ? 0.65
        : syringeState === 'cleaned'
        ? 0.08
        : 0.01;

    if (syringeAnimPhase === 'selected') {
      targetPos.set(-0.14, 0.56, -0.02);
      targetRotX = 0;
    } else if (syringeAnimPhase === 'ready_to_inject') {
      targetPos.set(-0.1, 0.58, -0.02);
      targetRotX = 0;
      targetPlunger = 0.05;
      targetLiquidScale = 0.65;
    } else if (syringeAnimPhase === 'washing_acetone') {
      // Botol Aseton di x_rel = -0.96, Botol Limbah di x_rel = -0.79
      targetRotX = 0;
      if (t < 0.75) {
        targetPos.set(-0.96, 0.58, -0.02);
        targetPlunger = 0;
        targetLiquidScale = 0.02;
      } else if (t < 1.25) {
        targetPos.set(-0.96, 0.41, -0.02);
        targetPlunger = 0;
        targetLiquidScale = 0.02;
      } else if (t < 1.8) {
        targetPos.set(-0.96, 0.41, -0.02);
        targetPlunger = 0.085;
        targetLiquidScale = 0.95;
      } else if (t < 2.15) {
        targetPos.set(-0.96, 0.41, -0.02);
        targetPlunger = 0.025;
        targetLiquidScale = 0.3;
      } else if (t < 2.55) {
        targetPos.set(-0.96, 0.41, -0.02);
        targetPlunger = 0.085;
        targetLiquidScale = 0.95;
      } else if (t < 3.05) {
        targetPos.set(-0.79, 0.58, -0.02);
        targetPlunger = 0.085;
        targetLiquidScale = 0.95;
      } else if (t < 3.45) {
        targetPos.set(-0.79, 0.44, -0.02);
        targetPlunger = 0.085;
        targetLiquidScale = 0.95;
      } else if (t < 4.0) {
        targetPos.set(-0.79, 0.44, -0.02);
        targetPlunger = 0.0;
        targetLiquidScale = 0.02;
      } else {
        setSyringeState('cleaned');
        setSyringeAnimPhase('selected');
        if (currentStep <= 3) {
          setCurrentStep(4);
        }
      }
    } else if (syringeAnimPhase === 'drawing_sample') {
      // Bergerak tepat ke atas Botol Sampel A (-0.62), B (-0.45), atau C (-0.28)
      targetRotX = 0;
      if (t < 0.65) {
        targetPos.set(sampleVialRelX, 0.58, -0.02);
        targetPlunger = 0;
        targetLiquidScale = 0.02;
      } else if (t < 1.25) {
        targetPos.set(sampleVialRelX, 0.41, -0.02);
        targetPlunger = 0;
        targetLiquidScale = 0.05;
      } else if (t < 2.15) {
        targetPos.set(sampleVialRelX, 0.41, -0.02);
        targetPlunger = 0.05;
        targetLiquidScale = 0.65;
      } else if (t < 2.75) {
        targetPos.set(-0.15, 0.58, -0.02);
        targetPlunger = 0.05;
        targetLiquidScale = 0.65;
      } else {
        setSyringeState('filled');
        setSyringeAnimPhase('ready_to_inject');
        if (currentStep <= 4) {
          setCurrentStep(5);
        }
      }
    } else if (syringeAnimPhase === 'injecting_gc') {
      targetRotX = 0;
      if (t < 0.9) {
        targetPos.set(0.92, 1.3, -0.43);
        targetPlunger = 0.05;
        targetLiquidScale = 0.65;
      } else if (t < 1.55) {
        targetPos.set(0.92, 1.13, -0.43);
        targetPlunger = 0.05;
        targetLiquidScale = 0.65;
      } else if (t < 2.2) {
        targetPos.set(0.92, 1.13, -0.43);
        targetPlunger = 0.0;
        targetLiquidScale = 0.01;
      } else if (t < 2.8) {
        targetPos.set(0.92, 1.32, -0.43);
        targetPlunger = 0.0;
        targetLiquidScale = 0.01;
      } else {
        startSeparationRun();
      }
    }

    const lerpSpeed = dt * 8.5;
    syringeBodyRef.current.position.lerp(targetPos, lerpSpeed);
    syringeBodyRef.current.rotation.x = THREE.MathUtils.lerp(
      syringeBodyRef.current.rotation.x,
      targetRotX,
      lerpSpeed
    );
    plungerGroupRef.current.position.y = THREE.MathUtils.lerp(
      plungerGroupRef.current.position.y,
      targetPlunger,
      lerpSpeed
    );
    liquidMeshRef.current.scale.y = THREE.MathUtils.lerp(
      liquidMeshRef.current.scale.y,
      targetLiquidScale,
      lerpSpeed
    );
  });

  const handleSyringeClick = (e: any) => {
    e.stopPropagation();
    setActiveCameraTarget('vials');
    if (syringeAnimPhase === 'idle') {
      setSyringeSelected(true);
      setSyringeAnimPhase('selected');
    } else if (syringeAnimPhase === 'selected' && currentStep === 3) {
      setSyringeAnimPhase('washing_acetone');
    }
  };

  const isWashing = syringeAnimPhase === 'washing_acetone';
  const activeSampleSpec =
    SAMPLE_BOTTLE_SPECS[filledSampleId ?? selectedSampleId] ??
    SAMPLE_BOTTLE_SPECS.sample_a;
  const liquidColor = isWashing
    ? '#38bdf8'
    : syringeState === 'filled' || syringeAnimPhase === 'drawing_sample'
    ? activeSampleSpec.liquidColor
    : '#38bdf8';

  const isStep3SyringeTarget =
    currentStep === 3 && !syringeSelected && syringeState === 'empty';

  const subtitleText =
    syringeState === 'filled' && filledSampleId
      ? `Berisi 1,0 µL ${SAMPLE_BOTTLE_SPECS[filledSampleId].code}`
      : `Status: ${SYRINGE_STATE_LABELS[syringeState]}`;

  return (
    <group position={position}>
      {/* Dudukan Penyangga Suntikan Mikro */}
      <group position={[0, 0, 0]}>
        <RoundedBox
          args={[0.24, 0.022, 0.34]}
          position={[0, 0.011, 0]}
          radius={0.006}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.75}
            roughness={0.28}
          />
        </RoundedBox>

        <RoundedBox
          args={[0.07, 0.18, 0.025]}
          position={[0, 0.1, -0.11]}
          radius={0.005}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial
            color="#334155"
            metalness={0.8}
            roughness={0.25}
          />
        </RoundedBox>

        <RoundedBox
          args={[0.07, 0.11, 0.025]}
          position={[0, 0.065, 0.08]}
          radius={0.005}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial
            color="#334155"
            metalness={0.8}
            roughness={0.25}
          />
        </RoundedBox>
      </group>

      {/* Unit Suntikan Mikro 10 µL */}
      <group
        ref={syringeBodyRef}
        position={[0, 0.165, -0.01]}
        rotation={[Math.PI / 2 - 0.34, 0, 0]}
        onClick={handleSyringeClick}
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
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.22, 24]} />
          <meshPhysicalMaterial
            color={hovered ? '#e0f2fe' : '#f8fafc'}
            emissive={isStep3SyringeTarget ? '#f59e0b' : '#38bdf8'}
            emissiveIntensity={
              hovered ? 0.45 : isStep3SyringeTarget ? 0.35 : 0.06
            }
            transparent
            opacity={0.5}
            roughness={0.08}
            metalness={0.05}
            transmission={0.65}
            thickness={0.02}
          />
        </mesh>

        {[-0.07, -0.04, -0.01, 0.02, 0.05, 0.08].map((yPos, idx) => (
          <mesh key={idx} position={[0, yPos, 0]}>
            <cylinderGeometry args={[0.0186, 0.0186, 0.0025, 20]} />
            <meshBasicMaterial color={hovered ? '#38bdf8' : '#0f172a'} />
          </mesh>
        ))}

        <mesh ref={liquidMeshRef} position={[0, -0.045, 0]}>
          <cylinderGeometry args={[0.0125, 0.0125, 0.11, 18]} />
          <meshStandardMaterial
            color={liquidColor}
            emissive={liquidColor}
            emissiveIntensity={0.45}
            transparent
            opacity={0.9}
          />
        </mesh>

        <mesh position={[0, 0.112, 0]} castShadow>
          <boxGeometry args={[0.068, 0.01, 0.028]} />
          <meshStandardMaterial
            color="#cbd5e1"
            emissive="#a855f7"
            emissiveIntensity={hovered ? 0.4 : 0}
            metalness={0.9}
            roughness={0.18}
          />
        </mesh>

        <mesh position={[0, -0.125, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.006, 0.032, 20]} />
          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.92}
            roughness={0.18}
          />
        </mesh>

        <mesh position={[0, -0.195, 0]} castShadow>
          <cylinderGeometry args={[0.0022, 0.0012, 0.11, 12]} />
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.96}
            roughness={0.1}
          />
        </mesh>

        <group ref={plungerGroupRef} position={[0, 0, 0]}>
          <mesh position={[0, 0.065, 0]} castShadow>
            <cylinderGeometry args={[0.0055, 0.0055, 0.22, 16]} />
            <meshStandardMaterial
              color="#cbd5e1"
              emissive="#38bdf8"
              emissiveIntensity={hovered ? 0.45 : 0}
              metalness={0.92}
              roughness={0.15}
            />
          </mesh>

          <mesh position={[0, -0.045, 0]}>
            <cylinderGeometry args={[0.0135, 0.0135, 0.016, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>

          <mesh position={[0, 0.178, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.014, 24]} />
            <meshStandardMaterial
              color={hovered ? '#38bdf8' : '#a855f7'}
              emissive="#a855f7"
              emissiveIntensity={hovered ? 0.65 : 0.25}
              metalness={0.75}
              roughness={0.22}
            />
          </mesh>
        </group>
      </group>

      {/* Label 3D Suntikan Mikro */}
      <LabPinLabel
        position={[0, 0.34, 0]}
        title="Suntikan Mikro 10 µL"
        subtitle={subtitleText}
        badgeText={isStep3SyringeTarget ? 'Klik untuk Mengambil' : undefined}
        isActiveOrHovered={hovered || isStep3SyringeTarget}
        isStepTarget={isStep3SyringeTarget}
        dotColor="#a855f7"
      />
    </group>
  );
};

export default Microsyringe;
