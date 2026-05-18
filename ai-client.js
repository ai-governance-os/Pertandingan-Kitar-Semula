// EcoAI — frontend client for the Supabase Edge Function `analyze-recyclable`.
//
// v1.1 Layered analysis:
//   - mode: "normal" (default, cheap)   → 1600px wide, q 0.88, detail "low"
//   - mode: "high"   (teacher-triggered) → 2048px wide, q 0.9,  detail "high"
//
// Daily-limit guard so a runaway tab can't burn the school's budget overnight.
//
// Compresses the image in-browser before upload to keep API cost low.

const DAILY_LIMIT = 100;
const DAILY_KEY_PREFIX = "eco_ai_daily_v1_";

function todayStamp() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const MODE_PRESETS = {
  normal: { maxWidth: 1600, quality: 0.88, detail: "low"  },
  high:   { maxWidth: 2048, quality: 0.90, detail: "high" },
};

const EcoAI = {
  DAILY_LIMIT,

  endpoint() {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || cfg.url.includes("PASTE_")) {
      throw new Error("Supabase 未配置 · Supabase not configured");
    }
    return `${cfg.url.replace(/\/$/, "")}/functions/v1/analyze-recyclable`;
  },

  // ── Daily counter ──────────────────────────────────────────
  todayCount() {
    try {
      return Number(localStorage.getItem(DAILY_KEY_PREFIX + todayStamp()) || 0);
    } catch (_) { return 0; }
  },

  bumpToday() {
    try {
      const key = DAILY_KEY_PREFIX + todayStamp();
      const n = Number(localStorage.getItem(key) || 0) + 1;
      localStorage.setItem(key, String(n));
      return n;
    } catch (_) { return 0; }
  },

  remainingToday() {
    return Math.max(0, DAILY_LIMIT - this.todayCount());
  },

  resetDailyCounter() {
    try { localStorage.removeItem(DAILY_KEY_PREFIX + todayStamp()); } catch (_) {}
  },

  // ── Image compression ──────────────────────────────────────
  async fileToDataUrl(file, maxWidth = 1600, quality = 0.88) {
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

  // ── Main analysis call ─────────────────────────────────────
  // options:
  //   mode:           "normal" | "high"     (default "normal")
  //   schoolContext:  arbitrary JSON to send with the request
  //   skipDailyLimit: true to bypass the per-day guard (admin use only)
  async analyzeImage(file, options = {}) {
    const mode = options.mode === "high" ? "high" : "normal";
    const preset = MODE_PRESETS[mode];

    // Daily limit guard — fail fast before we hit the network or the model.
    if (!options.skipDailyLimit) {
      const used = this.todayCount();
      if (used >= DAILY_LIMIT) {
        throw new Error(
          `今日 AI 分析已达上限 (${DAILY_LIMIT} 次) · Daily AI quota reached. ` +
          `明天再来 · Try again tomorrow.`
        );
      }
    }

    const dataUrl = await this.fileToDataUrl(file, preset.maxWidth, preset.quality);
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
        detail: preset.detail,
        locale: "zh_en",
        school_context: options.schoolContext || null,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      throw new Error(json.error || `AI 分析失败 · AI failed (${res.status})`);
    }

    // Only count successful calls toward the daily quota.
    if (!options.skipDailyLimit) this.bumpToday();

    return {
      ...json,
      previewDataUrl: dataUrl,
      mode,
      dailyUsedAfter: this.todayCount(),
      dailyRemaining: this.remainingToday(),
    };
  },
};

window.EcoAI = EcoAI;
