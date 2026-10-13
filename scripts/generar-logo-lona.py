#!/usr/bin/env python3
# Uso: python3 -I scripts/generar-logo-lona.py public/brand/BricolageGrotesque-latin-wght.woff2 public/brand/lona  (requiere fonttools y brotli)
"""Genera el logotipo de Lona (dirección B · Cuadrilátero) como SVG con las letras convertidas en trazados."""
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

fuente, salida = sys.argv[1], sys.argv[2]
f = TTFont(fuente)
f = instantiateVariableFont(f, {"wght": 800, "opsz": 96})
upm = f["head"].unitsPerEm
cmap = f.getBestCmap(); gs = f.getGlyphSet(); hmtx = f["hmtx"]
xh = f["OS/2"].sxHeight
S = 200.0  # tamaño de la letra en px
k = S / upm
track = -0.03 * S

def glifo(ch, x0, base):
    g = cmap[ord(ch)]
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x0, base)))
    return pen.getCommands(), hmtx[g][0] * k

def anillo(x, base, lado, tinta, fondo, postes):
    """El ring visto desde arriba: lona (cuadro), cuerda interior y cuatro postes. lado = lado visible de la lona."""
    u = lado / 72.0
    ox, oy = x - 14 * u, base - lado - 14 * u
    r = lambda v: round(v, 2)
    p = [f'<rect x="{r(ox+14*u)}" y="{r(oy+14*u)}" width="{r(72*u)}" height="{r(72*u)}" rx="{r(6*u)}" fill="{tinta}"/>',
         f'<rect x="{r(ox+24*u)}" y="{r(oy+24*u)}" width="{r(52*u)}" height="{r(52*u)}" rx="{r(3*u)}" fill="none" stroke="{fondo}" stroke-width="{r(4*u)}"/>']
    for (cx, cy), col in zip([(14, 14), (86, 14), (14, 86), (86, 86)], postes):
        p.append(f'<circle cx="{r(ox+cx*u)}" cy="{r(oy+cy*u)}" r="{r(9*u)}" fill="{col}"/>')
    return "".join(p)

def logo(letras, tinta, fondo, postes):
    base = 0.95 * S  # línea base
    x = 0.0; partes = []
    d, adv = glifo("l", x, base); partes.append(f'<path d="{d}" fill="{letras}"/>'); x += adv + track
    lado = xh * k * 0.92
    hueco = 9 * lado / 72 + 0.05 * S  # los postes sobresalen: el hueco evita que toquen la l y la n
    x += hueco
    partes.append(anillo(x, base, lado, tinta, fondo, postes)); x += lado + hueco
    for ch in "na":
        d, adv = glifo(ch, x, base); partes.append(f'<path d="{d}" fill="{letras}"/>'); x += adv + track
    ancho = x - track + 0.02 * S; alto = S * 1.05
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 0 {round(ancho+8,1)} {round(alto,1)}" role="img" aria-label="lona">' + "".join(partes) + "</svg>\n"

LIMA, NEGRO, VIOLETA, BLANCO = "#D4F67C", "#0A0A0C", "#BE33F5", "#FFFFFF"
open(f"{salida}/lona-logo.svg", "w").write(logo(BLANCO, LIMA, NEGRO, [VIOLETA, BLANCO, BLANCO, VIOLETA]))
open(f"{salida}/lona-logo-claro.svg", "w").write(logo(NEGRO, NEGRO, LIMA, [VIOLETA, NEGRO, NEGRO, VIOLETA]))
simbolo = lambda tinta, fondo, postes, extra="": (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Lona">{extra}'
  f'<rect x="14" y="14" width="72" height="72" rx="6" fill="{tinta}"/><rect x="24" y="24" width="52" height="52" rx="3" fill="none" stroke="{fondo}" stroke-width="4"/>'
  + "".join(f'<circle cx="{cx}" cy="{cy}" r="9" fill="{c}"/>' for (cx, cy), c in zip([(14, 14), (86, 14), (14, 86), (86, 86)], postes)) + "</svg>\n")
open(f"{salida}/lona-simbolo.svg", "w").write(simbolo(LIMA, NEGRO, [VIOLETA, BLANCO, BLANCO, VIOLETA]))
open(f"{salida}/lona-simbolo-claro.svg", "w").write(simbolo(NEGRO, LIMA, [VIOLETA, NEGRO, NEGRO, VIOLETA]))
# Icono de la app: fondo negro a sangre (las tiendas recortan las esquinas), símbolo al 64 % centrado.
icono = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Lona"><rect width="100" height="100" fill="#0A0A0C"/>'
  '<g transform="translate(18 18) scale(0.64)"><rect x="14" y="14" width="72" height="72" rx="6" fill="#D4F67C"/><rect x="24" y="24" width="52" height="52" rx="3" fill="none" stroke="#0A0A0C" stroke-width="4"/>'
  '<circle cx="14" cy="14" r="9" fill="#BE33F5"/><circle cx="86" cy="14" r="9" fill="#FFFFFF"/><circle cx="14" cy="86" r="9" fill="#FFFFFF"/><circle cx="86" cy="86" r="9" fill="#BE33F5"/></g></svg>\n')
open(f"{salida}/lona-icono.svg", "w").write(icono)
print("x-height", xh, "upm", upm)
