function validarDecimal(e, input) {
  const char = String.fromCharCode(e.which);

  // permitir borrar, tab, flechas
  if ([8, 9, 37, 39, 46].includes(e.keyCode)) return true;

  // si ya hay un punto
  if (char === ".") {
    // no permitir si ya hay punto o aún no se escribió el primer dígito
    if (input.value.includes(".") || input.value.length === 0) return false;
    return true;
  }

  // sólo permitir dígitos 1-9 en la primera posición
  if (/^[1-9]$/.test(char)) {
    // si ya hay un dígito antes del punto, no permitir otro
    if (input.value.length > 0 && !input.value.includes(".")) return false;
    return true;
  }

  // sólo permitir dígitos 0-9 después del punto
  if (/[0-9]/.test(char) && input.value.includes(".")) return true;

  return false;
}

function validarNTU(e, input) {
  //solo permitir números
  if (/[0-9]/.test(e.key)) return true;

  //Valor maximo 1000
  if (input.value.length >= 4) return false;

  
  return false;
}