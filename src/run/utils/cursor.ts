// runs/utils/cursor.ts
export interface RunCursor {
  runAt: Date;
  id: string;
}

export function encodeRunCursor(c: RunCursor): string {
  const raw = `${c.runAt.toISOString()}|${c.id}`;
  return Buffer.from(raw, 'utf8').toString('base64url');
}

export function decodeRunCursor(cursor: string): RunCursor {
  const raw = Buffer.from(cursor, 'base64url').toString('utf8');
  const [runAtStr, id] = raw.split('|');
  return { runAt: new Date(runAtStr), id };
}
