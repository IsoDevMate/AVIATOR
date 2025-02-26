import { User } from '../../models/schema';

declare global {
  namespace Express {
    interface User extends User {}

    interface Request {
      user?: User;
    }
    interface Request {
      accessToken?: string;
    }
  }
}

export { User, Request };
