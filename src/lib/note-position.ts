export function notePosition(x: number, y: number, width: number, height: number) {
  const horizontal = Math.max(0, width - Math.min(248, width));
  const vertical = Math.max(0, height - 224);
  return { left: Math.min(1, Math.max(0, x)) * horizontal, top: Math.min(1, Math.max(0, y)) * vertical, horizontal, vertical };
}

export function normalizedPosition(left: number, top: number, horizontal: number, vertical: number) {
  return { x: horizontal ? Math.min(1, Math.max(0, left / horizontal)) : 0, y: vertical ? Math.min(1, Math.max(0, top / vertical)) : 0 };
}
