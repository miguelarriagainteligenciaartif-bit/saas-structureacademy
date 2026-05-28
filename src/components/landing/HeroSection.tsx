import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-24 pb-32">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      
      <div className="container relative mx-auto px-4 text-center z-10 max-w-4xl">
        <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50/50 px-3 py-1 text-sm font-medium text-structure-gray mb-8">
          <span className="flex h-2 w-2 rounded-full bg-structure-green mr-2"></span>
          Sistema validado con datos
        </div>
        
        <h1 className="text-hero font-display text-structure-dark mb-6 tracking-tight">
          No es suerte, es <span className="text-structure-green">Structure.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-structure-gray mb-10 max-w-2xl mx-auto leading-relaxed">
          Te enseñamos a operar los mercados financieros con una estrategia sistemática, respaldada por datos reales y una mentalidad sólida. Sin promesas vacías. Solo proceso.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#recurso" className="w-full sm:w-auto inline-flex items-center justify-center bg-structure-green text-white px-8 py-4 rounded-md font-bold hover:bg-structure-green/90 transition-all shadow-lg hover:shadow-structure-green/20">
            Empieza con Estructura
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
          <a href="#metodologia" className="w-full sm:w-auto inline-flex items-center justify-center text-structure-gray px-8 py-4 font-semibold hover:text-structure-dark transition-colors">
            Ver el Sistema
          </a>
        </div>
      </div>
    </section>
  );
}
