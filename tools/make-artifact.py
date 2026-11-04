# dist/ 빌드본을 claude.ai 아티팩트용 페이지로 변환 (폰트는 data URI로 인라인)
#   usage: python tools/make-artifact.py  →  dist/artifact.html + dist/artifact-files.json
import base64, json, os, pathlib, re
D = os.path.join(os.path.dirname(__file__), '..', 'dist')
html = open(os.path.join(D, 'index.html'), encoding='utf8').read()
def inline(m):
    path = os.path.join(D, m.group(1).lstrip('./'))
    b64 = base64.b64encode(open(path, 'rb').read()).decode()
    return f"url('data:font/woff2;base64,{b64}')"
html = re.sub(r"url\('(\./assets/fonts/[^']+\.woff2)'\)", inline, html)
head = re.search(r'<head>(.*)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', '', head)
head = head.replace('html, body { margin: 0;', ':root { color-scheme: dark; }\n    html, body { margin: 0;')
page = head.strip() + '\n' + body.strip() + '\n'
open(os.path.join(D, 'artifact.html'), 'w', encoding='utf8').write(page)
files = {}
for root, _, names in os.walk(os.path.join(D, 'assets')):
    for n in names:
        rel = pathlib.Path(os.path.relpath(os.path.join(root, n), D)).as_posix()
        if rel.startswith('assets/fonts/') or rel == 'assets/bg/pcbang.png':
            continue
        files[rel] = rel
json.dump(files, open(os.path.join(D, 'artifact-files.json'), 'w'), indent=0)
print(len(page) // 1024, 'KB page,', len(files), 'files')
