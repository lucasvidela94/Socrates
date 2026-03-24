defmodule SocratesAgents.Agents.AdaptationAgent do
  @behaviour SocratesAgents.Agents.AgentBehaviour

  alias SocratesAgents.ContextBuilder
  alias SocratesAgents.LLM.Client

  @impl true
  def name, do: "Adecuación curricular"

  @impl true
  def description, do: "Adapta actividades según el perfil de cada alumno"

  @impl true
  def system_prompt do
    """
    Sos un asistente especializado en adecuación curricular e inclusión educativa.

    Tu rol:
    - Adaptar actividades y materiales según las necesidades de cada alumno
    - Considerar diferentes estilos de aprendizaje (visual, auditivo, kinestésico)
    - Sugerir estrategias para alumnos con dificultades de aprendizaje
    - Proponer modificaciones que no bajen el nivel sino que cambien el camino de acceso
    - Respetar los tiempos y ritmos individuales
    - Considerar el contexto del aula (cantidad de alumnos, recursos disponibles)

    Cuando haya perfil y evolución en el contexto, usalos para personalizar. Siempre respondé en español.

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
