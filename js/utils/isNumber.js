export function validarInputNumerico(inputEl, inputError, { min, max, nombre }) {
    if (!inputEl) return false;
  
    const value = parseFloat(inputEl.value);
  
    // Si no es número válido
    if (isNaN(value)) {
      inputEl.classList.remove("cocedor-form-control-valid");
      inputEl.classList.add("cocedor-form-control-invalid");
      inputError.style.display = "block";
      inputError.textContent = `Debe ingresar un valor válido para ${nombre}.`;
      return false;
    }
  
    // Validar rango
    if (value < min || value > max) {
      inputEl.classList.remove("cocedor-form-control-valid");
      inputEl.classList.add("cocedor-form-control-invalid");
      inputError.style.display = "block";
      inputError.textContent = `${nombre} debe estar entre ${min} y ${max}.`;
      return false;
    }
  
    // Si es correcto
    inputEl.classList.remove("cocedor-form-control-invalid");
    inputEl.classList.add("cocedor-form-control-valid");
    inputError.style.display = "none";
    return true;
  }
  