// import React, { useState } from 'react';
// import { useAppSelector } from '../../hooks/hooks';
// import { sendWebSocketMessage } from '../../services/websocket';
// import { Card, CardBody,Button,Input} from "@material-tailwind/react";
// export const PlaceBet = () => {
//   const [amount, setAmount] = useState<number>(10);
//   const [autoMode, setAutoMode] = useState<{ enabled: boolean; targetMultiplier: number }>({
//     enabled: false,
//     targetMultiplier: 2.0
//   });
//   const token = useAppSelector((state) => state.auth.token);
//   const socket = useAppSelector((state) => state.websocket.socket) as WebSocket;

//   const handlePlaceBet = () => {
//     const message = {
//       type: 'place_bet',
//       data: { amount, autoMode },
//     };
//     sendWebSocketMessage(socket, message);
//   };

//   return (
//       <Card
//            placeholder=""
//       onPointerEnterCapture={() => {}}
//       onPointerLeaveCapture={() => {}}className="bg-gray-900 text-white shadow-lg">
//           <CardBody
//            placeholder=""
//       onPointerEnterCapture={() => {}}
//       onPointerLeaveCapture={() => {}}>
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <div className="flex justify-between items-center">
//               <span className="text-sm text-gray-400">Manual Bet</span>
//               <div className="flex space-x-2">
//                 <Button
//                                   variant="outlined"
//                                   placeholder={amount}
//       onPointerEnterCapture={() => {}}
//       onPointerLeaveCapture={() => {}}

//                   size="sm"
//                   onClick={() => setAmount(prev => Math.max(0, prev - 10))}
//                   className="bg-gray-800 text-white"
//                 >
//                   -
//                 </Button>
//                 <Input
//                   type="number"
//                                   value={amount}
//                                    placeholder=""
//       onPointerEnterCapture={() => {}}
//       onPointerLeaveCapture={() => {}}
//                   onChange={(e) => setAmount(Number(e.target.value))}
//                   className="bg-gray-800 text-white w-24 text-center"
//                   min={10}
//                   max={20000}
//                 />
//                 <Button
//                                   variant="outline"
//                                    placeholder=""
//       onPointerEnterCapture={() => {}}
//       onPointerLeaveCapture={() => {}}
//                   size="sm"
//                   onClick={() => setAmount(prev => prev + 10)}
//                   className="bg-gray-800 text-white"
//                 >
//                   +
//                 </Button>
//               </div>
//             </div>
//             <Button
//               onClick={handlePlaceBet}
//                placeholder=""
//       onPointerEnterCapture={() => {}}
//       onPointerLeaveCapture={() => {}}
//               className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
//             >
//               BET {amount.toFixed(2)} KES
//             </Button>
//           </div>

//           <div className="space-y-2">
//             <div className="flex justify-between items-center">
//               <span className="text-sm text-gray-400">Auto Bet</span>
//               <Input
//                               type="number"
//                                placeholder=""
//       onPointerEnterCapture={() => {}}
//       onPointerLeaveCapture={() => {}}
//                 value={autoMode.targetMultiplier}
//                 onChange={(e) => setAutoMode(prev => ({
//                   ...prev,
//                   targetMultiplier: Number(e.target.value)
//                 }))}
//                 className="bg-gray-800 text-white w-24 text-center"
//                 min={1.1}
//                 step={0.1}
//               />
//             </div>
//                       <Button
//                            placeholder=""
//       onPointerEnterCapture={() => {}}
//       onPointerLeaveCapture={() => {}}
//               onClick={() => setAutoMode(prev => ({ ...prev, enabled: !prev.enabled }))}
//               className={`w-full font-bold ${
//                 autoMode.enabled
//                   ? 'bg-red-500 hover:bg-red-600'
//                   : 'bg-green-500 hover:bg-green-600'
//               }`}
//             >
//               {autoMode.enabled ? 'STOP AUTO' : 'START AUTO'}
//             </Button>
//           </div>
//         </div>
//       </CardBody>
//     </Card>
//   );
// };


import React, { useState } from 'react';
import { useAppSelector } from '../../hooks/hooks';
import { sendWebSocketMessage } from '../../services/websocket';
import { motion } from 'framer-motion';
import { Card, CardBody,  Input } from "@material-tailwind/react";
import { ChevronUp, ChevronDown, Target } from "lucide-react";

export const PlaceBet = () => {
  const [amount, setAmount] = useState<number>(10);
  const [autoMode, setAutoMode] = useState<{ enabled: boolean; targetMultiplier: number }>({
    enabled: false,
    targetMultiplier: 2.0
  });
  const socket = useAppSelector((state) => state.websocket.socket) as WebSocket;

   const handlePlaceBet = () => {
    if (!socket) return;

    const message = {
      type: 'place_bet',
      data: {
        amount: Number(amount),
        autoMode: {
          enabled: autoMode.enabled,
          targetMultiplier: Number(autoMode.targetMultiplier)
        }
      }
    };

    sendWebSocketMessage(socket as WebSocket, message);
  };

  const presetAmounts = [100, 200, 500, 1000, 5000, 20000];

  return (
    <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl"
    placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}>
      <CardBody placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}>
        <div className="grid grid-cols-2 gap-6">
          {/* Manual Betting */}
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <span className="text-sm text-gray-400 font-medium">Manual Bet</span>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAmount(prev => Math.max(10, prev - 10))}
                  className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.button>

                <Input
                  type="number"
                  value={amount}
                  placeholder=""
                  crossOrigin={""}
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="bg-gray-700 text-white text-center text-xl font-bold"
                  containerProps={{ className: "min-w-[120px]" }}
                  labelProps={{ className: "hidden" }}
                  min={10}
                  max={20000}
                />

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAmount(prev => Math.min(20000, prev + 10))}
                  className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <ChevronUp className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map(preset => (
                <motion.button
                  key={preset}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAmount(preset)}
                  className="px-2 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  {preset.toLocaleString()}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePlaceBet}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors text-lg"
            >
              BET {amount.toFixed(2)} KES
            </motion.button>
          </div>

          {/* Auto Betting */}
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <span className="text-sm text-gray-400 font-medium">Auto Cashout At</span>
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-gray-400" />
      <Input
        type="number"
        value={autoMode.targetMultiplier}
        onChange={(e) => setAutoMode(prev => ({
          ...prev,
          targetMultiplier: Number(e.target.value)
        }))}
        className="bg-gray-700 text-white text-center text-xl font-bold"
        containerProps={{ className: "min-w-[120px]" }}
        labelProps={{ className: "hidden" }}
        min={1.1}
        step={0.1}
        placeholder=""
        crossOrigin=""
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      />
                <span className="text-xl font-bold">x</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setAutoMode(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-full py-4 font-bold rounded-lg transition-colors text-lg ${
                autoMode.enabled
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {autoMode.enabled ? 'STOP AUTO' : 'START AUTO'}
            </motion.button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
