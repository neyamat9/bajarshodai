# Fonts

All primary fonts in Bazar Shodai are self-hosted in `frontend/app/fonts/` as variable WOFF2 fonts:
- `Inter-variable.woff2` (Latin variable font)
- `Outfit-variable.woff2` (Headings variable font)
- `NotoSansBengali-variable.woff2` (Bengali variable weight 400-800, by the Noto Project under SIL OFL 1.1)

Self-hosting completely removes runtime Google Font CDN fetches during Turbopack and Vercel production builds, preventing `[next]/internal/font/google module-not-found` errors and eliminating third-party DNS latency for users.
