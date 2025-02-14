import React, { useState } from 'react';
import { useAppSelector } from '../../hooks/hooks';
import { sendWebSocketMessage } from '../../services/websocket';
import { Card, CardBody,Button,Input} from "@material-tailwind/react";
export const PlaceBet = () => {
  const [amount, setAmount] = useState<number>(10);
  const [autoMode, setAutoMode] = useState<{ enabled: boolean; targetMultiplier: number }>({
    enabled: false,
    targetMultiplier: 2.0
  });
  const token = useAppSelector((state) => state.auth.token);
  const socket = useAppSelector((state) => state.websocket.socket) as WebSocket;

  const handlePlaceBet = () => {
    const message = {
      type: 'place_bet',
      data: { amount, autoMode },
    };
    sendWebSocketMessage(socket, message);
  };

  return (
      <Card
           placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}className="bg-gray-900 text-white shadow-lg">
          <CardBody
           placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Manual Bet</span>
              <div className="flex space-x-2">
                <Button
                                  variant="outlined"
                                  placeholder={amount}
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}

                  size="sm"
                  onClick={() => setAmount(prev => Math.max(0, prev - 10))}
                  className="bg-gray-800 text-white"
                >
                  -
                </Button>
                <Input
                  type="number"
                                  value={amount}
                                   placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="bg-gray-800 text-white w-24 text-center"
                  min={10}
                  max={20000}
                />
                <Button
                                  variant="outline"
                                   placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
                  size="sm"
                  onClick={() => setAmount(prev => prev + 10)}
                  className="bg-gray-800 text-white"
                >
                  +
                </Button>
              </div>
            </div>
            <Button
              onClick={handlePlaceBet}
               placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
            >
              BET {amount.toFixed(2)} KES
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Auto Bet</span>
              <Input
                              type="number"
                               placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
                value={autoMode.targetMultiplier}
                onChange={(e) => setAutoMode(prev => ({
                  ...prev,
                  targetMultiplier: Number(e.target.value)
                }))}
                className="bg-gray-800 text-white w-24 text-center"
                min={1.1}
                step={0.1}
              />
            </div>
                      <Button
                           placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
              onClick={() => setAutoMode(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-full font-bold ${
                autoMode.enabled
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {autoMode.enabled ? 'STOP AUTO' : 'START AUTO'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
