import React from "react"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export default function Button(props: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 8,
        border: "none",
        background: "#2C6BED",
        color: "white",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        boxSizing: "border-box",
        ...props.style,
      }}
    />
  )
}