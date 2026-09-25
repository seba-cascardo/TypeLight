"""Build src/engine/corpus/books.ts: public-domain Rioplatense books for the reading mode.

Source: es.wikisource.org (rendered pages through the MediaWiki API, cached in scripts/.books-cache/).
Horacio Quiroga (1878-1937), "Cuentos de la selva" (1918); Roberto Arlt (1900-1942), "Aguafuertes porteñas"
(1928-1933). Both are public domain in Argentina and Uruguay (70 years after the author's death).

Adaptations, all mechanical: typographic punctuation to ASCII (the app types what a keyboard types: — becomes -,
«» and “” become "), and the 1918 accents the RAE dropped in 1952 (fué, vió, dió, á, ó...) modernised. Texts
(stories, columns) with tú forms are left out: the app speaks Rioplatense. Paragraphs are grouped into pages of
about 150 to 480 characters, split at sentence ends. Run: python scripts/build-books.py [--offline]
"""
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'scripts' / '.books-cache'
OUT = ROOT / 'src' / 'engine' / 'corpus' / 'books.ts'
API = 'https://es.wikisource.org/w/api.php'
UA = 'TypeLight-corpus/1.0 (personal typing app; github.com/seba-cascardo/TypeLight)'

BOOKS = [
    {
        'id': 'quiroga-selva',
        'title': 'Cuentos de la selva',
        'author': 'Horacio Quiroga',
        'year': '1918',
        'pages': [
            'La tortuga gigante',
            'Las medias de los flamencos',
            'El loro pelado',
            'La guerra de los yacarés',
            'La gama ciega',
            'Historia de dos cachorros de coatí y de dos cachorros de hombre',
            'El paso del Yabebirí',
            'La abeja haragana',
        ],
        # The scanned edition opens each story with a drawn capital (an image): its letter goes back here.
        'initials': {
            'La tortuga gigante': 'H', 'Las medias de los flamencos': 'C', 'El loro pelado': 'H', 'La guerra de los yacarés': 'E',
            'La gama ciega': 'H', 'Historia de dos cachorros de coatí y de dos cachorros de hombre': 'H', 'El paso del Yabebirí': 'E',
            'La abeja haragana': 'H',
        },
    },
    {
        'id': 'arlt-aguafuertes',
        'title': 'Aguafuertes porteñas',
        'author': 'Roberto Arlt',
        'year': '1928-1933',
        'index': 'Aguafuertes porteñas',
    },
]

# Only the tú forms voseo does not share: vos estás, vas, ves, das are Rioplatense too, and words like
# "ganas" or "tomas" are nouns. A text with any of these is left out.
TUTEO = set("""
tú ti contigo tuyo tuya tuyos tuyas eres tienes puedes sabes quieres haces dices vienes oyes sientes piensas crees
conoces necesitas debes entiendes recuerdas prefieres juegas duermes sigues vives trabajas hablas comes buscas
encuentras escuchas lees escribes abres empiezas terminas pierdes pareces mientes sueñas llevas miras
""".split())
WORD = re.compile(r'[a-záéíóúüñ]+')

OLD_ACCENTS = [
    (r'\bfué\b', 'fue'), (r'\bFué\b', 'Fue'), (r'\bfuí\b', 'fui'), (r'\bvió\b', 'vio'), (r'\bVió\b', 'Vio'),
    (r'\bdió\b', 'dio'), (r'\bDió\b', 'Dio'), (r'\bví\b', 'vi'), (r'\bdí\b', 'di'), (r'\bfuése\b', 'fuese'),
    (r'(?<=\s)á(?=\s)', 'a'), (r'(?<=\s)ó(?=\s)', 'o'), (r'(?<=\s)é(?=\s)', 'e'), (r'^Á(?=\s)', 'A'),
]
TYPOGRAPHIC = [('ę', 'e'), ('·', ''), ('“', '"'), ('”', '"'), ('„', '"'), ('«', '"'), ('»', '"'), ('‘', "'"), ('’', "'"), ('—', '-'), ('–', '-'), ('…', '...'), (' ', ' '), ('​', '')]


def fetch(title):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / (re.sub(r'[^\w]+', '_', title) + '.json')
    if f.exists():
        return json.loads(f.read_text(encoding='utf-8'))
    if '--offline' in sys.argv:
        raise SystemExit(f'not cached: {title}')
    q = urllib.parse.urlencode({'action': 'parse', 'page': title, 'prop': 'text', 'formatversion': 2, 'format': 'json', 'redirects': 1})
    req = urllib.request.Request(f'{API}?{q}', headers={'User-Agent': UA})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req) as r:
                data = json.loads(r.read().decode('utf-8'))
            break
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 5:
                raise
            # Rate limited: wait what the server asks (or a growing pause) and try again.
            time.sleep(int(e.headers.get('Retry-After') or 0) or 10 * (attempt + 1))
    f.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    time.sleep(2)
    return data


def index_titles(title):
    data = fetch(title)
    h = data['parse']['text']
    return [html.unescape(t) for t in re.findall(r'<li><a href="[^"]*" title="([^"]+)"', h)]


def paragraphs(page_html):
    h = re.sub(r'<style[\s\S]*?</style>', '', page_html)
    h = re.sub(r'<sup[^>]*class="[^"]*reference[^"]*"[\s\S]*?</sup>', '', h)
    h = re.sub(r'<span[^>]*class="[^"]*(pagenum|ws-noexport)[^"]*"[^>]*>[\s\S]*?</span>', '', h)
    out = []
    for p in re.findall(r'<p[^>]*>([\s\S]*?)</p>', h):
        t = html.unescape(re.sub(r'<[^>]+>', '', p))
        # OCR leftovers: a stray backtick after a word, underscores; `quoted' becomes 'quoted'.
        t = re.sub(r'(?<=\w)`(?=\s)', '', t).replace('`', "'").replace('_', '')
        for a, b in TYPOGRAPHIC:
            t = t.replace(a, b)
        t = re.sub(r'\s+', ' ', t).strip()
        for pat, rep in OLD_ACCENTS:
            t = re.sub(pat, rep, t)
        if len(t) < 3 or not re.search(r'[a-záéíóúñ]', t):
            continue
        out.append(t)
    return out


def split_long(p, limit=480):
    """Cut at sentence ends; a sentence still too long is cut at a semicolon or a comma."""
    if len(p) <= limit:
        return [p]
    parts = []
    for sentence in re.split(r'(?<=[.?!])\s+', p):
        parts += re.split(r'(?<=[;,])\s+', sentence) if len(sentence) > limit else [sentence]
    out, cur = [], ''
    for s in parts:
        if cur and len(cur) + 1 + len(s) > limit:
            out.append(cur)
            cur = s
        else:
            cur = f'{cur} {s}'.strip()
    if cur:
        out.append(cur)
    return out


def pages_of(paras, low=150, limit=480):
    pieces = [x for p in paras for x in split_long(p, limit)]
    out, cur = [], ''
    for x in pieces:
        # A page closes once it has enough text; a short one (a line of dialogue) takes the next piece along.
        if cur and (len(cur) >= low or len(cur) + 1 + len(x) > limit * 1.4):
            out.append(cur)
            cur = x
        else:
            cur = f'{cur} {x}'.strip()
    if cur:
        if out and len(cur) < 60:
            out[-1] = f'{out[-1]} {cur}'
        else:
            out.append(cur)
    return out


def tuteo(paras):
    return sum(1 for p in paras for w in WORD.findall(p.lower()) if w in TUTEO)


def main():
    books = []
    for b in BOOKS:
        titles = b.get('pages') or index_titles(b['index'])
        chapters, skipped = [], []
        for t in titles:
            try:
                data = fetch(t)
            except Exception as e:  # a missing page is reported, not fatal
                skipped.append(f'{t} ({e})')
                continue
            paras = paragraphs(data['parse']['text'])
            initial = b.get('initials', {}).get(t)
            if initial and paras and paras[0][:1].islower():
                paras[0] = initial + paras[0]
            # Arlt pages open with the column title; Quiroga's with nothing extra.
            if paras and paras[0].strip('. ').lower() == t.lower():
                paras = paras[1:]
            n = tuteo(paras)
            if n:
                skipped.append(f'{t} (tuteo: {n})')
                continue
            pages = pages_of(paras)
            if pages:
                chapters.append({'title': t, 'pages': pages})
        chars = sum(len(p) for c in chapters for p in c['pages'])
        print(f"{b['id']}: {len(chapters)} chapters, {sum(len(c['pages']) for c in chapters)} pages, {chars} chars")
        for s in skipped:
            print('  skipped:', s)
        books.append({k: b[k] for k in ('id', 'title', 'author', 'year')} | {
            'source': 'https://es.wikisource.org/wiki/' + urllib.parse.quote((b.get('index') or b['title']).replace(' ', '_')),
            'chapters': chapters,
        })
    body = json.dumps(books, ensure_ascii=False, indent=1)
    OUT.write_text(
        '// Generated by scripts/build-books.py from es.wikisource.org. Do not edit by hand.\n'
        '// Public domain: Horacio Quiroga (1878-1937), Roberto Arlt (1900-1942). Adapted: ASCII punctuation,\n'
        '// 1918 accents modernised (fué, vió, á...), texts with tú forms left out, paragraphs grouped into pages.\n'
        'export interface BookChapter {\n  title: string\n  pages: string[]\n}\n\n'
        'export interface Book {\n  id: string\n  title: string\n  author: string\n  year: string\n  source: string\n  chapters: BookChapter[]\n}\n\n'
        f'export const BOOKS: Book[] = {body}\n',
        encoding='utf-8', newline='\n',
    )
    print('wrote', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
