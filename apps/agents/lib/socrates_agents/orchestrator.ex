defmodule SocratesAgents.Orchestrator do
  @moduledoc """
  Routes requests to the appropriate specialized agent based on agent type.
  The teacher (docente) is always the supervisor — agents only produce drafts.

  To add a new agent: create the module with `use AgentBase, id: "..."` and
  add it to @agent_modules below.
  """

  @agent_modules [
    SocratesAgents.Agents.CriteriaAgent,
    SocratesAgents.Agents.PlannerAgent,
    SocratesAgents.Agents.AdaptationAgent,
    SocratesAgents.Agents.TaskAgent,
    SocratesAgents.Agents.FeedbackSummaryAgent,
    SocratesAgents.Agents.CurriculumParserAgent,
    SocratesAgents.Agents.ContentReviewerAgent
  ]

  @registry Enum.reduce(@agent_modules, %{}, fn mod, acc ->
    meta =
      mod.__info__(:attributes)
      |> Keyword.get(:agent_meta, [%{}])
      |> List.first()

    Map.put(acc, meta.id, mod)
  end)

  @type agent_type :: String.t()
  @type context :: map()

  @spec dispatch(agent_type(), String.t(), context()) :: {:ok, String.t()} | {:error, String.t()}
  def dispatch(agent_type, message, context \\ %{}) do
    case Map.get(@registry, agent_type) do
      nil -> {:error, "Unknown agent type: #{agent_type}"}
      mod -> mod.run(message, context)
    end
  end

  @spec available_agents() :: [%{id: String.t(), name: String.t(), description: String.t()}]
  def available_agents do
    @agent_modules
    |> Enum.map(fn mod ->
      meta =
        mod.__info__(:attributes)
        |> Keyword.get(:agent_meta, [%{}])
        |> List.first()

      {meta, mod}
    end)
    |> Enum.filter(fn {meta, _mod} -> Map.get(meta, :public, false) end)
    |> Enum.map(fn {meta, mod} ->
      %{id: meta.id, name: mod.name(), description: mod.description()}
    end)
  end
end
