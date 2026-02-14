import { cn } from "@/lib/utils"
import * as React from "react"

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 48 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-auto", className)}
      {...props}
    >
      {/* Left Tilde/Wave */}
      <path
        d="M2 12C4 6, 7 18, 10 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-75"
      />
      {/* Center Chevron /\\ */}
      <path
        d="M20 20L24 4L28 20"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Tilde/Wave */}
      <path
        d="M38 12C40 6, 43 18, 46 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-75"
      />
    </svg>
  )
}
