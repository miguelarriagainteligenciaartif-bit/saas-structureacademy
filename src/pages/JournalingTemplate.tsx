import structureLogo from "@/assets/logo.png";
import { Printer } from "lucide-react";

export default function JournalingTemplate() {
  const handlePrint = () => {
    window.print();
  };

  // Generate 20 empty rows for the template
  const rows = Array.from({ length: 20 });

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Actions bar - Hidden on print */}
        <div className="flex justify-between items-center mb-6 print:hidden bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-structure-dark">Tu Plantilla de Journaling</h1>
            <p className="text-sm text-gray-500">Puedes imprimirla o guardarla como PDF</p>
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-structure-green text-white px-4 py-2 rounded-md font-medium hover:bg-structure-green/90 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Guardar PDF
          </button>
        </div>

        {/* Printable Area */}
        <div className="bg-white p-8 md:p-12 shadow-lg print:shadow-none print:p-0 rounded-xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-10 border-b-2 border-structure-green pb-6">
            <div>
              <img 
                src={structureLogo} 
                alt="Structure Academy" 
                className="h-16 w-auto object-contain mb-2"
              />
              <h2 className="text-2xl font-display font-bold text-structure-dark tracking-tight">
                Trading Journal Oficial
              </h2>
              <p className="text-structure-gray font-medium text-sm">Disciplina primero, resultados después.</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-2">
                <span className="font-bold text-gray-700">Mes / Semana:</span>
                <div className="border-b border-gray-300 w-32"></div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="font-bold text-gray-700">Balance Inicial:</span>
                <div className="border-b border-gray-300 w-32"></div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-structure-green text-white text-sm">
                  <th className="py-3 px-2 border border-structure-green font-semibold text-center w-8">#</th>
                  <th className="py-3 px-2 border border-structure-green font-semibold w-24">Fecha</th>
                  <th className="py-3 px-2 border border-structure-green font-semibold w-24">Activo</th>
                  <th className="py-3 px-2 border border-structure-green font-semibold w-24">Modelo</th>
                  <th className="py-3 px-2 border border-structure-green font-semibold text-center w-16">Dir.</th>
                  <th className="py-3 px-2 border border-structure-green font-semibold w-20">Riesgo</th>
                  <th className="py-3 px-2 border border-structure-green font-semibold text-center w-20">R:R</th>
                  <th className="py-3 px-2 border border-structure-green font-semibold text-center w-20">Res.</th>
                  <th className="py-3 px-2 border border-structure-green font-semibold">Notas / Emociones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((_, index) => (
                  <tr key={index} className="even:bg-gray-50/50">
                    <td className="py-6 px-2 border border-gray-200 text-center text-gray-400 text-xs">{index + 1}</td>
                    <td className="py-6 px-2 border border-gray-200"></td>
                    <td className="py-6 px-2 border border-gray-200"></td>
                    <td className="py-6 px-2 border border-gray-200"></td>
                    <td className="py-6 px-2 border border-gray-200"></td>
                    <td className="py-6 px-2 border border-gray-200"></td>
                    <td className="py-6 px-2 border border-gray-200"></td>
                    <td className="py-6 px-2 border border-gray-200"></td>
                    <td className="py-6 px-2 border border-gray-200"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Area */}
          <div className="mt-8 grid grid-cols-3 gap-6 pt-6 border-t-2 border-structure-green">
            <div className="border border-gray-200 p-4 rounded-md">
              <h4 className="font-bold text-gray-700 text-sm mb-4">Resumen de la Semana</h4>
              <div className="flex justify-between mb-2 text-sm border-b border-dashed border-gray-200 pb-1"><span>Trades Totales:</span><span className="w-12 border-b border-gray-300"></span></div>
              <div className="flex justify-between mb-2 text-sm border-b border-dashed border-gray-200 pb-1"><span>Win Rate:</span><span className="w-12 border-b border-gray-300"></span></div>
              <div className="flex justify-between mb-2 text-sm border-b border-dashed border-gray-200 pb-1"><span>P&L Total:</span><span className="w-12 border-b border-gray-300"></span></div>
            </div>
            <div className="col-span-2 border border-gray-200 p-4 rounded-md">
              <h4 className="font-bold text-gray-700 text-sm mb-2">Conclusiones / Áreas de Mejora</h4>
              <div className="border-b border-gray-300 mt-6 w-full"></div>
              <div className="border-b border-gray-300 mt-6 w-full"></div>
              <div className="border-b border-gray-300 mt-6 w-full"></div>
            </div>
          </div>
          
          <div className="text-center text-gray-400 text-xs mt-8 font-medium">
            © {new Date().getFullYear()} Structure Academy. Uso exclusivo para alumnos y suscriptores.
          </div>
        </div>
      </div>
    </div>
  );
}
