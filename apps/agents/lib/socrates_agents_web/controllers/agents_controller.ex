defmodule SocratesAgentsWeb.AgentsController do
  use SocratesAgentsWeb, :controller

  alias SocratesAgents.Orchestrator

  def index(conn, _params) do
    json(conn, %{agents: Orchestrator.available_agents()})
  end
end
