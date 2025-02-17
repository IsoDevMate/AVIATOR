// // src/components/Cashout.tsx
// import React from 'react';
// import { useAppSelector } from '../../hooks/hooks';
// import { sendWebSocketMessage } from '../../services/websocket';
// import { Button } from "@material-tailwind/react";

// export const Cashout = () => {
//   const socket = useAppSelector((state) => state.websocket.socket);

//   const handleCashout = () => {
//     const message = {
//       type: 'cashout',
//       data: {},
//     };
//     sendWebSocketMessage(socket as WebSocket, message);
//   };

//   return (
//     <Button
//       onClick={handleCashout}
//       className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 text-lg"
//       placeholder=""
//       onPointerEnterCapture={() => {}}
//       onPointerLeaveCapture={() => {}}
//     >
//       CASHOUT
//     </Button>
//   );
// };

import React from 'react';
import { useAppSelector } from '../../hooks/hooks';
import { sendWebSocketMessage } from '../../services/websocket';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
export const Cashout = () => {
  const socket = useAppSelector((state) => state.websocket.socket);
  const multiplier = useAppSelector((state) => state.websocket.multiplier) as number;
  const [lastCashout, setLastCashout] = React.useState<number | null>(null);

  const handleCashout = () => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }
    const message = {
      type: 'cashout',
      data: {},
    };
    sendWebSocketMessage(socket as WebSocket, message);

    // Trigger confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setLastCashout(multiplier);
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleCashout}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-6 text-2xl rounded-lg shadow-lg transition-all"
      >
        CASHOUT
      </motion.button>

      <AnimatePresence>
        {lastCashout && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            Cashed out at {lastCashout}x!
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
