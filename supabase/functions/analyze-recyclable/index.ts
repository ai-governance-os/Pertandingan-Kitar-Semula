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
- aluminum         铝罐 / Tin aluminium
- used_oil         回锅油 / Minyak terpakai
- newspaper        报纸 / Surat khabar
- metal            铁制品 / Besi
- cardboard        纸皮 / Kotak kadbod
- plastic          塑料 / Plastik
- paper            纸张 / Kertas
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
  • label / sticker / wrapper (标签 / 包装纸)
  • straw / spout (吸管 / 倒嘴)
  • inner foil / aluminium lining (内层铝膜)
  • plastic window / cellophane (塑料窗)
  • metal ring / handle (金属环 / 提手)

Be GENEROUS with parts. A normal Tetra Pak has 3 parts. A normal PET bottle has 3 parts. A milk-powder tin has 3 parts.
Single-material items (e.g. a plain newspaper, a plain aluminum can) have exactly 1 part — that's fine too.

NEVER lump multiple components into one "mixed" part. Split them.

═══════════════════════════════════════════════════════════════
📚 EXAMPLES — copy this level of detail
═══════════════════════════════════════════════════════════════

▼ EXAMPLE A: A Tetra Pak juice carton with blue plastic cap, white printed body, "Mockup" label
{
  "is_recyclable_candidate": true,
  "overall_confidence": 0.92,
  "detected_items": [{
    "label_zh": "果汁纸盒 (Tetra Pak)",
    "label_en": "Juice carton (Tetra Pak)",
    "visible_state": "clean",
    "materials": ["paper", "plastic", "aluminum"],
    "is_mixed_material": true,
    "confidence": 0.92,
    "recommended_parts": [
      {
        "part_zh": "蓝色塑料盖",
        "part_en": "Blue plastic cap",
        "material": "HDPE plastic",
        "bin_category_id": "plastic",
        "bin_label_zh": "塑料",
        "bin_label_en": "Plastic",
        "action": "拧下盖子，丢入塑料桶 · Unscrew the cap and drop into the plastic bin"
      },
      {
        "part_zh": "纸盒身",
        "part_en": "Carton body",
        "material": "laminated paperboard",
        "bin_category_id": "paper",
        "bin_label_zh": "纸张",
        "bin_label_en": "Paper",
        "action": "倒空 → 冲洗 → 撕开摊平 · Empty → rinse → tear open and flatten"
      },
      {
        "part_zh": "内层铝箔膜",
        "part_en": "Inner aluminum foil lining",
        "material": "aluminum foil",
        "bin_category_id": "paper",
        "bin_label_zh": "纸张 (与盒身一起)",
        "bin_label_en": "Paper (with the body)",
        "action": "通常和纸一起回收，无需单独撕 · Usually recycled with the paper body, no need to separate"
      }
    ],
    "eco_actions": ["先拧盖", "倒空冲洗", "压扁省空间"]
  }],
  "main_recommendation": {
    "summary_zh": "这是 Tetra Pak 果汁盒。拧下塑料盖丢塑料桶，盒身倒空冲洗后压扁丢纸桶。",
    "summary_en": "This is a Tetra Pak juice carton. Unscrew the plastic cap to the plastic bin; rinse and flatten the body for the paper bin.",
    "award_star_suggestion": 2,
    "needs_teacher_review": false
  },
  "student_message": {
    "zh": "做得好！记得先拧盖子 → 倒空 → 压扁，三步就 OK！",
    "en": "Nice! Remember: unscrew cap → empty → flatten. Three steps, done!"
  },
  "teacher_note": {
    "zh": "示范如何快速拧盖、撕开盒底压扁。",
    "en": "Demonstrate fast cap removal and flattening the carton."
  },
  "safety_flags": []
}

▼ EXAMPLE B: A clear PET water bottle with cap and printed label
recommended_parts should have 3 entries:
  1. 瓶盖 cap → plastic bin → "拧下来"
  2. 瓶身 body → plastic bin → "倒空、冲洗、压扁"
  3. 标签 label → general_waste OR plastic → "撕下标签"

▼ EXAMPLE C: A used aluminum drink can (single material)
recommended_parts has just 1 entry:
  1. 整罐 whole can → aluminum bin → "倒空、冲洗、压扁"
(That's correct — don't fabricate fake parts for single-material items.)

═══════════════════════════════════════════════════════════════
OTHER RULES
═══════════════════════════════════════════════════════════════
1. needs_teacher_review = true ONLY when image is blurry/unclear or contains hazards.
   A normal clear photo of a known item → needs_teacher_review = false. Be DECISIVE.
2. overall_confidence: 0.85–0.95 for clear common items, 0.5–0.7 only when actually unclear.
3. Dangerous items (battery, chemical, sharp, medical, broken glass): set safety_flags AND needs_teacher_review = true AND award_star_suggestion = 0.
4. Wet/oily/food-contaminated items: explain why it lowers recyclability; suggest cleaning.
5. student_message: cheerful, ≤ 30 chars Chinese, age-7 friendly, give the NEXT action.
6. teacher_note: 1 short sentence — what the teacher should demonstrate or double-check.
7. award_star_suggestion: 1 for single-material, 2 for mixed-material correctly decomposed, 3 for hard cases.
8. Return JSON only matching the schema. No prose, no markdown, no extra fields.`;

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
IMPORTANT: If the item has a cap/lid/label/lining or any visibly separable component, you MUST split it into multiple recommended_parts entries (see Example A in the instructions — 3 parts for a Tetra Pak).
Do not be lazy. Do not lump components together. Be DECISIVE: for a clear photo of a common item, set needs_teacher_review = false and overall_confidence ≥ 0.85.
Write both Chinese and English in every text field.`;

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
