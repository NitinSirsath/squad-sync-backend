export type UserType = {
  username: string;
  email: string;
  password: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  _id: string;
  role?: number;
};
