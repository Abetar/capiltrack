export default function PrivacyPage() {
  return (
    <main className="bg-[#F8FAFC] min-h-screen">

      <div className="max-w-4xl mx-auto px-6 py-20">

        <h1 className="text-3xl font-semibold mb-6">
          Aviso de Privacidad
        </h1>

        <p className="text-gray-600 mb-6">
          En CapilTrack, la protección de la información clínica y personal es una prioridad.
          Este aviso describe cómo recopilamos, utilizamos y protegemos los datos dentro de la plataforma.
        </p>

        <Section
          title="1. Información que recopilamos"
          content="CapilTrack permite a las clínicas registrar información de pacientes, incluyendo datos personales, fotografías clínicas y métricas capilares."
        />

        <Section
          title="2. Uso de la información"
          content="La información registrada es utilizada exclusivamente para el seguimiento clínico del paciente, análisis de evolución y mejora de la atención médica."
        />

        <Section
          title="3. Seguridad de la información"
          content="Implementamos medidas técnicas y organizativas para proteger los datos contra accesos no autorizados, pérdida o alteración."
        />

        <Section
          title="4. Compartición de datos"
          content="CapilTrack no comparte información con terceros. Cada clínica administra su información de forma independiente."
        />

        <Section
          title="5. Responsabilidad del usuario"
          content="Las clínicas son responsables del uso adecuado de los datos de sus pacientes y del cumplimiento de la normativa local aplicable."
        />

        <Section
          title="6. Cambios en este aviso"
          content="Nos reservamos el derecho de actualizar este aviso para reflejar mejoras en la plataforma o cambios regulatorios."
        />

        <p className="text-sm text-gray-400 mt-10">
          Última actualización: {new Date().getFullYear()}
        </p>

      </div>
    </main>
  )
}

function Section({ title, content }: any) {
  return (
    <div className="mb-6">
      <h2 className="font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 text-sm">{content}</p>
    </div>
  )
}