defmodule SocratesAgents.ContextBuilder do
  @moduledoc """
  Inyecta contexto de aula y alumnos (perfiles, devoluciones, notas) en el system prompt.
  """

  @spec build_system_prompt(String.t(), map()) :: String.t()
  def build_system_prompt(base_prompt, context) when is_map(context) do
    parts = [String.trim(base_prompt)]

    parts =
      case Map.get(context, "classroom") do
        nil -> parts
        c when is_map(c) -> parts ++ [format_classroom(c)]
        _ -> parts
      end

    students = Map.get(context, "students") || []

    parts =
      if is_list(students) and students != [] do
        parts ++ Enum.flat_map(students, &student_sections/1)
      else
        parts
      end

    Enum.join(parts, "\n\n---\n\n")
  end

  defp format_classroom(c) do
    """
    CONTEXTO DE AULA (datos locales de Sócrates)
    Nombre: #{Map.get(c, "name")} | Grado: #{Map.get(c, "grade")} | Turno: #{Map.get(c, "shift")}
    """
  end

  defp student_sections(student) when is_map(student) do
    name = Map.get(student, "name", "Alumno")
    profile = Map.get(student, "profile") || %{}
    fb = Map.get(student, "recentFeedback") || []
    notes = Map.get(student, "recentNotes") || []

    [
      "ALUMNO: #{name}",
      format_profile(profile),
      format_feedback(fb),
      format_notes(notes)
    ]
  end

  defp student_sections(_), do: []

  defp format_profile(p) when is_map(p) do
    """
    Perfil de aprendizaje:
    - Estilo: #{Map.get(p, "learningStyle") || "—"}
    - Fortalezas: #{Map.get(p, "strengths") || "—"}
    - Desafíos: #{Map.get(p, "challenges") || "—"}
    - Adecuaciones sugeridas: #{Map.get(p, "accommodations") || "—"}
    """
  end

  defp format_profile(_), do: "Perfil: sin datos."

  defp format_feedback(list) when is_list(list) do
    lines =
      Enum.map(list, fn item ->
        when_s = Map.get(item, "weekStart")
        ind = encode_indicators(Map.get(item, "indicators") || %{})
        obs = Map.get(item, "observations") || ""
        sum = Map.get(item, "aiSummary") || ""
        ok = Map.get(item, "teacherApproved")

        "Semana #{when_s}: indicadores #{ind}. Observaciones: #{obs}. Resumen IA (borrador): #{sum}. Aprobado por docente: #{ok}"
      end)

    "Evolución reciente (devoluciones):\n" <> Enum.join(lines, "\n")
  end

  defp format_feedback(_), do: "Evolución reciente: sin devoluciones registradas."

  defp format_notes(list) when is_list(list) do
    lines =
      Enum.map(list, fn n ->
        cat = Map.get(n, "category", "")
        obs = Map.get(n, "observation", "")
        "#{cat}: #{obs}"
      end)

    "Notas de aprendizaje recientes:\n" <> Enum.join(lines, "\n")
  end

  defp format_notes(_), do: "Notas de aprendizaje: sin registros."

  defp encode_indicators(v) when is_map(v) do
    case Jason.encode(v) do
      {:ok, s} -> s
      {:error, _} -> inspect(v)
    end
  end

  defp encode_indicators(v), do: inspect(v)
end
