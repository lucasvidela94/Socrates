defmodule SocratesAgents.Agents.CurriculumParserAgent do
  @behaviour SocratesAgents.Agents.AgentBehaviour

  alias SocratesAgents.LLM.Client

  @impl true
  def name, do: "Parser de programa (interno)"

  @impl true
  def description, do: "Convierte texto de programa escolar en JSON estructurado"

  @impl true
  def system_prompt do
    """
    Sos un asistente que SOLO transforma texto de programas escolares (planificación anual, temario, sílabo)
    en JSON válido UTF-8. No agregues explicación, markdown ni texto fuera del JSON.

    Estructura obligatoria:
    {"subjects":[{"name":"string","units":[{"name":"string","description":"string o vacío","objectives":"string o vacío","topics":["tema1","tema2"]}]}]}

    Reglas:
    - Inferí materias y unidades aunque el texto sea imperfecto; completá lo razonable con strings vacíos donde falte detalle.
    - topics es siempre un array de strings (nombres de temas). Si no hay temas explícitos, usá [] o un tema genérico por unidad.
    - No inventes instituciones ni datos personales; solo reorganizá el contenido dado.
    """
  end

  @impl true
  def run(message, context) do
    llm_config = Map.get(context, "llm_config")

    if is_nil(llm_config) or is_nil(Map.get(llm_config, "api_key")) do
      {:error, "No hay configuración de LLM. Configurá tu proveedor en Ajustes."}
    else
      messages = [%{"role" => "user", "content" => message}]
      Client.chat_completion(llm_config, system_prompt(), messages)
    end
  end
end
