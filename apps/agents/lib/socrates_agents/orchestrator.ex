defmodule SocratesAgents.Orchestrator do
  @moduledoc """
  Routes requests to the appropriate specialized agent based on agent type.
  The teacher (docente) is always the supervisor — agents only produce drafts.
  """

  alias SocratesAgents.Agents.{
    CriteriaAgent,
    PlannerAgent,
    AdaptationAgent,
    TaskAgent,
    FeedbackSummaryAgent
  }

  @type agent_type :: String.t()
  @type context :: map()

  @spec dispatch(agent_type(), String.t(), context()) :: {:ok, String.t()} | {:error, String.t()}
  def dispatch(agent_type, message, context \\ %{}) do
    case agent_type do
      "criteria" -> CriteriaAgent.run(message, context)
      "planner" -> PlannerAgent.run(message, context)
      "adaptation" -> AdaptationAgent.run(message, context)
      "tasks" -> TaskAgent.run(message, context)
      "feedback_summary" -> FeedbackSummaryAgent.run(message, context)
      unknown -> {:error, "Unknown agent type: #{unknown}"}
    end
  end

  @spec available_agents() :: [%{id: String.t(), name: String.t(), description: String.t()}]
  def available_agents do
    [
      %{
        id: "criteria",
        name: "Criterios de evaluación",
        description: "Genera criterios de evaluación alineados al currículo"
      },
      %{
        id: "planner",
        name: "Planificador semanal",
        description: "Elabora planes semanales/mensuales de enseñanza"
      },
      %{
        id: "adaptation",
        name: "Adecuación curricular",
        description: "Adapta actividades según el perfil de cada alumno"
      },
      %{
        id: "tasks",
        name: "Consignas y tareas",
        description: "Crea tareas, actividades y fichas de trabajo"
      }
    ]
  end
end
