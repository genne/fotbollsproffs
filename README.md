# Fotbollsproffs

PWA som hjälper dig logga fotbollsträning på väg mot **10 000 timmar**.

- Starta / stoppa träningstimer med kategori + anteckning
- Uppskatta tidigare träningstid via frågeformulär (ålder, frekvens, raster, hemma…)
- Träningsplan per veckodag (ordinarie + extraträningar)
- ETA-datum till målet, dynamiskt uppdaterat från plan eller senaste 4 veckornas logg
- Installerbar PWA, funkar offline
- Lokal lagring (localStorage), export/import JSON

## Kom igång

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # bygg för produktion
npm run preview  # förhandsgranska byggda versionen
```

## Hosting

Automatisk deploy till Vercel via GitHub Actions (`.github/workflows/deploy.yml`).
Live på: https://fotbollsproffs.genne.app
