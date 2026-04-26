# Setup inicial - Finanzas Admin

Este documento define la estructura minima para activar el modulo de finanzas en `/admin`.

## 1) Variables de entorno (web)

Agregar en `.env.local`:

```env
NEXT_PUBLIC_APPWRITE_DATABASE_ID=development
NEXT_PUBLIC_APPWRITE_FINANCE_COLLECTION_ID=finance_snapshots
```

## 2) Coleccion sugerida en Appwrite

Database: el mismo usado por la app (ej. `development`).

Collection ID sugerido: `finance_snapshots`.

Permisos recomendados de la coleccion:
- `read`: `team:69ed68fd001dcdbeaee6`
- `create`: `team:69ed68fd001dcdbeaee6`
- `update`: `team:69ed68fd001dcdbeaee6`
- `delete`: `team:69ed68fd001dcdbeaee6`

## 3) Atributos de la coleccion

- `period` (string, requerido) formato `YYYY-MM`
- `basePlanUsd` (double, requerido)
- `variableCostUsd` (double, requerido)
- `creditsUsd` (double, requerido)
- `totalCostUsd` (double, requerido)
- `fxRateCopUsd` (double, requerido)
- `notes` (string, opcional, max 1000)
- `createdBy` (string, opcional, max 100)

## 4) KPI iniciales calculados en web

- Usuarios Pro activos: total de miembros del team `Premium` (`69d0674b0024ad1068c4`)
- Ingreso mensual estimado: `usuarios_pro * 9.99`
- Costo mensual Appwrite: `totalCostUsd` del ultimo snapshot
- Margen mensual estimado: `ingreso - costo`

## 5) Moneda

- Visualizacion por defecto en COP
- Boton para convertir a USD
- Conversion usando `fxRateCopUsd` del ultimo snapshot
