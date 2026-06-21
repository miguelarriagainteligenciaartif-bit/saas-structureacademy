import { CalendarCheck, ShieldQuestion, Rocket, Key, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function WhatsAppCta() {
  const whatsappNumber = "+34675344307"; // Replace with actual number
  const whatsappMessage = "Hola! Me gustaría recibir información sobre Structure Academy.";
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <section id="comenzar" className="py-24 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Text & Benefits */}
          <div>
            <div className="text-structure-green font-bold tracking-wider text-sm mb-3 uppercase">Comenzar Ahora</div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-structure-dark mb-6 tracking-tight leading-tight">
              Empieza tu camino hacia la <span className="text-structure-green">consistencia.</span>
            </h2>
            <p className="text-structure-gray text-lg mb-8 leading-relaxed">
              No vas a entrar a una plataforma sin más. Primero hablaremos personalmente para entender tu situación, resolver tus dudas y explicarte cómo funciona Structure Academy.
            </p>

            <div className="space-y-6 mb-10">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mr-4 flex-shrink-0">
                  <CalendarCheck className="w-5 h-5 text-structure-green" />
                </div>
                <div>
                  <h4 className="font-bold text-structure-dark">Te oriento personalmente</h4>
                  <p className="text-sm text-structure-gray mt-1">Analizo tu situación y te recomiendo el mejor camino.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mr-4 flex-shrink-0">
                  <ShieldQuestion className="w-5 h-5 text-structure-green" />
                </div>
                <div>
                  <h4 className="font-bold text-structure-dark">Resuelvo tus dudas</h4>
                  <p className="text-sm text-structure-gray mt-1">Te explico todo lo que necesites saber.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mr-4 flex-shrink-0">
                  <Rocket className="w-5 h-5 text-structure-green" />
                </div>
                <div>
                  <h4 className="font-bold text-structure-dark">Te ayudo a empezar correctamente</h4>
                  <p className="text-sm text-structure-gray mt-1">Desde el principio, con buen enfoque y claridad.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mr-4 flex-shrink-0">
                  <Key className="w-5 h-5 text-structure-green" />
                </div>
                <div>
                  <h4 className="font-bold text-structure-dark">Creo tu cuenta de acceso</h4>
                  <p className="text-sm text-structure-gray mt-1">Una vez estés listo, te doy acceso a la academia.</p>
                </div>
              </div>
            </div>

            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-structure-green text-white px-8 py-4 rounded-md font-bold hover:bg-structure-green/90 transition-all shadow-lg hover:shadow-structure-green/20 w-full sm:w-auto text-lg"
            >
              <MessageCircle className="w-6 h-6 mr-2" />
              Hablar por WhatsApp
            </a>
            <p className="mt-4 text-sm text-structure-gray">Respuesta rápida y personalizada.</p>
          </div>

          {/* Right: Phone Mockup with QR */}
          <div className="flex justify-center items-center relative">
            {/* Arrow pointing to phone (Desktop only) */}
            <div className="hidden lg:block absolute left-[-60px] bottom-10 opacity-30">
              <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 40C20 40 40 20 50 10" stroke="#000" strokeWidth="2" fill="none"/>
                <path d="M45 5L55 5L50 15" stroke="#000" strokeWidth="2" fill="none"/>
              </svg>
            </div>

            {/* Phone Frame */}
            <div className="w-[300px] h-[600px] bg-white rounded-[40px] shadow-2xl border-[8px] border-gray-100 flex flex-col items-center pt-10 pb-8 px-6 relative overflow-hidden">
              <div className="w-24 h-6 bg-gray-100 absolute top-0 rounded-b-xl"></div>
              
              <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#25D366]/30">
                <MessageCircle className="w-10 h-10 text-white fill-current" />
              </div>
              
              <h3 className="font-bold text-2xl text-center mb-8">
                Hablemos por<br/>WhatsApp
              </h3>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 w-full flex justify-center">
                <QRCodeSVG 
                  value={whatsappUrl} 
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="text-center text-sm text-structure-gray px-4">
                Escanea el código con la cámara de tu móvil para iniciar el chat.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
