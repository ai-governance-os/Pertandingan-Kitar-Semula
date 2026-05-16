// EcoAI — frontend client for the Supabase Edge Function `analyze-recyclable`.
// Compresses the image in-browser before upload to keep API cost low.

const EcoAI = {
  endpoint() {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || cfg.url.includes("PASTE_")) {
      throw new Error("Supabase 未配置 · Supabase not configured");
    }
    return `${cfg.url.replace(/\/$/, "")}/functions/v1/analyze-recyclable`;
  },

  async fileToDataUrl(file, maxWidth = 1280, quality = 0.82) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    if (!file.type.startsWith("image/")) return dataUrl;

    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });

    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  },

  async analyzeImage(file, options = {}) {
    const dataUrl = await this.fileToDataUrl(
      file,
      options.maxWidth || 1280,
      options.quality || 0.82
    );
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mimeType = mimeMatch?.[1] || "image/jpeg";

    const cfg = window.SUPABASE_CONFIG || {};
    const headers = { "Content-Type": "application/json" };
    if (cfg.anonKey) {
      headers["Authorization"] = `Bearer ${cfg.anonKey}`;
      headers["apikey"] = cfg.anonKey;
    }

    const res = await fetch(this.endpoint(), {
      method: "POST",
      headers,
      body: JSON.stringify({
        image_base64: base64,
        mime_type: mimeType,
        detail: options.detail || "low",
        locale: "zh_en",
        school_context: options.schoolContext || null,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      throw new Error(json.error || `AI 分析失败 · AI failed (${res.status})`);
    }
    return { ...json, previewDataUrl: dataUrl };
  },
};

window.EcoAI = EcoAI;
