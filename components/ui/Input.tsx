import React from "react"

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export default function Input(props: InputProps) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        ...props.style,
      }}
    />
  )
}