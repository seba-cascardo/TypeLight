import json

STRIP = str.maketrans('áéíóúü', 'aeiouu')

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
cagar cago cagó cagás cagada cagado cagan asesinaron asesinaste asesinamos asesinan guerra guerras
""".split())

# First names that survive the dictionary check or start a sentence capitalised.
NAMES = set("""
tom mary maría maria juan pedro ana josé jose luis carlos jorge marta laura elena pablo miguel lucía lucia sofía sofia diego
pepe paco manolo ken taro yumi bob john jack alicia beatriz carmen claudia cristina daniel david eduardo emilio enrique
fernando francisco gabriel gonzalo guillermo ignacio isabel javier jesús jesus joaquín joaquin julia julio lola lorenzo
manuel marcos mario mercedes nicolás nicolas pilar rafael ramón ramon raúl raul roberto rosa sara sergio susana teresa
tomás tomas vicente víctor victor alejandro andrés andres antonio ángel angel alberto
""".split())


def load_dictionary(path):
    return set(json.load(open(path, encoding='utf8')))
