import { Heart, BrainCircuit, UserCheck, ShieldCheck } from "lucide-react";

export function Manifesto() {
  return (
    <section id="manifiesto" className="py-24 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-16">
          <div className="text-structure-green font-bold tracking-wider text-sm mb-3 uppercase">Nuestra Filosofía</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-structure-dark mb-6 tracking-tight">
            Disciplina primero,<br />
            resultados después.
          </h2>
          <p className="text-structure-gray text-lg max-w-2xl leading-relaxed">
            Creemos en el trading consciente. No se trata de tener razón, se trata de seguir un proceso que funciona.
          </p>
        </div>
        
        {/* The 3 Philosophy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Heart className="w-7 h-7 text-structure-green" />
            </div>
            <h3 className="text-xl font-bold text-structure-dark mb-4">Amor propio</h3>
            <p className="text-structure-gray text-sm leading-relaxed">
              No puedes dar lo que no tienes. Operar desde el amor propio es respetar tu tiempo, tu energía y tu mente.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-6">
              <BrainCircuit className="w-7 h-7 text-structure-green" />
            </div>
            <h3 className="text-xl font-bold text-structure-dark mb-4">Paz mental</h3>
            <p className="text-structure-gray text-sm leading-relaxed">
              La claridad mental es tu mayor ventaja. Un trader en paz toma mejores decisiones.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-6">
              <UserCheck className="w-7 h-7 text-structure-green" />
            </div>
            <h3 className="text-xl font-bold text-structure-dark mb-4">Responsabilidad</h3>
            <p className="text-structure-gray text-sm leading-relaxed">
              Eres 100% responsable de tus resultados. Nadie más puede operar tu cuenta por ti.
            </p>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="bg-gray-50 rounded-xl p-6 md:p-8 flex items-center border border-gray-100 shadow-sm">
          <div className="bg-white p-3 rounded-xl shadow-sm mr-6 border border-gray-200 flex-shrink-0">
            <ShieldCheck className="w-8 h-8 text-structure-green" />
          </div>
          <div>
            <h3 className="font-bold text-structure-dark text-base md:text-lg mb-1">
              No buscamos atajos. Buscamos consistencia.
            </h3>
            <p className="text-structure-gray text-sm md:text-base font-medium">
              El proceso es simple. No es fácil. Pero funciona.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
