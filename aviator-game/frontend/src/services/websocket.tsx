// src/services/websocket.ts
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { websocketConnected, websocketMessageReceived, setWebSocketInstance } from '../features/ws/websocketslice';

export const sendWebSocketMessage = (socket: WebSocket, message: Record<string, unknown>) => {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open');
     }
}

export const useWebSocket = (token: string) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:3000/ws?token=${token}`);

    dispatch(setWebSocketInstance(socket));

    socket.onopen = () => {
      console.log('WebSocket connection established');
      dispatch(websocketConnected(true));
    };

    socket.onmessage = (event) => {
      console.log('Message from server:', event.data);
      dispatch(websocketMessageReceived(JSON.parse(event.data)));
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      dispatch(websocketConnected(false));
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [dispatch, token]);
};
