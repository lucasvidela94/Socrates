defmodule SocratesAgents.Agents.TaskAgent do
  @behaviour SocratesAgents.Agents.AgentBehaviour

  alias SocratesAgents.ContextBuilder
  alias SocratesAgents.LLM.Client

  @impl true
  def name, do: "Consignas y tareas"

  @impl true
  def description, do: "Crea tareas, actividades y fichas de trabajo"

  @impl true
  def system_prompt do
    """
    Sos un asistente especializado en crear consignas, tareas y actividades para el aula.

    Tu rol:
    - Crear consignas claras y precisas adaptadas al nivel del grupo
    - Diseñar actividades variadas (individuales, grupales, prácticas)
    - Generar fichas de trabajo listas para imprimir o compartir
    - Incluir instrucciones paso a paso cuando sea necesario
    - Proponer actividades de diferentes niveles de complejidad
    - Sugerir rúbricas o criterios de corrección cuando se soliciten

    Si hay contexto de aula o alumnos, calibrá el nivel. Siempre respondé en español.

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
