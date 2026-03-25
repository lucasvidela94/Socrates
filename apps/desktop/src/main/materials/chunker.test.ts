import { describe, it, expect } from "vitest";
import { chunkText, Chunk } from "./chunker";

describe("chunkText", () => {
  it("retorna array vacío para texto vacío", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
    expect(chunkText("\n\n")).toEqual([]);
  });

  it("retorna un solo chunk para texto corto", () => {
    const chunks = chunkText("Hola mundo.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.content).toBe("Hola mundo.");
    expect(chunks[0]!.chunkIndex).toBe(0);
    expect(chunks[0]!.pageNumber).toBe(1);
    expect(chunks[0]!.tokenEstimate).toBeGreaterThan(0);
  });

  it("usa el número de página indicado", () => {
    const chunks = chunkText("Texto en página 5.", 5);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.pageNumber).toBe(5);
  });

  it("separa párrafos en chunks distintos si exceden el máximo", () => {
    const sentences = Array.from(
      { length: 40 },
      (_, i) => `Esta es la oración número ${i + 1} del párrafo largo.`
    ).join(" ");
    const text = sentences + "\n\n" + sentences;
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const c of chunks) {
      expect(c.tokenEstimate).toBeLessThanOrEqual(650);
    }
  });

  it("asigna chunkIndex secuencial", () => {
    const text = Array.from({ length: 10 }, (_, i) =>
      `Párrafo número ${i + 1} con suficiente contenido.`
    ).join("\n\n");
    const chunks = chunkText(text);
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i]!.chunkIndex).toBe(i);
    }
  });

  it("combina párrafos cortos en un mismo chunk", () => {
    const text = "Frase corta 1.\n\nFrase corta 2.\n\nFrase corta 3.";
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.content).toContain("Frase corta 1.");
    expect(chunks[0]!.content).toContain("Frase corta 3.");
  });

  it("divide párrafos largos por oraciones", () => {
    const longParagraph = Array.from(
      { length: 50 },
      (_, i) => `Esta es la oración número ${i + 1} con algo de extensión para acumular tokens.`
    ).join(" ");
    const chunks = chunkText(longParagraph);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.content.length).toBeGreaterThan(0);
    }
  });

  it("estima tokens como ceil(length/4)", () => {
    const text = "a".repeat(100);
    const chunks = chunkText(text);
    expect(chunks[0]!.tokenEstimate).toBe(25);
  });

  it("maneja solo whitespace entre párrafos", () => {
    const text = "Párrafo 1.\n\n\n\n\nPárrafo 2.";
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.content).toContain("Párrafo 1.");
    expect(chunks[0]!.content).toContain("Párrafo 2.");
  });

  it("respeta el límite mínimo de tokens por chunk", () => {
    const short = "Hola.";
    const medium = "a".repeat(500);
    const text = short + "\n\n" + medium;
    const chunks = chunkText(text);
    for (const c of chunks) {
      expect(c.content.trim().length).toBeGreaterThan(0);
    }
  });
});
