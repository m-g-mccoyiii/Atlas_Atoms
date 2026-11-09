"""Generate docs/LESSON_PLANS.md from js/lessons.js (which is valid JSON inside a JS wrapper).

Run from anywhere:  python tools/make_lesson_doc.py
"""
import json
import os
import re

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(root, 'js', 'lessons.js'), encoding='utf-8').read()
start = src.index('AA.LESSONS = [') + len('AA.LESSONS = ')
lessons, _ = json.JSONDecoder().raw_decode(src, start)
units = json.loads(re.search(r'AA\.LESSON_UNITS = (\[.*?\]);', src, re.S).group(1)) if 'AA.LESSON_UNITS' in src else []
unit_at = {u[0]: u[2] for u in units}

out = [f"# Atlas' Atoms: {len(lessons)} Lesson Plans", "",
       "Written for a very advanced 7-year-old working with a grown-up. A path from \"what is an atom?\" to burning fuel, acids and the chemistry of your body. "
       "Each lesson takes 10 to 20 minutes and is built around the game. The same lessons appear in the game under **Lessons**, "
       "and the game ticks a lesson off automatically when the child finishes its activity.", "",
       "**For the adult:** let the child do the building. Ask \"what do you think will happen?\" before each step. "
       "The off-screen activities use ordinary household items. Do them with an adult nearby, and never taste or sniff unknown chemicals.", ""]
out.append("| # | Lesson | Level | Time |")
out.append("| --- | --- | --- | --- |")
for L in lessons:
    out.append(f"| {L['n']} | {L['title']} | {L['level']} | {L['minutes']} min |")
out.append("")
for L in lessons:
    if L['n'] in unit_at:
        out += ["---", "", f"# Unit: {unit_at[L['n']]}", ""]
    out += [f"## Lesson {L['n']}: {L['title']}", "",
            f"*{L['level']} · about {L['minutes']} minutes*", "",
            f"**Big idea.** {L['bigIdea']}", "", "**Words**", ""]
    out += [f"- **{w[0]}**: {w[1]}" for w in L['words']]
    out += ["", "**Try it in the game**", ""]
    out += [f"{i}. {s}" for i, s in enumerate(L['tryIt'], 1)]
    out += ["", "**Check yourself**", ""]
    out += [f"- {c['q']}  \n  *Answer: {c['a']}*" for c in L['check']]
    out += ["", f"**In real life.** {L['realLife']}", "", f"**Away from the screen.** {L['offScreen']}", ""]
    if L.get('grownup'):
        out += [f"**Grown-up question.** {L['grownup'].removeprefix('Ask: ')}", ""]

os.makedirs(os.path.join(root, 'docs'), exist_ok=True)
path = os.path.join(root, 'docs', 'LESSON_PLANS.md')
open(path, 'w', encoding='utf-8', newline='\n').write('\n'.join(out))
print(f"Wrote {path} ({len(lessons)} lessons)")
