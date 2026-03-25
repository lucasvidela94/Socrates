defmodule SocratesAgents.LLM.Client do
  @moduledoc """
  Wrapper for LLM API calls. Supports OpenAI-compatible APIs (OpenAI, OpenRouter, Gemini).
  Uses Req for HTTP requests directly — instructor_ex is available for structured output
  in future iterations.
  """

  @spec chat_completion(map(), String.t(), list(map())) ::
          {:ok, String.t()} | {:error, String.t()}
  def chat_completion(llm_config, system_prompt, messages) do
    provider = Map.get(llm_config, "provider", "openai")
    model = Map.get(llm_config, "model", "gpt-4o-mini")
    api_key = Map.get(llm_config, "api_key", "")
    base_url = Map.get(llm_config, "base_url") || default_base_url(provider)

    url = "#{base_url}/chat/completions"

    headers = [
      {"authorization", "Bearer #{api_key}"},
      {"content-type", "application/json"}
    ]

    headers =
      if provider == "openrouter" do
        headers ++ [{"x-title", "Socrates"}, {"http-referer", "https://socrates.local"}]
      else
        headers
      end

    all_messages =
      [%{"role" => "system", "content" => system_prompt}] ++ messages

    body =
      Jason.encode!(%{
        "model" => model,
        "messages" => all_messages,
        "temperature" => 0.7,
        "max_tokens" => 8192
      })

    case Req.post(url, body: body, headers: headers, receive_timeout: 120_000) do
      {:ok, %Req.Response{status: 200, body: resp_body}} ->
        content =
          resp_body
          |> Map.get("choices", [])
          |> List.first(%{})
          |> dig(["message", "content"])

        if content do
          {:ok, content}
        else
          {:error, "Respuesta vacía del modelo"}
        end

      {:ok, %Req.Response{status: status, body: resp_body}} ->
        error_msg =
          case resp_body do
            %{"error" => %{"message" => msg}} -> msg
            _ -> "HTTP #{status}"
          end

        {:error, "Error del proveedor: #{error_msg}"}

      {:error, exception} ->
        {:error, "Error de conexión: #{Exception.message(exception)}"}
    end
  end

  defp default_base_url("openrouter"), do: "https://openrouter.ai/api/v1"
  defp default_base_url("gemini"), do: "https://generativelanguage.googleapis.com/v1beta/openai"
  defp default_base_url(_), do: "https://api.openai.com/v1"

  defp dig(map, [key | rest]) when is_map(map) do
    case Map.get(map, key) do
      nil -> nil
      value when rest == [] -> value
      value -> dig(value, rest)
    end
  end

  defp dig(_, _), do: nil
end
