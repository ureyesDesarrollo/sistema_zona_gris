import { obtenerReporte } from "../../../services/cocedores.service.js";
import { RANGOS_VALIDACION } from "../../../pages/cocedores/modals/rangosParametros.js";

async function getData(fecha_inicio, fecha_fin) {
    const { data } = await obtenerReporte({
        fecha_inicio,
        fecha_fin,
    });

    return data;
}

// Detecta el tipo de parámetro a partir de la llave del dato
function keyToType(key) {
    if (key.endsWith('_solidos')) return 'solidos';
    if (key.endsWith('_agua')) return 'flujo';
    if (key.endsWith('_ntu')) return 'ntu';
    if (key.endsWith('_ph')) return 'ph';
    if (key.endsWith('temp_entrada')) return 'tempEntrada';
    if (key.endsWith('temp_salida')) return 'tempSalida';
    return null;
}

// Extrae el número de cocedor (1..7) desde llaves como "c1_agua", "c3_solidos", etc.
function getCocedorFromKey(key) {
    const m = /^c([1-7])_/.exec(key);
    return m ? m[1] : null;
}

// Obtiene el rango correcto en base al tipo y la llave (para flujo depende del cocedor)
function getRangeFor(key, type) {
    if (!type) return null;
    if (type === 'flujo') {
        const cocedor = getCocedorFromKey(key);
        return cocedor ? RANGOS_VALIDACION.flujo?.[cocedor] : null;
    }
    return RANGOS_VALIDACION[type] ?? null;
}

function parseNumber(v) {
    if (v === null || v === undefined) return NaN;
    const s = String(v).replace(',', '.').trim();
    const num = parseFloat(s);
    return isNaN(num) ? NaN : num;
}

// Usa los rangos correctos incluyendo flujo por cocedor
function isOutOfRange(key, value) {
    const type = keyToType(key);
    const range = getRangeFor(key, type);
    if (!range) return false;

    const num = parseNumber(value);
    if (isNaN(num)) return false;

    const { min, max } = range;
    if (min !== undefined && num < min) return true;
    if (max !== undefined && num > max) return true;
    return false;
}

function addTD(tr, value, key, extraClass = '') {
    const td = document.createElement('td');
    td.textContent = value ?? '';
    if (isOutOfRange(key, value)) td.classList.add('out');
    if (extraClass) td.classList.add(extraClass);
    tr.appendChild(td);
}

function populateTable(data) {
    const tbody = document.getElementById('tableBody');
    data.forEach(row => {
        const tr = document.createElement('tr');

        // Orden de columnas
        addTD(tr, row.dia, 'fecha');
        addTD(tr, row.hora, 'hora');
        addTD(tr, row.proceso, 'proceso');
        addTD(tr, row.c1_temp_entrada, 'c1_temp_entrada');
        addTD(tr, row.c1_temp_salida, 'c1_temp_salida');

        // C1
        addTD(tr, row.c1_solidos, 'c1_solidos', 'col-c1');
        addTD(tr, row.c1_agua, 'c1_agua', 'col-c1');
        addTD(tr, row.c1_ntu, 'c1_ntu', 'col-c1');
        addTD(tr, row.c1_ph, 'c1_ph', 'col-c1');

        // C2
        addTD(tr, row.c2_solidos, 'c2_solidos', 'col-c2');
        addTD(tr, row.c2_agua, 'c2_agua', 'col-c2');
        addTD(tr, row.c2_ntu, 'c2_ntu', 'col-c2');
        addTD(tr, row.c2_ph, 'c2_ph', 'col-c2');

        // C3
        addTD(tr, row.c3_solidos, 'c3_solidos', 'col-c3');
        addTD(tr, row.c3_agua, 'c3_agua', 'col-c3');
        addTD(tr, row.c3_ntu, 'c3_ntu', 'col-c3');
        addTD(tr, row.c3_ph, 'c3_ph', 'col-c3');

        // C4
        addTD(tr, row.c4_solidos, 'c4_solidos', 'col-c4');
        addTD(tr, row.c4_agua, 'c4_agua', 'col-c4');
        addTD(tr, row.c4_ntu, 'c4_ntu', 'col-c4');
        addTD(tr, row.c4_ph, 'c4_ph', 'col-c4');

        // C5
        addTD(tr, row.c5_solidos, 'c5_solidos', 'col-c5');
        addTD(tr, row.c5_agua, 'c5_agua', 'col-c5');
        addTD(tr, row.c5_ntu, 'c5_ntu', 'col-c5');
        addTD(tr, row.c5_ph, 'c5_ph', 'col-c5');

        // C6
        addTD(tr, row.c6_solidos, 'c6_solidos', 'col-c6');
        addTD(tr, row.c6_agua, 'c6_agua', 'col-c6');
        addTD(tr, row.c6_ntu, 'c6_ntu', 'col-c6');
        addTD(tr, row.c6_ph, 'c6_ph', 'col-c6');

        // C7
        addTD(tr, row.c7_solidos, 'c7_solidos', 'col-c7');
        addTD(tr, row.c7_agua, 'c7_agua', 'col-c7');
        addTD(tr, row.c7_ntu, 'c7_ntu', 'col-c7');
        addTD(tr, row.c7_ph, 'c7_ph', 'col-c7');

        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', async () => {

    const reportForm = document.getElementById('reportForm');
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fecha_inicio = document.getElementById('fecha_inicio').value;
        const fecha_fin = document.getElementById('fecha_fin').value;
        try {
            const data = await getData(fecha_inicio, fecha_fin);
            console.log(data);
            populateTable(data);
        } catch (error) {
            console.error('Error cargando datos:', error, error.message);
        }
    })
});

