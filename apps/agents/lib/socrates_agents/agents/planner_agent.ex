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

    #{output_format()}
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

  defp output_format do
    """
    FORMATO DE SALIDA: Respondé en Markdown claro y directo.
    Usá # para el título principal, ## para secciones, ### para subsecciones.
    Usá listas con - para indicadores o ítems.
    Usá **negrita** para énfasis.
    NO respondas en JSON ni uses bloques de código.
    Si falta información, indicalo al inicio del texto.
    """
  end
end
