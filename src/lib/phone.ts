export function normalizeUsPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(national)) {
    return null;
  }

  return {
    e164: `+1${national}`,
    display: `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`
  };
}
