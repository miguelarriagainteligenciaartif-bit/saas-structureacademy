import { Calendar, Target, ShieldAlert, TrendingUp, ShieldCheck } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export function StatisticsSection() {
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

  // Simulated data for the equity curve
  const data = [
    { name: 'Nov 23', value: 0 },
    { name: 'Ene 24', value: 15 },
    { name: 'Mar 24', value: 35 },
    { name: 'May 24', value: 45 },
    { name: 'Jul 24', value: 70 },
    { name: 'Sep 24', value: 65 },
    { name: 'Nov 24', value: 90 },
    { name: 'Ene 25', value: 110 },
    { name: 'Mar 25', value: 140 },
    { name: 'May 25', value: 125 },
    { name: 'Jul 25', value: 160 },
    { name: 'Sep 25', value: 180 },
    { name: 'Nov 25', value: 175 },
    { name: 'Ene 26', value: 195 },
    { name: 'Mar 26', value: 210 },
    { name: 'May 26', value: 215 },
  ];

  return (
    <section id="estadisticas" className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-12">
          <div className="text-structure-green font-bold tracking-wider text-sm mb-3 uppercase">Estadísticas del sistema NQKEY</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-structure-dark mb-4 tracking-tight">
            Los <span className="text-structure-green">datos</span> hablan.
          </h2>
          <p className="text-structure-gray text-lg max-w-lg">
            Más de 36 meses de datos analizados. Resultados consistentes en diferentes condiciones de mercado.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-4 border border-green-100">
                {stat.icon}
              </div>
              <div className="text-3xl font-display font-bold text-structure-green mb-1">{stat.value}</div>
              <div className="text-xs font-bold text-structure-dark mb-3">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Equity Curve Chart */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 md:p-8 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-structure-dark text-lg">EQUITY CURVE - NQKEY</h3>
            <div className="text-sm border border-gray-200 px-3 py-1 rounded text-structure-gray">
              Últimos 36 meses
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Rendimiento']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rendimiento Anual Table */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 md:p-8 shadow-sm mb-12">
          <h3 className="font-bold text-structure-dark text-lg mb-6">RENDIMIENTO ANUAL</h3>
          <div className="w-full">
            <div className="flex justify-between border-b border-gray-100 pb-3 mb-3 text-sm text-structure-gray">
              <span>Año</span>
              <span>Resultado</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-50">
              <span className="font-bold text-structure-dark">2024</span>
              <span className="font-bold text-structure-green">+48%</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-50">
              <span className="font-bold text-structure-dark">2025</span>
              <span className="font-bold text-structure-green">+78%</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="font-bold text-structure-dark">2026 <span className="font-normal text-structure-gray text-sm ml-1">(hasta el momento)</span></span>
              <span className="font-bold text-structure-green">+17%</span>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="bg-green-50 rounded-xl p-6 flex items-start border border-green-100">
          <ShieldCheck className="w-6 h-6 text-structure-green mr-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-structure-dark font-medium text-sm md:text-base mb-1">
              Resultados obtenidos aplicando siempre las mismas reglas.
            </p>
            <p className="text-structure-gray text-sm">
              Sin optimizaciones. Sin atajos. Transparencia total.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
