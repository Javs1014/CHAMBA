'use client';
import { cn } from "@/lib/utils"
import * as React from "react"

export function TradeEvolutionLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="200"
      height="55"
      viewBox="0 0 800 220"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-auto", className)}
      {...props}
    >
      <g transform="translate(140,30)">
        <polygon points="0,0 160,0 160,130" fill="#7A3DB8" />
        <polygon points="-8,4 152,4 152,134" fill="#2F6FDB" />
        <polygon points="-16,8 144,8 144,138" fill="#1FA7A1" />
        <polygon points="-24,12 136,12 136,142" fill="#2FBF71" />
        <polygon points="-32,16 128,16 128,146" fill="#6DDC8B" />
        <polygon points="-40,20 120,20 120,150" fill="#B8794C" />
      </g>
      <text
        x="340"
        y="105"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="56"
        fontWeight="700"
        fill="#1F6FD6"
      >
        Trade
      </text>
      <text
        x="340"
        y="165"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="56"
        fontWeight="700"
        fill="#6E6E6E"
      >
        Evolution
      </text>
      <text
        x="640"
        y="165"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="56"
        fontWeight="700"
        fill="#1F6FD6"
      >
        OÜ
      </text>
    </svg>
  );
}
