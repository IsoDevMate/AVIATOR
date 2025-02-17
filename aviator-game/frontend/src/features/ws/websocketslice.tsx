// // src/features/websocket/websocketSlice.ts
// import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// interface WebSocketState {
//   isConnected: boolean;
//   messages: any[];
// }

// const initialState: WebSocketState = {
//   isConnected: false,
//   messages: [],
// };
// export const sendWebSocketMessage = (socket: WebSocket, message: Record<string, unknown>) => {
//     if (socket.readyState === WebSocket.OPEN) {
//         socket.send(JSON.stringify(message));
//     } else {
//         console.error('WebSocket is not open');
//     }
// };
// const websocketSlice = createSlice({
//   name: 'websocket',
//   initialState,
//   reducers: {
//     websocketConnected(state, action: PayloadAction<boolean>) {
//       state.isConnected = action.payload;
//     },
//     websocketMessageReceived(state, action: PayloadAction<string>) {
//       state.messages.push(action.payload);
//     },
//   },
// });

// export const { websocketConnected, websocketMessageReceived } = websocketSlice.actions;
// export default websocketSlice.reducer;


// src/features/websocket/websocketSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WebSocketState {
  isConnected: boolean;
  messages: { type: string; data: Record<string, unknown> }[];
  multiplier: number;
  socket: WebSocket | null;
}

const initialState: WebSocketState = {
  isConnected: false,
  messages: [],
  multiplier: 1.0,
  socket: null,
};



const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    websocketConnected(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },
    websocketMessageReceived(state, action: PayloadAction<{ type: string; data: { multiplier: number } & Record<string, unknown> }>) {
      state.messages.push(action.payload);
      if (action.payload.type === 'game:multiplier') {
        state.multiplier = action.payload.data.multiplier;
      }
      if (action.payload.type === 'game:crash') {
        state.multiplier = action.payload.data.multiplier;
      }
    },
    setWebSocketInstance(state, action: PayloadAction<WebSocket>) {
      state.socket = action.payload;
    },
  },
});

export const { websocketConnected, websocketMessageReceived, setWebSocketInstance } = websocketSlice.actions;
export default websocketSlice.reducer;
