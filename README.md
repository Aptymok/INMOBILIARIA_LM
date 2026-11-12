# INMOBILIARIA LM

Plataforma inmobiliaria independiente; posible colaboración futura con SFI sin compartir datos por defecto.

## Primera entrega (Fase 1)

- Registro manual y directorio de **clientes posibles** y **clientes nuevos**.
- Conversión prospecto → cliente sin duplicación ni pérdida de historial.
- Almacenamiento de documentos originales (JPG/PNG/WebP/PDF, máximo 8 MB) en PostgreSQL.
- OCR de **imágenes** realizado en el navegador con Tesseract.js; revisión humana antes de registrar texto.
- Registro SHA-256 de integridad, bitácora básica y descarga del documento original.
- Generación de **índice documental PDF** (no es aún el expediente consolidado).
- Protección inicial mediante HTTP Basic Auth. **Solo sobre HTTPS**.

## Ejecutar localmente

Requisitos: Node.js 20+, PostgreSQL 15+.

1. Copiar `.env.example` a `.env.local` y definir credenciales seguras y `DATABASE_URL`.
2. `npm install`
3. `DATABASE_URL=... npm run db` (o cargar las variables de entorno en la terminal).
4. `npm run dev`
5. Abrir http://localhost:3000 y autenticar con `ADMIN_USER` / `ADMIN_PASSWORD`.

Para el script de migración, `.env.local` no se carga automáticamente: exporta `DATABASE_URL` antes de ejecutarlo.

## Seguridad y alcance

**Prototipo técnico, no apto aún para datos personales reales ni producción.** Antes de operar: incorporar autenticación individual y roles, cifrado/gestión de secretos, políticas de consentimiento y retención, copias de seguridad verificadas, controles de duplicados, antivirus de cargas, auditoría completa y revisión legal aplicable.

No se ha configurado ningún despliegue, base de datos ni integración con SFI. El OCR opera solo con imágenes; los PDF se almacenan, pero aún no se procesan para extracción. El índice PDF **no sustituye** el expediente final con evidencia ni documentos legalmente válidos.

## Siguientes entregas

1. Autenticación individual/RBAC y control por expediente.
2. Extracción estructurada revisada, PDF escaneado y detección de duplicados.
3. Expediente de cierre con originales, índice y versiones.
4. CRM, operaciones, tareas y autorizaciones.
5. Trámites, finanzas e indicadores.

