import { Shield, FileText, CheckCircle, Search, Clock, Target, ShieldAlert, Activity, MessageCircle } from "lucide-react";

export function NqkeySection() {
  return (
    <section id="nqkey" className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <div className="text-structure-green font-bold tracking-wider text-sm mb-3">NQKEY</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-structure-dark mb-6 tracking-tight">
            El sistema detrás<br /> de los <span className="text-structure-green">resultados.</span>
          </h2>
          <p className="text-structure-gray text-lg max-w-2xl mx-auto">
            NQkey es un sistema basado en estructura, probabilidad y ejecución disciplinada.
          </p>
        </div>

        {/* The 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-7 h-7 text-structure-green" />
            </div>
            <h3 className="text-xl font-bold text-structure-dark mb-4">Estructura</h3>
            <p className="text-structure-gray text-sm leading-relaxed">
              Identificamos zonas institucionales y patrones de alta probabilidad.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-7 h-7 text-structure-green" />
            </div>
            <h3 className="text-xl font-bold text-structure-dark mb-4">Datos</h3>
            <p className="text-structure-gray text-sm leading-relaxed">
              Tomamos decisiones basadas en datos reales y validación estadística.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-7 h-7 text-structure-green" />
            </div>
            <h3 className="text-xl font-bold text-structure-dark mb-4">Ejecución</h3>
            <p className="text-structure-gray text-sm leading-relaxed">
              Aplicamos reglas claras con gestión de riesgo definida y sin excepciones.
            </p>
          </div>
        </div>

        {/* How it works steps */}
        <div className="mb-16">
          <h3 className="text-structure-green font-bold tracking-wider text-sm mb-8 text-center md:text-left">CÓMO FUNCIONA NQKEY</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <StepCard number={1} title="Identificamos" desc="Analizamos el mercado y sus estructuras clave." icon={<Search className="w-5 h-5" />} />
            <StepCard number={2} title="Esperamos" desc="Buscamos las condiciones óptimas para actuar." icon={<Clock className="w-5 h-5" />} />
            <StepCard number={3} title="Ejecutamos" desc="Entramos con precisión siguiendo nuestras reglas." icon={<Target className="w-5 h-5" />} />
            <StepCard number={4} title="Gestionamos" desc="Protegemos el capital con una gestión estricta de riesgo." icon={<ShieldAlert className="w-5 h-5" />} />
            <StepCard number={5} title="Analizamos" desc="Revisamos cada operación para mejorar y evolucionar." icon={<Activity className="w-5 h-5" />} />
          </div>
        </div>

        {/* WhatsApp CTA */}
        <div className="text-center">
          <a href="#comenzar" className="inline-flex items-center justify-center bg-structure-green text-white px-10 py-4 rounded-md font-bold hover:bg-structure-green/90 transition-all shadow-lg hover:shadow-structure-green/20 w-full md:w-auto">
            <MessageCircle className="w-5 h-5 mr-2" />
            Comenzar ahora
          </a>
          <p className="mt-4 text-structure-gray text-sm">Hablemos por WhatsApp y te explicamos cómo funciona.</p>
        </div>
      </div>
    </section>
  );
}

function StepCard({ number, title, desc, icon }: { number: number, title: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center flex flex-col items-center">
      <div className="w-8 h-8 rounded-full bg-structure-green text-white flex items-center justify-center font-bold text-sm mb-4">
        {number}
      </div>
      <div className="text-structure-green mb-3">
        {icon}
      </div>
      <h4 className="font-bold text-structure-dark text-sm mb-2">{title}</h4>
      <p className="text-xs text-structure-gray leading-relaxed">{desc}</p>
    </div>
  );
}
