import * as crypto from 'crypto';

export const generateCrashPoint = (): number => {
  const e = Math.pow(2, 32);
  const h = crypto.randomBytes(4).readUInt32BE(0);
  return Math.floor(100 * e / (e - h)) / 100;
};

export const calculateMultiplier = (elapsed: number): number => {
  // Time-based multiplier calculation
  const baseMultiplier = 1;
  const growthRate = 0.00006;
  return baseMultiplier * Math.pow(Math.E, growthRate * elapsed);
};
