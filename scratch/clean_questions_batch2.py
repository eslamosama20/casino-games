import json
from pathlib import Path

QUESTIONS_PATH = Path(r"c:\Users\osama\OneDrive\Desktop\سالب\casino-games\src\data\questions.json")

with open(QUESTIONS_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

REMOVE_IDS = {
    # 5 movies requested to remove
    "mov_066",  # duplicate of mov_008 (المعلم سلطان is the real character name)
    "mov_044",
    "mov_052",
    "mov_053",
    "mov_093",
    # 75 audio_mystery IDs requested to remove
    "audio_01", "audio_06", "audio_08", "audio_12", "audio_13", "audio_15",
    "audio_001", "audio_002", "audio_003", "audio_004", "audio_005", "audio_007",
    "audio_008", "audio_009", "audio_011", "audio_013", "audio_014", "audio_016",
    "audio_017", "audio_018", "audio_020", "audio_021", "audio_022", "audio_024",
    "audio_025", "audio_026", "audio_027", "audio_028", "audio_029", "audio_030",
    "audio_031", "audio_032", "audio_033", "audio_034", "audio_035", "audio_036",
    "audio_037", "audio_038", "audio_039", "audio_040", "audio_041", "audio_042",
    "audio_043", "audio_044", "audio_045", "audio_046", "audio_047", "audio_048",
    "audio_049", "audio_050", "audio_051", "audio_052", "audio_053", "audio_054",
    "audio_055", "audio_056", "audio_057", "audio_058", "audio_059", "audio_060",
    "audio_064", "audio_066", "audio_068", "audio_071", "audio_080", "audio_084",
    "audio_085", "audio_086", "audio_087", "audio_089", "audio_093", "audio_096",
    "audio_097", "audio_098", "audio_099",
}

new_questions = []
removed_movies = 0
removed_audio = 0
updated_blur = 0

for q in data["questions"]:
    qid = q["id"]
    if qid in REMOVE_IDS:
        if qid.startswith("mov_"):
            removed_movies += 1
        elif qid.startswith("audio_"):
            removed_audio += 1
        continue

    if qid == "blur_football_011":
        q["question"] = "خمن مين اللاعب صاحب الصورة المشوشة دي؟ ⚽ (الجناح المصري المتألق في البوندسليجا مع آينتراخت فرانكفورت والبريميرليج)"
        q["hint"] = "نجم منتخب مصر الذي تألق مع آينتراخت فرانكفورت الألماني وصاحب الركلات الحرة العالمية"
        updated_blur += 1
    elif q.get("categoryId") == "image_blur":
        # Ensure no stale "حالياً" / "النادي الحالي" remains anywhere
        for old_str, new_str in [
            ("النادي الحالي", "نادي"),
            ("حالياً", "الشهير"),
            ("الحالي", "الشهير"),
        ]:
            if old_str in q.get("question", ""):
                q["question"] = q["question"].replace(old_str, new_str)
                updated_blur += 1
            if q.get("hint") and old_str in q["hint"]:
                q["hint"] = q["hint"].replace(old_str, new_str)
                updated_blur += 1

    new_questions.append(q)

remaining_audio = [q for q in new_questions if q.get("categoryId") == "audio_mystery"]
data["questions"] = new_questions
data["version"] = 30

with open(QUESTIONS_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Removed movies: {removed_movies}, Removed audio_mystery: {removed_audio}")
print(f"Remaining audio_mystery: {len(remaining_audio)}")
print(f"Updated blur hints: {updated_blur}")
print(f"Total questions: {len(new_questions)} (version {data['version']})")
