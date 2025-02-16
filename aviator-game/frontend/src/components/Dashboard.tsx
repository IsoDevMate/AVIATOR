import { motion } from 'framer-motion';
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { DashboardLayout } from './DashboardLayout';
import { useAppSelector } from '../hooks/hooks';
import { useWebSocket } from '../services/websocket';
import { Balance } from './wsscomponnets/balance';
import { PlaceBet } from './wsscomponnets/placebet';
import { Cashout } from './wsscomponnets/cashout';
import { Multiplier } from './wsscomponnets/multiplier';
export const Dashboard = () => {
const { user, token } = useAppSelector((state) => state.auth);

  // Establish WebSocket connection
  useWebSocket(token);
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6 max-w-6xl mx-auto p-4"
      >
        <Card
         placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}>
          <CardBody
           placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}>
            <Typography
              variant="h5" color="blue-gray"
               placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}className="mb-4">
              Welcome, {user?.username}!
            </Typography>
            <Typography
             placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}>
              You're successfully logged in to your dashboard.
            </Typography>
          </CardBody>
        </Card>

      <Balance />
      <PlaceBet />
      <Cashout />
      <Multiplier />
      </motion.div>
    </DashboardLayout>
  );
};
