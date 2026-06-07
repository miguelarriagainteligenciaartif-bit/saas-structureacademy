import { useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";

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
    <section id="recurso" className="py-24 bg-structure-dark text-white relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-structure-green/10 blur-3xl"></div>
      
      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800/50 px-3 py-1 text-xs font-medium text-structure-green mb-6 uppercase tracking-wider">
              Recurso Gratuito
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 leading-tight">
              Descarga gratis la Plantilla de Journaling que uso para construir estadísticas reales
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              El primer paso hacia la consistencia es medir. Esta plantilla te ayudará a registrar tus operaciones, calcular tu esperanza matemática y tomar decisiones basadas en datos, no en emociones.
            </p>
            
            <ul className="space-y-4 mb-8">
              {[
                "Registra tus trades de manera estructurada",
                "Mide tu esperanza matemática y Drawdown",
                "Identifica qué modelos te dan mejores resultados"
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-structure-green mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-2xl text-structure-dark">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-structure-green" />
                </div>
                <h3 className="text-2xl font-bold mb-2">¡Plantilla Generada!</h3>
                <p className="text-structure-gray mb-6">
                  Hemos registrado tu solicitud. Ya puedes acceder a tu plantilla oficial.
                </p>
                <a 
                  href="/journaling-template" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-structure-green text-white font-bold py-4 px-8 rounded-md hover:bg-structure-green/90 transition-colors shadow-lg shadow-structure-green/20"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Ver y Descargar Plantilla
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-xl font-bold mb-6">¿A dónde te la enviamos?</h3>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-structure-green focus:border-structure-green outline-none transition-colors"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input 
                    type="email" 
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-structure-green focus:border-structure-green outline-none transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-structure-green text-white font-bold py-4 rounded-md hover:bg-structure-green/90 transition-colors flex items-center justify-center mt-4 shadow-lg shadow-structure-green/20"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Quiero la Plantilla
                </button>
                <p className="text-xs text-center text-gray-500 mt-4">
                  Prometemos no enviar spam. Podrás darte de baja cuando quieras.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
