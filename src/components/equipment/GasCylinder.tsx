import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLabStore } from '../../store/useLabStore';
import { LabPinLabel } from './LabPinLabel';

interface GasCylinderProps {
  position?: [number, number, number];
}

export const GasCylinder: React.FC<GasCylinderProps> = ({
  position = [-2.65, 0, -0.15],
}) => {
  const currentStep = useLabStore((s) => s.currentStep);
  const gasValveOpen = useLabStore((s) => s.gasValveOpen);
  const gasPressure = useLabStore((s) => s.gasPressure);
  const setGasValveOpen = useLabStore((s) => s.setGasValveOpen);
  const setGasPressure = useLabStore((s) => s.setGasPressure);
  const setCurrentStep = useLabStore((s) => s.setCurrentStep);
  const setActiveCameraTarget = useLabStore((s) => s.setActiveCameraTarget);

  const [hoveredValve, setHoveredValve] = useState(false);
  const [hoveredBody, setHoveredBody] = useState(false);

  const valveWheelRef = useRef<THREE.Group>(null);
  const deliveryNeedleRef = useRef<THREE.Mesh>(null);
  const flowParticlesRef = useRef<THREE.Group>(null);
  const pressureFloatRef = useRef<number>(gasPressure);
  const stepAdvanceTimerRef = useRef<number | null>(null);

  const { tubingCurve, tubingGeometry } = useMemo(() => {
    const points = [
      new THREE.Vector3(0.18, 1.33, 0.02),
      new THREE.Vector3(0.36, 1.28, -0.12),
      new THREE.Vector3(0.45, 0.82, -0.45),
      new THREE.Vector3(0.65, 0.35, -0.62),
      new THREE.Vector3(1.45, 0.32, -0.62),
      new THREE.Vector3(2.25, 0.38, -0.48),
      new THREE.Vector3(2.42, 0.65, -0.22),
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const geom = new THREE.TubeGeometry(curve, 64, 0.012, 12, false);
    return { tubingCurve: curve, tubingGeometry: geom };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);

    if (valveWheelRef.current) {
      const targetRot = gasValveOpen ? -Math.PI * 1.5 : 0;
      valveWheelRef.current.rotation.z = THREE.MathUtils.lerp(
        valveWheelRef.current.rotation.z,
        targetRot,
        dt * 5.5
      );
    }

    const targetPressure = gasValveOpen ? 40 : 0;
    if (Math.abs(pressureFloatRef.current - targetPressure) > 0.15) {
      pressureFloatRef.current = THREE.MathUtils.lerp(
        pressureFloatRef.current,
        targetPressure,
        dt * 3.5
      );
      const rounded = Math.round(pressureFloatRef.current);
      if (rounded !== gasPressure) {
        setGasPressure(rounded);
      }
    } else if (gasPressure !== targetPressure) {
      pressureFloatRef.current = targetPressure;
      setGasPressure(targetPressure);

      if (targetPressure === 40 && currentStep <= 1 && !stepAdvanceTimerRef.current) {
        stepAdvanceTimerRef.current = window.setTimeout(() => {
          setCurrentStep(2);
          stepAdvanceTimerRef.current = null;
        }, 900);
      }
    }

    if (deliveryNeedleRef.current) {
      const normalized = THREE.MathUtils.clamp(pressureFloatRef.current / 60, 0, 1);
      const targetAngle = 0.85 - normalized * 2.05;
      deliveryNeedleRef.current.rotation.z = THREE.MathUtils.lerp(
        deliveryNeedleRef.current.rotation.z,
        targetAngle,
        dt * 6
      );
    }

    if (flowParticlesRef.current && gasValveOpen) {
      const tBase = state.clock.elapsedTime * 0.42;
      flowParticlesRef.current.children.forEach((child, idx) => {
        const u = (tBase + idx / flowParticlesRef.current!.children.length) % 1;
        const pos = tubingCurve.getPointAt(u);
        child.position.copy(pos);
      });
    }
  });

  const handleOpenValve = (e: any) => {
    e.stopPropagation();
    setActiveCameraTarget('gas_cylinder');
    if (!gasValveOpen) {
      setGasValveOpen(true);
    } else if (currentStep <= 1) {
      setGasValveOpen(false);
    }
  };

  const isStep1Active = currentStep <= 1;
  const isHovered = hoveredValve || hoveredBody;

  return (
    <group position={position}>
      {/* Dudukan Kaki Tabung Gas */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.29, 0.06, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Badan Tabung Gas Helium */}
      <group
        onClick={handleOpenValve}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredBody(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredBody(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.21, 0.21, 0.92, 36]} />
          <meshStandardMaterial
            color="#2b4c3f"
            emissive="#10b981"
            emissiveIntensity={hoveredBody ? 0.14 : 0.02}
            metalness={0.62}
            roughness={0.32}
          />
        </mesh>

        <mesh position={[0, 0.98, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.21, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#15803d"
            emissive="#22c55e"
            emissiveIntensity={hoveredBody ? 0.2 : 0.04}
            metalness={0.55}
            roughness={0.28}
          />
        </mesh>

        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.213, 0.213, 0.18, 36]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} />
        </mesh>

        <mesh position={[0, 1.21, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.075, 0.1, 24]} />
          <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
        </mesh>
      </group>

      {/* Regulator Tekanan Ganda & Katup Putar */}
      <group position={[0, 1.33, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.16, 24]} />
          <meshStandardMaterial color="#d97706" metalness={0.88} roughness={0.2} />
        </mesh>

        <mesh position={[0.04, 0.03, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 0.34, 16]} />
          <meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.22} />
        </mesh>

        {/* Manometer Kiri (Tekanan Isi Tabung) */}
        <group position={[-0.1, 0.11, 0.03]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.035, 28]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0, 0.019]}>
            <circleGeometry args={[0.064, 28]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <ringGeometry args={[0.045, 0.056, 20, 1, 0.3, 2.2]} />
            <meshBasicMaterial color="#16a34a" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0.022]} rotation={[0, 0, -0.65]}>
            <boxGeometry args={[0.006, 0.048, 0.002]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        </group>

        {/* Manometer Kanan (Tekanan Aliran Keluar 0-60 psi) */}
        <group position={[0.13, 0.11, 0.03]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.035, 28]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0, 0.019]}>
            <circleGeometry args={[0.064, 28]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <ringGeometry args={[0.045, 0.056, 20, 1, 0.5, 1.8]} />
            <meshBasicMaterial color="#0284c7" side={THREE.DoubleSide} />
          </mesh>
          <mesh ref={deliveryNeedleRef} position={[0, 0, 0.022]} rotation={[0, 0, 0.85]}>
            <boxGeometry args={[0.006, 0.048, 0.002]} />
            <meshBasicMaterial color="#dc2626" />
          </mesh>
        </group>

        {/* Knob Katup Regulator Interaktif */}
        <group
          ref={valveWheelRef}
          position={[0, 0.01, 0.095]}
          onClick={handleOpenValve}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredValve(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHoveredValve(false);
            document.body.style.cursor = 'auto';
          }}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.03]}>
            <cylinderGeometry args={[0.016, 0.016, 0.07, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
          </mesh>

          <mesh castShadow>
            <torusGeometry args={[0.072, 0.016, 16, 28]} />
            <meshStandardMaterial
              color={gasValveOpen ? '#10b981' : '#ef4444'}
              emissive={
                hoveredValve
                  ? '#38bdf8'
                  : isStep1Active && !gasValveOpen
                  ? '#f59e0b'
                  : gasValveOpen
                  ? '#059669'
                  : '#991b1b'
              }
              emissiveIntensity={
                hoveredValve ? 0.8 : isStep1Active && !gasValveOpen ? 0.55 : 0.3
              }
              metalness={0.45}
              roughness={0.3}
            />
          </mesh>

          {[0, Math.PI / 2].map((rot, idx) => (
            <mesh key={idx} rotation={[0, 0, rot]}>
              <cylinderGeometry args={[0.008, 0.008, 0.14, 12]} />
              <meshStandardMaterial
                color={hoveredValve ? '#38bdf8' : '#cbd5e1'}
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>
          ))}

          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.028, 16]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* Pipa Tembaga Penyalur Gas ke Mesin GC */}
      <mesh geometry={tubingGeometry} castShadow>
        <meshStandardMaterial
          color="#d97706"
          metalness={0.88}
          roughness={0.2}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Partikel Indikator Aliran Gas saat Katup Terbuka */}
      {gasValveOpen && (
        <group ref={flowParticlesRef}>
          {Array.from({ length: 10 }).map((_, idx) => (
            <mesh key={idx}>
              <sphereGeometry args={[0.022, 12, 12]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          ))}
        </group>
      )}

      {/* Label 3D Rapi (Hanya Tampil Saat Hover atau Saat Langkah 1) */}
      <LabPinLabel
        position={[0, 1.54, 0.04]}
        title="He (Helium 99.999%)"
        subtitle={`Katup: ${gasValveOpen ? 'TERBUKA' : 'TERTUTUP'} • ${gasPressure} psi`}
        badgeText={
          gasValveOpen
            ? 'Aliran Gas: 1,5 mL/mnt'
            : isStep1Active
            ? 'Klik Knob Regulator'
            : undefined
        }
        isActiveOrHovered={isHovered || isStep1Active}
        isStepTarget={isStep1Active && !gasValveOpen}
        dotColor="#10b981"
      />
    </group>
  );
};

export default GasCylinder;
