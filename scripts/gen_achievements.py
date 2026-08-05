from pathlib import Path

out = Path(__file__).resolve().parents[1] / "public" / "achievements"
out.mkdir(parents=True, exist_ok=True)

items = [
    ("first_step", "#c18636", "M12 20 L20 8 L28 20 Z"),
    ("morning_ritual", "#a46957", "M20 8 A8 8 0 1 1 19.9 8 M20 4 L20 8"),
    ("card_player", "#703a14", "M10 6 h20 v28 h-20 z M14 12 h12 M14 18 h12"),
    ("seven_days", "#31464f", "M20 6 L24 14 L32 14 L26 20 L28 28 L20 23 L12 28 L14 20 L8 14 L16 14 Z"),
    ("gardener", "#5c6b52", "M20 30 V18 M12 22 Q20 8 28 22 M16 30 h8"),
    ("amateur_psych", "#a46957", "M12 16 Q20 6 28 16 Q20 26 12 16"),
    ("thirty_days", "#c18636", "M8 20 H32 M20 8 V32"),
    ("blooming", "#c18636", "M20 20 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M20 8 v6 M20 26 v6 M8 20 h6 M26 20 h6"),
    ("reflection_master", "#31464f", "M10 10 h20 v16 h-8 l-4 6 v-6 h-8 z"),
    ("sixty_days", "#703a14", "M12 12 h16 v16 h-16 z M16 16 h8 v8 h-8 z"),
    ("colleague_support", "#a46957", "M14 22 Q20 10 26 22 M10 26 Q20 18 30 26"),
    ("hundred_days", "#c18636", "M20 6 L22 14 L30 14 L24 18 L26 26 L20 21 L14 26 L16 18 L10 14 L18 14 Z"),
    ("forest_keeper", "#5c6b52", "M20 32 V20 M10 22 L20 8 L30 22 Z M14 26 L20 14 L26 26 Z"),
    ("year_resource", "#703a14", "M20 8 A10 10 0 1 1 19.9 8 M20 12 L20 20 L26 23"),
]

for aid, color, path in items:
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <circle cx="20" cy="20" r="19" fill="#f7f1e6" stroke="{color}" stroke-width="1.5"/>
  <path d="{path}" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
"""
    (out / f"{aid}.svg").write_text(svg, encoding="utf-8")

print("wrote", len(items), "to", out)
