import { BadRequestException } from '@nestjs/common';

// "YYYY-MM-DD HH:mm"
export const YMDHM_RE =
  /^(?<y>\d{4})-(?<m>0[1-9]|1[0-2])-(?<d>0[1-9]|[12]\d|3[01])\s(?<H>[01]\d|2[0-3]):(?<M>[0-5]\d)$/;

// "HH:mm:ss" (두 자리 고정)
export const HMS_RE = /^(?<H>[0-1]\d|2[0-3]):(?<M>[0-5]\d):(?<S>[0-5]\d)$/;

export function parseYmdHmToDate(input: string): Date {
  const m = YMDHM_RE.exec(input)?.groups;
  if (!m) {
    throw new BadRequestException(
      'runAt은 "YYYY-MM-DD HH:mm" 형식이어야 합니다.',
    );
  }
  const y = +m.y,
    mon = +m.m - 1,
    d = +m.d;
  const H = +m.H,
    M = +m.M;
  return new Date(y, mon, d, H, M, 0, 0); // 로컬 기준
}

export function parseHmsToSec(hms: string): number {
  const g = HMS_RE.exec(hms)?.groups;
  if (!g) {
    throw new BadRequestException('duration은 "HH:mm:ss" 형식이어야 합니다.');
  }
  const H = +g.H,
    M = +g.M,
    S = +g.S;
  return H * 3600 + M * 60 + S;
}

export function formatSecToHms(sec: number): string {
  const t = Math.max(0, Math.trunc(sec || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatSecToMs(sec: number): string {
  const t = Math.max(0, Math.trunc(sec || 0));
  const m = Math.floor(t / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(m)}:${pad(s)}`;
}
