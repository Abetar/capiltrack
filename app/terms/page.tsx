export default function TermsPage() {
  return (
    <main className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-20">

        <h1 className="text-3xl font-semibold mb-6">
          Términos y Condiciones
        </h1>

        <p className="text-gray-600 mb-6">
          Al utilizar CapilTrack, aceptas los siguientes términos y condiciones de uso.
        </p>

        <Section
          title="1. Uso del servicio"
          content="CapilTrack es una plataforma diseñada para clínicas capilares con fines de gestión clínica. El uso indebido del sistema es responsabilidad del usuario."
        />

        <Section
          title="2. Responsabilidad del usuario"
          content="Cada clínica es responsable de la información registrada y del cumplimiento de las regulaciones aplicables en su país."
        />

        <Section
          title="3. Disponibilidad del servicio"
          content="Nos esforzamos por mantener el sistema disponible, pero no garantizamos disponibilidad ininterrumpida."
        />

        <Section
          title="4. Pagos y suscripciones"
          content="El acceso al sistema puede requerir una suscripción activa. Los pagos son recurrentes según el plan seleccionado."
        />

        <Section
          title="5. Limitación de responsabilidad"
          content="CapilTrack no se hace responsable por decisiones médicas tomadas con base en la información registrada en la plataforma."
        />

        <Section
          title="6. Modificaciones"
          content="Podemos actualizar estos términos en cualquier momento sin previo aviso."
        />

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