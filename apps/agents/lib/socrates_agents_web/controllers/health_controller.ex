defmodule SocratesAgentsWeb.HealthController do
  use SocratesAgentsWeb, :controller

  def index(conn, _params) do
    json(conn, %{status: "ok", version: "0.1.0"})
  end
end
