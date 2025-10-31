import type { SVGProps } from 'react';

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
      <path d="M2.5 17.5L6 14l4-4 4.5 4.5L21.5 12" />
      <path d="M2.5 12.5l3.5 3.5 4-4 4.5 4.5L21.5 10" />
    </svg>
  );
}
