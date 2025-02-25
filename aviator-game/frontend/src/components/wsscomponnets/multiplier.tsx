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

// import React, { useEffect, useState } from 'react';
// import { useAppSelector } from '../../hooks/hooks';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Plane } from "lucide-react";

// export const Multiplier = () => {
//   const multiplier = useAppSelector((state: { websocket: { multiplier: number } }) => state.websocket.multiplier) as number;
//   const [isRising, setIsRising] = useState(false);
//   const [graphPoints, setGraphPoints] = useState<{x: number, y: number}[]>([]);

//   useEffect(() => {
//     if (multiplier > 1) {
//       setIsRising(true);
//       setGraphPoints(prev => [...prev, {
//         x: prev.length,
//         y: multiplier
//       }].slice(-50));
//     } else {
//       setIsRising(false);
//       setGraphPoints([]);
//     }
//   }, [multiplier]);

//   return (
//     <div className="relative h-[400px] rounded-lg overflow-hidden bg-gradient-to-b from-purple-900 via-gray-900 to-black">
//       {/* Background glow effect */}
//       <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent" />

//       {/* Multiplier Display */}
//       <motion.div
//         className="absolute inset-0 flex items-center justify-center"
//         animate={{
//           scale: isRising ? [1, 1.1] : 1,
//         }}
//         transition={{ repeat: Infinity, duration: 0.5 }}
//       >
//         <div className="relative">
//           <motion.div
//             className="text-8xl font-bold text-white flex items-center gap-4"
//             animate={{
//               color: multiplier > 2 ? ['#ffffff', '#ef4444'] : '#ffffff',
//             }}
//           >
//             {multiplier}x
//             <AnimatePresence>
//               {isRising && (
//                 <motion.div
//                   initial={{ x: 0, y: 0, rotate: -45 }}
//                   animate={{
//                     x: [0, 50, 100, 150, 200, 250, 300, 350, 400],
//                     y: [0, -10, -20, -10, 0, 10, 20, 10, 0],
//                     rotate: [0, 10, 20, 10, 0, -10, -20, -10, 0]
//                   }}
//                   transition={{
//                     repeat: Infinity,
//                     duration: 5,
//                     ease: "linear"
//                   }}
//                 >
//                   <Plane className="w-16 h-16 text-red-500" />
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </motion.div>
//         </div>
//       </motion.div>

//       {/* Graph */}
//       <svg className="absolute bottom-0 left-0 w-full h-1/2 overflow-visible">
//         <motion.path
//           d={`M 0 ${400} ${graphPoints.map((point, i) =>
//             `L ${(i / graphPoints.length) * 400} ${400 - (Math.pow(point.y, 2) * 50)}`
//           ).join(' ')}`}
//           fill="none"
//           stroke="#ef4444"
//           strokeWidth="2"
//           initial={{ pathLength: 0 }}
//           animate={{ pathLength: 1 }}
//           transition={{ duration: 0.5 }}
//         />
//       </svg>
//     </div>
//   );
// };


import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../hooks/hooks';
import { Plane } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export const Multiplier = () => {
  const multiplier = useAppSelector((state: { websocket: { multiplier: number } }) => state.websocket.multiplier);
  const [data, setData] = useState<Array<{ x: number; y: number }>>([]);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (multiplier > 1) {
      // Add new point to data
      setData(prevData => {
        const newData = [...prevData, {
          x: prevData.length,
          y: multiplier
        }].slice(-20); // Keep last 20 points

        // Update plane position to latest point
        const lastPoint = newData[newData.length - 1];
        setCurrentPosition({
          x: lastPoint.x * (500 / 20),
          y: 250 - (lastPoint.y * 30)
        });

        return newData;
      });
    } else {
      // Reset when multiplier is 1 or less
      setData([]);
      setCurrentPosition({ x: 0, y: 0 });
    }
  }, [multiplier]);

  const getRotation = () => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1];
    const prev = data[data.length - 2];
    const dx = current.x - prev.x;
    const dy = current.y - prev.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  return (
    <div className="relative h-[400px] rounded-lg overflow-hidden bg-gradient-to-b from-purple-900 via-gray-900 to-black">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent" />

      {/* Multiplier Display */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
        animate={{
          scale: multiplier > 1 ? [1, 1.1] : 1,
        }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        <motion.div
          className="text-6xl font-bold text-white"
          animate={{
            color: multiplier > 2 ? ['#ffffff', '#ef4444'] : '#ffffff',
          }}
        >
          {multiplier}x
        </motion.div>
      </motion.div>

      {/* Graph Container */}
      <div className="relative h-full">
        <LineChart
          width={500}
          height={250}
          data={data}
          margin={{ top: 60, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="x" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Line
            type="monotone"
            dataKey="y"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>

        <AnimatePresence>
          {multiplier > 1 && (
            <motion.div
              className="absolute"
              style={{
                left: `${currentPosition.x}px`,
                top: `${currentPosition.y}px`,
                transform: `translate(-50%, -50%) rotate(${getRotation()}deg)`
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plane className="h-8 w-8 text-red-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Additional visual elements */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
};

