import React from 'react';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useLabStore } from '../store/useLabStore';

interface LabRoomEnvironmentProps {
  floorY?: number;
}

const CEILING_Y = 3.7;
const BACK_Z = -3.6;
const FRONT_Z = 7.5;
const LEFT_X = -6.8;
const RIGHT_X = 6.8;

const ROOM_WIDTH = RIGHT_X - LEFT_X; // 13.6
const ROOM_DEPTH = FRONT_Z - BACK_Z; // 11.1
const CENTER_Z = (BACK_Z + FRONT_Z) / 2; // 1.95

/**
 * Lingkungan ruangan laboratorium kimia analitik 3D lengkap (4 dinding, plafon,
 * elemen arsitektur, serta furnitur & alat dekoratif pasif non-interaktif).
 * Tidak menggunakan event handler atau lampu castShadow tambahan agar performa tetap ringan.
 */
export const LabRoomEnvironment: React.FC<LabRoomEnvironmentProps> = ({
  floorY = -1.605,
}) => {
  const labTheme = useLabStore((s) => s.labTheme);
  const isLight = labTheme === 'light';

  const roomHeight = CEILING_Y - floorY;
  const centerY = (floorY + CEILING_Y) / 2;

  // Palet material menyesuaikan Mode Terang ('light') dan Mode Gelap ('dark')
  const wallColor = isLight ? '#f1f5f9' : '#0f172a';
  const dadoColor = isLight ? '#e2e8f0' : '#131d31';
  const trimColor = isLight ? '#94a3b8' : '#1e293b';
  const ceilingColor = isLight ? '#f8fafc' : '#0b1120';
  const frameColor = isLight ? '#475569' : '#334155';
  const cabinetBodyColor = isLight ? '#cbd5e1' : '#1e293b';
  const cabinetDoorColor = isLight ? '#e2e8f0' : '#273549';
  const benchTopColor = isLight ? '#1e293b' : '#161f30';
  const metalColor = isLight ? '#94a3b8' : '#475569';

  const dadoHeight = 1.25;
  const dadoCenterY = floorY + dadoHeight / 2;

  return (
    <group>
      {/* =================================================================== */}
      {/* 1. STRUKTUR RUANGAN UTUH: 4 DINDING, PLAFON & LIS DINDING           */}
      {/* =================================================================== */}

      {/* Dinding Belakang (z = -3.6) */}
      <mesh position={[0, centerY, BACK_Z]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, roomHeight]} />
        <meshStandardMaterial color={wallColor} metalness={0.08} roughness={0.85} />
      </mesh>
      {/* Panel Bawah & Lis Dinding Belakang */}
      <mesh position={[0, dadoCenterY, BACK_Z + 0.008]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, dadoHeight]} />
        <meshStandardMaterial color={dadoColor} metalness={0.1} roughness={0.75} />
      </mesh>
      <mesh position={[0, floorY + dadoHeight, BACK_Z + 0.015]}>
        <boxGeometry args={[ROOM_WIDTH, 0.045, 0.03]} />
        <meshStandardMaterial color={trimColor} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, floorY + 0.06, BACK_Z + 0.015]}>
        <boxGeometry args={[ROOM_WIDTH, 0.12, 0.03]} />
        <meshStandardMaterial color={trimColor} metalness={0.25} roughness={0.6} />
      </mesh>

      {/* Dinding Depan (z = 7.5) */}
      <mesh
        position={[0, centerY, FRONT_Z]}
        rotation={[0, Math.PI, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, roomHeight]} />
        <meshStandardMaterial color={wallColor} metalness={0.08} roughness={0.85} />
      </mesh>
      <mesh
        position={[0, dadoCenterY, FRONT_Z - 0.008]}
        rotation={[0, Math.PI, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, dadoHeight]} />
        <meshStandardMaterial color={dadoColor} metalness={0.1} roughness={0.75} />
      </mesh>
      <mesh position={[0, floorY + dadoHeight, FRONT_Z - 0.015]}>
        <boxGeometry args={[ROOM_WIDTH, 0.045, 0.03]} />
        <meshStandardMaterial color={trimColor} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, floorY + 0.06, FRONT_Z - 0.015]}>
        <boxGeometry args={[ROOM_WIDTH, 0.12, 0.03]} />
        <meshStandardMaterial color={trimColor} metalness={0.25} roughness={0.6} />
      </mesh>

      {/* Dinding Kiri (x = -6.8) */}
      <mesh
        position={[LEFT_X, centerY, CENTER_Z]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_DEPTH, roomHeight]} />
        <meshStandardMaterial color={wallColor} metalness={0.08} roughness={0.85} />
      </mesh>
      <mesh
        position={[LEFT_X + 0.008, dadoCenterY, CENTER_Z]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_DEPTH, dadoHeight]} />
        <meshStandardMaterial color={dadoColor} metalness={0.1} roughness={0.75} />
      </mesh>
      <mesh position={[LEFT_X + 0.015, floorY + dadoHeight, CENTER_Z]}>
        <boxGeometry args={[0.03, 0.045, ROOM_DEPTH]} />
        <meshStandardMaterial color={trimColor} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[LEFT_X + 0.015, floorY + 0.06, CENTER_Z]}>
        <boxGeometry args={[0.03, 0.12, ROOM_DEPTH]} />
        <meshStandardMaterial color={trimColor} metalness={0.25} roughness={0.6} />
      </mesh>

      {/* Dinding Kanan (x = 6.8) */}
      <mesh
        position={[RIGHT_X, centerY, CENTER_Z]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_DEPTH, roomHeight]} />
        <meshStandardMaterial color={wallColor} metalness={0.08} roughness={0.85} />
      </mesh>
      <mesh
        position={[RIGHT_X - 0.008, dadoCenterY, CENTER_Z]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_DEPTH, dadoHeight]} />
        <meshStandardMaterial color={dadoColor} metalness={0.1} roughness={0.75} />
      </mesh>
      <mesh position={[RIGHT_X - 0.015, floorY + dadoHeight, CENTER_Z]}>
        <boxGeometry args={[0.03, 0.045, ROOM_DEPTH]} />
        <meshStandardMaterial color={trimColor} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[RIGHT_X - 0.015, floorY + 0.06, CENTER_Z]}>
        <boxGeometry args={[0.03, 0.12, ROOM_DEPTH]} />
        <meshStandardMaterial color={trimColor} metalness={0.25} roughness={0.6} />
      </mesh>

      {/* Plafon Ruangan (y = 3.7, tanpa castShadow agar lampu utama tetap menembus) */}
      <mesh
        position={[0, CEILING_Y, CENTER_Z]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color={ceilingColor} metalness={0.05} roughness={0.9} />
      </mesh>

      {/* Kisi Rangka Plafon Akustik Ringan */}
      {[-3.4, 0, 3.4].map((xPos, idx) => (
        <mesh key={`ceil-beam-z-${idx}`} position={[xPos, CEILING_Y - 0.015, CENTER_Z]}>
          <boxGeometry args={[0.05, 0.03, ROOM_DEPTH]} />
          <meshStandardMaterial color={trimColor} metalness={0.35} roughness={0.5} />
        </mesh>
      ))}
      {[-1.8, 1.5, 4.8].map((zPos, idx) => (
        <mesh key={`ceil-beam-x-${idx}`} position={[0, CEILING_Y - 0.015, zPos]}>
          <boxGeometry args={[ROOM_WIDTH, 0.03, 0.05]} />
          <meshStandardMaterial color={trimColor} metalness={0.35} roughness={0.5} />
        </mesh>
      ))}

      {/* Papan Plakat Utama di Dinding Belakang */}
      <group position={[0, 3.05, BACK_Z + 0.02]}>
        <mesh>
          <planeGeometry args={[7.6, 0.44]} />
          <meshBasicMaterial
            color={isLight ? '#e2e8f0' : '#111827'}
            transparent
            opacity={0.9}
          />
        </mesh>
        <mesh position={[0, 0.22, 0.005]}>
          <boxGeometry args={[7.64, 0.02, 0.015]} />
          <meshStandardMaterial color="#0284c7" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.22, 0.005]}>
          <boxGeometry args={[7.64, 0.02, 0.015]} />
          <meshStandardMaterial color="#0284c7" metalness={0.5} roughness={0.3} />
        </mesh>
        <React.Suspense fallback={null}>
          <Text
            position={[0, 0, 0.015]}
            fontSize={0.155}
            color={isLight ? '#0f172a' : '#94a3b8'}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.1}
          >
            LABORATORIUM KIMIA ANALITIK • DIVISI KROMATOGRAFI GAS
          </Text>
        </React.Suspense>
      </group>

      {/* =================================================================== */}
      {/* 2. ELEMEN ARSITEKTUR: PINTU, JENDELA, VENTILASI / AC / EXHAUST      */}
      {/* =================================================================== */}

      {/* PINTU LABORATORIUM (Dinding Kanan, z = 2.8) */}
      <group position={[RIGHT_X - 0.02, floorY, 2.8]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Kusen Pintu */}
        <mesh position={[-0.6, 1.18, 0.02]}>
          <boxGeometry args={[0.08, 2.36, 0.08]} />
          <meshStandardMaterial color={frameColor} metalness={0.4} roughness={0.45} />
        </mesh>
        <mesh position={[0.6, 1.18, 0.02]}>
          <boxGeometry args={[0.08, 2.36, 0.08]} />
          <meshStandardMaterial color={frameColor} metalness={0.4} roughness={0.45} />
        </mesh>
        <mesh position={[0, 2.34, 0.02]}>
          <boxGeometry args={[1.28, 0.08, 0.08]} />
          <meshStandardMaterial color={frameColor} metalness={0.4} roughness={0.45} />
        </mesh>

        {/* Daun Pintu */}
        <mesh position={[0, 1.15, 0.01]}>
          <boxGeometry args={[1.12, 2.3, 0.045]} />
          <meshStandardMaterial
            color={isLight ? '#cbd5e1' : '#1e293b'}
            metalness={0.25}
            roughness={0.5}
          />
        </mesh>

        {/* Pelat Tahan Benturan Bawah Pintu (Kick Plate) */}
        <mesh position={[0, 0.16, 0.036]}>
          <boxGeometry args={[1.06, 0.28, 0.008]} />
          <meshStandardMaterial color={metalColor} metalness={0.75} roughness={0.28} />
        </mesh>

        {/* Jendela Kaca Kecil pada Daun Pintu */}
        <mesh position={[0.2, 1.56, 0.036]}>
          <boxGeometry args={[0.3, 0.72, 0.015]} />
          <meshStandardMaterial color={frameColor} metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0.2, 1.56, 0.045]}>
          <planeGeometry args={[0.24, 0.66]} />
          <meshStandardMaterial
            color={isLight ? '#bae6fd' : '#0b1322'}
            transparent
            opacity={0.62}
            metalness={0.2}
            roughness={0.15}
          />
        </mesh>

        {/* Handle Pintu Stainless */}
        <group position={[-0.4, 1.02, 0.042]}>
          <mesh>
            <boxGeometry args={[0.055, 0.18, 0.012]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0.06, 0.02, 0.035]}>
            <boxGeometry args={[0.14, 0.022, 0.022]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.18} />
          </mesh>
        </group>

        {/* Papan Tanda "EXIT / LAB KIMIA" di Atas Pintu */}
        <group position={[0, 2.55, 0.04]}>
          <mesh>
            <boxGeometry args={[0.92, 0.24, 0.035]} />
            <meshStandardMaterial
              color="#064e3b"
              emissive="#10b981"
              emissiveIntensity={isLight ? 0.22 : 0.45}
              roughness={0.35}
            />
          </mesh>
          <React.Suspense fallback={null}>
            <Text
              position={[0, 0, 0.022]}
              fontSize={0.085}
              color="#ecfdf5"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.06}
            >
              EXIT / LAB KIMIA
            </Text>
          </React.Suspense>
        </group>
      </group>

      {/* JENDELA BESAR LABORATORIUM (Dinding Kiri, z = 1.65) */}
      <group position={[LEFT_X + 0.02, 0.95, 1.65]} rotation={[0, Math.PI / 2, 0]}>
        {/* Cahaya / Latar Luar Jendela (Terang saat Mode Terang, Gelap saat Mode Gelap) */}
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[3.2, 2.0]} />
          <meshStandardMaterial
            color={isLight ? '#e0f2fe' : '#040812'}
            emissive={isLight ? '#bae6fd' : '#020617'}
            emissiveIntensity={isLight ? 0.55 : 0.05}
            roughness={0.5}
          />
        </mesh>

        {/* Kaca Semi-Transparan */}
        <mesh position={[0, 0, 0.018]}>
          <planeGeometry args={[3.2, 2.0]} />
          <meshStandardMaterial
            color={isLight ? '#f0f9ff' : '#0f172a'}
            transparent
            opacity={isLight ? 0.42 : 0.72}
            metalness={0.35}
            roughness={0.12}
          />
        </mesh>

        {/* Bingkai / Kusen Luar Jendela */}
        <mesh position={[0, 1.02, 0.03]}>
          <boxGeometry args={[3.34, 0.08, 0.07]} />
          <meshStandardMaterial color={frameColor} metalness={0.45} roughness={0.4} />
        </mesh>
        <mesh position={[0, -1.03, 0.045]}>
          <boxGeometry args={[3.38, 0.09, 0.14]} />
          <meshStandardMaterial color={frameColor} metalness={0.45} roughness={0.4} />
        </mesh>
        <mesh position={[-1.63, 0, 0.03]}>
          <boxGeometry args={[0.08, 2.1, 0.07]} />
          <meshStandardMaterial color={frameColor} metalness={0.45} roughness={0.4} />
        </mesh>
        <mesh position={[1.63, 0, 0.03]}>
          <boxGeometry args={[0.08, 2.1, 0.07]} />
          <meshStandardMaterial color={frameColor} metalness={0.45} roughness={0.4} />
        </mesh>

        {/* Tiang Pembagi Kaca (Mullions) */}
        {[-0.55, 0.55].map((xMul, idx) => (
          <mesh key={`win-mul-${idx}`} position={[xMul, 0, 0.03]}>
            <boxGeometry args={[0.055, 2.0, 0.05]} />
            <meshStandardMaterial color={frameColor} metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 0.42, 0.028]}>
          <boxGeometry args={[3.22, 0.045, 0.045]} />
          <meshStandardMaterial color={frameColor} metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* UNIT AC DINDING (Dinding Belakang Sisi Kanan Atas) */}
      <group position={[4.55, 2.95, BACK_Z + 0.14]}>
        <RoundedBox args={[1.38, 0.34, 0.25]} radius={0.03} smoothness={3}>
          <meshStandardMaterial
            color={isLight ? '#f8fafc' : '#cbd5e1'}
            metalness={0.2}
            roughness={0.35}
          />
        </RoundedBox>
        {/* Kisi-kisi Heatsink & Louver Bawah */}
        <mesh position={[0, -0.09, 0.128]}>
          <boxGeometry args={[1.24, 0.06, 0.015]} />
          <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.05, 0.128]}>
          <boxGeometry args={[1.28, 0.012, 0.01]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Lampu Indikator Status AC */}
        <mesh position={[0.52, -0.02, 0.128]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      </group>

      {/* GRILLE VENTILASI UDARA (Dinding Kanan Atas, z = -1.6) */}
      <group position={[RIGHT_X - 0.02, 3.05, -1.6]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.92, 0.44, 0.035]} />
          <meshStandardMaterial color={metalColor} metalness={0.55} roughness={0.35} />
        </mesh>
        {[-0.14, -0.07, 0, 0.07, 0.14].map((yPos, idx) => (
          <mesh key={`vent-slat-${idx}`} position={[0, yPos, 0.02]}>
            <boxGeometry args={[0.8, 0.022, 0.015]} />
            <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* SALURAN EXHAUST / DUCTING DEKAT PLAFON (Menghubungkan Fume Hood ke Dinding Kanan) */}
      <group>
        {/* Pipa Vertikal dari atas Lemari Asam (y ~ 1.25) ke Ducting Plafon */}
        <mesh position={[-5.25, 2.38, -2.75]}>
          <cylinderGeometry args={[0.17, 0.17, 2.26, 18]} />
          <meshStandardMaterial color={metalColor} metalness={0.68} roughness={0.28} />
        </mesh>
        {/* Elbow / Kotak Sambungan Ducting */}
        <mesh position={[-5.25, 3.48, -3.02]}>
          <boxGeometry args={[0.42, 0.28, 0.72]} />
          <meshStandardMaterial color={metalColor} metalness={0.65} roughness={0.3} />
        </mesh>
        {/* Saluran Ducting Horizontal Sepanjang Dinding Belakang Atas */}
        <mesh position={[0.75, 3.48, -3.28]}>
          <boxGeometry args={[12.0, 0.26, 0.36]} />
          <meshStandardMaterial color={metalColor} metalness={0.65} roughness={0.3} />
        </mesh>
        {/* Cincin Sambungan (Flange) Ducting */}
        {[-3.2, -0.8, 1.6, 4.0, 6.2].map((xPos, idx) => (
          <mesh key={`duct-flange-${idx}`} position={[xPos, 3.48, -3.28]}>
            <boxGeometry args={[0.04, 0.3, 0.4]} />
            <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.25} />
          </mesh>
        ))}
      </group>

      {/* =================================================================== */}
      {/* 3. FURNITUR & ALAT LAB DEKORATIF (DI LUAR AREA MEJA KERJA UTAMA)     */}
      {/*    Area Meja Utama Terlarang: x: [-3.5, 3.5], z: [-1.5, 1.5]        */}
      {/*    SEMUA OBJEK DI BAWAH BERSIFAT PASIF / TANPA EVENT HANDLER        */}
      {/* =================================================================== */}

      {/* A. LEMARI ASAM (FUME HOOD) — Sudut Belakang Kiri */}
      <group position={[-5.25, floorY, -2.75]} rotation={[0, 0.18, 0]}>
        {/* Kabinet Dasar Bawah */}
        <RoundedBox
          args={[1.72, 0.92, 0.92]}
          position={[0, 0.46, 0]}
          radius={0.02}
          smoothness={3}
          receiveShadow
        >
          <meshStandardMaterial color={cabinetBodyColor} metalness={0.35} roughness={0.45} />
        </RoundedBox>
        {/* Pintu Kabinet Bawah */}
        {[-0.42, 0.42].map((xDoor, idx) => (
          <group key={`fh-door-${idx}`} position={[xDoor, 0.46, 0.465]}>
            <mesh>
              <boxGeometry args={[0.78, 0.82, 0.02]} />
              <meshStandardMaterial color={cabinetDoorColor} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[idx === 0 ? 0.28 : -0.28, 0.14, 0.02]}>
              <boxGeometry args={[0.025, 0.16, 0.02]} />
              <meshStandardMaterial color={frameColor} metalness={0.75} roughness={0.25} />
            </mesh>
          </group>
        ))}

        {/* Meja Kerja Tahan Kimia di Dalam Fume Hood */}
        <mesh position={[0, 0.945, 0]}>
          <boxGeometry args={[1.76, 0.05, 0.96]} />
          <meshStandardMaterial color={benchTopColor} metalness={0.2} roughness={0.3} />
        </mesh>

        {/* Dinding Belakang & Samping Bilik Fume Hood */}
        <mesh position={[0, 1.72, -0.42]}>
          <boxGeometry args={[1.7, 1.5, 0.06]} />
          <meshStandardMaterial color={isLight ? '#f8fafc' : '#1e293b'} roughness={0.5} />
        </mesh>
        {[-0.82, 0.82].map((xSide, idx) => (
          <mesh key={`fh-side-${idx}`} position={[xSide, 1.72, 0]}>
            <boxGeometry args={[0.06, 1.5, 0.9]} />
            <meshStandardMaterial color={cabinetBodyColor} metalness={0.35} roughness={0.4} />
          </mesh>
        ))}

        {/* Kanopi Atas + Panel Sakelar Fume Hood */}
        <mesh position={[0, 2.66, 0]}>
          <boxGeometry args={[1.74, 0.42, 0.94]} />
          <meshStandardMaterial color={cabinetBodyColor} metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Strip Lampu Interior Fume Hood */}
        <mesh position={[0, 2.43, 0.08]}>
          <boxGeometry args={[1.2, 0.03, 0.18]} />
          <meshBasicMaterial color={isLight ? '#ffffff' : '#e0f2fe'} />
        </mesh>
        {/* Panel Tombol Kontrol di Kanopi Depan */}
        <mesh position={[0.45, 2.64, 0.475]}>
          <boxGeometry args={[0.48, 0.14, 0.015]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[0.32, 2.64, 0.485]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
        <mesh position={[0.42, 2.64, 0.485]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>

        {/* Kaca Sash Geser Depan Semi-Transparan */}
        <mesh position={[0, 1.85, 0.42]}>
          <planeGeometry args={[1.56, 1.1]} />
          <meshStandardMaterial
            color="#e0f2fe"
            transparent
            opacity={0.24}
            metalness={0.2}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Pegangan Sash */}
        <mesh position={[0, 1.3, 0.43]}>
          <boxGeometry args={[1.56, 0.04, 0.03]} />
          <meshStandardMaterial color={frameColor} metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Gelas Lab Dekoratif di Dalam Lemari Asam */}
        <mesh position={[-0.35, 1.07, -0.05]}>
          <cylinderGeometry args={[0.07, 0.07, 0.2, 16]} />
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.5} roughness={0.15} />
        </mesh>
        <mesh position={[-0.35, 1.03, -0.05]}>
          <cylinderGeometry args={[0.062, 0.062, 0.1, 16]} />
          <meshStandardMaterial color="#f59e0b" transparent opacity={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[0.25, 1.08, -0.1]}>
          <cylinderGeometry args={[0.045, 0.09, 0.22, 16]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.55} roughness={0.15} />
        </mesh>
      </group>

      {/* B. LEMARI PENYIMPANAN BAHAN KIMIA / RAK REAGEN — Sudut Belakang Kanan */}
      <group position={[5.15, floorY, -2.85]} rotation={[0, -0.18, 0]}>
        {/* Rangka Utama Lemari */}
        <RoundedBox
          args={[1.78, 2.35, 0.62]}
          position={[0, 1.175, 0]}
          radius={0.02}
          smoothness={3}
          receiveShadow
        >
          <meshStandardMaterial color={cabinetBodyColor} metalness={0.35} roughness={0.45} />
        </RoundedBox>

        {/* Kabinet Tertutup Bagian Bawah */}
        {[-0.43, 0.43].map((xDoor, idx) => (
          <group key={`cab-door-${idx}`} position={[xDoor, 0.44, 0.315]}>
            <mesh>
              <boxGeometry args={[0.8, 0.78, 0.02]} />
              <meshStandardMaterial color={cabinetDoorColor} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[idx === 0 ? 0.3 : -0.3, 0.12, 0.02]}>
              <boxGeometry args={[0.022, 0.14, 0.02]} />
              <meshStandardMaterial color={frameColor} metalness={0.75} roughness={0.25} />
            </mesh>
          </group>
        ))}

        {/* Stiker Peringatan Bahan Kimia di Kabinet Bawah */}
        <mesh position={[-0.43, 0.48, 0.33]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.14, 0.14]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>

        {/* Ruang Rak Reagen Terbuka Bagian Atas */}
        <mesh position={[0, 1.58, 0.04]}>
          <boxGeometry args={[1.64, 1.38, 0.54]} />
          <meshStandardMaterial color={isLight ? '#f8fafc' : '#0b1322'} roughness={0.7} />
        </mesh>

        {/* 3 Papan Rak + Deretan Botol Reagen Berwarna */}
        {[1.0, 1.44, 1.88].map((shelfY, sIdx) => (
          <group key={`shelf-${sIdx}`} position={[0, shelfY, 0.05]}>
            <mesh>
              <boxGeometry args={[1.64, 0.035, 0.52]} />
              <meshStandardMaterial color={metalColor} metalness={0.45} roughness={0.4} />
            </mesh>
            {[-0.64, -0.4, -0.16, 0.08, 0.32, 0.56].map((bx, bIdx) => {
              const bottleColors = [
                '#92400e',
                '#1d4ed8',
                '#047857',
                '#b45309',
                '#0369a1',
                '#be123c',
              ];
              const bColor = bottleColors[(sIdx * 2 + bIdx) % bottleColors.length];
              const bHeight = 0.22 + ((bIdx + sIdx) % 3) * 0.035;
              const bRadius = 0.055 + ((bIdx + sIdx) % 2) * 0.012;
              return (
                <group key={`reagent-${sIdx}-${bIdx}`} position={[bx, 0.018, 0.02]}>
                  {/* Badan Botol */}
                  <mesh position={[0, bHeight / 2, 0]}>
                    <cylinderGeometry args={[bRadius, bRadius, bHeight, 14]} />
                    <meshStandardMaterial
                      color={bColor}
                      transparent
                      opacity={0.86}
                      roughness={0.22}
                      metalness={0.1}
                    />
                  </mesh>
                  {/* Leher & Tutup Botol */}
                  <mesh position={[0, bHeight + 0.022, 0]}>
                    <cylinderGeometry args={[bRadius * 0.52, bRadius * 0.55, 0.045, 12]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.45} />
                  </mesh>
                  {/* Label Putih Botol */}
                  <mesh position={[0, bHeight * 0.55, bRadius + 0.002]}>
                    <planeGeometry args={[bRadius * 1.15, bHeight * 0.38]} />
                    <meshBasicMaterial color="#f8fafc" />
                  </mesh>
                </group>
              );
            })}
          </group>
        ))}
      </group>

      {/* C. MEJA LAB SAMPING KANAN + ALAT DEKORATIF (x = 5.85, z = -0.25) */}
      <group position={[5.85, floorY, -0.25]}>
        {/* Daun Meja Samping */}
        <RoundedBox
          args={[0.96, 0.07, 2.55]}
          position={[0, 0.9, 0]}
          radius={0.015}
          smoothness={3}
          receiveShadow
        >
          <meshStandardMaterial color={benchTopColor} metalness={0.2} roughness={0.28} />
        </RoundedBox>
        {/* Kaki Meja Samping */}
        {[
          [-0.4, -1.14],
          [0.4, -1.14],
          [-0.4, 1.14],
          [0.4, 1.14],
        ].map(([lx, lz], idx) => (
          <mesh key={`rb-leg-${idx}`} position={[lx, 0.43, lz]}>
            <boxGeometry args={[0.07, 0.86, 0.07]} />
            <meshStandardMaterial color={frameColor} metalness={0.55} roughness={0.35} />
          </mesh>
        ))}
        {/* Laci Bawah Meja Samping */}
        <RoundedBox
          args={[0.82, 0.42, 0.92]}
          position={[0, 0.64, 0.65]}
          radius={0.015}
          smoothness={3}
        >
          <meshStandardMaterial color={cabinetBodyColor} metalness={0.35} roughness={0.4} />
        </RoundedBox>

        {/* Alat Dekoratif 1: Neraca Analitik (Analytical Balance) */}
        <group position={[0.05, 0.935, -0.7]}>
          <RoundedBox args={[0.32, 0.07, 0.38]} position={[0, 0.035, 0]} radius={0.01}>
            <meshStandardMaterial color={isLight ? '#e2e8f0' : '#334155'} roughness={0.4} />
          </RoundedBox>
          {/* Layar Digital Depan */}
          <mesh position={[-0.162, 0.04, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.24, 0.042]} />
            <meshBasicMaterial color="#0c4a6e" />
          </mesh>
          {/* Ruang Kaca Pelindung Angin (Draft Shield) */}
          <mesh position={[0.02, 0.18, 0]}>
            <boxGeometry args={[0.24, 0.22, 0.26]} />
            <meshStandardMaterial
              color="#e0f2fe"
              transparent
              opacity={0.28}
              roughness={0.1}
            />
          </mesh>
          {/* Piringan Timbang Logam */}
          <mesh position={[0.02, 0.08, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.012, 20]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>

        {/* Alat Dekoratif 2: Oven Laboratorium Tambahan */}
        <group position={[0.08, 0.935, 0.55]}>
          <RoundedBox args={[0.48, 0.52, 0.54]} position={[0, 0.26, 0]} radius={0.015}>
            <meshStandardMaterial color={cabinetDoorColor} metalness={0.4} roughness={0.35} />
          </RoundedBox>
          <mesh position={[-0.242, 0.3, 0.04]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.28, 0.24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.3} roughness={0.2} />
          </mesh>
          <mesh position={[-0.242, 0.1, 0]}>
            <boxGeometry args={[0.015, 0.08, 0.44]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} />
          </mesh>
        </group>

        {/* Alat Dekoratif 3: Gelas Kimia & Labu Erlenmeyer */}
        <group position={[-0.12, 0.935, -0.1]}>
          <mesh position={[0, 0.09, -0.12]}>
            <cylinderGeometry args={[0.065, 0.065, 0.18, 16]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.48} roughness={0.12} />
          </mesh>
          <mesh position={[0, 0.05, -0.12]}>
            <cylinderGeometry args={[0.058, 0.058, 0.09, 16]} />
            <meshStandardMaterial color="#06b6d4" transparent opacity={0.75} roughness={0.2} />
          </mesh>
          <mesh position={[0.05, 0.1, 0.1]}>
            <cylinderGeometry args={[0.025, 0.08, 0.2, 16]} />
            <meshStandardMaterial color="#e0f2fe" transparent opacity={0.5} roughness={0.12} />
          </mesh>
          <mesh position={[0.05, 0.045, 0.1]}>
            <cylinderGeometry args={[0.055, 0.072, 0.08, 16]} />
            <meshStandardMaterial color="#10b981" transparent opacity={0.75} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* D. MEJA LAB SAMPING KIRI (Di Bawah Jendela) + MIKROSKOP DEKORATIF */}
      <group position={[-5.95, floorY, 1.95]}>
        <RoundedBox
          args={[0.92, 0.07, 2.3]}
          position={[0, 0.9, 0]}
          radius={0.015}
          smoothness={3}
          receiveShadow
        >
          <meshStandardMaterial color={benchTopColor} metalness={0.2} roughness={0.28} />
        </RoundedBox>
        {[
          [-0.38, -1.02],
          [0.38, -1.02],
          [-0.38, 1.02],
          [0.38, 1.02],
        ].map(([lx, lz], idx) => (
          <mesh key={`lb-leg-${idx}`} position={[lx, 0.43, lz]}>
            <boxGeometry args={[0.07, 0.86, 0.07]} />
            <meshStandardMaterial color={frameColor} metalness={0.55} roughness={0.35} />
          </mesh>
        ))}

        {/* Mikroskop Dekoratif */}
        <group position={[0.05, 0.935, -0.35]} rotation={[0, 0.4, 0]}>
          {/* Alas Mikroskop */}
          <RoundedBox args={[0.24, 0.045, 0.3]} position={[0, 0.022, 0]} radius={0.01}>
            <meshStandardMaterial color={isLight ? '#e2e8f0' : '#334155'} roughness={0.4} />
          </RoundedBox>
          {/* Tiang & Lengan Lengkung */}
          <mesh position={[-0.07, 0.18, 0]} rotation={[0, 0, -0.18]}>
            <boxGeometry args={[0.05, 0.3, 0.06]} />
            <meshStandardMaterial color={isLight ? '#cbd5e1' : '#475569'} roughness={0.35} />
          </mesh>
          {/* Meja Objek */}
          <mesh position={[0.02, 0.14, 0]}>
            <boxGeometry args={[0.16, 0.015, 0.16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          {/* Lensa Objektif & Kepala Okuler */}
          <mesh position={[0.02, 0.24, 0]}>
            <cylinderGeometry args={[0.022, 0.016, 0.09, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh position={[0.06, 0.35, 0]} rotation={[0, 0, -0.65]}>
            <cylinderGeometry args={[0.02, 0.024, 0.16, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.35} />
          </mesh>
        </group>

        {/* Rak Tabung Reaksi + Gelas Ukur Dekoratif */}
        <group position={[-0.08, 0.935, 0.48]}>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.12, 0.12, 0.32]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.2} roughness={0.4} />
          </mesh>
          {[-0.1, -0.035, 0.035, 0.1].map((tz, idx) => (
            <mesh key={`tube-${idx}`} position={[0, 0.13, tz]}>
              <cylinderGeometry args={[0.014, 0.014, 0.18, 10]} />
              <meshStandardMaterial color="#e0f2fe" transparent opacity={0.65} roughness={0.15} />
            </mesh>
          ))}
        </group>
      </group>

      {/* E. KURSI LAB (LAB STOOLS) DI PINGGIR RUANGAN */}
      {[
        [4.85, -0.35],
        [-4.85, 1.95],
        [4.65, 2.35],
      ].map(([sx, sz], idx) => (
        <group key={`stool-${idx}`} position={[sx, floorY, sz]}>
          {/* Alas Roda Bintang 5 Sederhana */}
          {[0, 1, 2, 3, 4].map((arm) => (
            <mesh
              key={`arm-${arm}`}
              position={[0, 0.04, 0]}
              rotation={[0, (arm * Math.PI * 2) / 5, 0]}
            >
              <boxGeometry args={[0.42, 0.03, 0.04]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          {/* Tiang Hidrolik Tengah */}
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.03, 0.035, 0.6, 14]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Ring Pijakan Kaki */}
          <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.17, 0.012, 8, 24]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Dudukan Empuk */}
          <mesh position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.2, 0.21, 0.07, 20]} />
            <meshStandardMaterial color="#0f172a" roughness={0.65} />
          </mesh>
        </group>
      ))}

      {/* F. PAPAN TULIS PUTIH (WHITEBOARD) — Dinding Kanan */}
      <group position={[RIGHT_X - 0.025, 1.15, -0.25]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Bingkai Aluminium */}
        <mesh>
          <boxGeometry args={[2.35, 1.25, 0.035]} />
          <meshStandardMaterial color={metalColor} metalness={0.65} roughness={0.3} />
        </mesh>
        {/* Bidang Papan Tulis */}
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[2.24, 1.14]} />
          <meshStandardMaterial
            color={isLight ? '#ffffff' : '#cbd5e1'}
            roughness={0.25}
          />
        </mesh>
        {/* Tray Spidol Bawah */}
        <mesh position={[0, -0.63, 0.06]}>
          <boxGeometry args={[0.85, 0.025, 0.08]} />
          <meshStandardMaterial color={frameColor} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[-0.15, -0.608, 0.065]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.12, 8]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
        </mesh>
        <mesh position={[0.05, -0.608, 0.065]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.12, 8]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        <React.Suspense fallback={null}>
          <Text
            position={[-0.95, 0.42, 0.025]}
            fontSize={0.075}
            color="#0f172a"
            anchorX="left"
            anchorY="middle"
          >
            CATATAN METODE GC-FID:
          </Text>
          <Text
            position={[-0.95, 0.25, 0.025]}
            fontSize={0.052}
            color="#0284c7"
            anchorX="left"
            anchorY="middle"
          >
            • Carrier Gas: He 99.999% (40 psi)
          </Text>
          <Text
            position={[-0.95, 0.12, 0.025]}
            fontSize={0.052}
            color="#0f172a"
            anchorX="left"
            anchorY="middle"
          >
            • Kolom DB-5 (Non-Polar) / DB-WAX (Polar)
          </Text>
          <Text
            position={[-0.95, -0.01, 0.025]}
            fontSize={0.052}
            color="#0f172a"
            anchorX="left"
            anchorY="middle"
          >
            • Target Resolusi Optimal: Rs &gt; 1.5
          </Text>
        </React.Suspense>
      </group>

      {/* G. POSTER KESELAMATAN LAB — Dinding Kiri (Di Samping Jendela) */}
      <group position={[LEFT_X + 0.025, 1.15, -1.25]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.05, 1.38, 0.025]} />
          <meshStandardMaterial color={frameColor} metalness={0.45} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[0.96, 1.28]} />
          <meshStandardMaterial
            color={isLight ? '#ffffff' : '#1e293b'}
            roughness={0.6}
          />
        </mesh>
        {/* Header Kuning/Merah Poster K3 */}
        <mesh position={[0, 0.52, 0.018]}>
          <planeGeometry args={[0.9, 0.18]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
        {/* Simbol Berlian Bahaya Sederhana (NFPA) */}
        <mesh position={[0, 0.12, 0.018]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.26, 0.26]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[-0.14, -0.02, 0.019]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.16, 0.16]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
        <mesh position={[0.14, -0.02, 0.019]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.16, 0.16]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <React.Suspense fallback={null}>
          <Text
            position={[0, 0.52, 0.025]}
            fontSize={0.058}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
          >
            KESELAMATAN LAB (K3)
          </Text>
          <Text
            position={[0, -0.38, 0.025]}
            fontSize={0.044}
            color={isLight ? '#334155' : '#cbd5e1'}
            anchorX="center"
            anchorY="middle"
          >
            GUNAKAN JAS LAB &amp; KACAMATA PELINDUNG
          </Text>
          <Text
            position={[0, -0.5, 0.025]}
            fontSize={0.04}
            color={isLight ? '#64748b' : '#94a3b8'}
            anchorX="center"
            anchorY="middle"
          >
            TUTUP PINTU OVEN SAAT PEMANASAN
          </Text>
        </React.Suspense>
      </group>
    </group>
  );
};

export default LabRoomEnvironment;
