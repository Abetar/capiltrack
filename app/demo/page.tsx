"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function DemoPage() {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  return (
    <main className="bg-[#F8FAFC] min-h-screen text-[#1F2937]">

      {/* NAVBAR */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-2">
            <Image src="/capiltrack-logo-final.png" alt="CapilTrack" width={40} height={40} />
            <span className="font-semibold text-[#2C6BED]">CapilTrack</span>
          </Link>

          <div className="hidden md:block text-sm text-gray-500">
            Vista del sistema
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-gray-600 hover:text-black">
              ← Volver
            </Link>

            <Link
              href="/register"
              className="bg-[#2C6BED] text-white px-5 py-2 rounded-md font-medium shadow-sm hover:bg-[#1F56D9] transition transform hover:scale-[1.02]"
              style={{ color: "#fff" }}
            >
              Crear cuenta
            </Link>
          </div>

        </div>
      </header>

      {/* HEADER */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold mb-4">
          Así funciona CapilTrack en una clínica real
        </h1>

        <p className="text-gray-600">
          Un vistazo a cómo puedes gestionar pacientes, seguimiento clínico y resultados en un solo sistema.
        </p>
      </section>

      {/* SECTIONS */}
      <Section
        title="Visión general de la clínica"
        desc="Monitorea pacientes, evolución y actividad clínica en un solo panel."
        image="/capiltrack-dashboard.jpg"
        onOpen={setActiveImage}
      />

      <Section
        title="Historial clínico completo"
        desc="Cada paciente tiene un timeline con consultas, métricas y evolución real."
        image="/capiltrack-history.jpg"
        reverse
        onOpen={setActiveImage}
      />

      <Section
        title="Comparativas antes y después"
        desc="Compara fotografías por zona para mostrar resultados claros a tus pacientes."
        image="/capiltrack-comparison.jpg"
        onOpen={setActiveImage}
      />

      <Section
        title="Registro de procedimientos"
        desc="Documenta grafts, técnica, bloques y detalles clínicos sin perder información."
        image="/capiltrack-procedures.jpg"
        reverse
        onOpen={setActiveImage}
      />

      {/* CTA */}
      <section className="bg-[#2C6BED] text-white text-center py-20 mt-20">
        <h2 className="text-3xl font-semibold mb-6">
          Lleva tu clínica al siguiente nivel
        </h2>

        <Link
          href="/register"
          className="bg-white text-[#2C6BED] px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition"
        >
          Crear cuenta
        </Link>
      </section>

      {/* MODAL */}
      <AnimatePresence>
        {activeImage && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveImage(null)}
          >
            <motion.div
              className="relative max-w-5xl w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={activeImage}
                alt="Preview"
                width={1400}
                height={900}
                className="w-full h-auto rounded-lg"
              />

              {/* CLOSE */}
              <button
                onClick={() => setActiveImage(null)}
                className="absolute top-4 right-4 bg-white text-black px-3 py-1 rounded-md text-sm shadow"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}


/* SECTION */

function Section({ title, desc, image, reverse = false, onOpen }: any) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center"
    >

      {/* TEXT */}
      <div className={reverse ? "order-2" : ""}>
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{desc}</p>

        {/* BUTTON */}
        <button
          onClick={() => onOpen(image)}
          className="bg-[#2C6BED] text-white px-5 py-2 rounded-md text-sm hover:bg-[#1F56D9] transition"
        >
          Ver imagen completa
        </button>
      </div>

      {/* IMAGE */}
      <div className={reverse ? "order-1" : ""}>
        <div className="rounded-xl overflow-hidden border shadow-sm">
          <Image
            src={image}
            alt={title}
            width={1200}
            height={800}
            className="w-full h-auto"
          />
        </div>
      </div>

    </motion.section>
  );
}