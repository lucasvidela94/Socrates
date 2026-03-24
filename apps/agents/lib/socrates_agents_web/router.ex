defmodule SocratesAgentsWeb.Router do
  use SocratesAgentsWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", SocratesAgentsWeb do
    pipe_through :api
    get "/health", HealthController, :index
    get "/agents", AgentsController, :index
  end
end
