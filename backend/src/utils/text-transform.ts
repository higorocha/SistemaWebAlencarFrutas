export function capitalizeName(name: string): string {
  if (!name) return '';
  return name.replace(/\b(\w)/g, s => s.toUpperCase());
}
