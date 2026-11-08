# EcoPulse — Estrutura do Banco

Script de inicialização: `backend/src/db/init.sql` (montado no Postgres via Docker).

## Tabela `report_types`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | SERIAL | PK |
| `name` | VARCHAR(50) | Nome amigável |
| `code` | VARCHAR(30) | Unique — FK alvo |
| `description` | TEXT | Descrição |

### Seed padrão

- `FLOOD` — Enchente
- `FIRE` — Incêndio
- `EARTHQUAKE` — Terremoto
- `BLOCKED_ROAD` — Via Bloqueada
- `TREE_FALL` — Queda de Árvore

## Tabela `reports`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | UUID | PK (`gen_random_uuid` / app) |
| `report_type_code` | VARCHAR(30) | FK → `report_types.code` |
| `description` | TEXT | Opcional |
| `latitude` | DOUBLE PRECISION | Obrigatório |
| `longitude` | DOUBLE PRECISION | Obrigatório |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

## Relacionamento

```
report_types (1) ──< (N) reports
     code              report_type_code
```

## Consulta por raio

API usa fórmula de Haversine em SQL (raio padrão 5 km) filtrando por `lat`/`lon`/`radiusKm`.
