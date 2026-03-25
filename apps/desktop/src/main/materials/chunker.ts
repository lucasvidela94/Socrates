export interface Chunk {
  chunkIndex: number;
  content: string;
  tokenEstimate: number;
  pageNumber: number;
}

const MAX_TOKENS_PER_CHUNK = 600;
const MIN_TOKENS_PER_CHUNK = 100;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function chunkText(text: string, pageNumber = 1): Chunk[] {
  if (!text || text.trim().length === 0) return [];

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return [];

  const chunks: Chunk[] = [];
  let currentContent = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);

    // If single paragraph exceeds max, split by sentences
    if (paragraphTokens > MAX_TOKENS_PER_CHUNK) {
      if (currentContent) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: currentContent.trim(),
          tokenEstimate: estimateTokens(currentContent),
          pageNumber,
        });
        currentContent = "";
      }
      // Split long paragraph by sentences
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      let sentenceBuffer = "";
      for (const sentence of sentences) {
        if (estimateTokens(sentenceBuffer + " " + sentence) > MAX_TOKENS_PER_CHUNK && sentenceBuffer) {
          chunks.push({
            chunkIndex: chunkIndex++,
            content: sentenceBuffer.trim(),
            tokenEstimate: estimateTokens(sentenceBuffer),
            pageNumber,
          });
          sentenceBuffer = sentence;
        } else {
          sentenceBuffer = sentenceBuffer ? sentenceBuffer + " " + sentence : sentence;
        }
      }
      if (sentenceBuffer.trim()) {
        currentContent = sentenceBuffer;
      }
      continue;
    }

    const combined = currentContent ? currentContent + "\n\n" + paragraph : paragraph;
    if (estimateTokens(combined) > MAX_TOKENS_PER_CHUNK && currentContent) {
      if (estimateTokens(currentContent) >= MIN_TOKENS_PER_CHUNK) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: currentContent.trim(),
          tokenEstimate: estimateTokens(currentContent),
          pageNumber,
        });
        currentContent = paragraph;
      } else {
        currentContent = combined;
      }
    } else {
      currentContent = combined;
    }
  }

  if (currentContent.trim()) {
    chunks.push({
      chunkIndex: chunkIndex++,
      content: currentContent.trim(),
      tokenEstimate: estimateTokens(currentContent),
      pageNumber,
    });
  }

  return chunks;
}
