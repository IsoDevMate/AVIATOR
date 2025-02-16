// // src/components/Balance.tsx
// import React from 'react';
// import { useAppSelector } from '../../hooks/hooks';

// export const Balance = () => {
//   const balance = useAppSelector((state: { auth: { balance?: number } }) => state.auth.balance) ?? 1000;

//   return (
//     <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
//       <h3 className="text-2xl font-bold text-green-500">
//         Balance: {typeof balance === 'number' ? balance.toFixed(2) : '0.00'} KES
//       </h3>
//     </div>
//   );
// };


import React from 'react';
import { useAppSelector } from '../../hooks/hooks';
import { motion } from 'framer-motion';
import { Wallet } from "lucide-react";

export const Balance = () => {
  const balance = useAppSelector((state: { auth: { balance?: number } }) => state.auth.balance) ?? 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-lg shadow-lg"
    >
      <div className="flex items-center gap-3">
        <Wallet className="w-8 h-8 text-green-500" />
        <h3 className="text-3xl font-bold">
          <span className="text-gray-400">Balance:</span>{' '}
          <motion.span
            key={balance?.toString()}
            initial={{ scale: 1.2, color: '#22c55e' }}
            animate={{ scale: 1, color: '#4ade80' }}
            className="text-green-400"
          >
            {typeof balance === 'number' ? balance.toFixed(2) : '0.00'} KES
          </motion.span>
        </h3>
      </div>
    </motion.div>
  );
};
