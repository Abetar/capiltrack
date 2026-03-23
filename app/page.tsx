import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">

      {/* NAVBAR */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-capiltrack.png"
              alt="CapilTrack software para clínicas capilares"
              width={34}
              height={34}
            />
            <span className="text-lg font-semibold text-[#2C6BED]">
              CapilTrack
            </span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-black">
              Login
            </Link>

            <Link
              href="/register"
              className="bg-[#2C6BED] px-4 py-2 rounded-md font-medium hover:bg-[#1F56D9] !text-white"
              style={{ color: "#FFFFFF" }}
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>



      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-28 text-center">

        <h1 className="text-5xl font-semibold leading-tight mb-6">
          Software para clínicas capilares que centraliza pacientes, fotos y tratamientos
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          CapilTrack es un sistema diseñado específicamente para clínicas de injerto capilar
          que necesitan organizar su operación, dar seguimiento clínico real y mostrar resultados
          claros a sus pacientes.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/register"
            className="bg-[#2C6BED] px-8 py-4 rounded-md font-medium hover:bg-[#1F56D9] !text-white"
            style={{ color: "#FFFFFF" }}
          >
            Crear cuenta
          </Link>

          <Link
            href="/login"
            className="border border-gray-300 px-8 py-4 rounded-md hover:bg-gray-100"
          >
            Iniciar sesión
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-6">
          Sin instalaciones • Acceso desde cualquier lugar • Diseñado para clínicas reales
        </p>

      </section>



      {/* PROBLEMA */}
      <section className="bg-white border-t py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">

          <h2 className="text-2xl font-semibold mb-6">
            El seguimiento clínico capilar suele estar fragmentado
          </h2>

          <p className="text-gray-600 text-lg">
            Fotos en WhatsApp, notas en hojas, procedimientos en Excel.
            Esto hace imposible ver la evolución real del paciente y reduce
            la calidad del servicio que ofrece la clínica.
          </p>

        </div>
      </section>



      {/* SOLUCIÓN */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-10">

        <div>
          <h3 className="font-semibold mb-3 text-lg">
            Historial clínico centralizado
          </h3>

          <p className="text-gray-600">
            Toda la información del paciente en un solo sistema:
            consultas, métricas, fotos y tratamientos.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-lg">
            Evolución visual real
          </h3>

          <p className="text-gray-600">
            Compara fotografías por zona y analiza el progreso capilar
            de forma clara y profesional.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-lg">
            Control de procedimientos
          </h3>

          <p className="text-gray-600">
            Registra injertos, técnica, grafts y zonas tratadas
            sin perder información crítica.
          </p>
        </div>

      </section>



      {/* FEATURES */}
      <section className="bg-white border-t py-20">

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">

          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">
              Timeline clínico completo
            </h3>
            <p className="text-sm text-gray-600">
              Visualiza toda la historia del paciente en orden cronológico real.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">
              Fotografías organizadas por zona
            </h3>
            <p className="text-sm text-gray-600">
              Frontal, coronilla, laterales. Comparación directa entre sesiones.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">
              Multi-clínica segura
            </h3>
            <p className="text-sm text-gray-600">
              Cada clínica maneja su información de forma aislada y segura.
            </p>
          </div>

        </div>

      </section>



      {/* PRICING */}
      <section className="py-24 text-center bg-[#F8FAFC] border-t">

        <h2 className="text-3xl font-semibold mb-6">
          Precio simple, sin complicaciones
        </h2>

        <p className="text-gray-600 mb-10">
          Todo incluido. Sin límites ocultos.
        </p>

        <div className="max-w-md mx-auto border rounded-xl p-10 bg-white shadow-sm">

          <h3 className="text-lg font-semibold mb-2">
            CapilTrack
          </h3>

          <p className="text-5xl font-semibold text-[#2C6BED] mb-4">
            $1,499
          </p>

          <p className="text-sm text-gray-500 mb-6">
            MXN / mes por clínica
          </p>

          <ul className="text-sm text-gray-600 space-y-2 mb-8 text-left">
            <li>• Pacientes ilimitados</li>
            <li>• Fotografías clínicas</li>
            <li>• Métricas capilares</li>
            <li>• Procedimientos de injerto</li>
            <li>• Historial clínico completo</li>
          </ul>

          <Link
            href="/register"
            className="block w-full bg-[#2C6BED] py-3 rounded-md font-medium hover:bg-[#1F56D9] !text-white"
            style={{ color: "#FFFFFF" }}
          >
            Empezar ahora
          </Link>

        </div>

      </section>



      {/* CTA FINAL */}
      <section className="py-24 text-center">

        <h2 className="text-3xl font-semibold mb-6">
          Deja de perder información clínica
        </h2>

        <p className="text-gray-600 mb-8">
          Empieza a trabajar con un sistema diseñado para clínicas capilares reales.
        </p>

        <Link
          href="/register"
          className="bg-[#2C6BED] px-8 py-4 rounded-md font-medium hover:bg-[#1F56D9] !text-white"
          style={{ color: "#FFFFFF" }}
        >
          Crear cuenta
        </Link>

      </section>



      {/* FOOTER */}
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} CapilTrack • Software para clínicas capilares
        </div>
      </footer>

    </main>
  )
}