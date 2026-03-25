import { describe, it, expect } from "vitest";
import {
  parseAssistantPayload,
  isStructuredBlocks,
  cleanJsonToReadableText,
  parseMarkdownToBlocks,
} from "./assistant-payload";

const VALID_JSON_PAYLOAD = JSON.stringify({
  title: "Plan de clase",
  summary: "Resumen del plan",
  blocks: [
    { type: "heading", text: "Objetivo" },
    { type: "paragraph", text: "Desarrollar comprensión lectora." },
    { type: "heading", text: "Actividades" },
    { type: "paragraph", text: "Leer un cuento **corto** en voz alta." },
  ],
});

const TRUNCATED_JSON = `\`\`\`json
{
  "title": "Criterios de Evaluación",
  "summary": "Resumen de criterios para 3° grado.",
  "blocks": [
    {"type": "heading", "text": "Nivel Avanzado"},
    {"type": "paragraph", "text": "El estudiante demuestra comprensión total del cuento."},
    {"type": "heading", "text": "Nivel Satisfactorio"},
    {"type": "paragraph", "text": "El estudiante identifica los person`;

const TRUNCATED_MULTIBLOCK_JSON = `{
  "title": "Secuencia Didáctica",
  "summary": "Planificación para Lengua.",
  "blocks": [
    {"type": "heading", "text": "Clase 1"},
    {"type": "paragraph", "text": "Lectura grupal del cuento."},
    {"type": "heading", "text": "Clase 2"},
    {"type": "paragraph", "text": "Trabajo con personajes y conflicto."},
    {"type": "heading", "text": "Clase 3"},
    {"type": "paragraph", "text": "Producción escrita sobre el mensa`;

const MARKDOWN_RESPONSE = `# Criterios de Evaluación: Lectura Comprensiva

Estos criterios evalúan la comprensión de cuentos cortos en 3° grado.

## Nivel Avanzado

El estudiante identifica personajes principales y secundarios con detalle.

**Indicadores de logro:**

- Identifica personajes principales y secundarios describiendo características.
- Explica el conflicto central con causas y resolución.
- Interpreta el mensaje fundamentando con ejemplos del texto.

## Nivel Satisfactorio

El estudiante identifica personajes principales y describe acciones importantes.

- Nombra personajes principales y describe acciones clave.
- Identifica el conflicto principal y cómo se resuelve.

## En Proceso

El estudiante necesita guía para identificar elementos del cuento.

- Identifica algunos personajes con apoyo visual.
- Reconoce el problema con guía del docente.`;

const MARKDOWN_NO_SUMMARY = `# Plan Semanal

## Lunes

Lectura grupal del cuento "El zorro y la cigüeña".

## Martes

Actividad de comprensión con organizador gráfico.`;

describe("parseAssistantPayload — JSON", () => {
  it("parsea JSON válido directo", () => {
    const { title, parsed, cleanText, truncated } =
      parseAssistantPayload(VALID_JSON_PAYLOAD);
    expect(title).toBe("Plan de clase");
    expect(parsed).not.toBeNull();
    expect(isStructuredBlocks(parsed)).toBe(true);
    expect(cleanText).toContain("OBJETIVO");
    expect(truncated).toBe(false);
  });

  it("parsea JSON envuelto en code fences", () => {
    const fenced = "```json\n" + VALID_JSON_PAYLOAD + "\n```";
    const { parsed, truncated } = parseAssistantPayload(fenced);
    expect(parsed).not.toBeNull();
    expect(isStructuredBlocks(parsed)).toBe(true);
    expect(truncated).toBe(false);
  });

  it("parsea JSON con code fences en mayúscula", () => {
    const fenced = "```JSON  \n" + VALID_JSON_PAYLOAD + "\n  ```";
    const { parsed, truncated } = parseAssistantPayload(fenced);
    expect(parsed).not.toBeNull();
    expect(truncated).toBe(false);
  });

  it("parsea JSON con texto previo antes de las fences", () => {
    const withPreamble =
      "Aquí está tu plan:\n\n```json\n" + VALID_JSON_PAYLOAD + "\n```";
    const { parsed, truncated } = parseAssistantPayload(withPreamble);
    expect(parsed).not.toBeNull();
    expect(isStructuredBlocks(parsed)).toBe(true);
    expect(truncated).toBe(false);
  });

  it("parsea JSON con texto libre previo sin fences", () => {
    const withPreamble =
      "Te propongo lo siguiente:\n\n" + VALID_JSON_PAYLOAD;
    const { parsed, title, truncated } = parseAssistantPayload(withPreamble);
    expect(parsed).not.toBeNull();
    expect(title).toBe("Plan de clase");
    expect(truncated).toBe(false);
  });

  it("rescata bloques completos de JSON truncado con code fences", () => {
    const { parsed, truncated, title, cleanText } =
      parseAssistantPayload(TRUNCATED_JSON);
    expect(parsed).not.toBeNull();
    expect(isStructuredBlocks(parsed)).toBe(true);
    expect(truncated).toBe(true);
    expect(title).toBe("Criterios de Evaluación");

    const blocks = (parsed as Record<string, unknown>).blocks as Array<{
      type?: string;
      text?: string;
    }>;
    expect(blocks).toHaveLength(3);
    expect(blocks[0]!.type).toBe("heading");
    expect(blocks[0]!.text).toBe("Nivel Avanzado");
    expect(blocks[1]!.text).toContain("comprensión total");
    expect(blocks[2]!.type).toBe("heading");
    expect(blocks[2]!.text).toBe("Nivel Satisfactorio");
    expect(cleanText).not.toContain('"type"');
    expect(cleanText).not.toContain('"text"');
  });

  it("rescata múltiples bloques de JSON truncado sin fences", () => {
    const { parsed, truncated } = parseAssistantPayload(
      TRUNCATED_MULTIBLOCK_JSON
    );
    expect(parsed).not.toBeNull();
    expect(isStructuredBlocks(parsed)).toBe(true);
    expect(truncated).toBe(true);

    const blocks = (parsed as Record<string, unknown>).blocks as Array<{
      type?: string;
      text?: string;
    }>;
    expect(blocks.length).toBe(5);
    expect(blocks[4]!.text).toBe("Clase 3");
  });

  it("extrae title y summary de JSON truncado", () => {
    const { title, parsed } = parseAssistantPayload(
      TRUNCATED_MULTIBLOCK_JSON
    );
    expect(title).toBe("Secuencia Didáctica");
    expect((parsed as Record<string, unknown>).summary).toBe(
      "Planificación para Lengua."
    );
  });

  it("devuelve 'Borrador' si el JSON no tiene campo title", () => {
    const noTitle = JSON.stringify({
      blocks: [{ type: "paragraph", text: "algo" }],
    });
    const { title, parsed, truncated } = parseAssistantPayload(noTitle);
    expect(title).toBe("Borrador");
    expect(parsed).not.toBeNull();
    expect(truncated).toBe(false);
  });

  it("ignora strings JSON escapadas dentro de valores", () => {
    const nested = JSON.stringify({
      title: 'Respuesta con "comillas"',
      summary: 'Tiene \\n saltos y {"falso": "json"} dentro',
      blocks: [{ type: "paragraph", text: "ok" }],
    });
    const { parsed } = parseAssistantPayload(nested);
    expect(parsed).not.toBeNull();
    expect(parsed!.title).toBe('Respuesta con "comillas"');
  });
});

describe("parseAssistantPayload — Markdown", () => {
  it("parsea markdown con título, summary y secciones", () => {
    const { title, parsed, truncated } =
      parseAssistantPayload(MARKDOWN_RESPONSE);
    expect(title).toBe("Criterios de Evaluación: Lectura Comprensiva");
    expect(parsed).not.toBeNull();
    expect(isStructuredBlocks(parsed)).toBe(true);
    expect(truncated).toBe(false);

    expect((parsed as Record<string, unknown>).summary).toBe(
      "Estos criterios evalúan la comprensión de cuentos cortos en 3° grado."
    );

    const blocks = (parsed as Record<string, unknown>).blocks as Array<{
      type?: string;
      text?: string;
    }>;
    const headings = blocks.filter((b) => b.type === "heading");
    expect(headings.length).toBe(3);
    expect(headings[0]!.text).toBe("Nivel Avanzado");
    expect(headings[1]!.text).toBe("Nivel Satisfactorio");
    expect(headings[2]!.text).toBe("En Proceso");
  });

  it("convierte listas markdown a items con guión", () => {
    const { parsed } = parseAssistantPayload(MARKDOWN_RESPONSE);
    const blocks = (parsed as Record<string, unknown>).blocks as Array<{
      type?: string;
      text?: string;
    }>;
    const listBlock = blocks.find(
      (b) => b.type === "paragraph" && b.text?.startsWith("- Identifica")
    );
    expect(listBlock).toBeDefined();
    expect(listBlock!.text).toContain("- Explica");
    expect(listBlock!.text).toContain("- Interpreta");
  });

  it("parsea markdown sin summary (heading seguido de heading)", () => {
    const { title, parsed } = parseAssistantPayload(MARKDOWN_NO_SUMMARY);
    expect(title).toBe("Plan Semanal");
    expect(parsed).not.toBeNull();
    expect(isStructuredBlocks(parsed)).toBe(true);

    const blocks = (parsed as Record<string, unknown>).blocks as Array<{
      type?: string;
      text?: string;
    }>;
    expect(blocks[0]!.type).toBe("heading");
    expect(blocks[0]!.text).toBe("Lunes");
  });

  it("cleanText de markdown no contiene # ni artefactos", () => {
    const { cleanText } = parseAssistantPayload(MARKDOWN_RESPONSE);
    expect(cleanText).not.toContain("# ");
    expect(cleanText).not.toContain("## ");
    expect(cleanText).toContain("NIVEL AVANZADO");
    expect(cleanText).toContain("Lectura Comprensiva");
  });
});

describe("parseAssistantPayload — texto plano", () => {
  it("maneja string vacío", () => {
    const { parsed, cleanText, truncated } = parseAssistantPayload("");
    expect(parsed).toBeNull();
    expect(cleanText).toBe("");
    expect(truncated).toBe(false);
  });

  it("maneja texto plano sin JSON ni markdown", () => {
    const plainText =
      "Hola, no tengo JSON. Solo soy texto plano de respuesta.";
    const { parsed, cleanText, truncated } = parseAssistantPayload(plainText);
    expect(parsed).toBeNull();
    expect(cleanText).toBe(plainText);
    expect(truncated).toBe(false);
  });

  it("devuelve 'Borrador' como título cuando parsed es null", () => {
    const { title } = parseAssistantPayload("Texto sin estructura");
    expect(title).toBe("Borrador");
  });
});

describe("parseMarkdownToBlocks", () => {
  it("retorna null para texto sin headings markdown", () => {
    expect(parseMarkdownToBlocks("Solo texto plano sin headings.")).toBeNull();
  });

  it("retorna null para texto con menos de 2 líneas", () => {
    expect(parseMarkdownToBlocks("# Solo título")).toBeNull();
  });

  it("extrae título del primer # heading", () => {
    const result = parseMarkdownToBlocks("# Mi Título\n\nContenido aquí.");
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Mi Título");
  });

  it("primer párrafo después del título se convierte en summary", () => {
    const md = "# Título\n\nEste es el resumen.\n\n## Sección\n\nContenido.";
    const result = parseMarkdownToBlocks(md);
    expect(result!.summary).toBe("Este es el resumen.");
  });

  it("convierte ## y ### en heading blocks", () => {
    const md =
      "# Título\n\nResumen.\n\n## Sección A\n\nTexto A.\n\n### Sub B\n\nTexto B.";
    const result = parseMarkdownToBlocks(md);
    const blocks = result!.blocks as Array<{ type: string; text: string }>;
    const headings = blocks.filter((b) => b.type === "heading");
    expect(headings).toHaveLength(2);
    expect(headings[0]!.text).toBe("Sección A");
    expect(headings[1]!.text).toBe("Sub B");
  });

  it("agrupa items de lista consecutivos en un solo paragraph", () => {
    const md =
      "# Título\n\nResumen.\n\n## Lista\n\n- Item 1\n- Item 2\n- Item 3";
    const result = parseMarkdownToBlocks(md);
    const blocks = result!.blocks as Array<{ type: string; text: string }>;
    const listPara = blocks.find(
      (b) => b.type === "paragraph" && b.text.includes("- Item 1")
    );
    expect(listPara).toBeDefined();
    expect(listPara!.text).toContain("- Item 2");
    expect(listPara!.text).toContain("- Item 3");
  });
});

describe("isStructuredBlocks", () => {
  it("true para payload válido con blocks array", () => {
    const p = JSON.parse(VALID_JSON_PAYLOAD);
    expect(isStructuredBlocks(p)).toBe(true);
  });

  it("false para null", () => {
    expect(isStructuredBlocks(null)).toBe(false);
  });

  it("false para objeto sin blocks", () => {
    expect(isStructuredBlocks({ title: "test" })).toBe(false);
  });

  it("false para blocks que no es array", () => {
    expect(isStructuredBlocks({ blocks: "not-array" })).toBe(false);
  });

  it("false para blocks con elementos primitivos", () => {
    expect(isStructuredBlocks({ blocks: [1, 2, 3] })).toBe(false);
  });
});

describe("cleanJsonToReadableText", () => {
  it("convierte JSON válido a texto plano legible", () => {
    const clean = cleanJsonToReadableText(VALID_JSON_PAYLOAD);
    expect(clean).toContain("Plan de clase");
    expect(clean).toContain("Resumen del plan");
    expect(clean).toContain("OBJETIVO");
    expect(clean).toContain("Desarrollar comprensión lectora.");
    expect(clean).not.toContain('"type"');
  });

  it("limpia JSON truncado usando parser parcial", () => {
    const clean = cleanJsonToReadableText(TRUNCATED_JSON);
    expect(clean).toContain("Criterios de Evaluación");
    expect(clean).toContain("NIVEL AVANZADO");
    expect(clean).toContain("comprensión total");
    expect(clean).not.toContain('"type"');
    expect(clean).not.toContain('"text"');
  });

  it("retorna string vacío para input vacío", () => {
    expect(cleanJsonToReadableText("")).toBe("");
  });

  it("retorna texto plano sin cambios", () => {
    const text = "Solo texto sin JSON.";
    expect(cleanJsonToReadableText(text)).toBe(text);
  });
});
