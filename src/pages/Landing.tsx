import { HeroSection } from "@/components/landing/HeroSection";
import { Manifesto } from "@/components/landing/Manifesto";
import { Methodology } from "@/components/landing/Methodology";
import { LeadMagnet } from "@/components/landing/LeadMagnet";
import structureLogo from "@/assets/logo_color-01.jpeg";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-structure-gray font-sans selection:bg-structure-green selection:text-white">
      {/* Navigation (simplified for v1) */}
      <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <img 
              src={structureLogo} 
              alt="Structure Academy" 
              className="h-20 w-auto object-contain"
            />
            <span className="font-display font-bold text-xl tracking-tight text-structure-dark hidden sm:block">
              Structure <span className="text-structure-green">Academy</span>
            </span>
          </div>
          <div className="hidden md:flex gap-8 font-medium text-sm">
            <a href="#manifiesto" className="hover:text-structure-green transition-colors">Manifiesto</a>
            <a href="#metodologia" className="hover:text-structure-green transition-colors">Sistema</a>
          </div>
          <div>
            <a href="/auth" className="text-sm font-medium hover:text-structure-green transition-colors mr-4">Iniciar Sesión</a>
            <a href="#recurso" className="bg-structure-green text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-structure-green/90 transition-colors shadow-sm">
              Empezar
            </a>
          </div>
        </div>
      </nav>

      <main>
        <HeroSection />
        <Manifesto />
        <Methodology />
        <LeadMagnet />
      </main>

      {/* Footer */}
      <footer className="bg-structure-dark text-white py-12 border-t border-gray-800">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="font-display font-bold text-xl tracking-tight">
              Structure <span className="text-structure-green">Academy</span>
            </span>
            <p className="mt-4 text-gray-400 text-sm">
              Disciplina primero, resultados después.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-white">Enlaces</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#manifiesto" className="hover:text-white transition-colors">Manifiesto</a></li>
              <li><a href="#metodologia" className="hover:text-white transition-colors">Metodología</a></li>
              <li><a href="/auth" className="hover:text-white transition-colors">Acceso Alumnos</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Aviso Legal</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500 text-center">
          &copy; {new Date().getFullYear()} Structure Academy. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
