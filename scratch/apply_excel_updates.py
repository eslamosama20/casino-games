import json
import openpyxl
from pathlib import Path

BASE_DIR = Path(r"c:\Users\osama\OneDrive\Desktop\سالب\casino-games")
QUESTIONS_PATH = BASE_DIR / "src" / "data" / "questions.json"
EXCEL_PATH = Path(r"c:\Users\osama\OneDrive\Desktop\casino_games_all_in_one-54cb30ab.xlsx")

with open(QUESTIONS_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

questions = data["questions"]
by_id = {q["id"]: q for q in questions}

# 1. Ids to remove completely (illogical riddles, duplicates, trick wording)
REMOVE_IDS = {"rid_022", "rid_096", "mov_068", "mov_030", "mus_008"}

# 2. Exact corrections from 'أسئلة غلط ومصححة' + 'audio_04'
UPDATES = {
    "fb_003": {
        "question": "في أي نادي إنجليزي تألق محمد صلاح وحقق معه الدوري الإنجليزي ودوري الأبطال (2017–2026)؟",
        "answer": "ليفربول",
        "options": ["ليفربول", "تشيلسي", "روما", "أرسنال"],
    },
    "foot_072": {
        "question": "من هو الهداف التاريخي لمنتخب فرنسا؟",
        "answer": "كيليان مبابي",
        "options": ["كيليان مبابي", "أوليفييه جيرو", "تييري هنري", "كريم بنزيما"],
    },
    "fb_019": {
        "question": "أي منتخب فاز ببطولة يورو 2024؟",
        "answer": "إسبانيا",
        "options": ["إسبانيا", "إنجلترا", "فرنسا", "ألمانيا"],
    },
    "fb_012": {
        "question": "ما هو أول نادي في التاريخ حقق السداسية التاريخية (2009)؟",
        "answer": "برشلونة",
        "options": ["برشلونة", "بايرن ميونخ", "ريال مدريد", "مانشستر يونايتد"],
    },
    "foo_022": {
        "question": "مين المهاجم المصري اللي لعب لوست هام وويجان وتوتنهام وميدلسبره؟",
        "answer": "أحمد حسام ميدو",
        "options": ["أحمد حسام ميدو", "عمرو زكي", "محمد زيدان", "حسام حسن"],
    },
    "foo_001": {
        "question": "مين هداف الدوري المصري التاريخي على مر العصور؟",
        "answer": "حسن الشاذلي",
        "options": ["حسن الشاذلي", "حسام حسن", "السيد الضظوي", "عبد الله السعيد"],
    },
    "mov_023": {
        "question": "ما هي سنة العرض الأول لمسرحية مدرسة المشاغبين؟",
        "answer": "1971",
        "options": ["1971", "1973", "1975", "1969"],
    },
    "mus_030": {
        "question": "مين صاحب ومؤلف لحن أغنية 'يا مسافر وحدك وفايتني' الأصلية (1942)؟",
        "answer": "محمد عبد الوهاب",
        "options": ["محمد عبد الوهاب", "فريد الأطرش", "عبد الحليم حافظ", "رياض السنباطي"],
    },
    "mov_075": {
        "question": "ما هو الفيلم الكوميدي لأحمد حلمي الذي لعب فيه دور 3 توائم؟",
        "answer": "كده رضا",
        "options": ["كده رضا", "زكي شان", "إكس لارج", "جعلتني مجرماً"],
    },
    "mus_047": {
        "question": "مين غنى أغنية 'تعالى أدلعك'؟",
        "answer": "بهاء سلطان",
        "options": ["بهاء سلطان", "تامر حسني", "حماقي", "رامي صبري"],
    },
    "mus_045": {
        "question": "مين صاحب ألبوم وأغنية 'نور العين' (1996)؟",
        "answer": "عمرو دياب",
        "options": ["عمرو دياب", "محمد فؤاد", "مصطفى قمر", "إيهاب توفيق"],
    },
    "fb_022": {
        "question": "مين اللاعب اللي سجل هاتريك في نهائي كأس العالم 2022؟",
        "answer": "كيليان مبابي",
        "options": ["كيليان مبابي", "ليونيل ميسي", "جيف هيرست", "رونالدو الظاهرة"],
    },
    "hist_020": {
        "question": "مين الملك الفرعوني بطل معركة قادش الشهيرة؟",
        "answer": "رمسيس الثاني",
        "options": ["رمسيس الثاني", "تحتمس الثالث", "توت عنخ آمون", "خوفو"],
    },
    "hist_022": {
        "question": "ما اسم المعاهدة اللي وقعتها مصر وإسرائيل عام 1979؟",
        "answer": "معاهدة السلام المصرية الإسرائيلية",
        "options": ["معاهدة السلام المصرية الإسرائيلية", "اتفاقية الجلاء", "معاهدة 1936", "اتفاقية أوسلو"],
    },
    "hist_026": {
        "question": "قائد الثورة العرابية وصاحب مقولة 'لقد خلقنا الله أحراراً ولم يخلقنا تراثاً أو عقاراً'؟",
        "answer": "أحمد عرابي",
        "options": ["أحمد عرابي", "سعد زغلول", "مصطفى كامل", "محمد فريد"],
    },
    "hist_087": {
        "question": "ملك بابل صاحب مسلة القوانين المشهورة في التاريخ؟",
        "answer": "حمورابي",
        "options": ["حمورابي", "نبوخذ نصر", "سرجون الأكدي", "آشوربانيبال"],
    },
    "geo_038": {
        "question": "أي دولة أوروبية لغتها الرسمية أصلها عربي؟",
        "answer": "مالطا",
        "options": ["مالطا", "قبرص", "اليونان", "البرتغال"],
    },
    "geo_053": {
        "question": "ما هي أخفض نقطة على اليابسة على سطح الأرض؟",
        "answer": "شاطئ البحر الميت",
        "options": ["شاطئ البحر الميت", "بحر قزوين", "وادي الموت", "منخفض القطارة"],
    },
    "geo_086": {
        "question": "ما هي الدولة الأوروبية التي عاصمتها ريكيافيك وليس لديها جيش دائم؟",
        "answer": "أيسلندا",
        "options": ["أيسلندا", "سويسرا", "النرويج", "فنلندا"],
    },
    "geo_004": {
        "question": "ما هو أطول نهر في أفريقيا (وأطول نهر في العالم حسب القياس التقليدي)؟",
        "answer": "نهر النيل",
    },
    "gen_003": {
        "question": "ما هو أطول نهر في قارة أفريقيا؟",
        "answer": "نهر النيل",
    },
    "gen_096": {
        "question": "أي طائر ليلي مشهور بقدرته على تدوير رأسه تقريباً دورة كاملة؟",
        "answer": "البومة",
        "options": ["البومة", "الصقر", "الخفاش", "النسر"],
    },
    "emoj_061": {
        "question": "خمن الفيلم الأجنبي: 🚢 ⚓ 🌊 💔 🎻",
        "answer": "تيتانيك",
    },
    "mov_014": {
        "question": "مين لعب دور البرنس شوكت في فيلم 'الأيدي الناعمة'؟",
        "answer": "أحمد مظهر",
    },
    "mov_048": {
        "question": "مين مؤلف رواية وفيلم 'تراب الماس'؟",
        "answer": "أحمد مراد",
        "options": ["أحمد مراد", "يوسف زيدان", "علاء الأسواني", "بلال فضل"],
    },
    "mov_049": {
        "question": "ما اسم شخصية محمود عبد العزيز في فيلم 'الساحر'؟",
        "answer": "منصور بهجت",
    },
    "audio_04": {
        "question": 'مين صاحب الإفيه الكوميدي: "ثانية واحدة أتحزم وأجيلك!"؟',
        "answer": "محمد سعد (فيلم اللمبي 8 جيجا)",
        "hint": "فيلم اللمبي 8 جيجا مع مي عز الدين",
        "options": ["محمد سعد", "محمد هنيدي", "أحمد حلمي", "هاني رمزي"],
    },
}

updated_questions = []
fixed_count = 0
removed_count = 0

for q in questions:
    qid = q["id"]
    if qid in REMOVE_IDS:
        removed_count += 1
        continue
    if qid in UPDATES:
        for k, v in UPDATES[qid].items():
            q[k] = v
        fixed_count += 1
    # Update outdated "الحالي" wording in blur_football questions
    if q.get("categoryId") == "image_blur":
        for old_word, new_word in [("الحالي", "الشهير"), ("حالياً", "تألق مع")]:
            if old_word in q.get("question", ""):
                q["question"] = q["question"].replace(old_word, new_word)
            if q.get("hint") and old_word in q["hint"]:
                q["hint"] = q["hint"].replace(old_word, new_word)
    updated_questions.append(q)

# 3. Import 510 Geography + 500 Movies from Excel
wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True)
existing_ids = {q["id"] for q in updated_questions}
added_geo = 0
added_mov = 0

diff_map = {"easy": "سهل", "medium": "متوسط", "hard": "صعب"}

for sheet_name in ["بنك الجغرافيا", "بنك الأفلام"]:
    ws = wb[sheet_name]
    rows = list(ws.iter_rows(values_only=True))
    headers = rows[0]
    for r in rows[1:]:
        if not r or not r[0]:
            continue
        qid, cat, diff, question_txt, answer_txt, hint_txt, opts_str, source = r[:8]
        qid = str(qid).strip()
        if qid in existing_ids:
            continue
        cat = str(cat).strip()
        options_list = [o.strip() for o in str(opts_str).split("|") if o.strip()] if opts_str else None
        new_q = {
            "id": qid,
            "categoryId": cat,
            "category": cat,
            "question": str(question_txt).strip(),
            "answer": str(answer_txt).strip(),
            "difficulty": diff_map.get(str(diff).strip().lower(), "متوسط"),
        }
        if hint_txt:
            new_q["hint"] = str(hint_txt).strip()
        if options_list:
            new_q["options"] = options_list
        updated_questions.append(new_q)
        existing_ids.add(qid)
        if cat == "geography":
            added_geo += 1
        elif cat == "movies":
            added_mov += 1

data["questions"] = updated_questions
data["version"] = 29

with open(QUESTIONS_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Fixed: {fixed_count}, Removed: {removed_count}")
print(f"Added Geography: {added_geo}, Added Movies: {added_mov}")
print(f"Total questions now: {len(updated_questions)} (version {data['version']})")
