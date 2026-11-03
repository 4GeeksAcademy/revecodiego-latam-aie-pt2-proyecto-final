# Propuesta de arquitectura backend de Nexova

Borrador para el CTO · Hito de arquitectura de 4Geeks.
Este documento propone decisiones; no implementa ni autoriza cambios de contrato, dependencias o despliegue.

## 1. Resumen ejecutivo

Se propone una arquitectura en capas dentro de la API FastAPI existente, organizada por dominio.
Un único backend modular evita multiplicar despliegues para el equipo tecnológico de seis personas.
Routers delgados, services y repositories separan HTTP, reglas de negocio y almacenamiento/integraciones.
Selección, formación, soporte, ventas y RR.HH. podrán evolucionar sin compartir tablas ni reglas accidentalmente.
La API REST versionada y OpenAPI serán el acuerdo con frontends independientes dentro del monorepo.
TinyDB se limita al prototipo; datos reales y concurrencia requieren decidir una BD relacional.
JWT, configuración validada y logging sin datos personales son propuestas, no garantías actuales.
Se preservan el analizador CSV y sus consumidores mientras se acuerda una migración compatible.
La motivación es reducir operación manual y dar visibilidad, no introducir microservicios prematuros.
Base: [BRIEFING](../BRIEFING.md), [API actual](../services/api/main.py) y [contexto técnico](../memory-bank/techContext.md).

## 2. Contexto de Nexova que condiciona la arquitectura

El [BRIEFING](../BRIEFING.md), idéntico a [CONTEXT](../CONTEXT.md) mediante `cmp`, describe una consultora B2B con tres líneas: selección de talento, outsourcing de soporte y formación corporativa. Sus necesidades delimitan módulos, no features ya entregadas:

| Dominio y usuarios | Condicionante de negocio | Consecuencia propuesta |
| --- | --- | --- |
| Selección: consultores y clientes | Cribado manual, seguimiento por llamadas, necesidad de matching y ranking explicable | Procesos, candidatos y transiciones con reglas propias; no confundirlos con RR.HH. interno |
| Formación: formadores y participantes | Catálogo PDF, inscripciones por formulario y seguimiento en hojas | Catálogo, matrículas y progreso separados del pipeline comercial |
| Soporte: agentes y supervisores | Sin knowledge base; resolución media de 48 h frente a SLA de 24 h | Incidencias y métricas trazables; el objetivo de automatizar el 40% no es un resultado |
| Ventas: account managers y SDRs | HubSpot usado inconsistentemente y seguimiento manual | Integraciones y reglas de oportunidades con dueño explícito |
| Marketing | Website desactualizado y conversiones sin medir | Interfaz pública separada; eventos de conversión acordados, no telemetría inventada |
| RR.HH.: equipo interno | Onboarding, ausencias y consultas por correo/hojas | Permisos y datos de empleados separados de candidatos externos |
| Tecnología y dirección | Zendesk legado, ATS propio, HubSpot, Google Workspace; sin telemetría ni logging centralizado; reportes tardíos | Adaptadores por sistema, correlación de errores y métricas agregadas como trabajo futuro |

Todas las filas derivan de las secciones departamentales del [BRIEFING](../BRIEFING.md). No se presupone que los legados dispongan de APIs, credenciales o conectores utilizables: habrá que verificar contratos, permisos y exportaciones disponibles.

### Estado verificado: main, rama actual y PRs

Inspección local en `feature/architecture-proposal`, inicialmente limpia, con HEAD `82fc5fd` y referencia local `main` en `2554cc5`. `git diff --name-only main -- src services packages scripts uis index.html application.html validation.js` no mostró diferencias de producto. Es un snapshot de referencias locales, no una afirmación de sincronización con el remoto.

| Superficie | Existe en main y en la rama inspeccionada | Evidencia |
| --- | --- | --- |
| Backend | FastAPI en un archivo; análisis CSV y exportación del último resumen, sin auth ni persistencia durable en ese servicio | [main.py](../services/api/main.py), [README API](../services/api/README.md) |
| Reutilización Python | `incidents-analysis`: validación y métricas, consumidas por API y CLI | [API pública del paquete](../packages/incidents-analysis/README.md), [pyproject](../packages/incidents-analysis/pyproject.toml), [CLI](../scripts/analyze.py) |
| Shared | `packages/shared` es un paquete TypeScript de tipos básicos; no aparece `packages/shared/nexova_shared` ni un paquete Python con ese nombre | [manifest](../packages/shared/package.json), [tipos](../packages/shared/types/index.ts); inventario `git ls-tree -r --name-only main -- packages` |
| Backoffice | Next.js con pantalla de análisis CSV; no tiene README propio, se consultaron el padre y su manifest | [uis](../uis/README.es.md), [manifest](../uis/backoffice/package.json), [pantalla](../uis/backoffice/app/incidents/page.tsx) |
| Website | `uis/website` es destino normativo, todavía inexistente; sitio y formulario permanecen en raíz | [regla de estructura](../.agents/rules/repo-structure.md), [index](../index.html), [formulario](../application.html), [progress](../memory-bank/progress.md) |
| Tracker | Hito 3 separado y protegido; cliente de otra API, no prueba de backend Nexova integrado | [cliente](../uis/talent-pipeline-tracker/lib/api.ts), [contexto técnico](../memory-bank/techContext.md#arquitectura-existente-no-propuesta) |
| Documentación y herramientas | `docs` aloja documentación transversal; `scripts` incluye CLI y fixtures, no otro servicio | [docs](README.es.md), [scripts](../scripts/README.es.md), [CLI](../scripts/analyze.py) |

La API actual recibe multipart con campo `file` en `POST /api/incidents/analyze`; devuelve un resumen JSON agregado. `GET /api/incidents/results/export` devuelve CSV de métricas (`metric,value`) o 404 si no hay análisis. Ambos están declarados directamente sobre `app`, no mediante `APIRouter`. `LAST_ANALYSIS_RESULT` es global de proceso y CORS admite wildcard con credenciales: no son decisiones recomendadas para producción. Fuente: [main.py](../services/api/main.py).

**Propuesto en PR abierto, no integrado por ese hecho:** [#4](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/4) supplier-directory con TinyDB; [#5](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/5) auth JWT; [#6](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/6) frontend auth; [#7](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/7) password reset; [#8](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/8) gestor de incidencias; [#9](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/9) auditoría de errores, con base `feature/incidents-manager`; [#10](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/10) tests de auth.

**Excepción importante:** [#3](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/3) sigue abierto, pero el runtime del analizador ya existe en main. El contraste local `git diff --stat main...origin/feature/incidents-analysis` muestra solo dos líneas de documentación en scripts. No significa que #3 esté merged. Fuentes: [progress](../memory-bank/progress.md#pendientes-de-merge) y archivos anteriores.

Se revalidaron número, estado, título y base de #3–#10 mediante la [API pública de PRs](https://api.github.com/repos/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pulls?state=open&per_page=30), tras fallar `gh pr list` por falta de autenticación. No se auditó el código de esas ramas ni se atribuye su cobertura a main.

## 3. Patrón arquitectónico elegido y justificación

**Base elegida: arquitectura en capas**, empaquetada como un backend modular por dominio, no como microservicios. Es una decisión de esta propuesta vinculada al [BRIEFING](../BRIEFING.md): hay reglas diferentes para selección, formación, soporte y RR.HH., legados desconectados y un equipo tecnológico pequeño que también debe incorporar observabilidad.

| Alternativa | Evaluación para Nexova |
| --- | --- |
| MVC como base | Organiza interfaces en model/view/controller, pero las vistas ya pertenecen a UIs separadas. Un controller por pantalla favorecería mezclar reglas de candidatos, ventas y permisos internos. No se elige como base; la traducción HTTP sigue existiendo en routers |
| Arquitectura en capas | Elegida: permite probar reglas de SLA, matrículas o transiciones sin HTTP ni legado; concentra operación y logging en un backend y permite sustituir almacenamiento sin rehacer frontends |
| Serverless como base | Es principalmente una estrategia de ejecución, no sustituye la separación de responsabilidades. Distribuir ahora flujos entre funciones exigiría más coordinación de identidad, estado y trazas precisamente donde Nexova carece de telemetría. Podría evaluarse para tareas aisladas futuras, no es la base |

### Capas y reglas de dependencia

- **Routers → services:** routers validan entrada/salida mediante schemas, obtienen identidad y traducen resultados/errores a HTTP. No calculan scoring, SLA ni consultas de almacenamiento.
- **Services → repositories/models:** services implementan casos de uso y autorización sobre recursos; reciben repositories mediante inyección. No importan `Request`, `Response`, routers ni componentes de UI.
- **Repositories → almacenamiento/adaptadores:** concentran consultas, serialización y acceso al legado. No llaman routers ni deciden permisos de negocio. Los models describen entidades y representación persistente; no se exponen directamente como respuesta.
- **Schemas:** modelos Pydantic de entrada/salida, distintos para creación, actualización y lectura cuando sea necesario; nunca incluyen hashes de contraseñas en respuestas. Los comparten routers y services cuando simplifique el prototipo, sin depender de FastAPI ni de TinyDB.
- **Composición:** `main` registra routers y handlers; `dependencies` construye settings, identidad y repositories. `core/config` no importa dominios; `db` no importa routers. Nada importa `main` para obtener dependencias.
- **Entre dominios:** no acceder a repositories ajenos. Las colaboraciones pasan por services con contratos explícitos; una coordinación transversal pertenece al caso de uso consumidor, sin imports circulares. Extraer a `packages` solo lo realmente reutilizable, preservando `incidents-analysis`.

La modularización HTTP e inyección se apoyan en **F1**; la separación services/repositories y las fronteras de dominio son decisiones propias para Nexova, no una estructura obligatoria de FastAPI. Ver fuentes en la sección 10.

## 4. Estructura de carpetas y módulos propuesta

Todo el backend de esta propuesta permanece dentro de `services/api/`, respetando [services](../services/README.es.md) y la [regla de estructura](../.agents/rules/repo-structure.md). **E** = existe; **P** = propuesto aquí; **E→P** = archivo existente cuyo contenido se reorganizaría mediante otra tarea autorizada.

```text
services/api/                       E
|-- main.py                         E->P: composición; conservar entrada main:app
|-- README.md                       E
|-- requirements.txt                E: dependencias actuales, no cambiadas aquí
|-- core/                           P
|   |-- config/                     P: settings validados por entorno
|   |   `-- settings.py             P
|   |-- security.py                 P: verificación JWT y hashing
|   |-- logging.py                  P: correlación y redacción de datos sensibles
|   `-- errors.py                   P: errores comunes y traducción HTTP
|-- db/                             P
|   |-- connection.py               P: ciclo de vida del almacenamiento
|   `-- migrations/                 P: transformaciones al pasar a BD relacional
|-- dependencies/                   P
|   |-- identity.py                 P: identidad y permisos compartidos
|   `-- providers.py                P: settings y construcción de repositories
|-- domains/                        P: un router por dominio
|   |-- incidents/                  P: extraer el análisis existente sin duplicarlo
|   |   |-- router.py               P
|   |   |-- service.py              P
|   |   |-- repository.py           P
|   |   |-- models.py               P
|   |   |-- schemas.py              P
|   |   `-- integrations/           P: adaptador helpdesk, si se valida su acceso
|   |-- recruitment/                P: selección, candidatos y procesos
|   |-- training/                   P: catálogo, matrículas y progreso
|   |-- sales/                      P: oportunidades y adaptador CRM
|   |-- hr/                         P: empleados y onboarding interno
|   |-- auth/                       P: identidad/usuarios; armonizar PRs #5 y #7
|   |-- marketing/                  P: conversiones y reporting autorizado
|   |-- reporting/                  P: agregados para dirección/tecnología
|   `-- suppliers/                  P: solo si se acepta el alcance de PR #4
`-- tests/                          P
    |-- unit/                       P: services y reglas puras
    |-- integration/                P: repositories y adaptadores
    `-- api/                        P: rutas, permisos y contrato OpenAPI
```

Los demás dominios seguirían la misma separación de archivos mostrada en `incidents`, creando solo los que necesiten; no se generarían repositories vacíos para casos puramente calculados. Los directorios Python requerirían sus `__init__.py` cuando sean packages (**F1**). El árbol es diseño, no inventario de archivos creados.

`core` contiene mecanismos compartidos, no reglas departamentales; `db` gestiona recursos, no un gran repository universal. Cada dominio posee sus reglas, schemas y almacenamiento. Los adaptadores traducen identificadores/estados del legado a modelos propios, con errores explícitos y sin importar su formato en routers.

La validación de filas y las métricas se conservan en [packages/incidents-analysis](../packages/incidents-analysis/README.md); el service de incidencias las reutiliza, como ya hacen [API](../services/api/main.py) y [CLI](../scripts/analyze.py). `agents/` y `skills/` siguen siendo producto/capacidades según sus [README de agents](../agents/README.es.md) y [README de skills](../skills/README.es.md); `.agents/` es configuración del coding agent, no runtime.

## 5. Organización de endpoints y routers FastAPI

**Todas las rutas `/api/v1` siguientes son propuestas.** Cada dominio tendrá un `APIRouter`, con `prefix` y `tags` propios; `include_router` lo registra bajo `/api/v1` en `main`. El prefijo común se aplica una sola vez. Las `dependencies` del router cubren controles comunes; dependencias por operación aportan permisos específicos (**F1**).

| Dominio / tag | Prefijo completo propuesto | Recursos y rutas ejemplo |
| --- | --- | --- |
| Selección / recruitment | `/api/v1/recruitment` | `GET /candidates`, `POST /processes`, `PATCH /processes/{id}` |
| Formación / training | `/api/v1/training` | `GET /courses`, `POST /enrollments`, `PATCH /enrollments/{id}` |
| Soporte / incidents | `/api/v1/incidents` | `GET /tickets`, `POST /analyze`, `GET /analyses/{id}/export` |
| Ventas / sales | `/api/v1/sales` | `GET /opportunities`, `PATCH /opportunities/{id}` |
| RR.HH. / hr | `/api/v1/hr` | `GET /employees`, `POST /onboarding-checklists` |
| Auth y usuarios / auth | `/api/v1/auth` | `POST /tokens`, `GET /users/me`, `POST /password-reset-requests` |
| Marketing / marketing | `/api/v1/marketing` | `GET /conversion-metrics` |
| Reporting / reporting | `/api/v1/reporting` | `GET /executive-summary`, `GET /service-metrics` |
| Proveedores / suppliers | `/api/v1/suppliers` | `GET /`, `POST /`, condicionado a revisión de #4 |

**Convenciones propias:** recursos en inglés y plural, segmentos compuestos en kebab-case, identificadores opacos, sin nombres de tablas en URLs; `GET` consulta, `POST` crea/ejecuta, `PATCH` modifica parcialmente. Listados nuevos: `items`, `total`, `page`, `limit`, con límites validados; detalles: objeto tipado. Operaciones de análisis conservan semántica explícita de acción y exportación CSV. No se impone ese envelope retroactivamente al resumen actual.

**Autenticación propuesta:** JWT Bearer con firma, algoritmo permitido, expiración e identidad verificadas en servidor; hashes seguros para contraseñas, nunca contraseñas reversibles. El login y la solicitud de reset no pueden depender de un JWT previo. El resto de operaciones internas exige identidad; services verifican rol, empresa y propiedad del recurso cuando aplique. Un consultor no recibe por defecto acceso a empleados internos ni a clientes de otro ámbito. JWT no cifra su payload ni sustituye autorización. Base técnica **F2** y alcance pendiente de #5/#7; política concreta de roles por acordar.

**Errores propuestos para v1:** JSON con objeto `error` que contiene `code`, `message`, `request_id` y, solo para validaciones, `details` sanitizados. Mismos handlers para errores de negocio y validación: 400 para entrada de archivo inválida, 401 sin identidad válida, 403 sin permiso, 404 recurso ausente, 409 conflicto, 422 schema inválido y 500 inesperado. Fallos de legado se distinguen como 502/504 cuando corresponda. Nunca convertir un fallo en 200 ni enviar stack traces/datos personales al cliente; loguear internamente con correlación. Este envelope es decisión propia, no el formato actual ni un default de FastAPI.

**Compatibilidad:** [main.py](../services/api/main.py) usa hoy `{"error": mensaje}` para errores controlados y un resumen sin envelope. Se mantienen `/api/incidents/analyze` y `/api/incidents/results/export`, su multipart, errores y CSV hasta acordar migración con [backoffice](../uis/backoffice/app/incidents/page.tsx). Las futuras rutas versionadas reutilizarían services, no copias de lógica; el análisis con ID reemplazaría gradualmente el estado global, con aislamiento por usuario/cliente. Cambiar paths, permisos o formato exige aprobación y verificación de consumidores, no solo añadir un prefijo. OpenAPI documentará ambos contratos mientras coexistan (**F1**, **F6**).

## 6. Decisiones técnicas iniciales

| Decisión | Alternativa descartada o aplazada | Justificación y estado |
| --- | --- | --- |
| FastAPI + Uvicorn | Reescritura con otro framework | Ya presentes en [requirements](../services/api/requirements.txt) y [main](../services/api/main.py); se aprovecha código probado estáticamente y modularización **F1**, sin afirmar validación runtime en esta sesión |
| Schemas Pydantic explícitos | Diccionarios sin contrato para todas las respuestas | Validar límites entre UI y dominios, generar contrato; **F2/F6**. Es propuesta: el resumen actual está anotado como dict y el paquete valida filas con sus helpers |
| TinyDB para prototipo persistente acotado | Mantener el último resumen global como solución durable | Se alinea con el alcance anunciado de [#4](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/4), no está en [requirements actuales](../services/api/requirements.txt). Solo datos sintéticos, un proceso escritor y sin promesa de transacciones/escala |
| BD relacional antes de uso operativo concurrente | TinyDB en producción por inercia | Relaciones candidato-proceso, matrícula-curso y permisos requieren integridad y transacciones. Motor/driver a decidir; no se añade ORM ni tecnología fuera del curso en esta entrega |
| Configuración tipada con pydantic-settings | Constantes sensibles embebidas o entorno sin validación | Settings por servicio y validación al arrancar, inyectables en tests (**F3**). Dependencia propuesta, no declarada hoy en [requirements](../services/api/requirements.txt); incorporación requiere autorización |
| JWT y autorización por recurso | Confiar en UI o aplicar un único permiso global | Datos de clientes y RR.HH. requieren aislamiento. Propuesta apoyada por **F2** y PR #5, aún no integrada; transporte HTTPS y expiración obligatorios antes de operación real |
| Logging estructurado con stdlib y métricas básicas | Solo errores reportados por usuarios o imprimir tickets | El [BRIEFING](../BRIEFING.md) dice que no hay telemetría. Proponer `request_id`, dominio, ruta normalizada, status, duración y errores de integración, sin cuerpos, CVs, correos, tokens ni query strings. Centralización/alertas requieren definir destino y responsable |
| pytest por capas y contrato | Solo demo manual o asumir cobertura por #10 | Unit para reglas, integration para persistencia, API para status/schema/auth/CORS. **F2** respalda pytest; no hay runner declarado en [requirements](../services/api/requirements.txt) ni [pyproject](../packages/incidents-analysis/pyproject.toml). #10 es trabajo pendiente; no se crean tests aquí |
| Conservar pip/requirements y setuptools | Migrar a uv por aparecer en documentación externa | [README API](../services/api/README.md), [requirements](../services/api/requirements.txt), [pyproject](../packages/incidents-analysis/pyproject.toml) y [requirements CLI](../scripts/requirements.txt) son la evidencia real. Inventario de manifests sin `uv.lock` ni configuración uv; no se constató uso de uv. Pins/lock futuro requieren autorización |

**Ruta de migración de datos propuesta:** definir IDs estables y reglas de integridad; encapsular TinyDB en repositories; acordar schema relacional y transformaciones en `db/migrations`; ensayar export/import con conteos y relaciones verificadas en datos sintéticos; programar un corte de escrituras y backup con recuperación comprobada; sustituir repositories y validar contrato antes del cambio. Evitar dual-write improvisado. El gate para abandonar el prototipo es necesitar datos personales reales, varios escritores/workers o integridad transaccional, no un número arbitrario de registros.

Logging técnico no equivale a dashboard de negocio: SLA/backlog y conversiones necesitan definir eventos, calidad de datos y propietarios con soporte/marketing. Un destino centralizado, retención y alertas son decisiones operativas pendientes, no capacidades implementadas. No se propone instalar una plataforma externa de observabilidad en este hito.

## 7. Frontend y backend como sistemas separados

- **Monorepo, no runtime único:** conservar `uis/backoffice` y el futuro `uis/website` para frontends, `services/api` para backend y `packages` para reutilización. No crear `frontend/`, `backend/` ni migrar el sitio raíz sin autorización ([regla de estructura](../.agents/rules/repo-structure.md)). El tracker permanece independiente y protegido.
- **Comunicación:** API REST por HTTP/HTTPS, JSON para recursos y multipart/CSV para el análisis. Ninguna UI accede a TinyDB ni importa repositories Python. El patrón de llamadas ya existe en [backoffice](../uis/backoffice/app/incidents/page.tsx); separar sistemas no exige separar repositorios.
- **Monorepo frente a repos separados:** se elige mantener el monorepo para coordinar contratos y revisión con el equipo pequeño del [BRIEFING](../BRIEFING.md). Repos separados podrían dar permisos/ciclos de publicación distintos, pero aumentarían sincronización y no solucionan la desconexión de legados. Es decisión local, no recomendación obligatoria del template.
- **CORS:** listas explícitas por entorno con protocolo, host y puerto; solo origins de UIs autorizadas, nunca `"*"` en producción. Limitar métodos/headers necesarios, incluyendo `Authorization` si se usa Bearer; permitir credenciales solo si el transporte elegido lo necesita y sin wildcards en esa configuración. Verificar preflight de carga CSV y acceso a exportación; exponer `Content-Disposition` solo si el cliente necesita leerlo. CORS controla al browser, no autentica clientes ni protege acceso directo (**F4**).
- **Entorno por servicio:** la API recibe configuración privada del entorno de su proceso; las UIs solo reciben la configuración que necesitan. El nombre existente `NEXT_PUBLIC_API_URL` se lee en [backoffice](../uis/backoffice/app/incidents/page.tsx) y [tracker](../uis/talent-pipeline-tracker/lib/api.ts); no se copian valores. En Next.js, `NEXT_PUBLIC_*` llega al bundle del browser y queda fijado al build, por lo que cambiarlo puede requerir reconstruir la UI (**F5**).
- **Ejemplos de entorno:** proponer un `.env.example` por servicio con nombres y placeholders no sensibles, previa autorización explícita según [AGENTS](../AGENTS.md). No se crea, lee ni modifica ningún `.env*` aquí, tampoco ejemplos existentes. Secretos de JWT, bases o legados nunca llevan prefijo `NEXT_PUBLIC_`; la guía de settings **F3** no es permiso para versionarlos.
- **Contrato OpenAPI:** publicar schema y documentación del backend, revisar operaciones, schemas, errores y permisos con frontend antes de integrar cambios; verificar consumidores y compatibilidad en cada versión. FastAPI genera OpenAPI (**F6**), pero un dict sin schema preciso no garantiza tipos frontend coherentes. `/api/v1` como versión de contrato es una convención elegida aquí, independiente del número de release del servicio.
- **Despliegue independiente propuesto:** cada UI conserva su build/config y el backend su proceso/config; compartir commit no exige publicar todo a la vez. Acordar URLs, HTTPS, CORS y compatibilidad antes de promover cada artefacto. No se afirma que exista automatización de despliegue: el [BRIEFING](../BRIEFING.md) describe despliegues manuales. El template **F2** sirve de referencia de organización y pruebas, no se copia su infraestructura ni su frontend servido por el backend.

## 8. Riesgos y puntos de atención

| Qué podría salir mal | Impacto para Nexova | Mitigación propuesta |
| --- | --- | --- |
| Todos los dominios en un router/archivo | Cambiar soporte rompe selección o auth; integración de PRs difícil | Un router por dominio, composición en main y revisión de fronteras |
| Reglas de negocio en routers | SLA, matrículas y permisos no se prueban sin HTTP y se duplican | Services para casos de uso, schemas en frontera y tests de reglas |
| Repositories compartidos sin dueño o imports circulares | CRM, ATS y RR.HH. terminan acoplados; datos ajenos accesibles | Propiedad por dominio, colaboración por services y controles por recurso |
| Wildcard CORS combinado con autenticación | Bloqueos de browser o exposición innecesaria de orígenes | Allowlist por entorno, configuración explícita de credenciales y pruebas de preflight |
| Secretos o datos personales en repo/logs/browser | Compromiso de clientes, candidatos y empleados | Settings privados, ejemplos sin valores reales, redacción y revisión staged; nunca secretos `NEXT_PUBLIC_*` |
| Contrato y tipos UI divergen al añadir v1 | El backoffice deja de analizar/descargar; errores invisibles | OpenAPI revisado, convivencia temporal con rutas actuales y migración acordada |
| TinyDB o estado global llegan a operación real | Pérdida de resultados, conflictos entre procesos o fuga entre usuarios | Gate de producción, repositories, IDs por análisis, aislamiento y migración relacional verificada |
| PRs abiertos traen convenciones distintas | Duplicación de auth, handlers o almacenamiento | Revisar diffs/dependencias antes de merge, acordar convenciones; #9 depende de la rama del gestor |
| Integración de legados sin trazas ni política de fallos | Datos atrasados y soporte vuelve a enterarse por usuarios | Correlación, errores explícitos, métricas de frescura; timeouts y reintentos solo con idempotencia acordada |

Los riesgos de estado global/CORS se observan en [main.py](../services/api/main.py); ausencia de telemetría y fragmentación provienen del [BRIEFING](../BRIEFING.md). Los restantes son riesgos del diseño propuesto, no vulnerabilidades verificadas ni fallos atribuidos a PRs sin auditar.

## 9. Preguntas abiertas para el CTO y próximos pasos

1. ¿Qué caso de uso se prioriza y quién valida sus reglas: selección, soporte o formación? El [BRIEFING](../BRIEFING.md) no establece calendario ni orden de implementación.
2. ¿Qué roles, ámbitos por cliente y permisos requieren candidatos frente a empleados internos? ¿Quién aprueba retención y borrado de datos?
3. ¿Qué APIs/exportaciones y restricciones ofrecen Zendesk, HubSpot, ATS y Google Workspace? ¿Cuál es la fuente de verdad de cada entidad?
4. ¿Qué volumen, concurrencia y recuperación se necesitan para elegir la BD relacional y limitar el prototipo TinyDB?
5. ¿Cómo se transporta/almacena el JWT en las UIs, cómo se revoca y qué mecanismo de reset se aprueba? Coordinar con #5–#7 sin asumir su implementación.
6. ¿Qué origins, entornos, destino de logs, retención y responsables de alertas se autorizan? ¿Quién define frescura y métricas de SLA/reporting?
7. ¿Qué partes de #4–#10 se aceptan y en qué orden de dependencias? Revalidar estado remoto y código; #3 abierto no implica API ausente.

**Siguientes pasos, sin fechas:** revisar este borrador; aprobar alcance y convenciones; contrastar PRs; acordar contrato v1 y compatibilidad con backoffice; autorizar por separado reorganización/dependencias/configuración; implementar primero una separación de incidencias que preserve contrato; añadir tests y validar migración/observabilidad antes de uso real. No modificar tracker ni migrar website como efecto lateral.

**Límites de verificación de este borrador:** fuentes oficiales abiertas y resumidas; código/manifests e inventario Git inspeccionados; AST confirmó sintaxis y las dos rutas actuales. La auditoría dinámica de [verify-service-endpoints](../.agents/skills/verify-service-endpoints/SKILL.md) quedó bloqueada: el virtualenv previsto no está disponible y el Python accesible no tiene FastAPI, multipart ni incidents-analysis. Se respetó la prohibición de instalar. No se ejecutaron assertions de comportamiento, OpenAPI runtime, HTTP ni tests de auth; el éxito histórico registrado en [progress](../memory-bank/progress.md#validacion-ejecutada) no es un resultado de esta sesión. Los fallos previos de lint/build allí registrados no se corrigen ni se declaran resueltos.

## 10. Fuentes y convenciones investigadas

Se pudieron abrir las páginas siguientes. Los resúmenes son paráfrasis de los apartados consultados, no citas textuales. Las guías no prescriben toda la arquitectura de Nexova.

| Fuente | Qué se consultó y qué decisión respalda |
| --- | --- |
| **F1** · [FastAPI: Bigger Applications - Multiple Files](https://fastapi.tiangolo.com/tutorial/bigger-applications/) | Explica packages Python, `APIRouter`, `prefix`, `tags`, `dependencies` y registro con `include_router`, incluso opciones al incluirlo. Respalda dividir routers y compartir dependencias; dominios y capas services/repositories son adaptación propia |
| **F2** · [Full Stack FastAPI Template oficial](https://github.com/fastapi/full-stack-fastapi-template) | Su README presenta FastAPI, Pydantic, JWT, password recovery y pytest; también SQLModel/PostgreSQL y frontend React/Vite servido junto al backend. Se adoptan referencias de validación/auth/testing, no su stack completo, rutas raíz ni modelo de despliegue. TinyDB no procede de este template |
| **F3** · [FastAPI: Settings and Environment Variables](https://fastapi.tiangolo.com/advanced/settings/) | Describe `BaseSettings` de pydantic-settings, conversión/validación del entorno, módulo de configuración, dependencia cacheada y overrides para tests; explica dotenv. Respalda configuración tipada por servicio, sin copiar sus valores de ejemplo ni asumir uv instalado |
| **F4** · [FastAPI: CORS](https://fastapi.tiangolo.com/tutorial/cors/) | Define origin como protocolo/host/puerto y explica preflight, `CORSMiddleware`, allowlists y restricciones de wildcards con credenciales. Respalda CORS explícito por entorno para UIs y backend separados |
| **F5** · [Next.js: Environment Variables](https://nextjs.org/docs/app/guides/environment-variables) | Distingue configuración de servidor y variables `NEXT_PUBLIC_*` incorporadas al bundle en build. Respalda URL pública sin secretos, configuración por UI y consideración del rebuild |
| **F6** · [FastAPI: First Steps / OpenAPI](https://fastapi.tiangolo.com/tutorial/first-steps/#openapi) | Describe schema OpenAPI y documentación interactiva automática. Respalda usar el contrato para coordinar REST entre equipos; el prefijo `/api/v1`, paginación y envelope de errores son decisiones propias |
| **Negocio** · [BRIEFING](../BRIEFING.md), [CONTEXT](../CONTEXT.md), [projectbrief](../memory-bank/projectbrief.md) | Dominios, usuarios, legados, equipo pequeño y falta de telemetría justifican capas, aislamiento y observabilidad; no garantizan features ni fechas |
| **Repo** · [AGENTS](../AGENTS.md), [estructura](../.agents/rules/repo-structure.md), [servicios](../.agents/rules/services-conventions.md), [secretos](../.agents/rules/secrets-and-env.md), [techContext](../memory-bank/techContext.md) | Respaldan ubicaciones, protección de entregables, reutilización, preservación del contrato y límites de cambios. Las evidencias de implementación son los archivos enlazados en secciones 2 y 6 |
| **PRs** · [listado público API](https://api.github.com/repos/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pulls?state=open&per_page=30), [snapshot previo](../memory-bank/progress.md#pendientes-de-merge) | Metadatos revalidados de propuestas abiertas; no prueban implementación en main. TinyDB es alcance anunciado en #4, elegido aquí solo para prototipo |

**Decisiones locales, no mandatos de las fuentes:** arquitectura en capas y organización por dominio (necesidades del BRIEFING + modularización F1), monorepo con despliegue independiente (mapa del repo + F4/F5/F6), `/api/v1` y formato uniforme (acuerdo propuesto sobre F1/F6), transición TinyDB→relacional (prototipo de #4 + integridad requerida por dominios), logging con stdlib (ausencia de telemetría del BRIEFING). Cada una requiere revisión del CTO antes de convertirse en implementación.
