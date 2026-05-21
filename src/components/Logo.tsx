export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <rect width="64" height="64" rx="14" fill="#0284c7" />
      <circle cx="32" cy="32" r="19" fill="#ffffff" />
      <circle cx="32" cy="32" r="19" fill="none" stroke="#bae6fd" strokeWidth="2" />
      <circle cx="25.5" cy="26" r="3" fill="#0284c7" />
      <circle cx="38.5" cy="26" r="3" fill="#0284c7" />
      <circle cx="25.5" cy="38" r="3" fill="#0284c7" />
      <circle cx="38.5" cy="38" r="3" fill="#0284c7" />
    </svg>
  );
}
