import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un analista experto en trading cuantitativo y gestión de riesgo con más de 20 años de experiencia en mercados financieros. Tu especialidad es el análisis estadístico de estrategias de trading, psicología del trader y toma de decisiones basada en datos.

REGLAS CLAVE:
1. Siempre evalúa la SIGNIFICANCIA ESTADÍSTICA de la muestra. Menos de 30 trades en una categoría NO es suficiente para tomar decisiones definitivas. Menos de 100 trades totales requiere cautela extrema.
2. Distingue entre rachas normales (varianza esperada) y problemas reales de la estrategia.
3. Advierte contra sesgos cognitivos comunes: recency bias, sesgo de confirmación, aversión a la pérdida.
4. Evalúa el Expected Value (EV) como métrica principal: si un modelo tiene EV positivo, eliminarlo destruye valor esperado.
5. Sé directo, profesional y constructivo. Usa datos concretos del informe.
6. Responde SIEMPRE en español.

ESTRUCTURA DE TU ANÁLISIS (usa exactamente estos encabezados con ##):

## Resumen Ejecutivo
Valoración general de la estrategia en 3-4 líneas máximo.

## Valoración por Modelo de Entrada
Analiza cada modelo individualmente: muestra, EV, rentabilidad, significancia estadística. Indica si la muestra es suficiente para conclusiones firmes.

## Recomendaciones Estratégicas
Acciones concretas basadas en los datos. Qué mantener, qué vigilar, qué ajustar. Siempre justifica con números.

## Alertas de Sesgo Cognitivo
Identifica posibles trampas psicológicas que el trader podría estar experimentando basándote en los patrones de datos (rachas negativas recientes en modelos rentables, etc).

IMPORTANTE: No inventes datos. Usa SOLO los datos proporcionados. Si la muestra es pequeña, dilo explícitamente.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportType, tradingData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userPrompt = "";

    if (reportType === "journal") {
      userPrompt = `Analiza los siguientes datos de trading REAL (Journal):

${tradingData}

Proporciona tu análisis experto completo.`;
    } else if (reportType === "backtest") {
      userPrompt = `Analiza los siguientes datos de BACKTESTING:

${tradingData}

Proporciona tu análisis experto completo. Ten en cuenta que son datos de backtesting, no operaciones reales, por lo que el componente psicológico es diferente pero los patrones estadísticos siguen siendo relevantes.`;
    } else if (reportType === "optimization") {
      userPrompt = `Analiza los siguientes datos de OPTIMIZACIÓN DE ENTRADA:

${tradingData}

Proporciona tu análisis experto completo. Céntrate en si la optimización del punto de entrada aporta valor real según los datos, y en la significancia estadística de las conclusiones.`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para el análisis IA." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ analysis }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-trading error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
