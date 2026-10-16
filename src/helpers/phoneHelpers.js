export function formatPhone(phone) {
  if (!phone) return "-";

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 13) {
    return `+${digits.slice(0,2)} (${digits.slice(2,4)}) ${digits.slice(4,9)}-${digits.slice(9)}`;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  }

  return phone;
}