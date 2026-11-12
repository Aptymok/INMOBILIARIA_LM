# Fase 1 — criterios verificables

## Identidad y clasificación
- **Prospecto**: contacto comercial sin relación formalizada, con seguimiento simplificado.
- **Cliente nuevo**: relación formalizada en etapa de integración documental. No equivale a expediente completo.
- Un prospecto convertido conserva su identificador, documentos y bitácora.
- La conversión debe quedar registrada como evento de auditoría.
- Se advierte un posible duplicado por correo o teléfono antes de guardar; se requieren reglas robustas para concurrencia y homologación de teléfonos.

## Documentos
- Se recibe un original JPG/PNG/WebP/PDF de hasta 8 MiB.
- El backend verifica la firma inicial del archivo y calcula SHA-256.
- Se conserva el archivo original; no se sobrescribe.
- Se rechaza una copia exacta del archivo dentro del mismo expediente.
- OCR disponible únicamente para imágenes en el navegador. Revisar manualmente antes de almacenar texto.
- El PDF generado actualmente es **índice documental**, no expediente certificado.
- Pendiente: extracción estructurada, OCR sobre PDF, consolidación con originales y firma/constancia si aplica.

## Prueba de aceptación pendiente de ejecutar en entorno real
1. Crear prospecto con datos ficticios; comprobar persistencia.
2. Intentar registrar mismo correo o teléfono; esperar advertencia.
3. Convertir a cliente; comprobar mismo identificador y evento.
4. Subir documento ficticio compatible; descargar y comparar SHA-256.
5. Repetir mismo archivo; comprobar rechazo.
6. Extraer texto OCR de una imagen de prueba; corregir, confirmar y guardar.
7. Descargar índice PDF; comprobar que enumere archivos y declare no ser expediente certificado.
8. Reiniciar aplicación; verificar persistencia y bitácora.
9. Probar acceso no autenticado y límites de carga.
10. Compilar y revisar resultados de GitHub Actions.

## Gate de producción
No usar datos reales hasta establecer usuarios individuales, RBAC, protección contra abuso, consentimiento y retención, antimalware, copias recuperables, cifrado y valoración legal de documentos.
