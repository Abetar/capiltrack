import { Inter } from "next/font/google"
import React from "react"
import "./globals.css"
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

const inter = Inter({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "CapilTrack - Gestión de pacientes y seguimiento clínico para clínicas capilares",
  description: "CapilTrack es un software clínico diseñado para ayudar a las clínicas capilares a gestionar pacientes, realizar seguimientos clínicos y analizar resultados de manera eficiente. Con una interfaz intuitiva y herramientas avanzadas, CapilTrack facilita la organización de datos, el monitoreo de tratamientos y la generación de informes detallados para mejorar la atención al paciente y optimizar los procesos clínicos.",
};
  

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}