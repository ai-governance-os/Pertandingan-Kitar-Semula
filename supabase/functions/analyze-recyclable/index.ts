// Supabase Edge Function: analyze-recyclable
// Proxies image analysis to OpenAI Responses API so the API key never lives in the browser.
//
// Deploy:
//   supabase functions deploy analyze-recyclable --no-verify-jwt
// Secrets:
//   supabase secrets set OPENAI_API_KEY=sk-...
//   supabase secrets set OPENAI_MODEL=gpt-4o-mini

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RECYCLING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version",
    "is_recyclable_candidate",
    "overall_confidence",
    "detected_items",
    "main_recommendation",
    "student_message",
    "teacher_note",
    "safety_flags",
  ],
  properties: {
    schema_version: { type: "string", enum: ["1.0"] },
    is_recyclable_candidate: { type: "boolean" },
    overall_confidence: { type: "number", minimum: 0, maximum: 1 },
    detected_items: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "label_en",
          "label_zh",
          "visible_state",
          "materials",
          "is_mixed_material",
          "recommended_parts",
          "eco_actions",
          "confidence",
        ],
        properties: {
          label_en: { type: "string" },
          label_zh: { type: "string" },
          visible_state: {
            type: "string",
            enum: [
              "clean",
              "dirty",
              "wet",
              "food_contaminated",
              "partially_visible",
              "uncertain",
            ],
          },
          materials: { type: "array", items: { type: "string" } },
          is_mixed_material: { type: "boolean" },
          recommended_parts: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "part_en",
                "part_zh",
                "material",
                "bin_category_id",
                "bin_label_en",
                "bin_label_zh",
                "action",
              ],
              properties: {
                part_en: { type: "string" },
                part_zh: { type: "string" },
                material: { type: "string" },
                bin_category_id: {
                  type: "string",
                  enum: [
                    "aluminum",
                    "used_oil",
                    "newspaper",
                    "metal",
                    "cardboard",
                    "plastic",
                    "paper",
                    "ewaste",
                    "hazardous",
                    "general_waste",
                    "unknown",
                  ],
                },
                bin_label_en: { type: "string" },
                bin_label_zh: { type: "string" },
                action: { type: "string" },
              },
            },
          },
          eco_actions: { type: "array", items: { type: "string" } },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
    main_recommendation: {
      type: "object",
      additionalProperties: false,
      required: [
        "summary_en",
        "summary_zh",
        "award_star_suggestion",
        "needs_teacher_review",
      ],
      properties: {
        summary_en: { type: "string" },
        summary_zh: { type: "string" },
        award_star_suggestion: { type: "integer", minimum: 0, maximum: 5 },
        needs_teacher_review: { type: "boolean" },
      },
    },
    student_message: {
      type: "object",
      additionalProperties: false,
      required: ["en", "zh"],
      properties: { en: { type: "string" }, zh: { type: "string" } },
    },
    teacher_note: {
      type: "object",
      additionalProperties: false,
      required: ["en", "zh"],
      properties: { en: { type: "string" }, zh: { type: "string" } },
    },
    safety_flags: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "battery",
          "chemical",
          "sharp",
          "medical_waste",
          "broken_glass",
          "dirty_food_waste",
          "unknown_hazard",
        ],
      },
    },
  },
};

const SYSTEM_PROMPT = `You are a SHARP, DETAIL-OBSESSED AI recycling teacher for SJK(C) Chung Hwa Belemang primary school in Malaysia.
You inspect a photo and produce concrete, decisive recycling instructions for teachers and students aged 7–12.
UI is bilingual Chinese (Simplified) + English — always fill BOTH.

═══════════════════════════════════════════════════════════════
SCHOOL BIN CATEGORIES (use these exact bin_category_id values)
═══════════════════════════════════════════════════════════════
- aluminum         铝罐 / Tin aluminium    (RM 5.50/kg — most valuable)
- used_oil         回锅油 / Minyak terpakai (RM 3.40/kg)
- newspaper        报纸 / Surat khabar     (RM 1.00/kg)
- metal            铁制品 / Besi           (RM 0.40/kg, sharp edges!)
- cardboard        纸皮 / Kotak kadbod     (RM 0.25/kg)
- plastic          塑料 / Plastik          (RM 0.25/kg)
- paper            纸张 / Kertas           (RM 0.10/kg)
- ewaste           电子废物 / E-waste
- hazardous        危险品 / Bahan bahaya
- general_waste    普通垃圾 / Sampah am
- unknown          无法判断

═══════════════════════════════════════════════════════════════
🔑 CORE RULE — DECOMPOSE AGGRESSIVELY
═══════════════════════════════════════════════════════════════
If an item has ANY of these visible separable components, you MUST list EACH as its own entry in recommended_parts:
  • cap / lid / cover (盖子)
  • body / shell (盒身 / 瓶身)
  • label / sticker / wrapper (标签)
  • straw / spout (吸管)
  • inner foil / aluminium lining (内层铝膜)
  • plastic window / cellophane (塑料窗)
  • metal ring / handle (金属环 / 提手)
  • pump / spray nozzle (压头 / 喷嘴)

Be GENEROUS with parts. A normal Tetra Pak has 3 parts. A normal PET bottle has 3 parts. A toothpaste tube has 2. A milk-powder tin has 3.
Single-material items (a plain newspaper, a plain aluminum can) have exactly 1 part — that's correct too.
NEVER lump multiple components into one "mixed" part. Split them.

═══════════════════════════════════════════════════════════════
📚 EIGHT WORKED EXAMPLES — match this level of detail
═══════════════════════════════════════════════════════════════

▼ EXAMPLE A — Tetra Pak juice carton (blue plastic cap + printed body)
3 parts:
  1. 蓝色塑料盖 cap → plastic bin → "拧下盖子"
  2. 纸盒身 carton body → paper bin → "倒空 → 冲洗 → 撕开摊平"
  3. 内层铝箔 inner foil → paper bin (with body) → "和纸一起回收，无需单独撕"
materials: ["paper", "plastic", "aluminum"]
summary_zh: "Tetra Pak 果汁盒。拧下塑料盖丢塑料桶，盒身倒空冲洗后压扁丢纸桶。"
award_star_suggestion: 2

▼ EXAMPLE B — PET clear water bottle (cap + body + label)
3 parts:
  1. 瓶盖 cap → plastic bin → "拧下来"
  2. 瓶身 body → plastic bin → "倒空 → 冲洗 → 压扁"
  3. 收缩塑料标签 shrink label → general_waste → "撕下来（多数是收缩塑料）"
materials: ["PET plastic", "HDPE cap", "shrink plastic label"]
award_star_suggestion: 2

▼ EXAMPLE C — Used aluminum drink can (single material)
1 part:
  1. 整罐 whole can → aluminum bin → "倒空 → 冲洗 → 压扁 (小心罐口)"
materials: ["aluminum"]
award_star_suggestion: 1
(Don't fabricate fake parts for single-material items.)

▼ EXAMPLE D — Toothpaste tube
2 parts:
  1. 塑料盖 cap → plastic bin → "拧下来"
  2. 铝塑复合管身 aluminum-plastic tube → general_waste → "复合材料不易回收，多数当一般垃圾"
materials: ["plastic cap", "aluminum-plastic laminate"]
safety_flags: []
summary_zh: "牙膏管是复合材料。盖子分开丢塑料，管身多数只能丢一般垃圾。"
award_star_suggestion: 2

▼ EXAMPLE E — Aerosol spray can (insecticide, hair spray, etc.)
1 part with strong safety warning:
  1. 整罐 whole can → hazardous bin → "用完才丢，绝对不能压扁（会爆炸）"
materials: ["pressurized aluminum/steel"]
safety_flags: ["chemical"]
needs_teacher_review: true
student_message: "喷雾罐有压力，绝对不能压扁会爆炸！让老师处理。"
award_star_suggestion: 0

▼ EXAMPLE F — Glass bottle with metal cap
2 parts with safety:
  1. 金属盖 metal cap → metal bin → "拧下来"
  2. 玻璃瓶身 glass body → general_waste → "学校没有玻璃桶，小心放置交给老师 (RM 没有玻璃回收链)"
materials: ["glass", "metal cap"]
safety_flags: ["broken_glass"]
award_star_suggestion: 1

▼ EXAMPLE G — Canned food (sardine / tuna) with paper label
2 parts:
  1. 纸标签 paper label → paper bin → "撕下来"
  2. 金属罐 metal can → metal bin → "倒空 → 冲洗 → 压扁 (小心罐口锋利)"
materials: ["tin-plated steel", "paper label"]
safety_flags: ["sharp"]
award_star_suggestion: 2

▼ EXAMPLE H — Milk powder tin (e.g. Dutch Lady / Nespray)
3 parts:
  1. 塑料盖 plastic lid → plastic bin → "取下来"
  2. 纸标签 paper label → paper bin → "撕下来"
  3. 金属罐身 metal tin body → metal bin → "擦干净，投入铁制品桶"
materials: ["tin-plated steel", "plastic lid", "paper label"]
award_star_suggestion: 2

═══════════════════════════════════════════════════════════════
DECISION RULES
═══════════════════════════════════════════════════════════════
1. BE DECISIVE. For a clear photo of any common item, set needs_teacher_review = false AND overall_confidence ≥ 0.85.
   Set needs_teacher_review = true ONLY when:
     • image is blurry / heavily occluded, OR
     • item contains safety hazards (battery, chemical, sharp, broken glass, medical waste)
2. Dangerous items (battery, chemical, sharp, medical, broken glass): set safety_flags AND needs_teacher_review = true AND award_star_suggestion = 0.
3. Wet / oily / food-contaminated items: explain contamination, suggest cleaning, slightly lower confidence.
4. student_message.zh: ≤ 35 Chinese chars, cheerful, age-7 friendly, give the NEXT concrete action.
5. teacher_note.zh: 1 short sentence — what to demonstrate or double-check.
6. award_star_suggestion:
     • 0 for hazardous / not recyclable
     • 1 for single-material correctly identified
     • 2 for mixed-material correctly decomposed
     • 3 for hard cases (complex item with 4+ parts)
7. action field: always concrete verbs (拧下 / 倒空 / 冲洗 / 撕下 / 压扁 / 擦干净). Bilingual format: "中文 · English".
8. Output JSON ONLY, strict schema match. No prose, no markdown, no extra fields.`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function outputText(data: any): string {
  if (typeof data.output_text === "string") return data.output_text;
  const parts: string[] = [];
  for (const item of data.output || []) {
    for (const c of item.content || []) {
      if (typeof c.text === "string") parts.push(c.text);
    }
  }
  return parts.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Method not allowed" }, 405);

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return jsonResponse({ ok: false, error: "OPENAI_API_KEY is not configured" }, 500);

    const body = await req.json();
    const imageBase64 = String(body.image_base64 || "");
    const mimeType = String(body.mime_type || "image/jpeg");
    const detail = body.detail === "high" ? "high" : "low";

    if (!imageBase64 || imageBase64.length < 100) {
      return jsonResponse({ ok: false, error: "Missing image_base64" }, 400);
    }

    // Base64 length ~ 4/3 of binary bytes. 6_000_000 ≈ 4.5 MB binary.
    if (imageBase64.length > 6_000_000) {
      return jsonResponse({ ok: false, error: "Image too large. Compress before upload." }, 413);
    }

    const model = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
    const prompt = `Analyze this photo for a primary-school recycling activity. Return ONLY JSON matching the schema.
CRITICAL: Decompose aggressively. If the item has a cap, lid, label, lining, straw, pump, or any visibly separable part, list EACH as its own entry in recommended_parts (Tetra Pak = 3 parts, PET bottle = 3 parts, toothpaste = 2 parts, milk-powder tin = 3 parts).
Do not be lazy. Do not lump components together. Be DECISIVE: for a clear photo of a common item, set needs_teacher_review = false and overall_confidence ≥ 0.85.
For hazards (battery / chemical / sharp / glass / medical) set safety_flags AND award_star_suggestion = 0.
Write both Chinese and English in every text field. Output JSON only.`;

    const openaiResp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: SYSTEM_PROMPT,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              {
                type: "input_image",
                image_url: `data:${mimeType};base64,${imageBase64}`,
                detail,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "recycling_analysis",
            strict: true,
            schema: RECYCLING_SCHEMA,
          },
        },
        max_output_tokens: 2400,
      }),
    });

    const data = await openaiResp.json();
    if (!openaiResp.ok) {
      return jsonResponse(
        {
          ok: false,
          provider: "openai",
          error: data.error?.message || "OpenAI request failed",
          raw: data,
        },
        502,
      );
    }

    const text = outputText(data);
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch (_e) {
      return jsonResponse(
        { ok: false, provider: "openai", error: "Model returned non-JSON output", raw_text: text },
        502,
      );
    }

    return jsonResponse({
      ok: true,
      provider: "openai",
      model,
      analysis,
      usage: data.usage || null,
    });
  } catch (e) {
    return jsonResponse({ ok: false, error: (e as Error)?.message || String(e) }, 500);
  }
});
