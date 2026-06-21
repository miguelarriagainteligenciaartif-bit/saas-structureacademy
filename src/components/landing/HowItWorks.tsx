import { Search, Clock, Target, ShieldAlert, Activity, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <div className="text-structure-green font-bold tracking-wider text-sm mb-3 uppercase">CÓMO FUNCIONA NQKEY</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-structure-dark mb-6 tracking-tight">
            Un sistema. Un proceso. <span className="text-structure-green">Resultados reales.</span>
          </h2>
          <p className="text-structure-gray text-lg max-w-2xl mx-auto leading-relaxed">
            NQkey está diseñado para operar con ventaja matemática en el mercado Nasdaq (NQ) siguiendo un proceso claro y disciplinado.
          </p>
        </div>

        {/* The 5 Steps */}
        <div className="hidden md:flex justify-between items-start mb-20 relative">
          {/* Connecting Line */}
          <div className="absolute top-8 left-[10%] right-[10%] h-0.5 bg-gray-100 z-0"></div>
          
          <StepItem num="1" icon={<Search className="w-6 h-6" />} title="Identificamos" desc="Zonas de interés basadas en estructura, liquidez y contexto del mercado." />
          <StepItem num="2" icon={<Target className="w-6 h-6" />} title="Esperamos" desc="La confirmación exacta según nuestras reglas." />
          <StepItem num="3" icon={<CheckCircle2 className="w-6 h-6" />} title="Ejecutamos" desc="Con gestión de riesgo fija y sin excepciones." />
          <StepItem num="4" icon={<ShieldAlert className="w-6 h-6" />} title="Gestionamos" desc="Cada trade con un plan predefinido." />
          <StepItem num="5" icon={<Activity className="w-6 h-6" />} title="Analizamos" desc="Medimos resultados, aprendemos y mejoramos cada día." />
        </div>

        {/* Mobile steps */}
        <div className="md:hidden grid grid-cols-1 gap-4 mb-16">
          <MobileStepItem num="1" title="Identificamos" desc="Zonas de interés basadas en estructura, liquidez y contexto." />
          <MobileStepItem num="2" title="Esperamos" desc="La confirmación exacta según nuestras reglas." />
          <MobileStepItem num="3" title="Ejecutamos" desc="Con gestión de riesgo fija y sin excepciones." />
          <MobileStepItem num="4" title="Gestionamos" desc="Cada trade con un plan predefinido." />
          <MobileStepItem num="5" title="Analizamos" desc="Medimos resultados, aprendemos y mejoramos cada día." />
        </div>

        {/* Trade Mockup Box */}
        <div className="bg-structure-dark rounded-3xl p-8 md:p-12 text-white mb-20 shadow-2xl flex flex-col lg:flex-row gap-12">
          {/* Left: Chart Mockup */}
          <div className="flex-1 border border-gray-800 rounded-xl bg-[#0f1419] p-4 relative overflow-hidden flex flex-col justify-between">
            <div className="text-sm font-medium mb-8 text-gray-300">Ejemplo de operación con NQkey</div>
            
            {/* Fake Chart Graphics */}
            <div className="relative h-64 w-full">
              {/* Candlesticks representation */}
              <div className="absolute inset-0 flex items-end justify-between px-4 pb-8 opacity-50">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="w-2 flex flex-col justify-end" style={{ height: `${20 + Math.random() * 60}%` }}>
                    <div className={`w-0.5 h-full mx-auto ${i % 2 === 0 ? 'bg-structure-green' : 'bg-red-500'}`}></div>
                    <div className={`w-full h-8 ${i % 2 === 0 ? 'bg-structure-green' : 'bg-red-500'}`}></div>
                  </div>
                ))}
              </div>
              
              {/* Labels */}
              <div className="absolute left-8 bottom-12 bg-structure-green text-white text-xs px-3 py-1 rounded-full border border-green-400 font-bold">1. Identificación</div>
              <div className="absolute left-1/2 top-16 bg-structure-green text-white text-xs px-3 py-1 rounded-full border border-green-400 font-bold -translate-x-1/2">2. Confirmación</div>
              <div className="absolute right-24 bottom-24 bg-structure-green text-white text-xs px-3 py-1 rounded-full border border-green-400 font-bold">3. Entrada</div>
              
              {/* TP / SL Lines */}
              <div className="absolute right-4 top-12 w-20 border-t-2 border-structure-green border-dashed"></div>
              <div className="absolute right-4 top-8 text-xs text-structure-green">Take Profit<br/><span className="bg-structure-green/20 px-1 rounded inline-block mt-1">+2R</span></div>
              
              <div className="absolute right-4 bottom-20 w-20 border-t-2 border-red-500 border-dashed"></div>
              <div className="absolute right-4 bottom-10 text-xs text-red-500">Stop Loss<br/><span className="bg-red-500/20 px-1 rounded inline-block mt-1">-1R</span></div>
            </div>
          </div>
          
          {/* Right: Key Rules */}
          <div className="w-full lg:w-1/3">
            <h3 className="text-xl font-bold mb-6">Reglas clave del sistema</h3>
            <ul className="space-y-6">
              {[
                { title: "Solo operamos setups con ventaja estadística." },
                { title: "Relación riesgo/beneficio fija 1:2", desc: "en todas las operaciones." },
                { title: "Gestión de riesgo estricta.", desc: "Máximo 1% por operación." },
                { title: "Sin improvisación.", desc: "Ejecutamos el plan, no emociones." },
                { title: "Revisión y mejora constante", desc: "basada en datos." }
              ].map((rule, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-structure-green mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-sm block">{rule.title}</span>
                    {rule.desc && <span className="text-sm text-gray-400">{rule.desc}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Why it works */}
        <div className="mb-16">
          <h3 className="font-bold text-center text-xl mb-10">¿Por qué funciona NQkey?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-structure-green mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm mb-2">Ventaja matemática</h4>
              <p className="text-xs text-structure-gray">Setups probados con datos reales durante más de 36 meses.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-structure-green mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm mb-2">Proceso repetible</h4>
              <p className="text-xs text-structure-gray">Un sistema claro que puedes aplicar en cualquier condición.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-structure-green mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm mb-2">Disciplina y consistencia</h4>
              <p className="text-xs text-structure-gray">Elimina la improvisación y las decisiones emocionales.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-structure-green mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm mb-2">Resultados medibles</h4>
              <p className="text-xs text-structure-gray">Cada operación se analiza para mejorar tu rendimiento.</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between border border-gray-100">
          <div className="flex items-center mb-6 md:mb-0">
            <div className="bg-white p-3 rounded-xl shadow-sm mr-6 border border-gray-200">
              <ShieldCheck className="w-8 h-8 text-structure-green" />
            </div>
            <div>
              <p className="text-structure-dark font-bold text-base md:text-lg mb-1">
                NQkey no es magia, es estructura aplicada con disciplina.
              </p>
              <p className="text-structure-gray text-sm md:text-base">
                Aprende a operarlo paso a paso dentro de Structure Academy.
              </p>
            </div>
          </div>
          <a href="#comenzar" className="whitespace-nowrap inline-flex items-center justify-center bg-structure-green text-white px-8 py-4 rounded-md font-bold hover:bg-structure-green/90 transition-all shadow-lg hover:shadow-structure-green/20 w-full md:w-auto">
            Comenzar Ahora
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
        </div>

      </div>
    </section>
  );
}

function StepItem({ num, icon, title, desc }: { num: string, icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center text-center w-40 z-10">
      <div className="w-16 h-16 rounded-full bg-white border-2 border-structure-green text-structure-green flex items-center justify-center mb-6 shadow-sm">
        {icon}
      </div>
      <div className="font-bold text-sm text-structure-dark mb-1">{num}. {title}</div>
      <div className="text-xs text-structure-gray leading-relaxed">{desc}</div>
    </div>
  );
}

function MobileStepItem({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-start">
      <div className="w-8 h-8 rounded-full bg-structure-green text-white flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0">
        {num}
      </div>
      <div>
        <h4 className="font-bold text-sm text-structure-dark mb-1">{title}</h4>
        <p className="text-xs text-structure-gray">{desc}</p>
      </div>
    </div>
  );
}
