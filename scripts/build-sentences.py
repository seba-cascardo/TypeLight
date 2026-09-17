"""Builds src/engine/corpus/sentences.generated.ts from Tatoeba's Spanish sentences.

Inputs (download to scripts/, or pass paths):
  spa_sentences.tsv(.bz2) - https://downloads.tatoeba.org/exports/per_language/spa/spa_sentences.tsv.bz2 (CC BY 2.0 FR)
  dict.json               - words/an-array-of-spanish-words (accent-stripped dictionary, used as whitelist)
"""
import bz2, json, os, random, re, sys
from corpus_common import BLOCK, NAMES, STRIP, load_dictionary

here = os.path.dirname(os.path.abspath(__file__))
src_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, 'spa_sentences.tsv.bz2')
dict_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, 'dict.json')
out_path = os.path.join(here, '..', 'src', 'engine', 'corpus', 'sentences.generated.ts')

QUOTA, MIN_PLAIN, MIN_QUESTION = 1500, 400, 300
dictionary = load_dictionary(dict_path)

ALLOWED = re.compile(r"^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ ,.;:¿?¡!'\"()-]+$")
ACCENT = re.compile(r'[áéíóúü]')
QUESTION = re.compile(r'[¿?¡!]')
VOSOTROS = re.compile(r'\b(vosotros|vosotras|vuestr[oa]s?|os)\b|(áis|éis|abais|asteis|isteis|íais)\b')
CAPITAL = re.compile(r'[A-ZÁÉÍÓÚÜÑ]')
WORD = re.compile(r'[a-záéíóúüñ]+')

# Frequent tuteo (present-indicative tú) forms; a Rioplatense reader uses vos, not tú. Preterite/future/
# conditional/subjunctive forms are shared with voseo and stay allowed.
TUTEO = set("""
tú ti contigo tuyo tuya tuyos tuyas
eres estás tienes puedes sabes quieres haces vas dices vienes sales pones ves das oyes sientes piensas crees conoces
necesitas debes entiendes recuerdas prefieres juegas duermes sigues vives trabajas hablas comes tomas buscas encuentras
llevas esperas llamas miras escuchas lees escribes abres cierras empiezas terminas pierdes ganas pareces mientes sueñas
cantas bailas corres caminas compras pagas cocinas limpias manejas conduces estudias aprendes enseñas cuentas cuidas dejas
sacas subes bajas entras muestras cambias ayudas olvidas extrañas amas odias quedas andas vuelves traes caes ríes
gustas sabías podrías querías tenías estabas ibas hacías decías venías
""".split())

# Peninsular Spanish vocabulary/register: a Rioplatense reader doesn't say these. "vale" and "conducir" also
# exist in Rioplatense usage but are much rarer there; losing them from the pool is an accepted trade-off.
PENINSULAR = set("""
ordenador ordenadores peli pelis mola molan molaba guarro guarra guarros enhorabuena friegues friega vale coche
coches patata patatas zumo zumos móvil móviles piso pisos gafas tío tía tíos tías chaval chavala chavales curro
currar flipar flipo flipas guay follón majo maja majos majas conducir aparcar aparcamiento vosotros
""".split())


def ok(s):
    if not (40 <= len(s) <= 90) or not ALLOWED.match(s):
        return False
    if not s[0].isupper() or s[-1] not in '.?!':
        return False
    if s.count('¿') != s.count('?') or s.count('¡') != s.count('!'):
        return False
    for m in CAPITAL.finditer(s):
        i = m.start()
        if i == 0:
            continue
        before = s[:i].rstrip()
        if before and before[-1] in '¿¡.?!"':
            continue
        return False  # a capital mid-sentence: a proper noun
    words = WORD.findall(s.lower())
    if len(set(words)) < 4 or VOSOTROS.search(s.lower()):
        return False
    if any(w in TUTEO for w in words):
        return False
    if any(w in PENINSULAR for w in words):
        return False
    for w in words:
        if w in BLOCK or w in NAMES or w.translate(STRIP) not in dictionary:
            return False
    return True


opener = bz2.open if src_path.endswith('.bz2') else open
seen, plain, accented = set(), [], []
with opener(src_path, 'rt', encoding='utf8') as f:
    for line in f:
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 3 or parts[1] != 'spa':
            continue
        s = re.sub(r'\s+', ' ', parts[2]).strip()
        if not ok(s):
            continue
        key = re.sub(r'[^a-záéíóúüñ ]', '', s.lower())
        if key in seen:
            continue
        seen.add(key)
        (accented if ACCENT.search(s) else plain).append(s)

rng = random.Random(20260917)
rng.shuffle(plain)
rng.shuffle(accented)
chosen = []
taken = set()


def take(bucket, n, pred=lambda s: True):
    for s in bucket:
        if len(chosen) >= QUOTA or n <= 0:
            return
        if s in taken or not pred(s):
            continue
        chosen.append(s)
        taken.add(s)
        n -= 1


take(plain, MIN_PLAIN)
take(plain + accented, MIN_QUESTION, lambda s: bool(QUESTION.search(s)))
take(accented + plain, QUOTA - len(chosen))
chosen.sort(key=lambda s: s.lower())

src = (
    "// Frases del español tomadas de Tatoeba (https://tatoeba.org, CC BY 2.0 FR), filtradas por scripts/build-sentences.py:\n"
    "// sin nombres propios, sin formas de vosotros, todas las palabras en diccionario, sin vulgaridades. No editar a mano.\n"
    "export const GENERATED_SENTENCES: string[] = [\n" + ''.join(f"  {json.dumps(s, ensure_ascii=False)},\n" for s in chosen) + "]\n"
)
with open(out_path, 'w', encoding='utf8', newline='\n') as f:
    f.write(src)
print(len(chosen), 'sentences;', sum(1 for s in chosen if not ACCENT.search(s)), 'without accents;',
      sum(1 for s in chosen if QUESTION.search(s)), 'questions/exclamations ->', os.path.normpath(out_path))
