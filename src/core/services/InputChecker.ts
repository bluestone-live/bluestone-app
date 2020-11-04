export function checkNumber(input: string) {
  return /^(\d+\.?\d*|\.\d+)$/.test(input);
}
