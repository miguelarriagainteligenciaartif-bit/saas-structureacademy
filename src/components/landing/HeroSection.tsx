import { PlayCircle, Calendar, Target, ShieldAlert, TrendingUp, ShieldCheck } from "lucide-react";
import desktopChart from "@/assets/desktop_chart.png";
import mobileApp from "@/assets/mobile_app.png";

export function HeroSection() {
  const stats = [
    {
      icon: <Calendar className="w-6 h-6 text-structure-green" />,
      value: "+36",
      label: "MESES ANALIZADOS",
      desc: "Más de 36 meses de datos reales."
    },
    {
      icon: <Target className="w-6 h-6 text-structure-green" />,
      value: "1:2",
      label: "RELACIÓN RIESGO/BENEFICIO",
      desc: "Relación fija 1:2 aplicada en todas las operaciones."
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-structure-green" />,
      value: "7 SL",
      label: "MÁXIMO DRAWDOWN HISTÓRICO",
      desc: "Máximo drawdown de 7 SL consecutivos."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-structure-green" />,
      value: "+50%",
      label: "PROMEDIO ANUAL",
      desc: "Rendimiento promedio anual obtenido."
    }
  ];

  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-16">
      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        
        {/* Top Content: Text + Image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="text-left">
            <h1 className="text-5xl lg:text-6xl font-display font-bold text-structure-dark mb-6 tracking-tight leading-tight">
              No es suerte.<br/>
              Es <span className="text-structure-green">estructura.</span>
            </h1>
            <p className="text-lg text-structure-gray mb-10 leading-relaxed max-w-lg">
              Aprende a operar con un sistema respaldado por datos reales, reglas claras y una ejecución disciplinada.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a href="#nqkey" className="w-full sm:w-auto inline-flex items-center justify-center bg-structure-green text-white px-8 py-4 rounded-md font-bold hover:bg-structure-green/90 transition-all shadow-lg hover:shadow-structure-green/20">
                Descubrir NQkey
              </a>
              <a href="#como-funciona" className="w-full sm:w-auto inline-flex items-center justify-center text-structure-dark border border-gray-300 px-8 py-4 rounded-md font-semibold hover:bg-gray-50 transition-colors">
                <PlayCircle className="w-5 h-5 mr-2 text-structure-gray" />
                Ver cómo funciona
              </a>
            </div>
          </div>

          {/* Images for Monitor & Phone */}
          <div className="relative flex justify-center items-center lg:justify-end h-[400px]">
            {/* Main Monitor */}
            <div className="w-[350px] md:w-[450px] h-[250px] md:h-[300px] bg-structure-dark rounded-xl shadow-2xl relative border-4 border-gray-800 flex items-center justify-center overflow-hidden">
              <img src={desktopChart} alt="Plataforma de Trading" className="w-full h-full object-cover" />
            </div>
            {/* Phone */}
            <div className="absolute bottom-0 left-10 md:left-20 w-[120px] md:w-[150px] h-[240px] md:h-[300px] bg-white rounded-3xl shadow-2xl border-4 border-gray-200 flex flex-col overflow-hidden">
              <img src={mobileApp} alt="Aplicación Móvil" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-4 border border-green-100">
                {stat.icon}
              </div>
              <div className="text-3xl font-display font-bold text-structure-green mb-1">{stat.value}</div>
              <div className="text-xs font-bold text-structure-dark mb-3">{stat.label}</div>
              <p className="text-xs text-structure-gray">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="bg-gray-50 rounded-xl p-6 md:p-8 flex items-center border border-gray-100">
          <div className="bg-white p-3 rounded-xl shadow-sm mr-6 border border-gray-200 flex-shrink-0">
            <ShieldCheck className="w-8 h-8 text-structure-green" />
          </div>
          <div>
            <h3 className="font-display font-bold text-structure-dark text-lg md:text-xl">
              Sistema. Datos. Disciplina. Resultados.
            </h3>
            <p className="text-structure-gray text-sm md:text-base">
              No operamos por impulso, operamos con ventaja.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
