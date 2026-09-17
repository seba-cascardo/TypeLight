"""Builds src/engine/corpus/ngrams.ts: the most frequent bigrams and trigrams inside Spanish words,
weighted by the rank of the words in words.ts (same 1/sqrt(rank+20) weight wordsText uses)."""
import math, os, re
from collections import Counter

here = os.path.dirname(os.path.abspath(__file__))
words_path = os.path.join(here, '..', 'src', 'engine', 'corpus', 'words.ts')
out_path = os.path.join(here, '..', 'src', 'engine', 'corpus', 'ngrams.ts')

words = re.search(r"'([^']+)'", open(words_path, encoding='utf8').read()).group(1).split(' ')
bi, tri = Counter(), Counter()
for i, w in enumerate(words):
    weight = 1 / math.sqrt(i + 20)
    for j in range(len(w) - 1):
        bi[w[j:j + 2]] += weight
    for j in range(len(w) - 2):
        tri[w[j:j + 3]] += weight


def table(counter, n):
    top = counter.most_common(n)
    mx = top[0][1]
    return ',\n'.join(f"  ['{g}', {max(1, round(v / mx * 1000))}]" for g, v in top)


src = (
    "// N-gramas más frecuentes dentro de palabra, peso relativo 1..1000 (por rango de frecuencia en words.ts).\n"
    "// Generado por scripts/build-ngrams.py — no editar a mano.\n"
    f"export const BIGRAMS: [string, number][] = [\n{table(bi, 150)},\n]\n\n"
    f"export const TRIGRAMS: [string, number][] = [\n{table(tri, 100)},\n]\n"
)
with open(out_path, 'w', encoding='utf8', newline='\n') as f:
    f.write(src)
print(len(bi), 'bigrams,', len(tri), 'trigrams counted ->', os.path.normpath(out_path))
