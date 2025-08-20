// components/cocedores/cardsStatus.js
export function renderCardsStatus({user, cocedores}) {
    const container = document.getElementById('status-cards');
    if (!container) {
      console.warn('renderCardsStatus: no existe #status-cards en el DOM');
      return;
    }
  
    // 1) Inyecta el HTML de las tarjetas
    container.innerHTML = getCardsMarkup();
  
    // 2) Lee el usuario y decide visibilidad
    const perfil = user?.perfil || user?.perfil?.nombre || '';
    const isAdmin = perfil === 'Admin';
  
    // 3) Muestra/oculta según perfil
    container.classList.toggle('d-none', !isAdmin);
  
    const countActive = container.querySelector('#cocedoresCardCountActive');
    const countMaintenance = container.querySelector('#cocedoresCardCountMaintenance');
    const countAlerts = container.querySelector('#cocedoresCardCountAlerts');
    // (opcional) también ocultar cada tarjeta si no es admin
    [countActive, countMaintenance, countAlerts].forEach(el => {
      el?.closest('.col')?.classList.toggle('d-none', !isAdmin);
    });
  
    // (opcional) inicializa valores
    if (countActive) countActive.textContent = countByStatus(cocedores, 'ACTIVO');
    if (countMaintenance) countMaintenance.textContent = countByStatus(cocedores, 'MANTENIMIENTO');
    if (countAlerts) countAlerts.textContent = alertasActivas(cocedores);
  }
  
  function getCardsMarkup() {
    return `
      <div class="col">
        <div class="card h-100 fade-in" style="animation-delay: 0.1s">
          <div class="card-body text-center">
            <div class="mb-3">
              <div class="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center" style="width:60px;height:60px">
                <i data-lucide="flame" style="width:40px; height:40px;"></i>
              </div>
            </div>
            <h3 class="mb-1" id="cocedoresCardCountActive">...</h3>
            <p class="text-muted mb-0">Cocedores activos</p>
          </div>
        </div>
      </div>
  
      <div class="col">
        <div class="card h-100 fade-in" style="animation-delay: 0.3s">
          <div class="card-body text-center">
            <div class="mb-3">
              <div class="bg-warning bg-opacity-10 text-warning rounded-circle d-inline-flex align-items-center justify-content-center" style="width:60px;height:60px">
                <i data-lucide="triangle-alert" style="width:40px; height:40px;"></i>
              </div>
            </div>
            <h3 class="mb-1" id="cocedoresCardCountAlerts">...</h3>
            <p class="text-muted mb-0">Cocedores sin verificar por supervisor</p>
          </div>
        </div>
      </div>
  
      <div class="col">
        <div class="card h-100 fade-in" style="animation-delay: 0.4s">
          <div class="card-body text-center">
            <div class="mb-3">
              <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center" style="width:60px;height:60px">
                <i data-lucide="wrench" style="width:40px; height:40px;"></i>
              </div>
            </div>
            <h3 class="mb-1" id="cocedoresCardCountMaintenance">...</h3>
            <p class="text-muted mb-0">Mantenimiento</p>
          </div>
        </div>
      </div>
    `;
  }

  // --- Contador de estatus ---
function countByStatus(arr, status) {
    return Array.isArray(arr)
      ? arr.filter(x => x.estatus === status).length
      : 0;
  }
  
  function alertasActivas(arr){
   return Array.isArray(arr) ? arr.filter(x => x.supervisor_validado === '0').length : 0; 
  }