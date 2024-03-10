export default function OldJersey({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 250 200"
      className={className}
    >
      <path
        fill="#DC7633"
        stroke="#000"
        strokeWidth="3"
        d="m10 47 15 40 40-25 10 125h100l10-125 40 25 15-40-50-35h-28a64 64 0 0 1-74 0H60z"
      />
    </svg>
  );
}
