#!/usr/bin/env python3
"""Build the app.

    python3 build.py

Reads src/shell.html and src/fmn/*.js, inlines every script into one
<script> block in the order the shell declares, and writes index.html at the
repo root — which is what GitHub Pages serves and what the family's phones
load.

Edit files in src/. Never edit index.html; this overwrites it.
"""
import re
import pathlib
import sys

HERE = pathlib.Path(__file__).parent
SHELL = HERE / 'src' / 'shell.html'
OUT = HERE / 'index.html'

html = SHELL.read_text()

tags = re.findall(r'<script src="(fmn/[\w.]+\.js)(?:\?v=\d+)?"></script>', html)
if not tags:
    sys.exit('no fmn/*.js script tags found in src/shell.html')

parts = []
for rel in tags:
    path = HERE / 'src' / rel
    if not path.exists():
        sys.exit('missing %s' % path)
    parts.append('/* ===== %s ===== */\n%s' % (rel, path.read_text().rstrip('\n')))
bundle = '<script>\n' + '\n\n'.join(parts) + '\n</script>'

block = re.search(
    r'(?:<!--[^\n]*-->\n)?(?:<script src="fmn/[\w.]+\.js(?:\?v=\d+)?"></script>\n?)+',
    html)
html = html[:block.start()] + bundle + html[block.end():]

# the shell loads assets from ../ so it can run straight from src/ during
# development; at the root they sit alongside index.html
html = html.replace('../manifest.webmanifest', 'manifest.webmanifest')
html = html.replace('../icon.svg', 'icon.svg')

OUT.write_text(html)
print('built index.html — %d lines, %d scripts inlined' % (html.count('\n') + 1, len(tags)))
