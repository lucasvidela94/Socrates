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

    parts =
      case Map.get(context, "curriculum") do
        nil -> parts
        cur when is_map(cur) -> parts ++ [format_curriculum(cur)]
        _ -> parts
      end

    students = Map.get(context, "students") || []

    parts =
      if is_list(students) and students != [] do
        parts ++ Enum.flat_map(students, &student_sections/1)
      else
        parts
      end

    materials = Map.get(context, "materials") || []

    parts =
      if is_list(materials) and materials != [] do
        parts ++ [format_materials(materials)]
      else
        parts
      end

    parts = parts ++ [quality_rules(context)]

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

  defp format_materials(materials) when is_list(materials) do
    docs =
      Enum.map(materials, fn m ->
        title = Map.get(m, "title", "Sin título")
        subject = Map.get(m, "subject")
        chunks = Map.get(m, "chunks") || []

        header =
          case subject do
            s when is_binary(s) and s != "" -> "MATERIAL: #{title} (#{s})"
            _ -> "MATERIAL: #{title}"
          end

        content =
          Enum.map(chunks, fn c ->
            text = Map.get(c, "content", "")
            page = Map.get(c, "pageNumber")

            case page do
              p when is_integer(p) -> "[p.#{p}] #{text}"
              _ -> text
            end
          end)
          |> Enum.join("\n")

        [header, content] |> Enum.join("\n")
      end)

    ["MATERIALES DE REFERENCIA DEL AULA:", Enum.join(docs, "\n\n")] |> Enum.join("\n")
  end

  defp format_materials(_), do: ""

  defp format_curriculum(c) when is_map(c) do
    title = Map.get(c, "title") || "Programa"
    year = Map.get(c, "year")
    year_suffix = if is_nil(year), do: "", else: " (#{year})"

    subj = Map.get(c, "currentSubjectName") || "—"
    cu = Map.get(c, "currentUnit")

    {unit_name, date_part, objectives} =
      case cu do
        %{} = u ->
          n = Map.get(u, "name") || "—"
          dr = Map.get(u, "dateRangeLabel") || ""
          dp = if dr != "", do: " (#{dr})", else: ""
          {n, dp, Map.get(u, "objectives")}

        _ ->
          {"sin unidad definida", "", nil}
      end

    topics = Map.get(c, "currentTopicNames") || []
    topics_line = if is_list(topics) and topics != [], do: Enum.join(topics, ", "), else: ""

    lines = [
      "CURRÍCULO / PROGRAMA ANUAL: #{title}#{year_suffix}",
      "Posición actual: #{subj} > #{unit_name}#{date_part}"
    ]

    lines =
      case objectives do
        s when is_binary(s) ->
          if String.trim(s) != "", do: lines ++ ["Objetivos: #{s}"], else: lines

        _ ->
          lines
      end

    lines =
      if topics_line != "" do
        lines ++ ["Temas actuales: #{topics_line}"]
      else
        lines
      end

    Enum.join(lines, "\n")
  end

  defp format_curriculum(_), do: ""

  defp quality_rules(context) do
    grade =
      context
      |> Map.get("classroom", %{})
      |> Map.get("grade", "el grado del aula")

    curriculum_line =
      case Map.get(context, "curriculum") do
        cur when is_map(cur) ->
          "5. Si el contexto incluye CURRÍCULO / PROGRAMA ANUAL, alineá el contenido a la unidad y temas actuales.\n"

        _ ->
          ""
      end

    base = """
    REGLAS DE CALIDAD OBLIGATORIAS:
    1. Si el contexto incluye MATERIALES DE REFERENCIA, usalos como fuente principal. No inventar datos.
    2. Vocabulario y complejidad deben ser apropiados para #{grade}.
    3. Revisá gramática y ortografía antes de responder.
    4. Si no hay materiales de referencia para un tema, indicarlo explícitamente.
    """

    String.trim_trailing(base) <> curriculum_line
  end
end
