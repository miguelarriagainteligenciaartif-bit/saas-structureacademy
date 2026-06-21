import { HeroSection } from "@/components/landing/HeroSection";
import { Manifesto } from "@/components/landing/Manifesto";
import { NqkeySection } from "@/components/landing/NqkeySection";
import { StatisticsSection } from "@/components/landing/StatisticsSection";
import { BacktestingSummary } from "@/components/landing/BacktestingSummary";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LeadMagnet } from "@/components/landing/LeadMagnet";
import { WhatsAppCta } from "@/components/landing/WhatsAppCta";
import structureLogo from "@/assets/logo_color-01.jpeg";
import { MessageCircle, Instagram, MapPin, Mail } from "lucide-react";

export default function Landing() {
  const whatsappNumber = "+34675344307"; // Replace with actual number
  const whatsappMessage = "Hola! Me gustaría recibir información sobre Structure Academy.";
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-white text-structure-gray font-sans selection:bg-structure-green selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <img 
              src={structureLogo} 
              alt="Structure Academy" 
              className="h-16 w-auto object-contain"
            />
            <span className="font-display font-bold text-xl tracking-tight text-structure-dark hidden lg:block">
              Structure <span className="text-structure-green">Academy</span>
            </span>
          </div>
          <div className="hidden lg:flex gap-6 xl:gap-8 font-medium text-sm text-structure-dark">
            <a href="#manifiesto" className="hover:text-structure-green transition-colors">Filosofía</a>
            <a href="#nqkey" className="hover:text-structure-green transition-colors">NQkey</a>
            <a href="#estadisticas" className="hover:text-structure-green transition-colors">Estadísticas</a>
            <a href="#backtesting" className="hover:text-structure-green transition-colors">Backtesting</a>
            <a href="#recurso" className="hover:text-structure-green transition-colors">Journal Gratuito</a>
          </div>
          <div className="flex items-center">
            <a href="/auth" className="text-sm font-bold hover:text-structure-green transition-colors mr-6 text-structure-dark hidden sm:block">
              Iniciar Sesión
            </a>
            <a href="#comenzar" className="bg-structure-green text-white px-6 py-2.5 rounded-md font-bold text-sm hover:bg-structure-green/90 transition-colors shadow-sm">
              Comenzar
            </a>
          </div>
        </div>
      </nav>

      <main>
        <HeroSection />
        <HowItWorks />
        <Manifesto />
        <NqkeySection />
        <StatisticsSection />
        <BacktestingSummary />
        <LeadMagnet />
        <WhatsAppCta />
      </main>

      {/* Footer Final */}
      <footer className="bg-[#111] text-gray-300">
        {/* Pre-footer CTA */}
        <div className="bg-white text-center py-16 border-b border-gray-100 rounded-b-3xl">
          <div className="text-structure-green font-bold tracking-wider text-sm mb-3 uppercase">Paso final</div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-structure-dark mb-4">
            ¿Listo para operar con <span className="text-structure-green">estructura?</span>
          </h2>
          <p className="text-structure-gray mb-8">
            Estamos aquí para ayudarte a operar con datos, disciplina y mentalidad profesional.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center bg-structure-green text-white font-bold py-3 px-8 rounded-md hover:bg-structure-green/90 transition-colors"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Hablar por WhatsApp
            </a>
            <a 
              href="https://www.instagram.com/eriick.ruiiz/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center border border-gray-300 text-structure-dark font-bold py-3 px-8 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Instagram className="w-5 h-5 mr-2 text-pink-500" />
              Ver Instagram
            </a>
          </div>
        </div>

        {/* Main Footer */}
        <div className="container mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <img src={structureLogo} alt="Logo" className="h-12 w-auto bg-white p-1.5 rounded-lg" />
              <span className="font-display font-bold text-xl tracking-tight text-white">
                Structure <span className="text-structure-green">Academy</span>
              </span>
            </div>
            <p className="text-sm text-gray-200 mb-6">
              Disciplina primero,<br/>
              resultados después.
            </p>
            <div className="mt-8 border-t border-gray-800 pt-4">
              <p className="text-white font-bold text-sm">No es suerte.</p>
              <p className="text-structure-green font-bold text-sm">Es estructura.</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase text-sm tracking-wider mb-6">Navegación</h4>
            <ul className="space-y-3 text-sm text-gray-200">
              <li><a href="#manifiesto" className="hover:text-white transition-colors flex items-center"><span className="text-structure-green mr-2">›</span> Filosofía</a></li>
              <li><a href="#nqkey" className="hover:text-white transition-colors flex items-center"><span className="text-structure-green mr-2">›</span> NQkey</a></li>
              <li><a href="#estadisticas" className="hover:text-white transition-colors flex items-center"><span className="text-structure-green mr-2">›</span> Estadísticas</a></li>
              <li><a href="#backtesting" className="hover:text-white transition-colors flex items-center"><span className="text-structure-green mr-2">›</span> Backtesting</a></li>
              <li><a href="#recurso" className="hover:text-white transition-colors flex items-center"><span className="text-structure-green mr-2">›</span> Journal Gratuito</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase text-sm tracking-wider mb-6">Contacto</h4>
            <div className="space-y-6 text-sm">
              <div className="flex items-start">
                <MessageCircle className="w-5 h-5 text-structure-green mr-3 flex-shrink-0" />
                <div>
                  <a href={whatsappUrl} className="text-white font-bold hover:text-structure-green transition-colors">WhatsApp</a>
                  <p className="text-xs text-gray-300 mt-1">Respuesta rápida</p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-structure-green mr-3 flex-shrink-0" />
                <div>
                  <a href="mailto:erick.bambino@hotmail.com" className="text-white font-bold hover:text-structure-green transition-colors">erick.bambino@hotmail.com</a>
                  <p className="text-xs text-gray-300 mt-1">Escríbenos</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-structure-green mr-3 flex-shrink-0" />
                <div>
                  <span className="text-white font-bold">España</span>
                  <p className="text-xs text-gray-300 mt-1">Horario: Lunes a Viernes<br/>10:00 - 18:00 (CET)</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase text-sm tracking-wider mb-6">Síguenos</h4>
            <div className="flex items-start">
              <Instagram className="w-6 h-6 mr-3 flex-shrink-0" />
              <div>
                <a href="https://www.instagram.com/eriick.ruiiz/" className="text-white font-bold hover:text-structure-green transition-colors">Instagram</a>
                <p className="text-xs text-gray-300 mt-1">@eriick.ruiiz</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="container mx-auto px-4 py-6 text-xs text-gray-300 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Structure Academy. Todos los derechos reservados.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Aviso Legal</a>
            <span className="text-gray-500">|</span>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <span className="text-gray-500">|</span>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
