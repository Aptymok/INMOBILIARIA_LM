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


## Segunda iteración (en código; validación pendiente)

- Detección preventiva de posibles contactos duplicados por correo o teléfono; todavía no es un bloqueo transaccional garantizado bajo concurrencia.
- Rechazo de documentos idénticos dentro del mismo contacto y comprobación de firmas de archivo JPG/PNG/WebP/PDF.
- Borrador descargable del expediente consolidado: índice con SHA-256 y anexos PDF/JPG/PNG. Los WebP y PDF incompatibles se omiten y se declara el total omitido. No equivale a certificación legal.
- GitHub Actions: verificación TypeScript y compilación Next.js en cada push o PR. La ejecución real de estas verificaciones sigue pendiente de confirmar.
- Criterios de aceptación en `docs/FASE_1_CRITERIOS.md`.

**Repositorio público para revisión de Luis**: no subir documentos personales reales, credenciales ni archivos de clientes. La instancia sigue sin base de datos ni despliegue configurados.

## Prueba automatizada con datos ficticios

El flujo de GitHub Actions en `.github/workflows/quality.yml` instala dependencias,
verifica TypeScript, intenta compilar Next.js, levanta PostgreSQL de prueba, aplica
la estructura de datos y ejecuta `scripts/smoke.mjs`.

La prueba comprueba:
- creación de un prospecto ficticio;
- conversión al estado de cliente sin cambiar su ID;
- incorporación y lectura de bytes documentales y su SHA-256;
- registro de eventos de auditoría;
- reversión de los datos simulados al finalizar.

**La presencia del flujo no acredita una ejecución exitosa.** Se debe comprobar el
resultado real en la pestaña Actions de GitHub. No hay aún una prueba extremo a
extremo del navegador, del OCR, de la conversión real de PDFs o del servicio desplegado.

Esta fase no está lista para gestionar documentos de clientes reales. La protección
de acceso actual es inicial y no sustituye permisos individuales ni controles de
seguridad de producción.
