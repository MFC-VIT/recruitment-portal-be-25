import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Experience from "../component3d/Experience";
import Interface from "../component3d/Interface";

const Scene3d: React.FC = () => {
  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full h-[80%]">
        <Canvas camera={{ position: [1, 0.5, 17.5], fov: 30 }} shadows>
          <Experience />
        </Canvas>
      </div>
      <div className="w-full h-[20%] flex justify-center">
        <Interface />
      </div>
    </div>
  );
};

export default Scene3d;