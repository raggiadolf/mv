export default function PolkaDotJersey({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 250 200"
      className={className}
    >
      <defs>
        <pattern
          id="a"
          width="42.4"
          height="42.4"
          x="0"
          y="0"
          patternUnits="userSpaceOnUse"
        >
          <path fill="#fff" d="M0 0h42.4v42.4H0z" />
          <g fill="red">
            <circle cx="21.2" r="7.4" />
            <circle cx="21.2" cy="42.4" r="7.4" />
            <circle cy="21.2" r="7.4" />
            <circle cx="42.4" cy="21.2" r="7.4" />
          </g>
        </pattern>
      </defs>
      <path
        d="m10 47 15 40 40-25 10 125h100l10-125 40 25 15-40-50-35h-28a64 64 0 0 1-74 0H60z"
        style={{
          fill: "url(#a)",
          stroke: "#000",
          strokeWidth: "3",
        }}
      />
    </svg>
  );
}