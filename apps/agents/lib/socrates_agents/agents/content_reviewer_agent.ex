defmodule SocratesAgents.Agents.ContentReviewerAgent do
  @behaviour SocratesAgents.Agents.AgentBehaviour

  alias SocratesAgents.ContextBuilder
  alias SocratesAgents.LLM.Client

  @impl true
  def name, do: "Verificación de contenido (interno)"

  @impl true
  def description, do: "Revisa gramática, hechos frente a materiales y adecuación al grado en una sola pasada"

  @impl true
  def system_prompt do
    """
    Sos un revisor pedagógico para docentes. Recibís un BORRADOR generado por otro asistente y debés evaluarlo en una sola lectura.

    Dimensiones (todas obligatorias en tu análisis interno):
    1. Gramática y redacción en español (ortografía, puntuación, claridad).
    2. Factual: si el contexto incluye MATERIALES DE REFERENCIA, el borrador no debe contradecirlos ni inventar datos que no estén respaldados. Si no hay materiales sobre un punto, no es error factual salvo que el borrador afirme hechos concretos inventados.
    3. Nivel: vocabulario y complejidad apropiados para el grado del aula indicado en el contexto.

    Salida OBLIGATORIA: un único JSON válido UTF-8, sin markdown ni texto fuera del JSON.

    Esquema:
    {"approved": true|false, "corrections": [{"type":"grammar"|"factual"|"grade_level", "original":"texto del borrador", "corrected":"versión sugerida", "reason":"breve"}], "corrected_content":"versión completa corregida del borrador cuando aplique; si approved es true y no hay cambios, puede repetir el original"}

    Reglas del JSON:
    - Si no hay correcciones puntuales, corrections puede ser [].
    - corrected_content debe ser el texto listo para el aula después de aplicar las correcciones (o el original si está bien).
    - type solo usa esos tres valores.
    """
  end

  @impl true
  def run(message, context) do
    llm_config = Map.get(context, "llm_config")

    if is_nil(llm_config) or is_nil(Map.get(llm_config, "api_key")) do
      {:error, "No hay configuración de LLM. Configurá tu proveedor en Ajustes."}
    else
      user = "Borrador a verificar (texto tal como lo generó el asistente):\n\n" <> message
      messages = [%{"role" => "user", "content" => user}]
      enhanced = ContextBuilder.build_system_prompt(system_prompt(), context)
      Client.chat_completion(llm_config, enhanced, messages)
    end
  end
end
