"""Builds src/engine/corpus/words.ts.

Inputs (download to the same directory as this script or pass paths):
  es_50k.txt  - hermitdave/FrequencyWords es (OpenSubtitles 2018), "word freq" per line
  dict.json   - words/an-array-of-spanish-words (accent-stripped dictionary, used as whitelist)
"""
import json, re, sys, os

here = os.path.dirname(os.path.abspath(__file__))
freq_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, 'es_50k.txt')
dict_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, 'dict.json')
out_path = os.path.join(here, '..', 'src', 'engine', 'corpus', 'words.ts')

STRIP = str.maketrans('áéíóúü', 'aeiouu')
dictionary = set(json.load(open(dict_path, encoding='utf8')))

BLOCK = set("""
ha oh oye eh ah hey ok uh the you and sr sra srta dr tv ja jaja jajaja hmm mm yeah ee uu ii iii ugh wow cd jet queen mr mrs miss
mataron matar mató matarte matarlo matarme matarla maten mata mate matas matan matando matado matarnos matarán matará matarían mátalo mátame matamos matáis matad matarán
muerto muerta muertos muertas muerte muere murió morir morirá muriendo morirás moriré moriremos mueran muera mueras muertes
asesino asesina asesinos asesinato asesinar asesinado asesinada asesinó asesinatos
verga mierda joder jodido jodida jódete coño puta puto putas putos carajo cabrón cabrona cabrones pendejo pendeja pendejos culo culos tetas polla pollas cojones coger cogió cogido follar follando
maldito maldita malditos malditas maldición diablos demonios infierno idiota idiotas imbécil imbéciles estúpido estúpida estúpidos estúpidas gilipollas zorra perra perras bastardo bastardos basura maricón marica
masacre sangre sangriento disparar disparó disparo disparos dispara pistola pistolas arma armas bala balas cuchillo cuchillos violación violar violó droga drogas cocaína heroína cadáver cadáveres suicidio suicidarse
sexy sexo sexual desnuda desnudo desnudos desnudas nazi nazis gordo gorda gordos gordas
crimen crímenes criminal criminales terrorista terroristas terrorismo bomba bombas secuestro secuestrado rehén rehenes tortura torturar cárcel prisión trasero
james ben john jack sam tom harry mike michael frank charlie max nick george peter paul david chris joe bob bill jim jason alex mary jane sarah anna emma lisa laura ryan kate lady mister
prostituta prostitutas prostitución golpear golpeó golpes espada espadas violencia violento gay puta
sois vosotros vosotras vuestro vuestra vuestros vuestras os
""".split())

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
