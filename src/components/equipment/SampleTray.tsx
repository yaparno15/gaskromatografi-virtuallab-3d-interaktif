import React, { useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useLabStore } from '../../store/useLabStore';
import {
  SampleId,
  SAMPLE_BOTTLE_SPECS,
} from '../../utils/chromatographyPhysics';
import { Microsyringe } from './Microsyringe';
import { LabPinLabel } from './LabPinLabel';

interface VialSpec {
  id: 'acetone' | 'waste' | SampleId;
  sampleId?: SampleId;
  label: string;
  subtitle: string;
  shortCode: string;
  xOffset: number;
  glassColor: string;
  liquidColor: string;
  capColor: string;
  fillRatio: number;
}

const VIALS: VialSpec[] = [
  {
    id: 'acetone',
    label: 'Pelarut Pencuci (Aseton)',
    subtitle: 'Pembilas Jarum (Tb 56 °C)',
    shortCode: 'ASETON',
    xOffset: -0.34,
    glassColor: '#e0f2fe',
    liquidColor: '#38bdf8',
    capColor: '#0284c7',
    fillRatio: 0.74,
  },
  {
    id: 'waste',
    label: 'Botol Limbah (Waste)',
    subtitle: 'Penampung Bilasan',
    shortCode: 'LIMBAH',
    xOffset: -0.17,
    glassColor: '#fde68a',
    liquidColor: '#94a3b8',
    capColor: '#e11d48',
    fillRatio: 0.36,
  },
  {
    id: 'sample_a',
    sampleId: 'sample_a',
    label: 'Sampel A: Hidrokarbon Alkana',
    subtitle: 'Non-Polar (Heksana, Oktana, Dekana)',
    shortCode: 'SAMPEL A',
    xOffset: 0.0,
    glassColor: SAMPLE_BOTTLE_SPECS.sample_a.glassColor,
    liquidColor: SAMPLE_BOTTLE_SPECS.sample_a.liquidColor,
    capColor: SAMPLE_BOTTLE_SPECS.sample_a.capColor,
    fillRatio: 0.68,
  },
  {
    id: 'sample_b',
    sampleId: 'sample_b',
    label: 'Sampel B: Alkohol Volatil',
    subtitle: 'Polar (Metanol, Etanol, 1-Propanol)',
    shortCode: 'SAMPEL B',
    xOffset: 0.17,
    glassColor: SAMPLE_BOTTLE_SPECS.sample_b.glassColor,
    liquidColor: SAMPLE_BOTTLE_SPECS.sample_b.liquidColor,
    capColor: SAMPLE_BOTTLE_SPECS.sample_b.capColor,
    fillRatio: 0.68,
  },
  {
    id: 'sample_c',
    sampleId: 'sample_c',
    label: 'Sampel C: Minyak Atsiri',
    subtitle: 'Terpena Sensitif Panas (Eugenol)',
    shortCode: 'SAMPEL C',
    xOffset: 0.34,
    glassColor: SAMPLE_BOTTLE_SPECS.sample_c.glassColor,
    liquidColor: SAMPLE_BOTTLE_SPECS.sample_c.liquidColor,
    capColor: SAMPLE_BOTTLE_SPECS.sample_c.capColor,
    fillRatio: 0.68,
  },
];

interface SampleTrayProps {
  position?: [number, number, number];
  includeSyringe?: boolean;
}

export const SampleTray: React.FC<SampleTrayProps> = ({
  position = [-1.42, 0, 0.45],
  includeSyringe = true,
}) => {
  const currentStep = useLabStore((s) => s.currentStep);
  const syringeState = useLabStore((s) => s.syringeState);
  const syringeSelected = useLabStore((s) => s.syringeSelected);
  const selectedSampleId = useLabStore((s) => s.selectedSampleId);
  const filledSampleId = useLabStore((s) => s.filledSampleId);
  const attemptWashSyringe = useLabStore((s) => s.attemptWashSyringe);
  const attemptDrawSample = useLabStore((s) => s.attemptDrawSample);
  const setHoveredSampleId = useLabStore((s) => s.setHoveredSampleId);
  const setActiveCameraTarget = useLabStore((s) => s.setActiveCameraTarget);

  const [hoveredVial, setHoveredVial] = useState<string | null>(null);

  const handleVialClick = (vial: VialSpec, e: any) => {
    e.stopPropagation();
    setActiveCameraTarget('vials');

    if (vial.id === 'acetone' || vial.id === 'waste') {
      attemptWashSyringe();
    } else if (vial.sampleId) {
      attemptDrawSample(vial.sampleId);
    }
  };

  return (
    <group position={position}>
      {/* Rak Aluminium 5 Botol Vial (Aseton, Limbah, Sampel A, Sampel B, Sampel C) */}
      <group position={[-0.18, 0, 0]}>
        <RoundedBox
          args={[0.92, 0.035, 0.26]}
          position={[0, 0.0175, 0]}
          radius={0.008}
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
          args={[0.9, 0.018, 0.24]}
          position={[0, 0.11, 0]}
          radius={0.006}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#334155"
            metalness={0.8}
            roughness={0.22}
          />
        </RoundedBox>

        {[
          [-0.41, -0.09],
          [0.41, -0.09],
          [-0.41, 0.09],
          [0.41, 0.09],
        ].map(([px, pz], idx) => (
          <mesh key={idx} position={[px, 0.065, pz]} castShadow>
            <cylinderGeometry args={[0.01, 0.01, 0.09, 16]} />
            <meshStandardMaterial
              color="#94a3b8"
              metalness={0.9}
              roughness={0.18}
            />
          </mesh>
        ))}

        {/* 5 Botol Vial Kaca Berjejer Rapi */}
        {VIALS.map((vial) => {
          const isHovered = hoveredVial === vial.id;
          const vialHeight = 0.18;
          const fillRatio =
            vial.id === 'waste' && syringeState !== 'empty'
              ? vial.fillRatio + 0.15
              : vial.fillRatio;
          const liquidHeight = vialHeight * fillRatio;

          const isLockedOtherSample =
            Boolean(vial.sampleId) &&
            syringeState === 'filled' &&
            Boolean(filledSampleId) &&
            filledSampleId !== vial.sampleId;

          const isFilledThisSample =
            Boolean(vial.sampleId) &&
            syringeState === 'filled' &&
            filledSampleId === vial.sampleId;

          // Agar label 3D tidak pernah bertumpuk, hanya maksimal 1 botol yang menampilkan kartu penuh saat tidak di-hover
          const isAcetoneStep3Target =
            vial.id === 'acetone' &&
            currentStep === 3 &&
            syringeSelected &&
            syringeState === 'empty';

          const isDefaultStep4SampleTarget =
            vial.sampleId === selectedSampleId &&
            currentStep === 4 &&
            syringeState === 'cleaned' &&
            !hoveredVial;

          const isStepTarget =
            isAcetoneStep3Target || isDefaultStep4SampleTarget;

          let badgeText: string | undefined;
          if (vial.id === 'acetone') {
            if (syringeState === 'filled') {
              badgeText = 'Klik Bilas & Ganti Sampel';
            } else if (isAcetoneStep3Target || isHovered) {
              badgeText = 'Klik untuk Bilas Jarum';
            }
          } else if (vial.sampleId) {
            if (isLockedOtherSample) {
              badgeText = '🔒 Terkunci (Cegah Kontaminasi)';
            } else if (isFilledThisSample) {
              badgeText = '✓ Diambil (1,0 µL di Suntikan)';
            } else if (syringeState === 'cleaned') {
              badgeText = 'Klik Ambil 1,0 µL Sampel';
            } else if (isHovered) {
              badgeText = 'Info MSDS di Kanan Atas';
            }
          }

          return (
            <group
              key={vial.id}
              position={[vial.xOffset, 0.035, 0]}
              onClick={(e) => handleVialClick(vial, e)}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredVial(vial.id);
                if (vial.sampleId) {
                  setHoveredSampleId(vial.sampleId);
                }
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredVial(null);
                if (vial.sampleId) {
                  setHoveredSampleId(null);
                }
                document.body.style.cursor = 'auto';
              }}
            >
              {/* Cincin Indikator Dasar Botol */}
              <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.044, 0.055, 24]} />
                <meshBasicMaterial
                  color={
                    isLockedOtherSample
                      ? '#ef4444'
                      : isFilledThisSample
                      ? '#10b981'
                      : isHovered || isStepTarget
                      ? '#38bdf8'
                      : '#475569'
                  }
                />
              </mesh>

              {/* Tabung Kaca Botol Vial */}
              <mesh position={[0, vialHeight / 2, 0]} castShadow>
                <cylinderGeometry args={[0.042, 0.042, vialHeight, 28]} />
                <meshPhysicalMaterial
                  color={vial.glassColor}
                  emissive={
                    isLockedOtherSample ? '#ef4444' : vial.liquidColor
                  }
                  emissiveIntensity={
                    isHovered || isStepTarget || isFilledThisSample
                      ? 0.42
                      : 0.04
                  }
                  transparent
                  opacity={isLockedOtherSample ? 0.3 : 0.45}
                  roughness={0.08}
                  metalness={0.05}
                  transmission={0.65}
                  thickness={0.03}
                />
              </mesh>

              {/* Cairan di Dalam Botol */}
              <mesh position={[0, liquidHeight / 2 + 0.006, 0]}>
                <cylinderGeometry args={[0.036, 0.036, liquidHeight, 24]} />
                <meshStandardMaterial
                  color={vial.liquidColor}
                  emissive={vial.liquidColor}
                  emissiveIntensity={
                    isHovered || isStepTarget || isFilledThisSample
                      ? 0.65
                      : 0.22
                  }
                  transparent
                  opacity={isLockedOtherSample ? 0.45 : 0.86}
                  roughness={0.15}
                />
              </mesh>

              {/* Stiker Label Depan Botol */}
              <mesh position={[0, vialHeight * 0.52, 0.0425]}>
                <planeGeometry args={[0.048, 0.046]} />
                <meshBasicMaterial
                  color={
                    isLockedOtherSample
                      ? '#fecdd3'
                      : isFilledThisSample
                      ? '#bbf7d0'
                      : '#f8fafc'
                  }
                />
              </mesh>

              {/* Leher Botol */}
              <mesh position={[0, vialHeight + 0.015, 0]} castShadow>
                <cylinderGeometry args={[0.026, 0.035, 0.03, 24]} />
                <meshPhysicalMaterial
                  color={vial.glassColor}
                  transparent
                  opacity={0.5}
                  roughness={0.1}
                />
              </mesh>

              {/* Tutup Crimp & Septum */}
              <mesh position={[0, vialHeight + 0.038, 0]} castShadow>
                <cylinderGeometry args={[0.031, 0.031, 0.024, 24]} />
                <meshStandardMaterial
                  color={isLockedOtherSample ? '#991b1b' : vial.capColor}
                  emissive={isLockedOtherSample ? '#ef4444' : vial.capColor}
                  emissiveIntensity={
                    isHovered || isStepTarget || isFilledThisSample
                      ? 0.55
                      : 0.12
                  }
                  metalness={0.65}
                  roughness={0.25}
                />
              </mesh>
              <mesh
                position={[0, vialHeight + 0.051, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <circleGeometry args={[0.017, 20]} />
                <meshBasicMaterial color="#fef2f2" />
              </mesh>

              {/* Label Pin 3D Kontekstual (Hanya muncul pada botol yang sedang di-hover atau 1 target utama) */}
              <LabPinLabel
                position={[0, 0.3, 0]}
                title={vial.label}
                subtitle={vial.subtitle}
                badgeText={badgeText}
                isActiveOrHovered={isHovered || isStepTarget}
                isStepTarget={isStepTarget}
                dotColor={
                  isLockedOtherSample
                    ? '#ef4444'
                    : isFilledThisSample
                    ? '#10b981'
                    : vial.capColor
                }
              />
            </group>
          );
        })}
      </group>

      {includeSyringe && <Microsyringe position={[0.44, 0, 0.02]} />}
    </group>
  );
};

export default SampleTray;
