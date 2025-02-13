import { motion } from 'framer-motion';
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { DashboardLayout } from './DashboardLayout';
import { useAppSelector } from '../hooks/hooks';

export const Dashboard = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardBody>
            <Typography variant="h5" color="blue-gray" className="mb-4">
              Welcome, {user?.username}!
            </Typography>
            <Typography>
              You're successfully logged in to your dashboard.
            </Typography>
          </CardBody>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};
