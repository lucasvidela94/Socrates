defmodule SocratesAgents.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      SocratesAgentsWeb.Telemetry,
      {DNSCluster, query: Application.get_env(:socrates_agents, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: SocratesAgents.PubSub},
      # Start a worker by calling: SocratesAgents.Worker.start_link(arg)
      # {SocratesAgents.Worker, arg},
      # Start to serve requests, typically the last entry
      SocratesAgentsWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: SocratesAgents.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    SocratesAgentsWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
