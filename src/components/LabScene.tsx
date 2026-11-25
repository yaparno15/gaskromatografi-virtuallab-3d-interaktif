import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
  Grid,
  RoundedBox,
  Text,
} from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  useLabStore,
  CameraTargetId,
  PRACTICUM_STEPS,
} from '../store/useLabStore';
import { GasCylinder } from './equipment/GasCylinder';
import { SampleTray } from './equipment/SampleTray';
import { GCMachine } from './equipment/GCMachine';
import { ComputerMonitor } from './equipment/ComputerMonitor';
import { LabRoomEnvironment } from './LabRoomEnvironment';

export const CAMERA_PRESETS: Record<
  CameraTargetId,
  { position: [number, number, number]; target: [number, number, number]; label: string }
> = {
  overview: {
    position: [-0.45, 2.35, 5.35],
    target: [-0.55, 0.45, -0.05],
    label: 'Tampilan Penuh Meja Laboratorium',
  },
  gas_cylinder: {
    position: [-2.95, 1.18, 2.55],
    target: [-2.95, 0.78, -0.15],
    label: 'Stasiun 1: Tabung Gas Pembawa (Helium)',
  },
  vials: {
    position: [-1.72, 0.82, 1.85],
    target: [-1.72, 0.22, 0.45],
    label: 'Stasiun 2: Rak Botol Vial & Sampel',
  },
  syringe: {
    position: [-1.22, 0.78, 1.75],
    target: [-1.22, 0.22, 0.47],
    label: 'Stasiun 2B: Suntikan Mikro 10 µL',
  },
  gc_unit: {
    position: [0.05, 1.12, 2.35],
    target: [0.05, 0.5, -0.05],
    label: 'Stasiun 3: Instrumen Utama GC-FID',
  },
  injection_closeup: {
    position: [-0.22, 1.12, 1.72],
    target: [-0.12, 0.62, 0.04],
    label: 'Port Injektor & Oven Kolom Kapiler',
  },
  monitor: {
    position: [1.85, 1.02, 2.15],
    target: [1.95, 0.52, -0.05],
    label: 'Stasiun 4: Monitor PC Akuisisi Data',
  },
};

const CameraController: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const activeCameraTarget = useLabStore((s) => s.activeCameraTarget);
  const cameraResetCount = useLabStore((s) => s.cameraResetCount);
  const currentStep = useLabStore((s) => s.currentStep);

  const isTransitioning = useRef(true);
  const desiredPos = useRef(new THREE.Vector3(...CAMERA_PRESETS.overview.position));
  const desiredTarget = useRef(new THREE.Vector3(...CAMERA_PRESETS.overview.target));

  useEffect(() => {
    const preset = CAMERA_PRESETS[activeCameraTarget] ?? CAMERA_PRESETS.overview;
    desiredPos.current.set(...preset.position);
    desiredTarget.current.set(...preset.target);
    isTransitioning.current = true;
  }, [activeCameraTarget, cameraResetCount, currentStep]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isTransitioning.current) {
      const stepFactor = 1 - Math.exp(-4.5 * Math.min(delta, 0.1));
      camera.position.lerp(desiredPos.current, stepFactor);
      controlsRef.current.target.lerp(desiredTarget.current, stepFactor);

      const posDist = camera.position.distanceTo(desiredPos.current);
      const targetDist = controlsRef.current.target.distanceTo(desiredTarget.current);
      if (posDist < 0.015 && targetDist < 0.015) {
        isTransitioning.current = false;
      }
    }

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={0.9}
      maxDistance={6.8}
      maxPolarAngle={Math.PI / 2 - 0.03}
      minPolarAngle={0.15}
      onStart={() => {
        isTransitioning.current = false;
      }}
    />
  );
};

/**
 * Pencahayaan Studio & Laboratorium yang mendukung Mode Terang ('light') & Mode Gelap ('dark')
 */
const LabLighting: React.FC = () => {
  const labTheme = useLabStore((s) => s.labTheme);
  const isLight = labTheme === 'light';

  const bgColor = isLight ? '#eef2f6' : '#090d16';

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 11, 24]} />

      {/* Ambient & Hemisphere Light ditingkatkan signifikan pada Mode Terang */}
      <ambientLight
        intensity={isLight ? 1.25 : 0.48}
        color={isLight ? '#ffffff' : '#e2e8f0'}
      />

      <hemisphereLight
        args={[
          isLight ? '#ffffff' : '#38bdf8',
          isLight ? '#cbd5e1' : '#0f172a',
          isLight ? 1.15 : 0.35,
        ]}
      />

      {/* Lampu Utama (Directional Key Light) dengan Bayangan Halus */}
      <directionalLight
        position={[3.5, 6.5, 4.0]}
        intensity={isLight ? 1.85 : 1.7}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
        shadow-camera-near={0.5}
        shadow-camera-far={16}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />

      {/* Lampu Pengisi Samping & Belakang */}
      <directionalLight
        position={[-4.5, 4.5, -3.0]}
        intensity={isLight ? 1.1 : 0.8}
        color={isLight ? '#f0f9ff' : '#38bdf8'}
      />
      <pointLight
        position={[3.0, 2.5, 2.5]}
        intensity={isLight ? 0.9 : 0.65}
        color={isLight ? '#ffffff' : '#fef08a'}
        distance={12}
      />

      {/* Lampu Plafon Laboratorium */}
      <group position={[0, 3.6, 0]}>
        {[-1.8, 1.8].map((xPos, idx) => (
          <group key={idx} position={[xPos, 0, -0.1]}>
            <mesh castShadow>
              <boxGeometry args={[2.6, 0.08, 0.45]} />
              <meshStandardMaterial
                color={isLight ? '#cbd5e1' : '#1e293b'}
                metalness={0.6}
                roughness={0.25}
              />
            </mesh>
            <mesh position={[0, -0.045, 0]}>
              <planeGeometry args={[2.45, 0.35]} />
              <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Peta Lingkungan Refleksi HDRI Prosedural */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 4, 0, 0]}>
          <Lightformer
            form="rect"
            intensity={isLight ? 3.6 : 2.8}
            position={[0, 5, -2]}
            scale={[8, 2, 1]}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
            color="#ffffff"
          />
          <Lightformer
            form="rect"
            intensity={isLight ? 2.2 : 1.6}
            position={[-5, 3, 2]}
            scale={[4, 2, 1]}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
            color={isLight ? '#e0f2fe' : '#38bdf8'}
          />
          <Lightformer
            form="rect"
            intensity={isLight ? 2.2 : 1.4}
            position={[5, 2, 3]}
            scale={[4, 2, 1]}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
            color="#f0f9ff"
          />
          <Lightformer
            form="ring"
            intensity={isLight ? 1.5 : 1.0}
            position={[0, 3, 5]}
            scale={3}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
            color="#ffffff"
          />
        </group>
      </Environment>
    </>
  );
};

interface StationZoneProps {
  id: CameraTargetId;
  position: [number, number, number];
  size: [number, number];
  title: string;
  subtitle: string;
  accentColor: string;
}

const EquipmentStationPad: React.FC<StationZoneProps> = ({
  id,
  position,
  size,
  title,
  subtitle,
  accentColor,
}) => {
  const activeCameraTarget = useLabStore((s) => s.activeCameraTarget);
  const currentStep = useLabStore((s) => s.currentStep);
  const setActiveCameraTarget = useLabStore((s) => s.setActiveCameraTarget);

  const stepTarget = PRACTICUM_STEPS[currentStep]?.cameraTarget;
  const isFocused = activeCameraTarget === id || stepTarget === id;

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        setActiveCameraTarget(id);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <RoundedBox
        args={[size[0], 0.018, size[1]]}
        radius={0.008}
        smoothness={4}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          color={isFocused ? '#1e293b' : '#0f172a'}
          emissive={accentColor}
          emissiveIntensity={isFocused ? 0.12 : 0.02}
          metalness={0.55}
          roughness={0.35}
        />
      </RoundedBox>

      <group position={[0, 0.011, size[1] / 2 - 0.065]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <planeGeometry args={[size[0] - 0.08, 0.11]} />
          <meshBasicMaterial
            color={isFocused ? '#0c4a6e' : '#090d16'}
            transparent
            opacity={0.92}
          />
        </mesh>
        <React.Suspense fallback={null}>
          <Text
            position={[0, 0.016, 0.002]}
            fontSize={0.032}
            color={isFocused ? '#38bdf8' : '#cbd5e1'}
            anchorX="center"
            anchorY="middle"
          >
            {title}
          </Text>
          <Text
            position={[0, -0.025, 0.002]}
            fontSize={0.022}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
          >
            {subtitle}
          </Text>
        </React.Suspense>
      </group>
    </group>
  );
};

/**
 * Meja Kerja Laboratorium & Ruangan (Menyesuaikan Mode Terang & Mode Gelap)
 */
const LaboratoryWorkbench: React.FC = () => {
  const labTheme = useLabStore((s) => s.labTheme);
  const isLight = labTheme === 'light';

  const benchWidth = 6.8;
  const benchDepth = 2.6;
  const topThickness = 0.11;
  const legHeight = 1.55;
  const floorY = -legHeight - topThickness / 2;

  const legXPositions = [-3.15, 0, 3.15];
  const legZPositions = [-1.05, 1.05];

  return (
    <group position={[0, 0, 0]}>
      {/* Daun Meja Kerja Phenolic Resin */}
      <RoundedBox
        args={[benchWidth, topThickness, benchDepth]}
        position={[0, -topThickness / 2, 0]}
        radius={0.02}
        smoothness={4}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          color={isLight ? '#1e293b' : '#161f30'}
          metalness={0.2}
          roughness={0.24}
          envMapIntensity={1.25}
        />
      </RoundedBox>

      {/* Lis Pengaman Depan Meja */}
      <mesh position={[0, -topThickness / 2, benchDepth / 2 + 0.003]} receiveShadow>
        <boxGeometry args={[benchWidth - 0.04, 0.018, 0.01]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#0284c7"
          emissiveIntensity={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Rak Utilitas & Soket Listrik Belakang Meja */}
      <group position={[0, 0, -benchDepth / 2 + 0.22]}>
        <RoundedBox
          args={[benchWidth - 0.1, 0.42, 0.36]}
          position={[0, 0.21, 0]}
          radius={0.015}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={isLight ? '#cbd5e1' : '#1e293b'}
            metalness={0.45}
            roughness={0.35}
          />
        </RoundedBox>

        <RoundedBox
          args={[benchWidth - 0.06, 0.03, 0.4]}
          position={[0, 0.435, 0]}
          radius={0.008}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={isLight ? '#94a3b8' : '#334155'}
            metalness={0.65}
            roughness={0.25}
          />
        </RoundedBox>

        {[-1.6, -0.4, 0.9, 2.1].map((xPos, i) => (
          <group key={i} position={[xPos, 0.16, 0.182]}>
            <mesh>
              <boxGeometry args={[0.24, 0.1, 0.015]} />
              <meshStandardMaterial
                color={isLight ? '#f8fafc' : '#0f172a'}
                metalness={0.3}
                roughness={0.5}
              />
            </mesh>
            <mesh position={[0.08, 0.02, 0.01]}>
              <sphereGeometry args={[0.008, 8, 8]} />
              <meshBasicMaterial color="#22c55e" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Kaki Baja Meja Laboratorium */}
      {legXPositions.map((lx, xi) =>
        legZPositions.map((lz, zi) => (
          <group key={`${xi}-${zi}`} position={[lx, -topThickness - legHeight / 2, lz]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.11, legHeight, 0.11]} />
              <meshStandardMaterial
                color={isLight ? '#64748b' : '#1e293b'}
                metalness={0.6}
                roughness={0.35}
              />
            </mesh>
            <mesh position={[0, -legHeight / 2 + 0.025, 0]}>
              <cylinderGeometry args={[0.075, 0.085, 0.05, 20]} />
              <meshStandardMaterial color="#0f172a" metalness={0.3} roughness={0.7} />
            </mesh>
          </group>
        ))
      )}

      {[-1.05, 1.05].map((lz, i) => (
        <mesh key={`beam-x-${i}`} position={[0, -topThickness - 0.12, lz]} castShadow>
          <boxGeometry args={[6.3, 0.09, 0.07]} />
          <meshStandardMaterial
            color={isLight ? '#64748b' : '#1e293b'}
            metalness={0.6}
            roughness={0.35}
          />
        </mesh>
      ))}
      <mesh position={[0, -topThickness - legHeight + 0.25, -0.3]} castShadow>
        <boxGeometry args={[6.3, 0.07, 0.07]} />
        <meshStandardMaterial
          color={isLight ? '#94a3b8' : '#334155'}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>

      {/* Kabinet Laci Bawah Meja */}
      <group position={[2.05, -topThickness - 0.52, 0]}>
        <RoundedBox
          args={[1.95, 0.95, 1.9]}
          radius={0.02}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={isLight ? '#cbd5e1' : '#1e293b'}
            metalness={0.4}
            roughness={0.4}
          />
        </RoundedBox>
        {[0.25, -0.05, -0.32].map((dy, idx) => (
          <group key={idx} position={[0, dy, 0.96]}>
            <mesh>
              <boxGeometry args={[1.82, 0.22, 0.02]} />
              <meshStandardMaterial
                color={isLight ? '#e2e8f0' : '#273549'}
                metalness={0.35}
                roughness={0.35}
              />
            </mesh>
            <mesh position={[0, 0.03, 0.025]}>
              <boxGeometry args={[0.36, 0.022, 0.025]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Alas Stasiun Kerja */}
      <EquipmentStationPad
        id="gas_cylinder"
        position={[-2.65, 0.009, -0.15]}
        size={[0.85, 1.15]}
        title="01: TABUNG GAS He"
        subtitle="Helium 99,999% & Regulator"
        accentColor="#10b981"
      />
      <EquipmentStationPad
        id="vials"
        position={[-1.32, 0.009, 0.45]}
        size={[1.22, 0.72]}
        title="02: SAMPEL & SUNTIKAN"
        subtitle="Aseton • Limbah • Sampel • 10 µL"
        accentColor="#a855f7"
      />
      <EquipmentStationPad
        id="gc_unit"
        position={[0.32, 0.009, -0.12]}
        size={[1.72, 1.28]}
        title="03: INSTRUMEN GC-FID"
        subtitle="Injektor • Oven Kolom • Detektor"
        accentColor="#f59e0b"
      />
      <EquipmentStationPad
        id="monitor"
        position={[2.22, 0.009, 0.05]}
        size={[1.45, 1.15]}
        title="04: MONITOR PC DATA"
        subtitle="Grafik Kromatogram Real-Time"
        accentColor="#06b6d4"
      />

      {/* Peralatan 3D */}
      <GasCylinder position={[-2.65, 0.018, -0.15]} />
      <SampleTray position={[-1.42, 0.018, 0.45]} includeSyringe={true} />
      <GCMachine position={[0.32, 0.018, -0.12]} />
      <ComputerMonitor position={[2.22, 0.018, -0.05]} />

      {/* Lantai Ruangan Lab (Putih Abu Muda Bersih di Mode Terang, Gelap di Mode Gelap) */}
      <mesh
        position={[0, floorY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial
          color={isLight ? '#e2e8f0' : '#0b101b'}
          metalness={0.1}
          roughness={0.75}
        />
      </mesh>

      <Grid
        position={[0, floorY + 0.003, 0]}
        args={[24, 24]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor={isLight ? '#cbd5e1' : '#1e293b'}
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor={isLight ? '#94a3b8' : '#334155'}
        fadeDistance={16}
        fadeStrength={1.2}
      />

      <ContactShadows
        position={[0, floorY + 0.005, 0]}
        opacity={isLight ? 0.42 : 0.65}
        scale={12}
        blur={2.2}
        far={3.5}
      />

      {/* Lingkungan Ruangan Laboratorium Utuh (4 Dinding, Plafon, Arsitektur & Dekorasi Pasif) */}
      <LabRoomEnvironment floorY={floorY} />
    </group>
  );
};

export const LabScene: React.FC = () => {
  const labTheme = useLabStore((s) => s.labTheme);
  const isLight = labTheme === 'light';

  return (
    <div
      className={`w-full h-full relative transition-colors duration-300 ${
        isLight ? 'bg-slate-100' : 'bg-slate-950'
      }`}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [-0.45, 2.35, 5.35], fov: 42, near: 0.1, far: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <LabLighting />
        <CameraController />
        <LaboratoryWorkbench />
      </Canvas>
    </div>
  );
};

export default LabScene;
