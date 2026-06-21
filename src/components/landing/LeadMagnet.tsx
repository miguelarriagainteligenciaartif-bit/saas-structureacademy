import { useState } from "react";
import { Download, CheckCircle2, PenTool, BarChart3, AlertCircle, ShieldCheck, Gift, Star } from "lucide-react";

export function LeadMagnet() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    
    // In a real scenario, integrate with ConvertKit or MailerLite here.
    console.log("Subscribing:", { name, email });
    setSubmitted(true);
  };

  return (
    <section id="recurso" className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Text Content */}
          <div>
            <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-structure-green mb-6 uppercase tracking-wider">
              Recurso Gratuito
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-bold text-structure-dark mb-6 tracking-tight leading-tight">
              El primer paso para mejorar no es operar más.<br/>
              <span className="text-structure-green">Es medir mejor.</span>
            </h2>
            
            <p className="text-structure-gray text-lg mb-10 leading-relaxed">
              Descarga gratis el Journal que utilizamos en Structure Academy para registrar operaciones, medir rendimiento y tomar decisiones basadas en <span className="font-bold text-structure-dark">datos</span>, no en emociones.
            </p>
            
            <div className="space-y-6 mb-10">
              <div className="flex items-start">
                <PenTool className="w-6 h-6 text-structure-green mr-4 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-structure-dark text-sm">Registra cada trade de forma profesional</h4>
                  <p className="text-xs text-structure-gray mt-1">Lleva un control completo de entradas, salidas, gestión y notas.</p>
                </div>
              </div>
              <div className="flex items-start">
                <BarChart3 className="w-6 h-6 text-structure-green mr-4 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-structure-dark text-sm">Calcula tu rendimiento real</h4>
                  <p className="text-xs text-structure-gray mt-1">Obtén métricas clave como win rate, profitability, expectancy y drawdown.</p>
                </div>
              </div>
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-structure-green mr-4 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-structure-dark text-sm">Detecta errores recurrentes</h4>
                  <p className="text-xs text-structure-gray mt-1">Identifica patrones que te están costando dinero y corrígelos.</p>
                </div>
              </div>
              <div className="flex items-start">
                <ShieldCheck className="w-6 h-6 text-structure-green mr-4 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-structure-dark text-sm">Construye confianza basada en estadísticas</h4>
                  <p className="text-xs text-structure-gray mt-1">Toma decisiones con claridad y tranquilidad. Sin adivinar. Sin improvisar.</p>
                </div>
              </div>
            </div>

            {/* Mockup Placeholder */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center shadow-sm w-full max-w-sm">
              <div className="w-16 h-20 bg-structure-dark rounded shadow-lg border border-gray-800 flex flex-col items-center justify-center mr-4 flex-shrink-0">
                <span className="text-[10px] font-bold text-white mb-1">NQkey</span>
                <span className="text-[6px] text-gray-400">TRADING JOURNAL</span>
              </div>
              <div>
                <p className="font-bold text-structure-dark text-sm">Plantilla en Excel / Google Sheets</p>
                <p className="text-structure-green text-xs font-medium">Lista para usar</p>
              </div>
              <Download className="w-5 h-5 text-structure-green ml-auto" />
            </div>
          </div>
          
          {/* Right: Form */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100 relative">
            {/* Arrow pointing to form (Desktop only) */}
            <div className="hidden lg:block absolute left-[-80px] top-10 text-structure-green opacity-50">
              <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 90C10 50 50 10 90 10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="5,5"/>
                <path d="M80 5L95 10L85 20" stroke="currentColor" strokeWidth="3" fill="none"/>
              </svg>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-structure-green mb-4">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-center text-structure-dark">
                Descarga tu<br/>Journal Gratuito
              </h3>
              <div className="w-12 h-1 bg-gray-200 rounded-full mt-4"></div>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-structure-green" />
                </div>
                <h3 className="text-2xl font-bold mb-2">¡Plantilla Generada!</h3>
                <p className="text-structure-gray mb-6">
                  Hemos registrado tu solicitud. Ya puedes acceder a tu plantilla.
                </p>
                <a 
                  href="/journaling-template" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center bg-structure-green text-white font-bold py-4 rounded-md hover:bg-structure-green/90 transition-colors shadow-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Descargar Plantilla
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-structure-dark mb-2">Nombre</label>
                  <input 
                    type="text" 
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-md border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-structure-green focus:bg-white outline-none transition-all"
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-structure-dark mb-2">Correo Electrónico</label>
                  <input 
                    type="email" 
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-md border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-structure-green focus:bg-white outline-none transition-all"
                    placeholder="tu@email.com"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-structure-green text-white font-bold py-4 rounded-md hover:bg-structure-green/90 transition-all flex items-center justify-center shadow-lg hover:shadow-structure-green/20"
                >
                  <Download className="w-5 h-5 mr-2" />
                  DESCARGAR JOURNAL GRATUITO
                </button>

                <div className="bg-green-50 p-4 rounded-lg flex items-start mt-6">
                  <ShieldCheck className="w-5 h-5 text-structure-green mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-structure-dark font-medium leading-relaxed">
                    Sin spam. Sin ventas agresivas. Solo herramientas útiles para traders que quieren construir estructura.
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-100 text-center">
                  <div className="flex justify-center mb-2">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-structure-gray">
                    +2,500 traders ya utilizan nuestro journal para mejorar sus resultados.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer Features */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-wrap justify-center gap-8 text-sm font-bold text-structure-gray">
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 text-structure-green mr-2" />
            100% Gratis
          </div>
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 text-structure-green mr-2" />
            Acceso Inmediato
          </div>
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 text-structure-green mr-2" />
            Privacidad Protegida
          </div>
        </div>

      </div>
    </section>
  );
}
