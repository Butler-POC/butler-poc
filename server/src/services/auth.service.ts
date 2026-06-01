// Created: 2026-05-30 10:53
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/error';
import {
  AuthUser,
  JwtPayload,
  LoginInput,
  SignupInput,
  USER_TYPES,
  UserType,
} from '../types/user';

const TOKEN_TTL = '7d';
const SALT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new HttpError(500, '서버 설정 오류: JWT_SECRET 이 없습니다.');
  }
  return secret;
}

function toAuthUser(u: {
  id: string;
  email: string;
  name: string;
  userType: UserType;
}): AuthUser {
  return { id: u.id, email: u.email, name: u.name, userType: u.userType };
}

function issueToken(user: AuthUser): { token: string; user: AuthUser } {
  const payload: JwtPayload = { sub: user.id, userType: user.userType };
  const token = jwt.sign(payload, jwtSecret(), { expiresIn: TOKEN_TTL });
  return { token, user };
}

export async function signup(input: SignupInput) {
  const email = (input.email ?? '').trim().toLowerCase();
  const name = (input.name ?? '').trim();
  const { password, userType } = input;

  // 입력 검증
  if (!EMAIL_RE.test(email)) throw new HttpError(400, '올바른 이메일을 입력해 주세요.');
  if (!password || password.length < 8)
    throw new HttpError(400, '비밀번호는 8자 이상이어야 합니다.');
  if (!name) throw new HttpError(400, '이름을 입력해 주세요.');
  if (!USER_TYPES.includes(userType))
    throw new HttpError(400, '사용자 유형을 선택해 주세요.');

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new HttpError(409, '이미 가입된 이메일입니다.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, userType },
  });

  return issueToken(toAuthUser(user));
}

export async function login(input: LoginInput) {
  const email = (input.email ?? '').trim().toLowerCase();
  const { password } = input;

  const user = await prisma.user.findUnique({ where: { email } });
  // 이메일 존재 여부를 노출하지 않도록 동일 메시지 사용
  if (!user) throw new HttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');

  const ok = await bcrypt.compare(password ?? '', user.passwordHash);
  if (!ok) throw new HttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');

  return issueToken(toAuthUser(user));
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toAuthUser(user) : null;
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, jwtSecret()) as JwtPayload;
}
