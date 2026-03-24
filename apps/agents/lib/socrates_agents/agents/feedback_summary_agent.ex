defmodule SocratesAgents.Agents.FeedbackSummaryAgent do
  @behaviour SocratesAgents.Agents.AgentBehaviour

  alias SocratesAgents.LLM.Client

  @impl true
  def name, do: "Resumen de devolución"

  @impl true
  def description, do: "Sintetiza la evolución semanal para la docente (borrador)"

  @impl true
  def system_prompt do
    """
    Sos un asistente para docentes. Recibís un JSON en el mensaje del usuario con:
    studentName, weekStart, priorWeeks (texto), currentIndicators, currentObservations.

    Generá un único párrafo claro en español (máximo 120 palabras) que ayude a la docente
    a ver tendencias sin diagnosticar ni medicalizar. No reemplazás el criterio docente.
    Si faltan datos, decilo en una frase breve.
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
