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
    // ── v1.1 fields (layered AI analysis) ──
    "image_quality",
    "multi_item_detected",
    "multi_item_advice_zh",
    "multi_item_advice_en",
    "uncertainties_zh",
    "uncertainties_en",
    "recommended_next_action",
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

    // ─── v1.1: layered AI analysis fields ───────────────────────
    image_quality: {
      type: "object",
      additionalProperties: false,
      required: ["clarity", "needs_retake", "retake_reason_zh", "retake_reason_en"],
      properties: {
        clarity: {
          type: "string",
          enum: ["clear", "blurry", "too_far", "reflective", "blocked", "crowded", "dark"],
        },
        needs_retake: { type: "boolean" },
        retake_reason_zh: { type: "string" },
        retake_reason_en: { type: "string" },
      },
    },
    multi_item_detected: { type: "boolean" },
    multi_item_advice_zh: { type: "string" },
    multi_item_advice_en: { type: "string" },
    uncertainties_zh: {
      type: "array",
      maxItems: 6,
      items: { type: "string" },
    },
    uncertainties_en: {
      type: "array",
      maxItems: 6,
      items: { type: "string" },
    },
    recommended_next_action: {
      type: "string",
      enum: [
        "accept",
        "take_closeup",
        "separate_items",
        "teacher_confirm",
        "reject_as_unsafe",
      ],
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
🎯 MATERIAL → BIN QUICK LOOKUP — memorize this, apply EVERY time
═══════════════════════════════════════════════════════════════
| Visible material                          | Goes to bin     |
|-------------------------------------------|-----------------|
| Pure paper (label, page, magazine)        | paper           |
| Newspaper specifically                    | newspaper       |
| Cardboard (corrugated, box, egg carton)   | cardboard       |
| Plastic of any kind (PET, HDPE, PP, lid)  | plastic         |
| Aluminum (drink can, foil)                | aluminum        |
| Other metal (tin-plated steel, sardine)   | metal           |
| Used cooking oil                          | used_oil        |
| Wet / oily / food-contaminated material   | general_waste   |
| Foam, styrofoam                           | general_waste   |
| Snack wrapper laminate (foil + plastic)   | general_waste   |
| Tissue, paper towel, thermal receipt      | general_waste   |
| Drinking straws (too small to sort)       | general_waste   |
| Battery, chemical, sharp, medical, glass  | hazardous       |
| Phone, cable, electronics, CD             | ewaste          |

🔁 THE "VISIBLE MATERIAL SCAN" — mandatory before writing JSON
For each item in the photo, you MUST do this scan:
  STEP 1: List EVERY distinct material you can see
          (don't guess "mixed material" — name each one: plastic body, paper label, metal cap, etc.)
  STEP 2: For each material, look up its bin in the table above
  STEP 3: Each material = ONE separate recommended_parts entry
          (NEVER combine 2 materials into 1 part. Paper label on plastic bottle = 2 parts.)

ONLY exceptions where 2 materials → 1 part:
  • Bonded at molecular level (Tetra Pak inner foil, snack wrapper laminate, paper cup inner film)
  • Too small to physically separate (pen, eraser, straw)
In these cases, output 1 part as general_waste with explanation.

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

▼ EXAMPLE B-1 — PET drink bottle with PAPER label (Coke, Sprite, Tropicana)
3 parts:
  1. 瓶盖 cap → plastic bin → "拧下来"
  2. 瓶身 body → plastic bin → "倒空 → 冲洗 → 压扁"
  3. 纸标签 paper label → paper bin → "撕下纸标签 → 投入纸张桶"
materials: ["PET plastic body", "HDPE plastic cap", "paper label"]
award_star_suggestion: 2
(KEY: paper label goes to PAPER bin, NOT general_waste. Always check label material first.)

▼ EXAMPLE B-2 — PET water bottle with SHRINK PLASTIC label (mineral water brand)
3 parts:
  1. 瓶盖 cap → plastic bin → "拧下来"
  2. 瓶身 body → plastic bin → "倒空 → 冲洗 → 压扁"
  3. 收缩塑料标签 shrink plastic label → plastic bin → "撕下来 (是塑料 → 也丢塑料桶)"
materials: ["PET plastic body", "HDPE plastic cap", "shrink plastic label"]
award_star_suggestion: 2
(Even shrink plastic is plastic → plastic bin. Only foil/foam laminates go to general_waste.)

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

▼ EXAMPLE I — Plastic bag stuffed with multiple recyclables (a common school pile)
The bag itself + every visible item inside = each gets its own detected_items entry.
Example: a transparent plastic bag containing 1 PET bottle, 1 newspaper bundle, 1 aluminum can →
  detected_items = [
    {label: "塑料袋 plastic bag", 1 part to plastic bin},
    {label: "PET 矿泉水瓶 PET water bottle", 3 parts},
    {label: "报纸 newspaper", 1 part to newspaper bin},
    {label: "铝罐 aluminum can", 1 part to aluminum bin}
  ]
NEVER report this as one "mixed bag" or "miscellaneous". List EACH item separately.

▼ EXAMPLE J — Ballpoint plastic pen (3 materials but too small to disassemble)
1 part:
  1. 整支笔 whole pen → general_waste → "用完再丢；笔太小，学校无法逐件拆解回收"
materials: ["plastic body", "metal tip", "ink tube"]
student_message: "用完一支笔再换新的，最环保！"
award_star_suggestion: 0
(3 materials but practical decomposition is impossible at primary school scale → 1 part is correct.)

▼ EXAMPLE K — Spiral notebook with plastic cover
3 parts:
  1. 塑料封面 plastic cover → plastic bin → "撕下来"
  2. 金属线圈 metal spiral → metal bin → "用钳子拆下来"
  3. 纸页 paper pages → paper bin → "撕开摊平叠好"
materials: ["paper pages", "metal spiral", "plastic cover"]
award_star_suggestion: 3
(Even "school stationery" can be decomposed — be diligent.)

▼ EXAMPLE L — Snack wrapper (chips / biscuit / candy with foil-plastic laminate)
1 part:
  1. 整袋 whole wrapper → general_waste → "铝塑复合膜，无法分离 → 一般垃圾"
materials: ["aluminum-plastic laminate"]
student_message: "选少包装的零食，可以减少这种垃圾！"
award_star_suggestion: 0
(Composite at molecular level — keep as 1 part, but EXPLAIN why so it educates.)

▼ EXAMPLE M — Tetra Pak with a metal straw and plastic wrapper stuffed inside
This is a STUDENT-COMBINED pile, not factory packaging. Treat each as SEPARATE detected_items:
  detected_items = [
    {label: "Tetra Pak 纸盒", 3 parts: cap/body/foil},
    {label: "金属吸管 metal straw", 1 part to metal bin: "冲洗，投入铁制品桶"},
    {label: "塑料袋 plastic wrapper", 1 part to plastic bin: "冲洗"}
  ]
NEVER bundle these into "one mixed item". The student stuffed them together — your job is to UNDO that.

▼ EXAMPLE N — Paper cup WITH a separate plastic lid (Starbucks-style takeaway cup)
2 parts:
  1. 塑料盖 plastic lid → plastic bin → "取下来 → 投入塑料桶"
  2. 纸杯身 paper cup body → general_waste → "杯身内层有塑料防水膜，多数无法回收 → 一般垃圾"
materials: ["PP plastic lid", "paper cup with plastic inner film"]
award_star_suggestion: 2
(IMPORTANT: even though the cup itself can't be recycled, the LID can. Always separate.)

▼ EXAMPLE O — Glass jar with metal cap and paper label (jam jar, peanut butter jar)
3 parts:
  1. 金属盖 metal cap → metal bin → "拧下来"
  2. 纸标签 paper label → paper bin → "撕下来 (浸水更容易撕)"
  3. 玻璃罐身 glass body → general_waste → "学校没有玻璃桶，交给老师处理"
materials: ["glass", "metal cap", "paper label"]
safety_flags: ["broken_glass"]
award_star_suggestion: 2
(3 different materials, 3 different bins. Always check label material — paper not plastic.)

▼ EXAMPLE P — Plastic takeaway container (rice/noodle box) with paper sleeve
3 parts:
  1. 透明塑料盖 plastic lid → plastic bin → "取下来"
  2. 塑料盒身 plastic container → plastic bin → "倒空 → 冲洗"
  3. 纸套 paper sleeve → paper bin → "撕下来"
materials: ["PP plastic container", "PET plastic lid", "paper sleeve"]
award_star_suggestion: 2
(Two plastic parts can BOTH go to plastic bin; paper part goes separately to paper bin.)

═══════════════════════════════════════════════════════════════
🧠 THINKING FRAMEWORK — apply silently before writing JSON
═══════════════════════════════════════════════════════════════
For EACH distinct object in the photo, mentally answer 3 questions:
  Q1. What MATERIALS do I see? (paper / plastic / metal / glass / rubber / aluminum / ...)
  Q2. Are they JOINED, or can a child physically separate them in under 30 seconds?
  Q3. Is decomposition PRACTICAL (worth doing) at primary-school scale?

Mapping:
  • Q1 lists multiple AND Q2 = yes AND Q3 = yes  → multiple recommended_parts (e.g. Tetra Pak, PET bottle, milk-powder tin, notebook)
  • Q1 lists multiple BUT Q2 = yes AND Q3 = no   → 1 part = general_waste, explain in action (e.g. pen, eraser, straw)
  • Q1 lists multiple BUT Q2 = no (fused at molecular level) → 1 part, explain (e.g. snack wrapper laminate, plain paper cup with NO removable lid, thermal receipt)
    [BUT: if the paper cup HAS a separable plastic lid → still 2 parts (lid + body)]
  • Q1 single material → 1 part (e.g. aluminum can, newspaper)

Do NOT output your thinking. Only output the final JSON.

═══════════════════════════════════════════════════════════════
🚫 FORBIDDEN OUTPUTS — these are lazy and WRONG
═══════════════════════════════════════════════════════════════
NEVER write a recommended_parts entry like:
  ❌ "整个物品 · Whole item"          (unless it really IS single-material; name the material)
  ❌ "混合材料部分 · Mixed material"   (LAZY — name each material)
  ❌ "其他部分 · Other parts"          (too vague — be specific)
  ❌ "未知材料 · Unknown material"     (try harder; if truly unknown, set needs_teacher_review)

NEVER write a summary_zh like:
  ❌ "需要老师确认"                    (only for blurry/dangerous; clear common items must be decisive)
  ❌ "这是混合材料，请分类"              (BE SPECIFIC — name parts + bins)
  ❌ "请按照学校规定处理"                (no — give concrete steps)

If you catch yourself drafting any of these, REWRITE with concrete material names and bin destinations.

═══════════════════════════════════════════════════════════════
💰 WHY DECOMPOSITION MATTERS — economic motivation
═══════════════════════════════════════════════════════════════
The school turns recyclables into money for student rewards. Bin values:
  • aluminum     RM 5.50/kg  ← most valuable
  • used_oil     RM 3.40/kg
  • newspaper    RM 1.00/kg
  • metal        RM 0.40/kg
  • cardboard    RM 0.25/kg
  • plastic      RM 0.25/kg
  • paper        RM 0.10/kg
  • general_waste = RM 0.00 (wasted opportunity)

EXAMPLE: A milk-powder tin thrown whole into general_waste = RM 0.
Correctly decomposed:
  • plastic lid → plastic bin    (RM 0.25/kg)
  • paper label → paper bin      (RM 0.10/kg)
  • metal body  → metal bin      (RM 0.40/kg ← highest of the 3)
→ School gets MORE money → MORE rewards for students.

So DECOMPOSE AGGRESSIVELY. Each correctly identified part = more value for the school.

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

═══════════════════════════════════════════════════════════════
🎚️ v1.1 LAYERED ANALYSIS — when to be DECISIVE vs UNCERTAIN
═══════════════════════════════════════════════════════════════
The previous rules say "be decisive." That STILL APPLIES — but only when the
image is genuinely clear and the item is a well-known shape (PET bottle, aluminum
can, Tetra Pak, newspaper, etc.). Don't bail on those — that was the old laziness.

NEW: when the image is genuinely AMBIGUOUS, you MUST express that ambiguity
using the new v1.1 fields instead of pretending to know. Be honest, not lazy.

DISCRIMINATOR (decide which mode you're in):
  CLEAR & COMMON → set overall_confidence ≥ 0.85, needs_teacher_review = false,
                   uncertainties_zh = [], recommended_next_action = "accept"
  AMBIGUOUS      → lower confidence (0.4–0.7), list uncertainties, set
                   recommended_next_action = "take_closeup" or "teacher_confirm"

CASES THAT ARE GENUINELY AMBIGUOUS (must use uncertainty):
  ① Glass bottle wrapped in plastic film / shrink wrap — material unclear
  ② Label material unclear (paper vs. shiny plastic on a plastic bottle)
  ③ Outer coating / laminate / metallized film — can't tell composition
  ④ Item partially occluded, far away, blurry, dark, heavily reflective
  ⑤ Two or more main items photographed together (see multi-item rule)
  ⑥ Unfamiliar shape that doesn't match any of examples A–P

HOW TO FILL THE v1.1 FIELDS

▸ image_quality (always required)
  - clarity: pick from clear / blurry / too_far / reflective / blocked / crowded / dark
  - needs_retake: true ONLY if you genuinely can't decide (don't say true for clear photos!)
  - retake_reason_zh / _en: ONE short sentence telling the teacher what to re-shoot.
    Example: { clarity: "clear", needs_retake: false, retake_reason_zh: "", retake_reason_en: "" }
    Example: { clarity: "reflective", needs_retake: true,
               retake_reason_zh: "瓶身反光，请近拍标签部分",
               retake_reason_en: "Bottle glare — please take a close-up of the label" }

▸ multi_item_detected (true/false)
  - true if there are 2+ DISTINCT main items in the frame (a pile, a bag of mixed stuff)
  - false if there is ONE main item (even if it has multiple parts like Tetra Pak)
  - When true: detected_items may still list each item, BUT also set
    multi_item_advice_zh = "检测到多个物品，建议逐个拍照以获得更准确分类。"
    multi_item_advice_en = "Multiple items detected — take separate photos for accuracy."
    award_star_suggestion = 0   ← don't tempt teachers to award on confused input
  - When false: multi_item_advice_zh = "", multi_item_advice_en = ""

▸ uncertainties_zh / uncertainties_en (arrays, can be empty)
  - List each thing you're genuinely unsure about, one short sentence each.
  - Examples (zh): "无法确认瓶身标签是纸张还是塑料", "照片反光，可能是玻璃也可能是塑料"
  - Empty array [] when image is clear and you're confident.
  - DON'T fill this just to seem humble — only real ambiguities.

▸ recommended_next_action (one of):
  - "accept"            → image is clear, AI is confident, teacher can act on result
  - "take_closeup"      → ask teacher/student to re-photograph a specific part (label, cap, coating)
  - "separate_items"    → photo has multiple items, suggest one-at-a-time
  - "teacher_confirm"   → item is unusual or material genuinely ambiguous, teacher must decide
  - "reject_as_unsafe"  → contains battery/chemical/sharp/medical/glass hazard
  Pick exactly one. Don't default to "accept" unless you really are confident.

DECISIVE EXAMPLES (these should give "accept" with high confidence):
  • Clean photo of a Coca-Cola aluminum can on white background     → accept (0.95)
  • Clean photo of a Tetra Pak on a desk                            → accept (0.92)
  • Clean photo of a newspaper stack                                → accept (0.94)

UNCERTAIN EXAMPLES (these should NOT bluff):
  • Glass bottle with a shrink-wrap plastic sleeve obscuring the body
    → confidence 0.55, clarity "reflective", needs_retake true,
      uncertainties: ["瓶身被塑料膜包裹，无法看清是玻璃还是塑料"],
      recommended_next_action "take_closeup"
  • Plastic bottle whose label looks like it could be paper OR shrink plastic
    → confidence 0.65, clarity "clear", needs_retake false,
      uncertainties: ["标签材质不明（纸张或塑料），建议老师近拍标签角落确认"],
      recommended_next_action "take_closeup"
  • A pile of mixed recyclables in a basket
    → multi_item_detected true, confidence 0.50, clarity "crowded",
      multi_item_advice set, recommended_next_action "separate_items",
      award_star_suggestion 0

═══════════════════════════════════════════════════════════════
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

🎯 RUN THE VISIBLE MATERIAL SCAN (MANDATORY):
  STEP 1: Name every distinct material you see (e.g. "plastic body", "paper label", "metal cap")
  STEP 2: Map each material to its bin using the MATERIAL→BIN table
  STEP 3: Output ONE recommended_parts entry per material

⚠️ COMMON TRAPS — don't fall for these:
  - Plastic bottle with PAPER label → 3 parts (cap+body→plastic, label→PAPER bin)
  - Plastic bottle with PLASTIC shrink label → 3 parts (all 3 → plastic bin)
  - Paper cup with separate plastic lid → 2 parts (lid→plastic, body→general_waste)
  - Glass jar with metal cap + paper label → 3 parts to 3 different bins
  - Aluminum can (no label or printed-on) → 1 part to aluminum bin
  - Tetra Pak → ALWAYS 3 parts (cap→plastic, body→paper, foil→with paper)

CRITICAL — FORBIDDEN OUTPUTS:
  - "Mixed material" / "整个物品" / "其他部分" / "Whole item" (LAZY, FORBIDDEN)
  - "Needs teacher review" for clear common items (be DECISIVE, confidence ≥ 0.85)

If photo contains MULTIPLE distinct items (a bag, a pile), list EACH as its own detected_items entry.

Hazards (battery / chemical / sharp / glass / medical) → safety_flags + award_star_suggestion = 0.

v1.1 layered fields — ALWAYS fill, even when clear:
  - image_quality.clarity + needs_retake (false for clean clear photos)
  - multi_item_detected (true only if 2+ DISTINCT main items)
  - uncertainties_zh / _en (empty array when you really are confident)
  - recommended_next_action (one of: accept / take_closeup / separate_items / teacher_confirm / reject_as_unsafe)

Be HONEST: if material is genuinely unclear (glass with plastic film, paper-vs-plastic label, reflective coating) → lower confidence + add uncertainty + recommend "take_closeup". Don't bluff. Don't pretend to know.

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
        max_output_tokens: 3200,
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
