# StationBike NFC

API que simula el sistema de las estaciones de StationBike: recibe las lecturas de la tarjeta NFC y las envía al backend principal. No tiene base de datos ni reglas de negocio.

## Cómo correrla
1. `npm install`
2. Copiar `.env.example` a `.env` y completar `CLAVE_INTERNA` (la misma del backend).
3. `npm run dev`
4. Abrir `http://localhost:4100/health`.

Requiere Node 20.6 o superior y el backend principal en marcha.