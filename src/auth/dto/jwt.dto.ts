export type AccessPayload = { sub: string; email: string; type: 'access' };
export type RefreshPayload = { sub: string; type: 'refresh'; jwtid: string };
