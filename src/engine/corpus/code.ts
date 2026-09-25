/**
 * Lines of code to type in the optional "Símbolos de código" unit. Written by hand for TypeLight (not copied
 * from any project): ASCII only, one space between tokens, no indentation. Identifiers mix Spanish and English,
 * like real code in Argentina. A line enters an exercise only if every character is typeable with the pool.
 */
export type CodeLang = 'js' | 'py' | 'sh' | 'sql' | 'web'

export interface CodeLine {
  lang: CodeLang
  text: string
}

const js = [
  'const total = items.reduce((a, b) => a + b, 0);',
  'if (edad >= 18 && !bloqueado) { return true; }',
  'for (let i = 0; i < lista.length; i++) {',
  'const { nombre, email } = usuario;',
  'export default function App() { return null; }',
  'const data = await fetch(url).then((r) => r.json());',
  'items.filter((x) => x.activo).map((x) => x.id);',
  'let saldo = cuenta?.saldo ?? 0;',
  'const precios = [120, 45, 300, 99];',
  'throw new Error(`Falta el campo ${campo}`);',
  'const doble = (n: number): number => n * 2;',
  'type Punto = { x: number; y: number };',
  'import { useState } from "react";',
  'obj["clave"] = valor || "sin dato";',
  'while (pila.length > 0) pila.pop();',
  'const par = n % 2 === 0 ? "par" : "impar";',
  'console.log(`Hola, ${nombre}!`);',
  'setCount((c) => c + 1);',
  'interface Tarea { id: string; hecha: boolean }',
  'const mask = (flags & 0xff) | 0x100;',
  'x ^= y; y ^= x; x ^= y;',
  'return a.length !== b.length;',
  'const [primero, ...resto] = args;',
  'document.querySelector("#app")?.remove();',
  'matriz[i][j] = matriz[j][i];',
  'const ids = new Set<string>(["a", "b"]);',
  'if (!res.ok) throw new Error(res.statusText);',
  'export const suma = (a: number, b: number) => a + b;',
]

const py = [
  'def area(radio): return 3.14 * radio ** 2',
  'for i in range(10): print(i)',
  'if x > 0 and not vacio: total += x',
  'precios = {"pan": 900, "leche": 1200}',
  'nombres = [p.nombre for p in personas if p.activo]',
  'with open("datos.csv") as f: lineas = f.readlines()',
  'class Cuenta: saldo = 0',
  'print(f"Total: {total:.2f}")',
  'import numpy as np',
  'return sorted(items, key=lambda x: x[1])',
  'assert len(lista) == 3, "faltan datos"',
  'n = n // 2 if n % 2 == 0 else 3 * n + 1',
  'valores[-1] = valores[0] + 1',
  'except KeyError as e: print(e)',
  'ruta = "C:\\\\datos\\\\2026"',
  'edades = {k: v for k, v in pares if v >= 18}',
  'def saludo(nombre="mundo"): return f"hola {nombre}"',
]

const sh = [
  'git commit -m "fix: typo en el login"',
  'git log --oneline -5',
  'ls -la | grep ".ts"',
  'cd ~/proyectos && npm install',
  'echo $HOME > ruta.txt',
  'cat notas.md | wc -l',
  'export PATH=$PATH:/usr/local/bin',
  'find . -name "*.log" -delete',
  'docker run -p 8080:80 nginx',
  'curl -s https://api.ejemplo.com/v1/items | jq ".[0]"',
  'chmod +x deploy.sh && ./deploy.sh',
  'git checkout -b fix/login',
  'npm run build 2>&1 | tail -5',
  'ssh ana@192.168.0.10',
  'git push origin main --tags',
]

const sql = [
  'SELECT nombre, edad FROM clientes WHERE edad > 30;',
  'INSERT INTO pedidos (id, total) VALUES (7, 1500);',
  'UPDATE productos SET precio = precio * 1.1 WHERE stock < 10;',
  'DELETE FROM sesiones WHERE creada < NOW() - INTERVAL 7 DAY;',
  'SELECT COUNT(*) FROM ventas GROUP BY mes;',
  'SELECT * FROM usuarios u JOIN roles r ON u.rol_id = r.id;',
  'CREATE INDEX idx_email ON usuarios (email);',
  'SELECT * FROM clientes WHERE nombre LIKE "%ana%";',
  'SELECT ciudad FROM envios WHERE ciudad <> "Rosario";',
]

const web = [
  '<div class="tarjeta">{titulo}</div>',
  '<a href="/ayuda" target="_blank">Ayuda</a>',
  '<input type="email" required />',
  'body { margin: 0; font-family: sans-serif; }',
  '.boton:hover { color: #3fae5a; }',
  '@media (max-width: 600px) { .menu { display: none; } }',
  '{"nombre": "Ana", "activo": true, "edad": 38}',
  '<img src="logo.png" alt="Logo" />',
  'grid-template-columns: repeat(3, 1fr);',
  '<button onClick={() => guardar(id)}>Guardar</button>',
  ':root { --verde: #3fae5a; }',
  '<ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>',
  'a[href^="https"] { text-decoration: none; }',
  '.nav > li ~ li { margin-left: 8px; }',
]

export const CODE: readonly CodeLine[] = [
  ...js.map((text) => ({ lang: 'js' as const, text })),
  ...py.map((text) => ({ lang: 'py' as const, text })),
  ...sh.map((text) => ({ lang: 'sh' as const, text })),
  ...sql.map((text) => ({ lang: 'sql' as const, text })),
  ...web.map((text) => ({ lang: 'web' as const, text })),
]
