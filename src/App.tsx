import React from 'react';
import { LabScene } from './components/LabScene';
import { LabHUD } from './components/LabHUD';

export function App() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D Laboratory Canvas */}
      <LabScene />

      {/* 2D Practicum HUD Overlay */}
      <LabHUD />
    </main>
  );
}

export default App;
