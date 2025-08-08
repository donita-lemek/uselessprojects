import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
      <path d="M12 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
      <path d="M19 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      <path d="m5.5 13.5.01-.01" />
      <path d="m5.5 5.5.01-.01" />
      <path d="m13.5 18.5.01-.01" />
      <path d="m18.5 10.5.01-.01" />
    </svg>
  );
}
