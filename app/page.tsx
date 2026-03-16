import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-gray-900">

      {/* NAVBAR */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-2">

            <Image
              src="/logo-capiltrack.png"
              alt="CapilTrack"
              width={32}
              height={32}
            />

            <span className="text-lg font-semibold text-[#2C6BED]">
              CapilTrack
            </span>

          </Link>

          <div className="flex items-center gap-4 text-sm">

            <Link
              href="/login"
              className="text-gray-700 hover:text-black"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="bg-[#2C6BED] text-white px-4 py-2 rounded-md hover:bg-[#1F56D9]"
              style={{color: "white"}}
            >
              Crear cuenta
            </Link>

          </div>
        </div>
      </header>



      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">

        <h2 className="text-4xl font-semibold mb-6">
          Organiza pacientes, fotografías y tratamientos capilares en un solo sistema
        </h2>

        <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
          CapilTrack ayuda a clínicas de injerto capilar a gestionar pacientes,
          documentar evolución con fotografías clínicas y registrar procedimientos
          de forma organizada y segura.
        </p>

        <div className="flex justify-center gap-4">

          <Link
            href="/register"
            className="bg-[#2C6BED] text-white px-6 py-3 rounded-md font-medium hover:bg-[#1F56D9]"
            style={{color: "white"}}
          >
            Crear cuenta
          </Link>

          <Link
            href="/login"
            className="border border-gray-300 px-6 py-3 rounded-md hover:bg-gray-100"
          >
            Iniciar sesión
          </Link>

        </div>

      </section>



      {/* PROBLEMA */}
      <section className="bg-white py-20 border-t">
        <div className="max-w-4xl mx-auto px-6 text-center">

          <h2 className="text-2xl font-semibold mb-6">
            El seguimiento capilar suele ser desordenado
          </h2>

          <p className="text-gray-600 text-lg">
            Muchas clínicas gestionan pacientes, fotografías y consultas en
            múltiples herramientas o incluso en carpetas y chats. Esto dificulta
            ver la evolución real del paciente y mantener un historial clínico
            claro.
          </p>

        </div>
      </section>



      {/* COMO FUNCIONA */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-10">

        <div>
          <h3 className="font-semibold mb-3 text-lg">
            1. Registra pacientes
          </h3>

          <p className="text-gray-600">
            Guarda información del paciente, historial clínico y consultas
            en un solo lugar accesible para la clínica.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-lg">
            2. Documenta evolución
          </h3>

          <p className="text-gray-600">
            Sube fotografías clínicas y registra la evolución capilar
            del paciente a lo largo del tratamiento.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-lg">
            3. Controla procedimientos
          </h3>

          <p className="text-gray-600">
            Registra procedimientos de trasplante capilar y
            tratamientos asociados para mantener un historial completo.
          </p>
        </div>

      </section>



      {/* FEATURES */}
      <section className="bg-white border-t py-20">

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">

          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-2">
              Gestión de pacientes
            </h3>

            <p className="text-sm text-gray-600">
              Registra pacientes, historial clínico y consultas
              de forma estructurada.
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-2">
              Seguimiento fotográfico
            </h3>

            <p className="text-sm text-gray-600">
              Guarda fotografías clínicas para comparar la evolución
              capilar del paciente.
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-2">
              Registro de tratamientos
            </h3>

            <p className="text-sm text-gray-600">
              Documenta procedimientos y tratamientos realizados
              en cada paciente.
            </p>
          </div>

        </div>

      </section>



      {/* CTA FINAL */}
      <section className="py-24 text-center">

        <h2 className="text-3xl font-semibold mb-6">
          Empieza a organizar tu clínica hoy
        </h2>

        <Link
          href="/register"
          className="bg-[#2C6BED] text-white px-8 py-4 rounded-md font-medium hover:bg-[#1F56D9]"
          style={{color: "white"}}
        >
          Crear cuenta
        </Link>

      </section>



      {/* FOOTER */}
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} CapilTrack
        </div>
      </footer>

    </main>
  )
}