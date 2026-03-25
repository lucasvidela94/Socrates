defmodule SocratesAgents.Agents.CurriculumParserAgent do
  use SocratesAgents.Agents.AgentBase, id: "curriculum_parser", use_context: false

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
end
