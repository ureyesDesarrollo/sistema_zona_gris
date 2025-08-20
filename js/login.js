import { BASE_API } from "./config.js";
import { fetchApi } from "./utils/api.js";

document.addEventListener('DOMContentLoaded', () => {
    const warning = document.getElementById("caps-warning");

    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const usernameError = document.getElementById('username-error');
    const passwordError = document.getElementById('password-error');
    const loginErrorBox = document.getElementById('loginError');
    const loginErrorText = document.getElementById('loginErrorText');
    const togglePassword = document.getElementById('togglePassword');
    const btnLogin = document.getElementById('btn-login');

    passwordInput.addEventListener("keydown", (e) => {
        if (e.getModifierState("CapsLock")) {
            warning.style.display = "block";
        } else {
            warning.style.display = "none";
        }
    });

    passwordInput.addEventListener("blur", () => {
        warning.style.display = "none";
    });
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            const icon = togglePassword.querySelector('i, svg');
            if (icon) {
                let iconAttr = icon.getAttribute('data-lucide');
                iconAttr = isPassword ? 'eye-closed' : 'eye';
                icon.setAttribute('data-lucide', iconAttr);
                lucide.createIcons();
            }
            passwordInput.focus();
        });
    }

    usernameInput.addEventListener('input', () => {
        if (usernameInput.value.trim() !== '') {
            usernameInput.classList.remove('error');
            usernameInput.setAttribute('aria-invalid', 'false');
            usernameError.classList.remove('show');
        }
    });

    passwordInput.addEventListener('input', () => {
        if (passwordInput.value.trim() !== '') {
            passwordInput.classList.remove('error');
            passwordInput.setAttribute('aria-invalid', 'false');
            passwordError.classList.remove('show');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (username.trim() === '') {
            usernameInput.classList.add('error');
            usernameInput.setAttribute('aria-invalid', 'true');
            usernameError.classList.add('show');
            isValid = false;
        }

        if (password.trim() === '') {
            passwordInput.classList.add('error');
            passwordInput.setAttribute('aria-invalid', 'true');
            passwordError.classList.add('show');
            isValid = false;
        }

        if (isValid) {
            btnLogin.disabled = true;
            btnLogin.classList.add('disabled');
            btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Iniciando sesión...';
            handleLogin(username, password, loginErrorBox, loginErrorText, btnLogin);
        }
    });
});

const ensureMinDuration = async (t0, min = 500) => {
    const elapsed = performance.now() - t0;
    if (elapsed < min) {
        await new Promise(r => setTimeout(r, min - elapsed));
    }
};

async function handleLogin(usuario, password, loginErrorBox, loginErrorText, btnLogin) {
    try {
        btnLogin.disabled = true;
        btnLogin.classList.add('disabled');
        btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Iniciando sesión...';

        const t0 = performance.now();

        const res = await fetchApi(`${BASE_API}/login`, 'POST', JSON.stringify({ usuario, password }));

        if (!res.success || res.error) {
            throw new Error(res.error || `Error ${res.status}`);
        }

        await ensureMinDuration(t0);

        localStorage.setItem('usuario', JSON.stringify(res.data));
        btnLogin.innerHTML = 'Accediendo...';
        window.location.href = 'index_inicio.html';

    } catch (err) {
        await ensureMinDuration(performance.timeOrigin ? performance.now() : 0);

        loginErrorBox.classList.add('show');
        loginErrorText.textContent = err.message || 'Error al iniciar sesión';

        // Reset botón
        btnLogin.disabled = false;
        btnLogin.classList.remove('disabled');
        btnLogin.innerHTML = 'Iniciar sesión';
    }
}

