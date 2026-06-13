const form = document.getElementById('application-form');
const successMessage = document.getElementById('success-message');
const successMessageText = document.getElementById('success-message-text');
const comments = document.getElementById('comments');
const commentsCounter = document.getElementById('comments-counter');

function setFieldError(input, errorId, message) {
  const error = document.getElementById(errorId);
  input.setAttribute('aria-invalid', 'true');
  if (error) {
    error.textContent = message;
    error.classList.remove('hidden');
  }
}

function clearFieldError(input, errorId) {
  const error = document.getElementById(errorId);
  input.setAttribute('aria-invalid', 'false');
  if (error) {
    error.classList.add('hidden');
  }
}

function hasAtLeastTwoWords(value) {
  return value.trim().split(/\s+/).filter(Boolean).length >= 2;
}

function validateFullName() {
  const input = document.getElementById('full-name');
  if (!hasAtLeastTwoWords(input.value)) {
    setFieldError(input, 'full-name-error', 'Por favor, introduce nombre y apellidos');
    return false;
  }
  clearFieldError(input, 'full-name-error');
  return true;
}

function validateEmail() {
  const input = document.getElementById('email');
  const valid = input.validity.valid && input.value.trim() !== '';
  if (!valid) {
    setFieldError(input, 'email-error', 'Introduce un correo válido');
    return false;
  }
  clearFieldError(input, 'email-error');
  return true;
}

function validatePhone() {
  const input = document.getElementById('phone');
  const value = input.value.trim();
  const phoneRegex = /^\+\d{1,3}\s?\d{2,4}(?:\s?\d{2,4}){1,3}$/;
  if (!phoneRegex.test(value)) {
    setFieldError(input, 'phone-error', 'Incluye el código de país, ej. +34 600 000 000');
    return false;
  }
  clearFieldError(input, 'phone-error');
  return true;
}

function validateCountry() {
  const input = document.getElementById('country');
  if (!input.value) {
    setFieldError(input, 'country-error', 'Selecciona tu país de residencia');
    return false;
  }
  clearFieldError(input, 'country-error');
  return true;
}

function validateExperienceYears() {
  const input = document.getElementById('experience-years');
  const value = Number(input.value);
  if (input.value === '' || Number.isNaN(value) || value < 0 || value > 50) {
    setFieldError(input, 'experience-years-error', 'Introduce un valor entre 0 y 50');
    return false;
  }
  clearFieldError(input, 'experience-years-error');
  return true;
}

function validateInterestSector() {
  const input = document.getElementById('interest-sector');
  if (!input.value) {
    setFieldError(input, 'interest-sector-error', 'Selecciona un sector');
    return false;
  }
  clearFieldError(input, 'interest-sector-error');
  return true;
}

function validateEnglishLevel() {
  const input = document.getElementById('english-level');
  if (!input.value) {
    setFieldError(input, 'english-level-error', 'Selecciona tu nivel de inglés');
    return false;
  }
  clearFieldError(input, 'english-level-error');
  return true;
}

function validateAvailability() {
  const radios = document.querySelectorAll('input[name="availability"]');
  const firstRadio = radios[0];
  const selected = Array.from(radios).some((radio) => radio.checked);

  if (!selected) {
    setFieldError(firstRadio, 'availability-error', 'Selecciona tu disponibilidad');
    return false;
  }

  radios.forEach((radio) => {
    radio.setAttribute('aria-invalid', 'false');
  });
  const error = document.getElementById('availability-error');
  if (error) {
    error.classList.add('hidden');
  }
  return true;
}

function validateLinkedIn() {
  const input = document.getElementById('linkedin');
  const value = input.value.trim();
  if (value === '') {
    clearFieldError(input, 'linkedin-error');
    return true;
  }

  let isValidUrl = false;
  try {
    const url = new URL(value);
    const normalized = `${url.hostname.toLowerCase()}${url.pathname.toLowerCase()}`;
    isValidUrl = normalized.includes('linkedin.com/in/');
  } catch (error) {
    isValidUrl = false;
  }

  if (!isValidUrl) {
    setFieldError(input, 'linkedin-error', 'Introduce una URL válida de LinkedIn');
    return false;
  }

  clearFieldError(input, 'linkedin-error');
  return true;
}

function validatePrivacy() {
  const input = document.getElementById('privacy-policy');
  if (!input.checked) {
    setFieldError(input, 'privacy-error', 'Debes aceptar la política de datos para continuar.');
    return false;
  }
  clearFieldError(input, 'privacy-error');
  return true;
}

function updateCommentsCounter() {
  const current = comments.value.length;
  commentsCounter.textContent = `${current} / 500 caracteres`;
}

function validateAll() {
  const results = [
    validateFullName(),
    validateEmail(),
    validatePhone(),
    validateCountry(),
    validateExperienceYears(),
    validateInterestSector(),
    validateEnglishLevel(),
    validateAvailability(),
    validateLinkedIn(),
    validatePrivacy()
  ];

  return results.every(Boolean);
}

function focusFirstInvalidField() {
  const firstInvalid = form.querySelector('[aria-invalid="true"]');
  if (firstInvalid) {
    firstInvalid.focus();
  }
}

document.getElementById('full-name').addEventListener('blur', validateFullName);
document.getElementById('email').addEventListener('blur', validateEmail);
document.getElementById('phone').addEventListener('blur', validatePhone);
document.getElementById('country').addEventListener('blur', validateCountry);
document.getElementById('experience-years').addEventListener('blur', validateExperienceYears);
document.getElementById('interest-sector').addEventListener('blur', validateInterestSector);
document.getElementById('english-level').addEventListener('blur', validateEnglishLevel);
document.querySelectorAll('input[name="availability"]').forEach((radio) => {
  radio.addEventListener('blur', validateAvailability);
  radio.addEventListener('change', validateAvailability);
});
document.getElementById('linkedin').addEventListener('blur', validateLinkedIn);
document.getElementById('privacy-policy').addEventListener('blur', validatePrivacy);
document.getElementById('privacy-policy').addEventListener('change', validatePrivacy);

comments.addEventListener('input', updateCommentsCounter);

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!validateAll()) {
    focusFirstInvalidField();
    return;
  }

  const nameValue = document.getElementById('full-name').value.trim();
  form.classList.add('hidden');
  successMessage.classList.remove('hidden');
  successMessageText.textContent = `✓ ¡Perfil recibido! Revisaremos tu candidatura y te contactaremos si surge una oportunidad. Gracias, ${nameValue}.`;
  successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

form.addEventListener('reset', () => {
  requestAnimationFrame(() => {
    form.querySelectorAll('[aria-invalid]').forEach((field) => {
      field.setAttribute('aria-invalid', 'false');
    });

    form.querySelectorAll('[id$="-error"]').forEach((error) => {
      error.classList.add('hidden');
    });

    updateCommentsCounter();
    successMessage.classList.add('hidden');
    form.classList.remove('hidden');
  });
});

updateCommentsCounter();
