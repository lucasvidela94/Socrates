defmodule SocratesAgents.Agents.AgentBase do
  @moduledoc """
  Shared base for all agents.

  Usage:

      use SocratesAgents.Agents.AgentBase,
        id: "criteria",        # required — string id for orchestrator dispatch
        use_context: true,     # optional (default true) — enrich prompt via ContextBuilder
        public: true           # optional (default false) — expose in available_agents/0

  Provides:
  - `@behaviour AgentBehaviour` declaration
  - Aliases for ContextBuilder and LLM.Client
  - A default `run/2` implementation (defoverridable)
  - `AgentBase.output_format/0` — shared markdown output instructions
  """

  alias SocratesAgents.ContextBuilder
  alias SocratesAgents.LLM.Client

  defmacro __using__(opts) do
    id = Keyword.fetch!(opts, :id)
    use_context = Keyword.get(opts, :use_context, true)
    public = Keyword.get(opts, :public, false)

    quote do
      @behaviour SocratesAgents.Agents.AgentBehaviour

      alias SocratesAgents.ContextBuilder
      alias SocratesAgents.LLM.Client

      Module.register_attribute(__MODULE__, :agent_meta, persist: true)
      @agent_meta %{
        id: unquote(id),
        use_context: unquote(use_context),
        public: unquote(public)
      }

      @impl true
      def run(message, context) do
        SocratesAgents.Agents.AgentBase.default_run(__MODULE__, message, context)
      end

      defoverridable run: 2
    end
  end

  @doc "Default run/2 logic shared by all agents."
  def default_run(agent_module, message, context) do
    llm_config = Map.get(context, "llm_config")

    if is_nil(llm_config) or is_nil(Map.get(llm_config, "api_key")) do
      {:error, "No hay configuración de LLM. Configurá tu proveedor en Ajustes."}
    else
      messages = [%{"role" => "user", "content" => message}]
      base_prompt = agent_module.system_prompt()

      meta =
        agent_module.__info__(:attributes)
        |> Keyword.get(:agent_meta, [%{}])
        |> List.first()

      system =
        if Map.get(meta, :use_context, true) do
          ContextBuilder.build_system_prompt(base_prompt, context)
        else
          base_prompt
        end

      Client.chat_completion(llm_config, system, messages)
    end
  end

  @doc "Shared markdown output format for public-facing agents."
  def output_format do
    """
    FORMATO DE SALIDA: Respondé en Markdown claro y directo.
    Usá # para el título principal, ## para secciones, ### para subsecciones.
    Usá listas con - para indicadores o ítems.
    Usá **negrita** para énfasis.
    NO respondas en JSON ni uses bloques de código.
    Si falta información, indicalo al inicio del texto.
    """
  end
end
