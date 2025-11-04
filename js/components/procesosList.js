import { formatter } from "../utils/formatter.js";
import { procesarMateriales, renderMateriales } from "../utils/renderMateriales.js";

export function procesosHtml(proceso) {
    const materiales = procesarMateriales(proceso.materiales_con_cantidad);
    const totalMateriales = materiales.length;
    const procesos = proceso.agrupacion_descripcion ? proceso.agrupacion_descripcion : proceso.pro_id;

    return `
    <label class="list-group-item d-flex align-items-start py-3 px-3 hover-bg-light position-relative" 
           style="transition: all 0.2s;border-bottom: 1px solid #f8f9fa;cursor: pointer;">
      <input class="form-check-input me-3 process-selector mt-1" 
             type="checkbox" 
             value="${procesos}" 
             style="width: 1.1em; height: 1.1em;"
             data-proceso="${proceso.proceso_agrupado_id ?? proceso.pro_id}">
      
      <div class="d-flex flex-column w-100">
        <!-- Primera fila: ID, Peso y Descripción -->
        <div class="d-flex w-100 align-items-center mb-2">
          <div class="w-25 pe-2">
            <span class="badge bg-primary bg-opacity-10 text-primary rounded-1" 
                  style="font-size: 0.85rem;padding: 0.35em 0.7em;font-weight: 500;">
              #${procesos}
            </span>
          </div>
          
          <div class="w-25 pe-2">
            <span class="text-dark" style="font-size: 0.95rem; font-weight: 500;">
              ${formatter.format(proceso.pro_total_kg || proceso.total_kg_agrupado)} 
              <small class="text-muted">kg</small>
            </span>
          </div>
          
          <div class="w-50">
            <div class="text-dark" 
                 style="font-size: 0.9rem; line-height: 1.3; font-weight: 500;"
                 title="${proceso.pt_descripcion ? proceso.pt_descripcion : proceso.pt_descripciones || 'Sin descripción'}">
              ${proceso.pt_descripcion ? proceso.pt_descripcion : proceso.pt_descripciones || 'Sin descripción'}
            </div>
          </div>
        </div>
        
        <!-- Segunda fila: Materiales -->
        ${totalMateriales > 0 ? `
        <div class="d-flex w-100 align-items-center">
          <div class="w-25 pe-2">
            <small class="text-muted" style="font-size: 0.75rem;">Materiales (${totalMateriales}):</small>
          </div>
          <div class="w-75">
            <div class="d-flex flex-wrap gap-1">
              ${renderMateriales(materiales)}
            </div>
          </div>
        </div>
        ` : `
        <div class="d-flex w-100 align-items-center">
          <div class="w-25 pe-2">
            <small class="text-muted" style="font-size: 0.75rem;">Materiales:</small>
          </div>
          <div class="w-75">
            <span class="text-muted" style="font-size: 0.8rem;">Sin materiales</span>
          </div>
        </div>
        `}
      </div>
    </label>`;
}