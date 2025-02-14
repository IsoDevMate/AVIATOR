// src/components/Cashout.tsx
import React from 'react';
import { useAppSelector } from '../../hooks/hooks';
import { sendWebSocketMessage } from '../../services/websocket';
import { Button } from "@material-tailwind/react";

export const Cashout = () => {
  const socket = useAppSelector((state) => state.websocket.socket);

  const handleCashout = () => {
    const message = {
      type: 'cashout',
      data: {},
    };
    sendWebSocketMessage(socket as WebSocket, message);
  };

  return (
    <Button
      onClick={handleCashout}
      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 text-lg"
      placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
    >
      CASHOUT
    </Button>
  );
};
