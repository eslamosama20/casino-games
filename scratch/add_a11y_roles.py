import re
from pathlib import Path

SRC_DIR = Path(r"c:\Users\osama\OneDrive\Desktop\سالب\casino-games\src")

total_updated = 0
for path in SRC_DIR.rglob("*.tsx"):
    text = path.read_text(encoding="utf-8")
    # Match <TouchableOpacity followed by props up to > (handling multiline)
    # Only insert accessibilityRole="button" if not already present inside the tag
    def repl(match):
        tag = match.group(0)
        if "accessibilityRole" in tag:
            return tag
        # Insert accessibilityRole="button" right after <TouchableOpacity
        return tag.replace("<TouchableOpacity", '<TouchableOpacity accessibilityRole="button"', 1)

    new_text = re.sub(r"<TouchableOpacity\b[^>]*?>", repl, text, flags=re.DOTALL)
    if new_text != text:
        count = new_text.count('accessibilityRole="button"') - text.count('accessibilityRole="button"')
        path.write_text(new_text, encoding="utf-8")
        print(f"Updated {path.name}: +{count} accessibilityRole='button'")
        total_updated += count

print(f"Total TouchableOpacity buttons updated: {total_updated}")
