import React from 'react';
import { useAppSelector } from '../../hooks/hooks';
import { TrendingUp } from "lucide-react";
export const Multiplier = () => {
  const multiplier = useAppSelector((state: { websocket: { multiplier: number } }) => state.websocket.multiplier) as number;

  return (
    <div className="relative h-[300px] flex items-center justify-center bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg shadow-lg">
      <div className="text-6xl font-bold text-red-500 flex items-center gap-2 animate-pulse">
        {multiplier}x
        <TrendingUp className="w-12 h-12" />
      </div>
    </div>
  );
};
