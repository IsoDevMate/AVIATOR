import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Navbar,
  Typography,
  Button,
  IconButton,
  Drawer,
} from "@material-tailwind/react";
import { useAppDispatch } from '../hooks/hooks';
import { logout } from '../features/auth/authslice';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar className="sticky top-0 z-10 max-w-full rounded-none px-4 py-2" placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>
        <div className="flex items-center justify-between">
          <Typography variant="h5" color="blue-gray" placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>
            Dashboard
          </Typography>
          <div className="hidden md:flex gap-4">
            <Button variant="text" onClick={handleLogout} placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>
              Logout
            </Button>
          </div>
          <IconButton
            variant="text"
            className="md:hidden"
                      onClick={() => setIsDrawerOpen(true)}
                      placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </IconButton>
        </div>
      </Navbar>

      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
              className="p-4"
              placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}
      >
        <div className="mb-6">
                  <Typography variant="h5" color="blue-gray"
                  placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>
            Menu
          </Typography>
        </div>
        <Button
          variant="text"
          onClick={handleLogout}
                  className="w-full justify-start"
                  placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}
        >
          Logout
        </Button>
      </Drawer>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {children}
      </motion.main>
    </div>
  );
};
