# Reto 5 — edad de una ficha

No programé `edadDeLaPersona(ficha)`. La ficha propuesta solo contiene nombre, apellidos, provincia y disciplina: no hay fecha de nacimiento ni otro dato fiable desde el que se pueda deducir una edad. Inventarla, inferirla o buscarla fuera vulneraría la privacidad y daría un resultado falso.

Alternativa útil: si el fundador decide que es necesaria, recoger una fecha de nacimiento con propósito explícito, consentimiento y política de retención; mostrar solo la categoría o rango de edad que sea imprescindible para el producto. La función debería recibir una fecha validada, no intentar extraer edad de datos que no la contienen.
