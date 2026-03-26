"use client"

import { useState } from "react"

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: any) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <main className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-xl mx-auto px-6 py-20">

        <h1 className="text-3xl font-semibold mb-6">
          Contacto
        </h1>

        <p className="text-gray-600 mb-8">
          ¿Tienes dudas o necesitas soporte? Escríbenos.
        </p>

        {sent ? (
          <p className="text-green-600">
            Mensaje enviado correctamente.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="text"
              placeholder="Nombre"
              required
              className="w-full border rounded-md p-3"
            />

            <input
              type="email"
              placeholder="Correo electrónico"
              required
              className="w-full border rounded-md p-3"
            />

            <textarea
              placeholder="Mensaje"
              required
              rows={5}
              className="w-full border rounded-md p-3"
            />

            <button
              type="submit"
              className="bg-[#2C6BED] text-white px-6 py-3 rounded-md hover:bg-[#1F56D9] transition"
            >
              Enviar mensaje
            </button>

          </form>
        )}

      </div>
    </main>
  )
}