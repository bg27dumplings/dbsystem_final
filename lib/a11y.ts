export function describedBy(id: string, hasError: boolean) {
  return hasError ? `${id}-error` : undefined;
}

export const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
