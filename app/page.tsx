"use client";

import Link from "next/link";
import Image from "next/image";
import AnimatedSection from "@/components/AnimatedSection";
import { Activity, Check, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      {/* NAVBAR */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/capiltrack-logo-final.png"
              alt="CapilTrack"
              width={40}
              height={40}
            />
            <span className="font-semibold text-[#2C6BED]">CapilTrack</span>
          </Link>

          {/* NAV LINKS */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="/#features" className="hover:text-black transition">
              Producto
            </Link>

            <Link href="/demo" className="hover:text-black transition">
              Demo
            </Link>

            <Link href="/#pricing" className="hover:text-black transition">
              Precio
            </Link>

            <Link href="/#faq" className="hover:text-black transition">
              FAQ
            </Link>
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-black">
              Login
            </Link>

            <Link
              href="/register"
              className="bg-[#2C6BED] text-white px-4 py-2 rounded-md font-medium shadow-sm hover:bg-[#1F56D9] transition transform hover:scale-[1.02]"
              style={{ color: "#fff" }}
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl font-semibold mb-6 leading-tight">
              Control total del seguimiento clínico capilar
            </h1>

            <p className="text-gray-600 mb-8">
              Centraliza pacientes, fotografías, métricas y procedimientos en un
              solo sistema diseñado específicamente para clínicas de injerto
              capilar.
            </p>

            <div className="flex gap-4">
              <Link
                href="/register"
                className="bg-[#2C6BED] text-white px-6 py-3 rounded-md font-medium shadow-sm hover:bg-[#1F56D9] transition transform hover:scale-[1.02]"
                style={{ color: "#fff" }}
              >
                Empezar
              </Link>

              <Link
                href="/demo"
                className="border px-6 py-3 rounded-md hover:bg-gray-100 transition"
              >
                Ver demo
              </Link>
            </div>
          </div>

          {/* MOCK */}
          <div className="bg-white border rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Paciente</p>
            <p className="font-semibold">Carlos Méndez</p>

            <div className="mt-4 text-sm text-gray-600">
              <p>Norwood: 3 → 2</p>
              <p>Densidad: +35%</p>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* HOW IT WORKS */}
      <AnimatedSection delay={0.1}>
        <section className="bg-white py-20 border-t">
          <div className="max-w-5xl mx-auto px-6 text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">
              Cómo funciona CapilTrack
            </h2>

            <p className="text-gray-600">
              Un flujo simple diseñado para la operación real de una clínica
              capilar
            </p>
          </div>

          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">
            <Step
              number="01"
              title="Registra pacientes"
              desc="Centraliza toda la información clínica desde el primer contacto"
            />

            <Step
              number="02"
              title="Captura métricas y fotos"
              desc="Documenta evolución con datos reales y comparables"
            />

            <Step
              number="03"
              title="Analiza evolución"
              desc="Toma decisiones clínicas basadas en resultados reales"
            />
          </div>
        </section>
      </AnimatedSection>

      {/* FEATURES */}
      <AnimatedSection delay={0.2}>
        <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-8">
          <Feature icon={<Activity />} title="Seguimiento clínico real" />
          <Feature icon={<Check />} title="Datos estructurados" />
          <Feature icon={<Shield />} title="Seguridad por clínica" />
        </section>
      </AnimatedSection>

      {/* PRICING */}
      <AnimatedSection delay={0.3}>
        <section className="bg-white py-24 text-center border-t" id="pricing">
          <h2 className="text-3xl font-semibold mb-6">
            Un solo sistema para toda tu clínica
          </h2>

          <div className="max-w-md mx-auto bg-[#F8FAFC] border rounded-xl p-10 shadow-sm">
            <p className="text-5xl text-[#2C6BED] font-semibold">$1,499</p>
            <p className="text-sm text-gray-500 mb-6">MXN / mes</p>

            <ul className="text-left space-y-2 mb-6 text-gray-600">
              <li>✔ Pacientes ilimitados</li>
              <li>✔ Fotografías clínicas</li>
              <li>✔ Métricas capilares</li>
              <li>✔ Procedimientos</li>
            </ul>

            <Link
              href="/register"
              className="block bg-[#2C6BED] text-white py-3 rounded-md font-medium shadow-sm hover:bg-[#1F56D9] transition transform hover:scale-[1.02]"
              style={{ color: "#fff" }}
            >
              Empezar ahora
            </Link>
          </div>
        </section>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection delay={0.4}>
        <section className="max-w-4xl mx-auto px-6 py-20" id="faq">
          <h2 className="text-2xl font-semibold mb-10 text-center">
            Preguntas frecuentes
          </h2>

          <FAQ
            q="¿Necesito instalar algo?"
            a="No, CapilTrack funciona completamente desde el navegador."
          />

          <FAQ
            q="¿Puedo usarlo en varias clínicas?"
            a="Sí, cada clínica maneja su información de forma independiente."
          />

          <FAQ
            q="¿Puedo cancelar en cualquier momento?"
            a="Sí, no hay contratos forzosos ni plazos obligatorios."
          />
        </section>
      </AnimatedSection>

      {/* CTA FINAL */}
      <AnimatedSection delay={0.5}>
        <section className="bg-[#2C6BED] text-white text-center py-20">
          <h2 className="text-3xl font-semibold mb-6">
            Profesionaliza tu clínica hoy
          </h2>

          <Link
            href="/register"
            className="bg-white text-[#2C6BED] px-6 py-3 rounded-md font-medium shadow-sm hover:bg-gray-100 transition transform hover:scale-[1.02]"
          >
            Crear cuenta
          </Link>
        </section>
      </AnimatedSection>

      {/* FOOTER */}
      <footer className="border-t bg-white mt-20">
        <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 text-sm text-gray-600">
          {/* BRAND */}
          <div>
            <p className="font-semibold text-[#2C6BED] mb-2">CapilTrack</p>
            <p className="text-gray-500">
              Software clínico para seguimiento capilar.
            </p>
          </div>

          {/* LINKS */}
          <div className="flex flex-col gap-2">
            <p className="font-medium text-gray-700 mb-2">Legal</p>

            <Link href="/privacy" className="hover:text-black transition">
              Aviso de privacidad
            </Link>

            <Link href="/terms" className="hover:text-black transition">
              Términos y condiciones
            </Link>
          </div>

          {/* CONTACT */}
          <div className="flex flex-col gap-2">
            <p className="font-medium text-gray-700 mb-2">Contacto</p>

            <Link href="/contact" className="hover:text-black transition">
              Soporte
            </Link>

            {/* <a
                href="mailto:soporte@capiltrack.com"
                className="hover:text-black transition"
              >
                soporte@capiltrack.com
              </a> */}
          </div>
        </div>

        {/* BOTTOM */}
        <div className="border-t text-center text-xs text-gray-400 py-4">
          © {new Date().getFullYear()} CapilTrack. Todos los derechos
          reservados.
        </div>
      </footer>
    </main>
  );
}

/* COMPONENTES */

function Step({ number, title, desc }: any) {
  return (
    <div className="p-6 border rounded-xl bg-[#F8FAFC] hover:shadow-md transition">
      <p className="text-sm text-[#2C6BED] font-semibold mb-2">{number}</p>
      <p className="font-medium mb-2">{title}</p>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function Feature({ icon, title }: any) {
  return (
    <div className="p-6 border rounded-xl bg-white hover:shadow-md transition">
      <div className="mb-3 text-[#2C6BED]">{icon}</div>
      <p className="font-medium">{title}</p>
    </div>
  );
}

function FAQ({ q, a }: any) {
  return (
    <div className="mb-6 border-b pb-4">
      <p className="font-medium mb-1">{q}</p>
      <p className="text-gray-600 text-sm">{a}</p>
    </div>
  );
}
