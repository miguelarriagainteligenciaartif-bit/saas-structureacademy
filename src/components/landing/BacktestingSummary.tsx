import { Calendar, ShieldAlert, FileText, Database, CheckCircle2, TrendingUp, TrendingDown, Activity, Zap, Minus, ShieldCheck } from "lucide-react";

export function BacktestingSummary() {
  return (
    <section id="backtesting" className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-16">
          <div className="text-structure-green font-bold tracking-wider text-sm mb-3 uppercase">Backtesting del sistema NQKEY</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-structure-dark mb-6 tracking-tight">
            No es suerte.<br />
            Son <span className="text-structure-green">datos reales.</span>
          </h2>
          <p className="text-structure-gray text-lg max-w-2xl leading-relaxed">
            Probamos NQkey durante más de 36 meses en diferentes condiciones de mercado para asegurarnos de que tiene ventaja estadística real antes de operarlo en cuentas reales.
          </p>
        </div>

        {/* 4 Key Pillars of Backtesting */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-structure-green" />
            </div>
            <div className="text-2xl font-bold text-structure-green mb-1">+36</div>
            <div className="text-xs font-bold text-structure-dark mb-3 uppercase">Meses Analizados</div>
            <p className="text-xs text-structure-gray">Más de 36 meses de datos históricos reales del Nasdaq (NQ).</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6 text-structure-green" />
            </div>
            <div className="text-sm font-bold text-structure-dark mt-2 mb-3 uppercase">Sin Optimizaciones</div>
            <p className="text-xs text-structure-gray">No se ajustaron parámetros. No se usó curve fitting.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-structure-green" />
            </div>
            <div className="text-sm font-bold text-structure-dark mt-2 mb-3 uppercase">Reglas Constantes</div>
            <p className="text-xs text-structure-gray">Mismas reglas de entrada, gestión y salida durante todo el periodo.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <Database className="w-6 h-6 text-structure-green" />
            </div>
            <div className="text-sm font-bold text-structure-dark mt-2 mb-3 uppercase">Datos Reales</div>
            <p className="text-xs text-structure-gray">Datos históricos reales de alta calidad. Sin datos sintéticos ni aproximados.</p>
          </div>
        </div>

        {/* Methodology and Environments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          {/* Metodología */}
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-structure-green font-bold tracking-wider text-sm mb-6 uppercase">Metodología</h3>
            <ul className="space-y-4">
              {[
                "Activo: Nasdaq E-mini Futures (NQ)",
                "Marco temporal: 15 minutos",
                "Periodo analizado: Marco temporal de 36 meses (Desde 2023)",
                "Relación Riesgo/Beneficio fija: 1:2",
                "Comisiones y slippage reales del mercado",
                "Gestión de riesgo fija por operación",
                "Sin optimizaciones ni cambios de reglas",
                "Ejecución realista y replicable"
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-structure-green mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-structure-gray">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Entornos Analizados */}
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-structure-green font-bold tracking-wider text-sm mb-6 uppercase">Entornos Analizados</h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <TrendingUp className="w-6 h-6 text-structure-green mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-structure-dark text-sm">Mercado alcista</h4>
                  <p className="text-xs text-structure-gray mt-1">Tendencias fuertes y continuas.</p>
                </div>
              </div>
              <div className="flex items-start">
                <TrendingDown className="w-6 h-6 text-red-500 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-structure-dark text-sm">Mercado bajista</h4>
                  <p className="text-xs text-structure-gray mt-1">Tendencias bajistas prolongadas.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Minus className="w-6 h-6 text-blue-500 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-structure-dark text-sm">Mercado lateral</h4>
                  <p className="text-xs text-structure-gray mt-1">Rangos y consolidaciones extensas.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Zap className="w-6 h-6 text-orange-500 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-structure-dark text-sm">Alta volatilidad</h4>
                  <p className="text-xs text-structure-gray mt-1">Momentos de alta volatilidad y noticias.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Activity className="w-6 h-6 text-gray-400 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-structure-dark text-sm">Baja volatilidad</h4>
                  <p className="text-xs text-structure-gray mt-1">Sesiones de baja actividad y liquidez.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lo que validamos */}
        <div className="mb-12">
          <h3 className="text-structure-green font-bold tracking-wider text-sm mb-6 uppercase">Lo que validamos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-structure-green mr-3 flex-shrink-0" />
              <span className="text-sm text-structure-gray">Que hay ventaja estadística.</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-structure-green mr-3 flex-shrink-0" />
              <span className="text-sm text-structure-gray">Que la gestión de riesgo protege el capital.</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-structure-green mr-3 flex-shrink-0" />
              <span className="text-sm text-structure-gray">Que el sistema es robusto, replicable y consistente.</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-structure-green mr-3 flex-shrink-0" />
              <span className="text-sm text-structure-gray">Que las reglas funcionan en distintos entornos de mercado.</span>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="bg-white rounded-xl p-6 flex items-start border border-gray-200 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-structure-green mr-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-structure-dark font-bold text-sm md:text-base mb-1">
              Backtesting no es solo probar un sistema.
            </p>
            <p className="text-structure-gray text-sm md:text-base">
              Es demostrar que funciona cuando nadie lo está mirando.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
