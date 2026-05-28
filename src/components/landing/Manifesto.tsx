export function Manifesto() {
  return (
    <section id="manifiesto" className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-section font-display text-structure-dark mb-4">La Verdad Incómoda</h2>
          <div className="w-16 h-1 bg-structure-green mx-auto rounded-full"></div>
        </div>
        
        <div className="prose prose-lg mx-auto text-structure-gray space-y-6">
          <p className="font-medium text-lg">
            El trading no es un atajo. No es una señal que sigues a ciegas. No es copiar a alguien que muestra resultados en pantalla.
          </p>
          <p>
            El trading es un proceso. Requiere un sistema con esperanza matemática positiva, validado con datos reales a largo plazo. Requiere la disciplina de ejecutarlo sin improvisar. Y requiere la mentalidad para no abandonarlo cuando el mercado pone a prueba tu paciencia.
          </p>
          <p className="font-bold text-structure-dark text-xl pt-4 text-center">
            Eso es lo que enseñamos en Structure Academy. Los datos, no opinión.
          </p>
        </div>
      </div>
    </section>
  );
}
