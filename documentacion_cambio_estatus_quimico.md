# Documentación Técnica – Proceso de Registro y Cambio de Estatus de Químicos en Clarificadores

## 1. Resumen Ejecutivo
Este documento describe la regla de negocio, el flujo técnico y la arquitectura existente del proceso de **registro de químicos (polímeros) por lote**, así como la **nueva funcionalidad requerida: cambio automático de estatus del químico anterior cuando se modifica el lote**. Todo el flujo ya opera correctamente; esta documentación consolida reglas, decisiones, flujos y responsabilidades.

## 2. Validación de Insumos
- El usuario confirmó que **no existen errores en el funcionamiento actual**.
- Requiere únicamente:
  - Documentación formal.
  - Explicación detallada de la regla de negocio.
  - Incluir la regla faltante: cambio de estatus al sustituir un lote.

## 3. Contexto
Los operadores de clarificadores registran el uso de polímeros identificados por *lote*.  
El sistema valida:
1. Si el lote existe en **Alpha ERP**, consultando un servicio Python que accede a DBFs.
2. Si es **primer uso del lote**, solicita **clave del departamento de calidad**.
3. Si ya existe un registro previo, se reutiliza su `control_procesos_id`.
4. El registro queda almacenado en el backend (PHP) con auditoría.
5. **Nuevo requerimiento:** Cuando el usuario cambie el lote, el lote anterior debe cambiar su estatus automáticamente.

## 4. Análisis Técnico
El flujo involucra:
- **Frontend JS**  
  Captura del lote, validaciones, apertura de modal, y confirmación por clave.
- **Backend PHP**  
  Inserción del registro, verificación del último lote, consulta al servicio Python.
- **Servicio Python**  
  Acceso a DBFs del Alpha ERP y validación del lote real.
- **Base de Datos**  
  Persistencia de lotes, químicos, estatus y logs.

El proceso actual es estable y correctamente implementado.

La pieza faltante:  
**Un endpoint y procedimiento para cambiar el estatus del químico anterior cuando se registra uno nuevo para el mismo clarificador.**

## 5. Reglas de Negocio Formalizadas
1. **Validación de lote con Alpha ERP**  
   - Un lote debe existir en la base DBF del Alpha ERP para ser considerado válido.
2. **Primer uso del lote**  
   - Si no hay historial del lote, se requiere clave del departamento de calidad.
3. **Reutilización del lote**  
   - Si ya existe `control_procesos_id`, se reutiliza y no se pide clave.
4. **Registro del químico**  
   - Todo registro debe guardarse con fecha, usuario, clarificador, lote y control de procesos.
5. **Cambio de lote**  
   - Al ingresar un lote nuevo en un clarificador:
     - El lote anterior debe cambiar a estatus **“inactivo”** o **“sustituido”**.
     - El lote nuevo pasa a estatus **“activo”**.
     - Se registra un evento de auditoría.
6. **Auditoría obligatoria**  
   - Toda acción (validación, registro, sustitución) debe quedar registrada.

## 6. Propuesta Arquitectónica
### Componentes
- **Frontend JS (modal + validación)**
- **API interna PHP**
- **Servicio de control de procesos (Python)**
- **BD MySQL**

### Nuevo Componente
Endpoint PHP:
```
POST /clarificador/cambiarEstatus
Payload:
{
  "equipo_id": <int>,
  "lote_anterior": "<string>",
  "lote_nuevo": "<string>"
}
```

### Lógica del estatus
1. Cambiar estatus de lote anterior a **inactivo**.
2. Registrar lote nuevo como **activo**.
3. Log de auditoría del cambio.

## 7. Código Mejorado por Bloques
### Bloque 1 – PHP: Cambio de estatus
```php
function cambiarEstatusLote($equipoId, $loteAnterior, $loteNuevo) {
    // 1. Inactivar registro anterior
    $sql1 = "UPDATE control_procesos 
             SET estatus = 'inactivo', fecha_fin = NOW()
             WHERE equipo_id = ? AND lote = ? AND estatus = 'activo'";
    runQuery($sql1, [$equipoId, $loteAnterior]);

    // 2. Activar registro nuevo
    $sql2 = "UPDATE control_procesos 
             SET estatus = 'activo', fecha_inicio = NOW()
             WHERE equipo_id = ? AND lote = ?";
    runQuery($sql2, [$equipoId, $loteNuevo]);

    // 3. Auditoría
    registrarBitacora('cambio_lote', [
        'equipo' => $equipoId,
        'lote_anterior' => $loteAnterior,
        'lote_nuevo' => $loteNuevo
    ]);

    return ['success' => true];
}
```

### Bloque 2 – JS: Llamar cambio de estatus después de registrar nuevo lote
```js
await fetchApi('/clarificador/cambiarEstatus', 'POST', {
  equipo_id,
  lote_anterior: ultimoLote,
  lote_nuevo: loteActual
});
```

## 8. Diagramas en Texto (ASCII)
### Flujo General
```
[Usuario] 
    ↓
[Frontend JS] 
    ↓ validar lote
[Python API - DBF Alpha] 
    ↓ resultado
[PHP Backend]
    ↓ registrar químico
[MySQL]

Si cambia el lote:
    ↓
[PHP cambia estatus]
    ↓
[MySQL actualiza anterior → inactivo]
    ↓
[MySQL activa nuevo]
```

### Diagrama de Estados
```
          ┌───────────┐
          │   Activo  │
          └──────┬────┘
                 │ Cambio de lote
                 ▼
          ┌───────────┐
          │ Inactivo  │
          └───────────┘
```

## 9. Pasos Detallados de Implementación
1. Crear endpoint `cambiarEstatus` en PHP.
2. Obtener lote anterior desde DB.
3. Desactivar lote anterior.
4. Activar lote nuevo.
5. Registrar bitácora.
6. Integrar llamada desde JS.
7. Probar flujo completo:
   - Registrar lote nuevo.
   - Validación Alpha ERP.
   - Solicitud de clave si corresponde.
   - Cambio de estatus.
8. Validar auditoría.

## 10. Checklist
- [ ] PHP: endpoint implementado  
- [ ] SQL: campos `estatus`, `fecha_inicio`, `fecha_fin`  
- [ ] JS: llamada después del registro  
- [ ] Python: sin cambios requeridos  
- [ ] Log de auditoría  
- [ ] Pruebas con lote nuevo  
- [ ] Pruebas con lote repetido  
- [ ] Pruebas de sustitución  
- [ ] Verificar que solo 1 lote activo por clarificador  

## 11. Riesgos y Mitigaciones
| Riesgo | Mitigación |
|-------|------------|
| Doble registro activo | Constraint + validación en update |
| Lotes mal sincronizados con Alpha ERP | Reintentos y logs |
| Fallo en actualización de estatus | Transacciones SQL |
| Operador cambia lote por error | Bitácora + opción de revertir |

## 12. Alternativas Adicionales
1. **Trigger SQL** que garantice solo un lote activo por clarificador.  
2. **Workflow por microservicio** que gestione estados sin depender del front.  
3. **Cola de eventos (RabbitMQ)** para desacoplar validaciones y actualización de estatus.

## 13. Recomendaciones Finales
- Implementar constraints para evitar estatus inconsistentes.
- Registrar siempre `usuario_id` en todos los cambios.
- Agregar un módulo de auditoría visible para calidad.
- Programar proceso nocturno que valide que no haya múltiples lotes activos.

