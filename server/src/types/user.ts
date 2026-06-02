// Created: 2026-05-30 10:51
/** 사용자 유형 (Prisma enum 과 동일 문자열) */
export type UserType = 'LANDLORD' | 'TENANT' | 'AGENT';

export const USER_TYPES: UserType[] = ['LANDLORD', 'TENANT', 'AGENT'];

/** 클라이언트에 노출하는 사용자 정보 (비밀번호 해시 제외) */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  userType: UserType;
}

/** JWT 페이로드 */
export interface JwtPayload {
  sub: string;
  userType: UserType;
}

export interface SignupInput {
  email: string;
  password: string;
  name: string;
  userType: UserType;
}

export interface LoginInput {
  email: string;
  password: string;
}
