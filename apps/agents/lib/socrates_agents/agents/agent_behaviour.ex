defmodule SocratesAgents.Agents.AgentBehaviour do
  @callback run(message :: String.t(), context :: map()) ::
              {:ok, String.t()} | {:error, String.t()}

  @callback name() :: String.t()
  @callback description() :: String.t()
  @callback system_prompt() :: String.t()
end
