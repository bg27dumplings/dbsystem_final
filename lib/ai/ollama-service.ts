const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  format?: string;
  images?: string[]; // Array of base64 encoded images
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export async function generateContent(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        prompt: request.prompt,
        stream: request.stream ?? false,
        format: request.format,
        images: request.images,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Ollama generate content error:", error);
    throw new Error("Failed to communicate with Ollama service.");
  }
}

export async function checkContentSafety(
  title: string,
  description: string,
  imageBase64s?: string[]
): Promise<{ safe: boolean; reason?: string }> {
  // We prefer using 'llava' for image + text, or 'qwen2'/'llama3' for pure text
  const model = imageBase64s && imageBase64s.length > 0 ? "llava" : "qwen2";

  const prompt = `
你是一個嚴格的校園二手市集內容審查員。
請檢查以下商品資訊（以及提供的圖片）是否包含違規內容：
1. 武器、刀械或危險物品
2. 菸、酒、毒品等管制物品
3. 情色、血腥或暴力內容
4. 代寫作業或考試作弊服務
5. 明顯引導私下交易的外部聯絡方式（如 Line ID）

商品標題：${title}
商品描述：${description}

請務必以 JSON 格式回傳，格式如下：
{
  "safe": true 或 false,
  "reason": "如果 false，請簡短說明違規原因。如果 true，則留空。"
}
`;

  try {
    const cleanImages = imageBase64s?.map(img => img.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, ''));
    const response = await generateContent({
      model,
      prompt,
      format: "json",
      images: cleanImages,
    });

    const result = JSON.parse(response.response);
    return {
      safe: Boolean(result.safe),
      reason: result.reason,
    };
  } catch (err) {
    console.error("Content safety check failed:", err);
    // If AI fails, we might decide to let it pass but log it, or block it.
    // For now, let's assume it passes so we don't block user if AI is down,
    // or we could block. Let's return safe: true for resilience, or you can adjust.
    return { safe: true, reason: "AI service unavailable" };
  }
}

export async function suggestListing(
  imageBase64?: string,
  hints?: string
): Promise<{ title: string; description: string; category?: string }> {
  const model = imageBase64 ? "llava" : "qwen2";
  const prompt = `
你是一個聰明的校園二手市集上架助手。
根據提供的圖片與使用者的提示（${hints || "無"}），幫我生成適合刊登的商品標題與詳細描述，以及建議的商品分類。
分類請從以下選一個：教科書、3C產品、生活用品、交通工具、服飾配件、其他。

特別注意：
1. 商品標題 (title) 必須「非常簡短」，只要「商品本身的名稱」即可 請全繁體中文顯示（例如：「短款毛衣」、「iPhone 13」），絕對不要是冗長的形容句子。
2. 任何的商品特色、形容詞或細節細項（例如：保暖、柔順材質、搭配等），請全部寫在商品描述 (description) 裡面，請全繁體中文顯示。

請務必以 JSON 格式回傳，格式如下：
{
  "title": "極簡短的商品名稱",
  "description": "詳細、有禮貌、吸引人的商品描述",
  "category": "分類名稱"
}
`;

  try {
    const cleanImage = imageBase64 ? imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '') : undefined;
    const response = await generateContent({
      model,
      prompt,
      format: "json",
      images: cleanImage ? [cleanImage] : undefined,
    });

    const result = JSON.parse(response.response);
    return {
      title: result.title || "",
      description: result.description || "",
      category: result.category || "",
    };
  } catch (err) {
    console.error("Suggest listing failed:", err);
    throw new Error("Failed to generate suggestions.");
  }
}
