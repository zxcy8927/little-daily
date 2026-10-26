"""Build the renamed OFL subset from an original Huninn TTF supplied as argv[1].
Run with fonttools==4.67.0 and brotli==1.2.1 installed in the build environment.
"""
from pathlib import Path
import sys
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
font = TTFont(sys.argv[1], recalcTimestamp=False)
chars = set(chr(cp) for start, end in [(0x20, 0xFF), (0x2000, 0x206F),
    (0x3000, 0x303F), (0x3100, 0x312F), (0x31A0, 0x31BF), (0xFF00, 0xFFEF)]
    for cp in range(start, end + 1))
# Big5 first-level characters cover common Traditional Chinese without retaining all rare glyphs.
for lead in range(0xA4, 0xC7):
    for trail in list(range(0x40, 0x7F)) + list(range(0xA1, 0xFF)):
        if lead == 0xC6 and trail > 0x7E:
            continue
        try:
            chars.update(bytes([lead, trail]).decode('big5'))
        except UnicodeDecodeError:
            pass
for folder in ['src', 'public']:
    for path in (root / folder).rglob('*'):
        if path.suffix in {'.ts', '.tsx', '.html', '.json', '.css', '.webmanifest'}:
            chars.update(path.read_text(encoding='utf-8-sig'))
original = set(font.getBestCmap())
required = {ord(c) for c in chars} & original
options = subset.Options()
options.name_IDs = ['*']
options.name_legacy = True
options.name_languages = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=required)
subsetter.subset(font)
# OFL Reserved Font Names cannot be used for this modified font's family names.
for name in font['name'].names:
    values = {1: 'Little Daily Round', 2: 'Regular', 3: 'LittleDailyRound-Subset-1',
        4: 'Little Daily Round Regular', 6: 'LittleDailyRound-Regular',
        16: 'Little Daily Round', 17: 'Regular'}
    if name.nameID in values:
        name.string = values[name.nameID].encode(name.getEncoding())
font.flavor = 'woff2'
out = root / 'public/little-daily-round.woff2'
font.save(out)
check = TTFont(out)
assert required <= set(check.getBestCmap())
print(f'Original: {Path(sys.argv[1]).stat().st_size} bytes; subset: {out.stat().st_size} bytes; codepoints: {len(required)}')
