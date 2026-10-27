# Project Brief: Nexova

## Negocio y problema

Nexova Solutions es una consultora B2B de recursos humanos y adquisicion de talento fundada en 2011. Opera desde Valencia y Miami, con 120 empleados y aproximadamente USD 8 millones de ingresos anuales. Sus clientes son empresas medianas de tecnologia, retail y servicios financieros. Sus tres lineas son headhunting ejecutivo y de mandos medios, outsourcing de soporte y formacion corporativa. Fuente: [BRIEFING.md](../BRIEFING.md), introduccion.

El problema transversal es la operacion manual y desconectada: seleccion sin seguimiento en tiempo real, catalogo de formacion en PDF, soporte sin knowledge base, CRM con uso inconsistente y reportes ejecutivos semanales atrasados. El objetivo del equipo de AI Engineering es reducir trabajo manual y aumentar velocidad, escala y visibilidad. Fuente: [BRIEFING.md](../BRIEFING.md), "Where the company stands today" y departamentos.

## Objetivos y hoja de ruta de negocio

El briefing no fija fechas ni orden de implementacion. Esta lista agrupa necesidades, no compromisos de entrega:

| Area | Necesidad y objetivo | Fuente |
| --- | --- | --- |
| Marketing | Website accesible, SEO/GEO, schema.org, pipeline de contenido asistido y conversiones medibles | [BRIEFING.md](../BRIEFING.md), Marketing |
| Ventas | Dashboard de pipeline, secuencias de prospeccion, alertas y propuestas personalizadas | [BRIEFING.md](../BRIEFING.md), Sales |
| HR interno | Portal, onboarding progresivo, KPIs y agente de politicas/beneficios | [BRIEFING.md](../BRIEFING.md), Human Resources |
| Seleccion | Scoring/ranking de CVs, matching, RAG de candidatos, portal y comunicaciones automaticas | [BRIEFING.md](../BRIEFING.md), Talent Selection |
| Formacion | Catalogo buscable, inscripcion online, recomendaciones, seguimiento y chatbot asesor | [BRIEFING.md](../BRIEFING.md), Corporate Training |
| Soporte | RAG de primera linea con objetivo del 40% de consultas sin intervencion humana, knowledge base, dashboard y sentiment analysis | [BRIEFING.md](../BRIEFING.md), Customer Support |
| Tecnologia | Telemetry/logging centralizados, pipeline de datos, monitoring/alertas y agente de documentacion | [BRIEFING.md](../BRIEFING.md), Technology |
| Direccion | KPIs unificados en tiempo real, reporte semanal automatico, alertas y asistente en lenguaje natural | [BRIEFING.md](../BRIEFING.md), Executive Direction |

## Restricciones y alcance

- Soporte: tiempo medio actual de 48 horas frente a SLA comprometido de 24 horas. El 40% del chatbot es objetivo, no resultado obtenido. Fuente: [BRIEFING.md](../BRIEFING.md), Customer Support.
- Direccion recibe informacion con una semana de atraso; preparar el PDF consume entre 4 y 8 horas por responsable. Fuente: [BRIEFING.md](../BRIEFING.md), Executive Direction.
- El formulario publico es para profesionales, no para empresas compradoras. Debe ser responsive, accesible, con Tailwind, validaciones y SEO; multiidioma es opcional. Fuente complementaria: [Context2.md](../Context2.md).
- El Hito 2 delimita utilidades TypeScript bien tipadas de modelado, filtrado, scoring, ranking, reporting y validacion, sin IA ni prompting. Fuente complementaria: [Contex3](../Contex3).
- El briefing menciona Megan Clarke en la organizacion comercial y Marcos Ibanez en la seccion Sales. No resolver esa discrepancia por suposicion: preguntar si afecta una tarea. Fuente: [BRIEFING.md](../BRIEFING.md), ambas secciones.
- No se deducen proveedores de IA, presupuesto tecnico, fechas ni arquitectura desplegada de estas necesidades. El estado implementado se registra aparte en [techContext.md](techContext.md) y [progress.md](progress.md).

## Fuente

Fuente principal: [BRIEFING.md](../BRIEFING.md), copia literal de [CONTEXT.md](../CONTEXT.md), conservado sin cambios. Comprobacion: `cmp CONTEXT.md BRIEFING.md` desde la raiz.

Fuentes complementarias de negocio: [Context2.md](../Context2.md) para el Hito 1 y [Contex3](../Contex3) para el Hito 2. No sustituyen al briefing ni prueban que una funcionalidad este implementada.