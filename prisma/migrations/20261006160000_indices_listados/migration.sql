-- Aditiva (T-006). Búsqueda de peleadores por nombre sin tildes: de 258 ms a menos de 5 ms con 100 000 fichas.
-- Requiere la extensión pg_trgm (incluida en PostgreSQL; en un proveedor gestionado hay que comprobar que la permite: ver docs/rendimiento/).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Por qué: `searchIds("fighter", …)` busca cada palabra con LIKE '%palabra%' sobre el nombre completo normalizado; sin este índice recorre toda la tabla.
-- La expresión debe coincidir carácter a carácter con la de src/lib/common/search.ts.
CREATE INDEX "Fighter_nombre_trgm_idx" ON "Fighter" USING gin (
  (translate(lower(coalesce("firstName", '') || ' ' || coalesce("lastName", '') || ' ' || coalesce("alias", '')), 'áàäâãåéèëêíìïîóòöôõúùüûñç', 'aaaaaaeeeeiiiiooooouuuunc')) gin_trgm_ops
);
