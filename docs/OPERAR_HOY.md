# INMOBILIARIA LM — Puente operativo local (19 noviembre 2026)

## Decisión de costo y ejecución

**Ruta inmediata**: aplicación Next.js existente + PostgreSQL 16 local. No se exige suscripción a SaaS, dominio adicional, servicio de IA ni pago por usuario. El software del repositorio no impone cuota mensual; **no se contabilizan** equipo, electricidad, conectividad, mantenimiento, respaldo ni operación humana. Una publicación pública con datos personales no está autorizada por el estado actual de seguridad.

**Capacidades**: directorio y conversión de contactos; carga documental y revisión OCR para imágenes; registro de propiedades con código único y estados; programación y cierre de seguimientos; vinculación de interesados y propiedades; auditoría básica e índice/borrador documental.

## Arranque en una computadora, solo pruebas con datos ficticios

Requisitos: Docker con Docker Compose, Node.js 22 y npm. En carpeta del repositorio:

1. Ejecutar `docker compose up -d` (PostgreSQL disponible solo desde la propia computadora en 127.0.0.1:5432).
2. Crear `.env.local` con:
   ```ini
   DATABASE_URL=postgresql://lm_local:local_demo_change_before_real_use@127.0.0.1:5432/inmobiliaria_lm
   ADMIN_USER=admin
   ADMIN_PASSWORD=REEMPLAZAR_CON_CLAVE_LARGA_Y_UNICA
   ```
3. Ejecutar `npm install`.
4. Ejecutar `npm run db` (aplica migraciones incrementales 001 y 002).
5. Ejecutar `npm run dev`.
6. Abrir `http://localhost:3000`. Entrar al directorio; en **Operaciones** crear una propiedad ficticia, programar una gestión y vincular un contacto ficticio.
7. Para detener la aplicación: Ctrl+C; detener PostgreSQL con `docker compose stop`. Los datos de ensayo persisten en el volumen Docker. **No ejecutar `docker compose down -v` si se requiere conservarlos.**

Las credenciales de la base del archivo compose son exclusivamente para la demostración LOCAL y **no son seguras para redes o datos reales**. Usar una contraseña propia de acceso a la aplicación. No subir `.env.local` al repositorio. **No publicar el puerto 3000 en una red accesible ni compartir la base de datos**.

## Ensayo de aceptación (ficticio)

1. Alta de un prospecto e identificación única.
2. Alta de una propiedad con código `LM-DEMO-001`.
3. Asociar prospecto y propiedad.
4. Programar llamada con fecha y hora; comprobar el tablero.
5. Marcar llamada realizada y verificar que deja de estar pendiente.
6. Apartar la propiedad y comprobar la actualización.
7. Registrar un documento ficticio y revisar la bitácora del contacto.
8. Reiniciar la aplicación y verificar que persisten contactos, propiedad y seguimiento.

## Evolución frente a lo que requiere el negocio

| Necesidad | Estado actual | Pendiente / condición de salida |
|---|---|---|
| Contactos y expedientes | Código disponible; probado parcialmente en CI | Autenticación individual, permisos por expediente, revisión legal |
| Inventario de propiedades | Código nuevo | Validar casos reales sin información sensible |
| Seguimiento comercial | Código nuevo | Recordatorios y asignaciones por usuario, prueba navegador |
| Relación interesado–propiedad | Código nuevo | Filtros de compatibilidad y ciclo de negociación |
| Operación inmobiliaria completa | No observada | Contratos, comisiones, cierre, conciliación, autorización |
| Publicación en internet | No configurada | TLS, RBAC, protección antiabuso, controles de documentos, restauración de backup |
| Datos personales reales | Bloqueado | Consentimiento/aviso privacidad, retención, cifrado, antimalware, controles y respaldo |

## Costos y decisiones

- **Local**: cero cuotas de SaaS impuestas por este diseño; recursos del equipo y mantenimiento no son gratis.
- **Nube**: costo desconocido hasta elegir infraestructura, volumen de archivos, respaldos y usuarios; no activar proveedores sin aprobación de gasto.
- **No añadir** CRM externo, motores de IA de pago ni nuevas bases de datos: duplicarían capacidades o introducirían gastos antes de demostrar necesidad.
- **Siguiente gate de seguridad**: usuarios individuales, roles por contacto/expediente, respaldos probados y política de datos. La contraseña HTTP compartida es solo una barrera inicial.
- **Medición del valor**: verificar que un usuario puede ir de prospecto → interés en propiedad → gestión programada → cierre de gestión en una sola sesión, con persistencia y sin duplicaciones.
