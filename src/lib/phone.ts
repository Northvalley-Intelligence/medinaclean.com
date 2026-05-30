export function normalizeUsPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (!/^\d{10}$/.test(national)) {
    return null;
  }

  return {
    e164: `+1${national}`,
    display: `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`
  };
}
