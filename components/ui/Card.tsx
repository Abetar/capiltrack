import React from "react"

type CardProps = {
  children: React.ReactNode
}

export default function Card({ children }: CardProps) {
  return (
    <div
      style={{
        width: 420,
        background: "white",
        borderRadius: 12,
        padding: 40,
        border: "1px solid #E5E7EB",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  )
}