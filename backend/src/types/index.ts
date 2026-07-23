export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  PRINCIPAL = "PRINCIPAL",
  VICE_PRINCIPAL = "VICE_PRINCIPAL",
  HOD = "HOD",
  DEPARTMENT_STAFF = "DEPARTMENT_STAFF",
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  departmentId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
