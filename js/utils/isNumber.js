export function validarInputNumerico(inputEl, inputError, { min, max, nombre }) {
  if (!inputEl) return false;

  // Validación básica de min/max
  if (typeof min !== "number" || typeof max !== "number" || min > max) {
    // Marcamos inválido si la config es incorrecta
    inputEl.classList.remove(
      "custom-modal-form-control-valid",
      "custom-modal-form-control-alerta"
    );
    inputEl.classList.add("custom-modal-form-control-invalid");
    if (inputError) {
      inputError.style.display = "block";
      inputError.textContent = "Configuración inválida de min/max.";
    }
    return false;
  }

  const showError = (msg) => {
    inputEl.classList.remove(
      "custom-modal-form-control-valid",
      "custom-modal-form-control-alerta"
    );
    inputEl.classList.add("custom-modal-form-control-invalid");
    if (inputError) {
      inputError.style.display = "block";
      inputError.textContent = msg;
    }
  };

  const showWarning = (msg) => {
    inputEl.classList.remove(
      "custom-modal-form-control-valid",
      "custom-modal-form-control-invalid"
    );
    inputEl.classList.add("custom-modal-form-control-alerta");
    if (inputError) {
      inputError.style.display = "block";
      inputError.textContent = msg;
    }
  };

  const showValid = () => {
    inputEl.classList.remove(
      "custom-modal-form-control-invalid",
      "custom-modal-form-control-alerta"
    );
    inputEl.classList.add("custom-modal-form-control-valid");
    if (inputError) inputError.style.display = "none";
  };

  const raw = (inputEl.value ?? "").toString().replace(",", ".").trim();
  const value = parseFloat(raw);

  // No número
  if (raw === "" || Number.isNaN(value)) {
    showError(
      nombre
        ? `Debe ingresar un valor válido para ${nombre}.`
        : "Debe ingresar un valor numérico válido."
    );
    return false;
  }

  // Fuera de rango
  if (value < min || value > max) {
    showError(
      nombre
        ? `${nombre} debe estar entre ${min} y ${max}.`
        : `El valor debe estar entre ${min} y ${max}.`
    );
    return false;
  }

  // En rango, pero cerca de los límites (10% por defecto)
  const rango = max - min;
  const margen = rango > 0 ? rango * 0.1 : 0;
  const cercaDelMin = value <= min + margen;
  const cercaDelMax = value >= max - margen;

  if (margen > 0 && (cercaDelMin || cercaDelMax)) {
    showWarning(
      nombre
        ? `${nombre} está cerca del límite permitido (${min} - ${max}). Por favor, verifique.`
        : `El valor está cerca del límite permitido (${min} - ${max}).`
    );
    return true;
  }

  // Correcto
  showValid();
  return true;
}