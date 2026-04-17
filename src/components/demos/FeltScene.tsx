import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function Box() {
  const mesh = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += delta * 0.35;
    mesh.current.rotation.y += delta * 0.55;
  });
  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1.35, 1.35, 1.35]} />
      <meshStandardMaterial color="#c45c3e" roughness={0.45} metalness={0.15} />
    </mesh>
  );
}

/** Minimal Three.js scene via R3F — brutal “toy” on a felt-adjacent plane. */
export function FeltScene() {
  return (
    <div className="h-56 w-full overflow-hidden rounded-lg border border-border bg-[#121214]">
      <Canvas camera={{ position: [2.4, 1.8, 2.8], fov: 45 }}>
        <color attach="background" args={["#0e0e10"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 3]} intensity={1.2} />
        <Box />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.85, 0]}>
          <planeGeometry args={[6, 6]} />
          <meshStandardMaterial color="#2a2420" roughness={0.9} />
        </mesh>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
