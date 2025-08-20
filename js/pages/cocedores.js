import { renderCardsStatus } from '../components/cocedores/cardsStatus.js';
import { renderTableCocedores, setupStatusChangeListeners } from '../components/cocedores/tablaCocedores.js';
import { showConfirm, showProcessModal } from '../components/modal.js';
import { refreshSession, renderTimer, SESSION_DURATION_MS, isExpired } from '../components/sessionTimer.js';
import { showToast } from '../components/toast.js';
import { fetchCocedores, fetchProcesos, fetchProximaRevision, iniciarProcesos } from '../services/cocedores.service.js';
import { isAdminOrGerente, isSupervisor, isControlProcesos } from '../utils/session.js';

let refreshTimer = null;

export async function init() {
    const user = JSON.parse(localStorage.getItem('usuario') || 'null');
    const cocedores = await fetchCocedores();

    const btnIniciarProceso = document.getElementById('btn-iniciar-proceso');
    const proximaRevisionEl = document.getElementById('hora-proximo-registro');
    const tablaBody = document.getElementById('tabla-cocedores');
    const accionesColumn = document.getElementById('acciones-column');

    if (btnIniciarProceso) {
        btnIniciarProceso.classList.toggle('d-none', !isSupervisor(user));
    }
    if (accionesColumn) {
        accionesColumn.classList.toggle('d-none', !isSupervisor(user) && !isControlProcesos(user));
    }

    renderCardsStatus({ user, cocedores });
    const data = await fetchProximaRevision();
    if (proximaRevisionEl) {
        proximaRevisionEl.textContent = data ?? '--:--';
    }
    if (tablaBody) {
        renderTableCocedores(cocedores, tablaBody, isSupervisor(user) || isControlProcesos(user));
        setupStatusChangeListeners(
            tablaBody,
            async () => {
                const cocedores = await fetchCocedores();
                renderTableCocedores(cocedores, tablaBody, isSupervisor(user) || isControlProcesos(user));
            },
            user
        );
    }

    // --- Refresco cada 5 minutos SOLO para Admin/Gerente ---
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }

    if (isAdminOrGerente(user)) {
        refreshTimer = setInterval(async () => {
            console.log("Refrescando...");
          try {
            const cocedoresAct = await fetchCocedores({ cache: 'no-store' });
            if (tablaBody) {
              renderTableCocedores(cocedoresAct, tablaBody, isSupervisor(user) || isControlProcesos(user));
            }
            renderCardsStatus({ user, cocedores: cocedoresAct });
      
            const data = await fetchProximaRevision({ cache: 'no-store' });
            if (proximaRevisionEl) proximaRevisionEl.textContent = data ?? '--:--';
      
            // 👇 Mantén viva la sesión (solo si no expiró)
            if (!isExpired) {
              refreshSession(); // Reinicia completamente la sesión
              renderTimer(SESSION_DURATION_MS); // Repinta el contador a "10:00"
            }
          } catch (e) {
            console.warn('refresh error', e);
            // si falla, no “gastes” sesión
          }
        }, 5 * 60 * 1000);
      }
    btnIniciarProceso.addEventListener('click', async (e) => {
        const { user_id } = JSON.parse(localStorage.getItem('usuario') || 'null');
        e.preventDefault();
        const procesos = await fetchProcesos();
        const cocedoresList = await fetchCocedores();
        const cocedoresActivos = cocedoresList.filter(c => c.estatus === 'ACTIVO');
        const seleccion = await showProcessModal(procesos, cocedoresActivos, {
            allowMultiple: true,
            minSelection: 1,
            title: 'Selecciona procesos y cocedores'
        });

        if (seleccion) {
            const { procesos, cocedores } = seleccion;

            showConfirm('¿Desea iniciar los procesos seleccionados?').then(async (res) => {
                if (res) {
                    const payload = {
                        procesos,
                        cocedores,
                        descripcion: `Procesos: ${procesos.join(', ')}`,
                        usuario_id: user_id
                    };
                    const respuesta = await iniciarProcesos(payload);
                    if (!respuesta.success) {
                        if (respuesta.errors) {
                            // muestra los errores del backend
                            const mensaje = Object.entries(respuesta.errors)
                                .map(([campo, errores]) => `${campo}: ${errores.join(', ')}`)
                                .join('<br>');
                            showToast(mensaje, false);
                        }else{
                            showToast(respuesta.error, false);
                        }
                    } else {
                        showToast('Procesos iniciados correctamente', true);
                        const cocedores = await fetchCocedores();
                        renderTableCocedores(cocedores, tablaBody, isSupervisor(user));
                        //alert('Procesos iniciados correctamente');
                    }
                }
            });
        }

    });
}