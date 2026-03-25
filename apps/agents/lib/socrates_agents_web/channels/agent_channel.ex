defmodule SocratesAgentsWeb.AgentChannel do
  use SocratesAgentsWeb, :channel

  alias SocratesAgents.Orchestrator

  @impl true
  def join("agent:lobby", _payload, socket) do
    {:ok, %{status: "connected"}, socket}
  end

  def join("agent:" <> _subtopic, _payload, _socket) do
    {:error, %{reason: "unknown topic"}}
  end

  @impl true
  def handle_in("request", payload, socket) do
    agent_type = Map.get(payload, "agentType", "criteria")
    context = Map.get(payload, "context", %{})
    message = Map.get(payload, "message", "")
    request_id = Map.get(payload, "requestId")

    Task.start(fn ->
      case Orchestrator.dispatch(agent_type, message, context) do
        {:ok, response} ->
          push(socket, "response", %{
            content: response,
            agentType: agent_type,
            requestId: request_id
          })

        {:error, reason} ->
          push(socket, "error", %{
            reason: reason,
            agentType: agent_type,
            requestId: request_id
          })
      end
    end)

    {:noreply, socket}
  end

  @impl true
  def handle_in("verify", payload, socket) do
    context = Map.get(payload, "context", %{})
    content = Map.get(payload, "content", "")
    request_id = Map.get(payload, "requestId")

    Task.start(fn ->
      case Orchestrator.dispatch("content_review", content, context) do
        {:ok, response} ->
          push(socket, "response", %{
            content: response,
            agentType: "content_review",
            requestId: request_id
          })

        {:error, reason} ->
          push(socket, "error", %{
            reason: reason,
            agentType: "content_review",
            requestId: request_id
          })
      end
    end)

    {:noreply, socket}
  end

  @impl true
  def handle_in("configure_llm", payload, socket) do
    socket = assign(socket, :llm_config, payload)
    {:reply, {:ok, %{status: "configured"}}, socket}
  end

  @impl true
  def handle_in(_event, _payload, socket) do
    {:noreply, socket}
  end
end
