# Documentación Oficial de Funcionalidad  
## Registro de Químicos por Lote en Clarificadores  
### (Uso interno para Desarrollo + Documentación funcional del Sistema)

---

# 1. Propósito del documento  
Este documento unifica y formaliza **la funcionalidad completa del registro y administración de químicos por lote** en los equipos clarificadores.  
Incluye dos perspectivas:

1. **Documentación para el equipo de desarrollo**  
   - Arquitectura  
   - Flujos técnicos  
   - Endpoints  
   - Validaciones  
   - Lógica backend y frontend  
   - Reglas de negocio computables  

2. **Documentación del sistema (funcional / usuario avanzado)**  
   - Qué hace el módulo  
   - Cómo opera la validación del lote  
   - Cómo se aplica la clave de calidad  
   - Cómo funciona el cambio automático de estatus

---

# 2. Descripción general del proceso

El sistema permite registrar el uso de **polímeros (químicos)** en equipos clarificadores.  
Cada químico está asociado a un **lote**, que debe validarse con información proveniente del **Alpha ERP**.

El sistema garantiza:
- Validación real del lote.  
- Control de primer uso mediante el departamento de calidad.  
- Persistencia del registro del químico.  
- Estado activo/inactivo de lotes por equipo.  
- Historial y auditoría.

---

# 3. Reglas de negocio (versión formal)

## 3.1 Validación del lote
- Todo lote debe existir en la base DBF del **Alpha ERP**.
- La validación se realiza mediante un servicio Python.
- Si el lote **no existe**, el sistema debe impedir el registro.

## 3.2 Primer uso del lote
- Si nunca ha sido registrado ese lote:
  - Se debe solicitar una **clave de autorización** del departamento de calidad.
  - La clave se valida contra el sistema de control de procesos.
  - Una vez validado, se genera un `control_procesos_id`.

## 3.3 Reutilización del lote (ya registrado antes)
- Si el lote ya tenía registro previo:
  - El sistema reutiliza el `control_procesos_id`.
  - No se solicita clave de calidad.

## 3.4 Cambio de lote
Regla clave: **solo un lote puede estar activo por clarificador.**

Cuando el operador registra un nuevo lote:

1. El lote anterior del equipo debe cambiar a **estatus: inactivo**.  
2. El lote nuevo se marca como **estatus: activo**.  
3. Se registra un evento en auditoría:
   - usuario  
   - fecha  
   - id del equipo  
   - lote anterior  
   - lote nuevo  

## 3.5 Registro del químico
Cada registro debe incluir:
- equipo_id  
- lote  
- control_procesos_id  
- usuario_id  
- fecha/hora  
- estatus  

## 3.6 Auditoría obligatoria
Toda acción genera trace:
- Validación de lote  
- Solicitud de clave  
- Registro de químico  
- Cambio de lote  

---

# 4. Flujo funcional (documentación del sistema)

## 4.1 Registrar un lote en un clarificador
1. El operador ingresa un lote.  
2. El sistema lo valida automáticamente contra Alpha ERP.  
3. Si es primer uso:
   - Se muestra ventana solicitando clave del departamento de calidad.  
4. Si el lote ya existe:
   - Se continúa sin intervención del departamento de calidad.  
5. El lote queda registrado correctamente.

## 4.2 Sustitución del lote
Cuando el operador escribe un lote diferente al que está activo:

1. El sistema identifica el lote actual activo.  
2. Cambia su estatus a **inactivo**.  
3. Registra el nuevo lote como **activo**.  
4. Guarda movimientos en bitácora.

El usuario solo ve un mensaje de éxito; el sistema administra estados automáticamente.

---

# 5. Arquitectura general del módulo

```
[Frontend JS] 
    ↓ capturar lote
    ↓ validar lote
[API PHP]
    ↓ llama servicio Python
[Servicio Python]
    ↓ consulta DBFs en Alpha ERP
[API PHP]
    ↓ registra químico / cambia estatus
[MySQL]
```

---

# 6. Componentes Técnicos

## 6.1 Frontend (JS)
Responsabilidades:
- Captura de lote.  
- Mostrar modal de validación para calidad.  
- Enviar payload al servidor.  
- Llamar al endpoint para cambiar estatus cuando aplica.  

Eventos clave:
- `buscarLote()`
- `validarLote()`
- `mostrarModalCalidad()`
- `insertarQuimico()`
- `cambiarEstatus()`

---

## 6.2 Backend (PHP)
Endpoints principales:
- `POST /clarificador/insertarQuimico`
- `POST /clarificador/cambiarEstatus`
- `POST /clarificador/validarLote`
- `POST /clarificador/validarClaveCalidad`

Responsabilidades:
- Registrar químico.  
- Vincular o crear `control_procesos_id`.  
- Validar primera vez con clave.  
- Cambiar estatus del lote anterior.  
- Registrar bitácora.  

---

## 6.3 Servicio Python
Responsabilidad:
- Validar existencia del lote en DBF del Alpha ERP.  
Entrada:
```json
{ "lote": "XXXX" }
```

Salida esperada:
```json
{
  "success": true,
  "control_procesos_id": 123
}
```

---

## 6.4 Base de Datos
Tablas relevantes:
- `control_procesos`
- `quimicos`
- `auditoria`
- `equipos`

Campos requeridos:
- lote  
- equipo_id  
- estatus (activo / inactivo)  
- fecha_inicio  
- fecha_fin  
- control_procesos_id  

Regla estructural:
> Solo un registro con estatus **activo** por equipo.

---

# 7. Detalle de la funcionalidad crítica: Cambio de estatus del lote

## 7.1 Objetivo
Cuando un operador registra un nuevo lote, el lote anterior no debe permanecer activo.

## 7.2 Proceso técnico

### 1. Obtener el lote activo actual del equipo
```sql
SELECT lote
FROM control_procesos
WHERE equipo_id = ? AND estatus = 'activo'
LIMIT 1;
```

### 2. Cambiar estatus del lote anterior
```sql
UPDATE control_procesos
SET estatus = 'inactivo', fecha_fin = NOW()
WHERE equipo_id = ? AND lote = ?;
```

### 3. Activar lote nuevo
```sql
UPDATE control_procesos
SET estatus = 'activo', fecha_inicio = NOW()
WHERE equipo_id = ? AND lote = ?;
```

### 4. Registrar bitácora
```sql
INSERT INTO auditoria (accion, equipo_id, lote_anterior, lote_nuevo, usuario_id)
VALUES ('cambio_lote', ?, ?, ?, ?);
```

---

# 8. Flujo técnico en detalle

```
[JS] operador ingresa lote
    ↓
[JS] consulta si hay lote previo
    ↓
[PHP] obtenerUltimoLote(equipo)
    ↓
    ├── Si el lote es igual → continuar
    └── Si el lote es distinto:
           → cambiar estatus lote anterior
           → activar lote nuevo
           → auditoría
    ↓
[PHP] insertar registro del químico
    ↓
[MySQL] guardar registro final
```

---

# 9. Diagrama de estados del lote

```
        ┌──────────────┐
        │    ACTIVO     │
        └───────┬────────┘
                │ cambio de lote
                ▼
        ┌──────────────┐
        │   INACTIVO    │
        └──────────────┘
```

---

# 10. Consideraciones para desarrollo
- Implementar transacciones SQL en cambios de estatus.  
- Validar que nunca existan dos lotes activos por equipo.  
- El cambio de estatus debe ejecutarse **antes** de registrar el nuevo químico.  
- Las respuestas JSON deben ser estrictamente definidas.  
- Toda validación debe quedar en backend para seguridad.  

---

# 11. Consideraciones para documentación del sistema
- El usuario NO maneja estatus.  
- El sistema lo gestiona automáticamente.  
- El usuario solo registra lotes; no necesita conocer la lógica interna.  

---

# 12. Conclusión
La funcionalidad está correctamente implementada y estable.  
Este documento define la operación completa desde el punto de vista técnico y funcional, habilitando:

- Trazabilidad  
- Entendimiento del proceso  
- Base para mantenimiento  
- Guía para nuevos desarrolladores  
- Estándar para documentación del módulo  

