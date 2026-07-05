# Guía de Ingesta: Citas Bíblicas

Esta carpeta contiene la plantilla `citas_biblicas_template.csv` diseñada para importar preguntas del nuevo modo de juego / categoría "Citas Bíblicas" directamente a Supabase.

## Formato de la Plantilla

La tabla en Supabase requiere columnas específicas. Al usar Excel o Google Sheets, asegúrate de mantener los siguientes encabezados:

1. **category**: Siempre debe ser `Citas Bíblicas`.
2. **points**: El valor de la pregunta (Ej: `100`, `200`, `300`, `400`, `500`).
3. **question**: El texto del pasaje bíblico que los jugadores leerán (Ej: *"En el principio creó Dios los cielos y la tierra"*).
4. **answer**: La cita bíblica correcta (Ej: *"Génesis 1:1"*).
5. **options**: Las 4 opciones múltiples que aparecerán en pantalla. En formato CSV para Postgres (Supabase), esto debe ir encerrado en llaves `{}` y cada opción entre comillas dobles separadas por comas. 
   - *Ejemplo:* `{"Génesis 1:1", "Juan 1:1", "Salmos 23:1", "Apocalipsis 1:1"}`
6. **reference**: (Opcional) Contexto o información extra para el pasaje (Ej: *"Palabras de Jesús"*).

## Instrucciones de Subida a Supabase

1. Abre el archivo `citas_biblicas_template.csv` en Excel o Google Sheets.
2. Agrega todas las preguntas nuevas respetando el formato, especialmente la columna de **options**.
3. Exporta o Guarda el archivo como `.csv` (Valores separados por comas).
4. Dirígete a tu panel de **Supabase**.
5. Ve al **Table Editor** y selecciona la tabla `questions`.
6. Haz clic en **Insert** > **Import data from CSV**.
7. Selecciona el archivo exportado y asegúrate de que las columnas mapeen correctamente.
8. ¡Listo! Las nuevas preguntas estarán disponibles automáticamente en Tribiblia.
