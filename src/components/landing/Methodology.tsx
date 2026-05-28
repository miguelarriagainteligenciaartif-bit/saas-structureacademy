import { Target, BarChart3, Brain } from "lucide-react";

export function Methodology() {
  const pillars = [
    {
      icon: <Target className="w-8 h-8 text-white" />,
      title: "Estrategia Sistemática",
      description: "Un sistema claro, simple y ejecutable. Nada de indicadores complejos ni análisis interminables. Un proceso que cualquiera puede replicar con disciplina."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-white" />,
      title: "Backtesting Riguroso",
      description: "Sin backtesting, no hay trading. Todo lo que enseñamos está respaldado por estadísticas favorables testeadas a largo plazo. Los datos mandan."
    },
    {
      icon: <Brain className="w-8 h-8 text-white" />,
      title: "Mentalidad Sólida",
      description: "El mayor enemigo del trader eres tú mismo. Trabajamos la psicología del trading para que operes desde la calma, no desde el miedo o la euforia."
    }
  ];

  return (
    <section id="metodologia" className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-section font-display text-structure-dark mb-4">Los 3 Pilares</h2>
          <p className="text-structure-gray text-lg max-w-2xl mx-auto">
            Nuestra metodología se basa en tres cimientos innegociables para alcanzar la consistencia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {pillars.map((pillar, index) => (
            <div key={index} className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-structure-green flex items-center justify-center mb-6 shadow-lg shadow-structure-green/20 group-hover:-translate-y-1 transition-transform">
                {pillar.icon}
              </div>
              <h3 className="text-xl font-bold text-structure-dark mb-4">{pillar.title}</h3>
              <p className="text-structure-gray leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
