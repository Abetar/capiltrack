export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#F8FAFC",
      }}
    >
      <div
        style={{
          width: 420,
          background: "white",
          borderRadius: 12,
          padding: 40,
          border: "1px solid #E5E7EB",
        }}
      >
        {children}
      </div>
    </div>
  )
}