import React from 'react';
import { Html } from '@react-three/drei';

interface LabPinLabelProps {
  position: [number, number, number];
  title: string;
  subtitle?: string;
  badgeText?: string;
  isActiveOrHovered: boolean;
  isStepTarget?: boolean;
  dotColor?: string;
}

/**
 * Komponen Label 3D (<Html>) yang rapi, berukuran tetap (tanpa distanceFactor / transform),
 * pointer-events-none, zIndexRange={[10, 0]}, dan hanya menampilkan kotak teks saat
 * di-hover atau menjadi target aktif pada langkah (currentStep) saat ini.
 */
export const LabPinLabel: React.FC<LabPinLabelProps> = ({
  position,
  title,
  subtitle,
  badgeText,
  isActiveOrHovered,
  isStepTarget = false,
  dotColor = '#38bdf8',
}) => {
  return (
    <Html
      position={position}
      center
      zIndexRange={[10, 0]}
      className="pointer-events-none select-none"
    >
      {isActiveOrHovered ? (
        <div className="pointer-events-none flex flex-col items-center">
          <div
            className={`max-w-[180px] rounded-lg border px-2.5 py-1 text-center shadow-lg backdrop-blur-md transition-all ${
              isStepTarget
                ? 'border-amber-400/90 bg-slate-900/95 ring-1 ring-amber-400/40'
                : 'border-sky-500/50 bg-slate-900/90'
            }`}
          >
            <div className="truncate text-xs font-semibold leading-tight text-slate-100">
              {title}
            </div>
            {subtitle && (
              <div className="mt-0.5 truncate font-mono text-[10px] leading-tight text-sky-300">
                {subtitle}
              </div>
            )}
            {badgeText && (
              <div className="mt-0.5 truncate rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-300">
                {badgeText}
              </div>
            )}
          </div>
          {/* Garis penunjuk tipis ke objek 3D di bawahnya */}
          <div
            className="h-3.5 w-[1px]"
            style={{ backgroundColor: isStepTarget ? '#fbbf24' : dotColor }}
          />
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: isStepTarget ? '#fbbf24' : dotColor }}
          />
        </div>
      ) : (
        /* Titik indikator kecil (pin minimalis) saat tidak di-hover & bukan target aktif */
        <div className="pointer-events-none flex items-center justify-center">
          <span
            className="h-2 w-2 rounded-full border border-slate-950 opacity-75 shadow-sm"
            style={{ backgroundColor: dotColor }}
          />
        </div>
      )}
    </Html>
  );
};

export default LabPinLabel;
