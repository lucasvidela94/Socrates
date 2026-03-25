defmodule SocratesAgents.Agents.CriteriaAgent do
  @behaviour SocratesAgents.Agents.AgentBehaviour

  alias SocratesAgents.ContextBuilder
  alias SocratesAgents.LLM.Client

  @impl true
  def name, do: "Criterios de evaluación"

  @impl true
  def description, do: "Genera criterios de evaluación alineados al currículo"

  @impl true
  def system_prompt do
    """
    Sos un asistente especializado en educación que ayuda a docentes a elaborar criterios de evaluación.

    Tu rol:
    - Generar criterios de evaluación claros, medibles y alineados al currículo
    - Adaptar los criterios al grado, materia y contexto del aula
    - Usar un lenguaje profesional pero accesible para el docente
    - Incluir indicadores de logro cuando sea pertinente
    - Considerar diferentes niveles de desempeño (avanzado, satisfactorio, en proceso, inicial)

    Siempre respondé en español. El docente es quien toma la decisión final; vos generás borradores.

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
