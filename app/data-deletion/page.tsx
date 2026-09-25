import Link from "next/link";

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link
          href="/"
          className="text-sm text-[#2C6BED] hover:underline"
        >
          ← Volver a CapilTrack
        </Link>

        <h1 className="text-3xl font-semibold mt-8 mb-6">
          Eliminación de datos
        </h1>

        <p className="text-gray-600 mb-6">
          Los usuarios de CapilTrack pueden solicitar la eliminación de sus
          datos personales y de la información asociada a su cuenta.
        </p>

        <section className="mb-8">
          <h2 className="font-semibold mb-2">
            Cómo solicitar la eliminación
          </h2>

          <p className="text-sm text-gray-600">
            Para solicitar la eliminación de tus datos, comunícate con el
            equipo de soporte de CapilTrack e indica el correo electrónico
            asociado a tu cuenta y que deseas ejercer tu derecho de eliminación
            de datos.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-semibold mb-2">
            Información que puede ser eliminada
          </h2>

          <p className="text-sm text-gray-600">
            La solicitud puede incluir datos de la cuenta, información de
            perfil y otros datos personales asociados al uso de CapilTrack,
            sujeto a las obligaciones legales o regulatorias aplicables.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-semibold mb-2">
            Datos relacionados con WhatsApp
          </h2>

          <p className="text-sm text-gray-600">
            Si has interactuado con CapilTrack mediante WhatsApp, también
            puedes solicitar la eliminación de los datos personales asociados
            a dichas conversaciones que sean almacenados por CapilTrack,
            sujeto a las obligaciones legales o regulatorias aplicables.
          </p>
        </section>

        <p className="text-sm text-gray-400 mt-10">
          Última actualización: {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}