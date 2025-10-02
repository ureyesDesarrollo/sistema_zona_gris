export function validarInputNumerico(inputEl, inputError, { min, max, nombre }) {
  if (!inputEl) return false;

  const value = parseFloat(inputEl.value);

  // Limpieza previa de clases
  inputEl.classList.remove(
    "custom-form-control-valid",
    "custom-form-control-invalid",
    "custom-form-control-alerta"
  );

  // Si no es número válido
  if (isNaN(value)) {
    inputEl.classList.add("custom-form-control-invalid");
    inputError.style.display = "block";
    inputError.textContent = `Debe ingresar un valor válido para ${nombre}.`;
    return false;
  }

  // Fuera de rango
  if (value < min || value > max) {
    inputEl.classList.add("custom-form-control-invalid");
    inputError.style.display = "block";
    inputError.textContent = `${nombre} debe estar entre ${min} y ${max}.`;
    return false;
  }

  // En rango válido, pero dentro del margen de alerta
  const margen = (max - min) * 0.1;
  const cercaDelMin = value >= min && value <= min + margen;
  const cercaDelMax = value <= max && value >= max - margen;

  if (cercaDelMin || cercaDelMax) {
    inputEl.classList.add("custom-form-control-alerta");
    inputError.style.display = "block";
    inputError.textContent = `${nombre} está cerca del límite permitido (${min} - ${max}). Por favor, verifique.`;
    return true;
  }

  // Valor correcto, sin alertas
  inputEl.classList.add("custom-form-control-valid");
  inputError.style.display = "none";
  return true;
}
