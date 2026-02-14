import { cn } from "@/lib/utils"
import * as React from "react"

export function SuccessfulTradeLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="300"
      height="67"
      viewBox="0 0 450 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-auto w-auto", className)}
      style={{ fontFamily: '"SF Pro Text", "Helvetica Neue", Arial, sans-serif' }}
      {...props}
    >
      {/* Logo Mark */}
      <g>
        {/* Green Shape */}
        <path d="M0 0 H40 L60 50 L40 100 H0 Z" fill="#188344" />
        {/* Blue Chevron */}
        <path d="M45 15 L80 50 L45 85 L35 75 L55 50 L35 25 Z" fill="#0094D3" />
        {/* Brown Chevron */}
        <path d="M75 15 L110 50 L75 85 L65 75 L85 50 L65 25 Z" fill="#9F6B4F" />
        {/* Beige Chevron */}
        <path d="M105 15 L140 50 L105 85 L95 75 L115 50 L95 25 Z" fill="#DAB88F" />
      </g>
      
      {/* Text Part */}
      <g transform="translate(160, 0)">
        <text x="0" y="45" fontSize="40" fontWeight="bold" fill="#188344">
          Successful
        </text>
        <text x="0" y="90" fontSize="40" fontWeight="bold" fill="#188344">
          Trade
        </text>
        <text x="145" y="90" fontSize="24" fontWeight="bold" fill="#188344">
          PTE LTD
        </text>
      </g>
    </svg>
  )
}
