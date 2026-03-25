defmodule SocratesAgents.Agents.FeedbackSummaryAgent do
  use SocratesAgents.Agents.AgentBase, id: "feedback_summary", use_context: false

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
end
