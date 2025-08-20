import { showToast } from "../toast.js";
import { isAdminOrGerente, tienePermiso, getUserId } from "../../utils/session.js";
import { ACTIONS } from "./actions.js";
import { procesarMateriales, renderMateriales } from "../modal.js";


export const renderTableCocedores = (cocedores, tablaBody, acciones) => {
  const user = JSON.parse(localStorage.getItem('usuario') || 'null');
  if (!Array.isArray(cocedores) || cocedores.length === 0) {
    tablaBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">Sin cocedores registrados</td></tr>`;
    return;
  }

  
  tablaBody.innerHTML = cocedores.map((c, i) => 
    {
      let materiales = procesarMateriales(c.materiales);
      let materialesAgrupado = reduceMateriles(materiales);
      return `
      <tr class="data-row ${Number(c.supervisor_validado) === 1 || c.supervisor_validado === null ? '' : 'tr-no-validado'}">
      <td class="cell-id">#${c.cocedor_id?.toString().padStart(3, '0') || (i + 1).toString().padStart(3, '0')}</td>
      <td class="cell-name">${c.nombre || '-'}</td>
      <td class="cell-name">${c.procesos || '-'}</td>
    <td class="cell-name"><div class="d-flex flex-wrap gap-1">${renderMateriales(materialesAgrupado, 5, false)}</div></td>
      <td class="cell-status">
        ${renderBadgeEstatus(c.estatus)}
      </td>
      <td class="cell-temperature ${c.temperatura_entrada > 100 ? 'warning' : ''}">
        ${c.temperatura_entrada ? `${c.temperatura_entrada}°C` : '-'}
      </td>
      <td class="cell-temperature ${c.temperatura_salida > 100 ? 'warning' : ''}">
        ${c.temperatura_salida ? `${c.temperatura_salida}°C` : '-'}
      </td>
      <td class="cell-activity">${c.responsable_tipo || '-'}</td>
      <td class="cell-activity">${c.fecha_registro || '-'}</td>
      ${renderAccionesCocedor(c, user)}
    </tr>
      `;
    }).join('');
}

const renderActionsSupervisor = (cocedorId, estatus) => {
  return `
    <td class="actions-cell">
    <div class="btn-group btn-group-actions" role="group">
      <button class="btn btn-action btn-validar" title="Validar registro" aria-label="Validar" data-id="${cocedorId}">
        <i data-lucide="notebook-tabs"></i>
        <span class="btn-text">Validar</span>
      </button>
      ${estatus === 'ACTIVO'
      ? `<button class="btn btn-action btn-pause pulse-hover" title="Pausar servicio" aria-label="Pausar" data-id="${cocedorId}">
             <i data-lucide="pause-circle"></i>
             <span class="btn-text">Pausar</span>
           </button>`
      : estatus === 'MANTENIMIENTO'
        ? `<button class="btn btn-action btn-activate glow-hover" title="Activar servicio" aria-label="Activar" data-id="${cocedorId}">
               <i data-lucide="play-circle"></i>
               <span class="btn-text">Activar</span>
             </button>`
        : ''
    }
    </div>
    </td>
  `;
}

const renderActionsControlProcesos = (cocedorId, estatus, supervisor_validado) => {
  const isActivo = estatus === 'ACTIVO';
  const isMantenimiento = estatus === 'MANTENIMIENTO';
  const validado = supervisor_validado !== '0'; // true si sí está validado

  return `
    <td class="actions-cell">
      <div class="btn-group btn-group-actions" role="group">
        ${isActivo
          ? validado
            ? `<button class="btn btn-action btn-registrar pulse-hover" 
                       title="Registrar parámetros" 
                       aria-label="Registrar" 
                       data-id="${cocedorId}">
                 <i data-lucide="test-tube"></i>
                 <span class="btn-text">Registrar</span>
               </button>`
            : `<button class="btn btn-action btn-registrar-disabled pulse-hover" 
                       title="No validado por supervisor" 
                       aria-label="Registrar (deshabilitado)">
                 <i data-lucide="test-tube"></i>
                 <span class="btn-text">Registrar</span>
               </button>`
          : isMantenimiento
            ? `<button class="btn btn-action btn-registrar-disabled pulse-hover" 
                       title="En mantenimiento" 
                       aria-label="Registrar (deshabilitado)">
                 <i data-lucide="test-tube"></i>
                 <span class="btn-text">Registrar</span>
               </button>`
            : ''
        }
      </div>
    </td>
  `;
};


const renderAccionesCocedor = (c, user) => {
  if (isAdminOrGerente(user)) return '';
  return tienePermiso('Cocedores', 'editar')
    ? renderActionsSupervisor(c.cocedor_id, c.estatus)
    : renderActionsControlProcesos(c.cocedor_id, c.estatus, c.supervisor_validado);
};

const renderBadgeEstatus = (estatus) => {
  const statusConfig = {
    'ACTIVO': {
      class: 'status-active',
      icon: 'zap',
      tooltip: 'Operativo'
    },
    'MANTENIMIENTO': {
      class: 'status-maintenance',
      icon: 'wrench',
      tooltip: 'En mantenimiento'
    },
    'INACTIVO': {
      class: 'status-inactive',
      icon: 'power-off',
      tooltip: 'Apagado'
    },
    'PENDIENTE': {
      class: 'status-pending',
      icon: 'clock',
      tooltip: 'Esperando acción'
    }
  };
  const config = statusConfig[estatus] || statusConfig['PENDIENTE'];
  return `
      <span class="status-badge ${config.class}" 
            title="${config.tooltip}" 
            aria-label="${config.tooltip}">
        <i data-lucide="${config.icon}"></i>
        ${estatus}
      </span>
    `;
}

export function setupStatusChangeListeners(tablaBody, reloadFn) {
  if (!tablaBody || tablaBody.__listenersBound) return;
  tablaBody.__listenersBound = true;

  tablaBody.addEventListener(
    "click",
    async (e) => {
      const btn = e.target.closest?.(
        "[data-action], .btn-pause, .btn-activate, .btn-registrar, .btn-validar"
      );
      if (!btn || btn.disabled) return;

      const action =
        btn.dataset.action ||
        (btn.classList.contains("btn-pause")
          ? "pause"
          : btn.classList.contains("btn-activate")
          ? "activate"
          : btn.classList.contains("btn-registrar")
          ? "registrar"
          : btn.classList.contains("btn-validar")
          ? "validar"
          : null);

      if (!action || !(action in ACTIONS)) return;

      const id = btn.dataset.id;
      if (!id) {
        showToast("Acción o ID no definidos.", false);
        return;
      }

      await ACTIONS[action]({
        id,
        btn,
        reloadFn,
      });
    },
    { passive: true }
  );
}


function reduceMateriles(materiales){
  return Object.values(materiales.reduce((acc, item) => {
    // Normalizamos nombre (quitamos espacios al inicio/fin)
    const nombre = item.nombre.trim();

    // Quitamos "kg" y convertimos a número
    const cantidadNum = parseFloat(item.cantidad);

    if (!acc[nombre]) {
      acc[nombre] = { nombre, cantidad: 0 };
    }
    acc[nombre].cantidad += cantidadNum;

    return acc;
  }, {}));
}