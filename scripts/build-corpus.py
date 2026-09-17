"""Builds src/engine/corpus/words.ts.

Inputs (download to the same directory as this script or pass paths):
  es_50k.txt  - hermitdave/FrequencyWords es (OpenSubtitles 2018), "word freq" per line
  dict.json   - words/an-array-of-spanish-words (accent-stripped dictionary, used as whitelist)
"""
import re, sys, os
from corpus_common import BLOCK, STRIP, load_dictionary

here = os.path.dirname(os.path.abspath(__file__))
freq_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, 'es_50k.txt')
dict_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, 'dict.json')
out_path = os.path.join(here, '..', 'src', 'engine', 'corpus', 'words.ts')

dictionary = load_dictionary(dict_path)

words = []
for line in open(freq_path, encoding='utf8'):
    w, _ = line.split()
    if not re.fullmatch(r'[a-záéíóúüñ]+', w) or len(w) < 2 or w in BLOCK:
        continue
    if not re.search(r'[aeiouáéíóúü]', w):
        continue
    if re.search(r'(áis|éis)$', w):  # formas de vosotros
        continue
    if w.translate(STRIP) not in dictionary:
        continue
    words.append(w)
    if len(words) >= 6000:
        break

src = (
    "// Palabras del español ordenadas por frecuencia (OpenSubtitles 2018 vía hermitdave/FrequencyWords, CC-BY-SA 4.0),\n"
    "// filtradas contra un diccionario (words/an-array-of-spanish-words) y sin vulgaridades ni violencia.\n"
    "// Generado por scripts/build-corpus.py — no editar a mano.\n"
    "export const WORDS: string[] = (\n  '" + ' '.join(words) + "'\n).split(' ')\n\n"
    "/** Palabras de una letra, útiles cuando hay pocas teclas aprendidas. */\n"
    "export const ONE_LETTER: string[] = ['a', 'y', 'o', 'e', 'u']\n"
)
with open(out_path, 'w', encoding='utf8', newline='\n') as f:
    f.write(src)
print(len(words), 'words ->', os.path.normpath(out_path))
