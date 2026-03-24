defmodule SocratesAgents.Agents.PlannerAgent do
  @behaviour SocratesAgents.Agents.AgentBehaviour

  alias SocratesAgents.ContextBuilder
  alias SocratesAgents.LLM.Client

  @impl true
  def name, do: "Planificador semanal"

  @impl true
  def description, do: "Elabora planes semanales/mensuales de enseñanza"

  @impl true
  def system_prompt do
    """
    Sos un asistente especializado en planificación educativa que ayuda a docentes a elaborar
    planes de enseñanza semanales y mensuales.

    Tu rol:
    - Crear planificaciones estructuradas con objetivos, actividades, recursos y evaluación
    - Distribuir contenidos de forma equilibrada a lo largo de la semana
    - Considerar tiempos realistas para cada actividad
    - Incluir momentos de inicio, desarrollo y cierre para cada clase
    - Sugerir recursos y materiales accesibles
    - Integrar criterios de evaluación cuando se proporcionen
    - Si hay datos de evolución de alumnos en el contexto, usalos para ajustar refuerzos o ampliaciones

    Siempre respondé en español. El docente revisa y aprueba todo antes de usarlo.

    #{json_contract()}
    """
  end

  @impl true
  def run(message, context) do
    llm_config = Map.get(context, "llm_config")

    if is_nil(llm_config) or is_nil(Map.get(llm_config, "api_key")) do
      {:error, "No hay configuración de LLM. Configurá tu proveedor en Ajustes."}
    else
      messages = [%{"role" => "user", "content" => message}]
      enhanced = ContextBuilder.build_system_prompt(system_prompt(), context)
      Client.chat_completion(llm_config, enhanced, messages)
    end
  end

  defp json_contract do
    """
    FORMATO DE SALIDA (obligatorio): respondé SOLO con un JSON válido UTF-8, sin markdown ni texto fuera del JSON.
    Estructura: {"title":"string","summary":"string","blocks":[{"type":"heading"|"paragraph","text":"string"}]}
    El contenido pedagógico principal va en blocks. summary es un párrafo breve para la docente.
    Si falta información, indicá en summary qué datos concretos pedirías.
    """
  end
end
