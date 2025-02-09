// types/express/index.d.ts

import { User } from '../../models/schema';

declare global {
  namespace Express {
    interface User extends User {}
  }
}
