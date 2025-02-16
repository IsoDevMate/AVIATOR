// import React from 'react';
// import { useAppSelector } from '../../hooks/hooks';
// import { TrendingUp } from "lucide-react";
// export const Multiplier = () => {
//   const multiplier = useAppSelector((state: { websocket: { multiplier: number } }) => state.websocket.multiplier) as number;

//   return (
//     <div className="relative h-[300px] flex items-center justify-center bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg shadow-lg">
//       <div className="text-6xl font-bold text-red-500 flex items-center gap-2 animate-pulse">
//         {multiplier}x
//         <TrendingUp className="w-12 h-12" />
//       </div>
//     </div>
//   );
// };


import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../hooks/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane } from "lucide-react";

export const Multiplier = () => {
  const multiplier = useAppSelector((state: { websocket: { multiplier: number } }) => state.websocket.multiplier) as number;
  const [isRising, setIsRising] = useState(false);
  const [graphPoints, setGraphPoints] = useState<{x: number, y: number}[]>([]);

  useEffect(() => {
    if (multiplier > 1) {
      setIsRising(true);
      // Add new point to graph
      setGraphPoints(prev => [...prev, {
        x: prev.length,
        y: multiplier
      }].slice(-50));
    } else {
      setIsRising(false);
      setGraphPoints([]);
    }
  }, [multiplier]);

  return (
    <div className="relative h-[400px] rounded-lg overflow-hidden bg-gradient-to-b from-purple-900 via-gray-900 to-black">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent" />

      {/* Multiplier Display */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: isRising ? [1, 1.05] : 1,
        }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        <div className="relative">
          <motion.div
            className="text-8xl font-bold text-white flex items-center gap-4"
            animate={{
              color: multiplier > 2 ? ['#ffffff', '#ef4444'] : '#ffffff',
            }}
          >
            {multiplier.toFixed(2)}x
            <AnimatePresence>
              {isRising && (
                <motion.div
                  initial={{ x: -50, rotate: -45 }}
                  animate={{
                    x: 50,
                    rotate: isRising ? [-45, -35] : -45,
                    y: isRising ? [0, -10] : 0
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear"
                  }}
                >
                  <Plane className="w-16 h-16 text-red-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {/* Graph */}
      <svg className="absolute bottom-0 left-0 w-full h-1/2 overflow-visible">
        <motion.path
          d={`M 0 ${400} ${graphPoints.map((point, i) =>
            `L ${(i / graphPoints.length) * 400} ${400 - (point.y * 50)}`
          ).join(' ')}`}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
      </svg>
    </div>
  );
};
