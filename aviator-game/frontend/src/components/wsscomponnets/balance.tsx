// src/components/Balance.tsx
import React from 'react';
import { useAppSelector } from '../../hooks/hooks';

export const Balance = () => {
  const balance = useAppSelector((state: { auth: { balance?: number } }) => state.auth.balance) ?? 1000;

  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold text-green-500">
        Balance: {typeof balance === 'number' ? balance.toFixed(2) : '0.00'} KES
      </h3>
    </div>
  );
};
