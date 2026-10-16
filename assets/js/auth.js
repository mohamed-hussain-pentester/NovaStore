/**
 * NovaStore — Demo Authentication Controller (Login & Registration)
 * Provides client-side validation and local session simulation for Flask practice
 */

(function (window) {
  'use strict';

  function initLogin() {
    const form = document.getElementById('login-form');
    const quickfillBtn = document.getElementById('quickfill-demo-btn');
    if (!form) return;

    if (quickfillBtn) {
      quickfillBtn.addEventListener('click', () => {
        document.getElementById('login-email').value = 'alex.demo@novastore.local';
        document.getElementById('login-password').value = 'NovaDemo#2026';
        window.NovaCommon.showToast('Demo credentials prefilled.', 'info');
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailEl = document.getElementById('login-email');
      const passEl = document.getElementById('login-password');
      let isValid = true;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailEl.value.trim() || !emailRegex.test(emailEl.value.trim())) {
        emailEl.classList.add('is-invalid');
        isValid = false;
      } else {
        emailEl.classList.remove('is-invalid');
      }

      if (!passEl.value.trim() || passEl.value.length < 6) {
        passEl.classList.add('is-invalid');
        isValid = false;
      } else {
        passEl.classList.remove('is-invalid');
      }

      if (!isValid) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Signing In...';

      const isMock = window.NovaConfig.isMockMode();

      try {
        if (isMock) {
          // Simulate instant local demo login
          const demoUser = {
            name: emailEl.value.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            email: emailEl.value.trim(),
            token: 'demo-session-token-' + Date.now(),
            role: emailEl.value.includes('admin') ? 'admin' : 'customer'
          };

          localStorage.setItem(window.NovaConfig.STORAGE_KEYS.USER, JSON.stringify(demoUser));
          window.NovaCommon.showToast(`Welcome back, ${demoUser.name}!`, 'success');

          setTimeout(() => {
            window.location.href = demoUser.role === 'admin' ? 'admin.html' : 'index.html';
          }, 600);
        } else {
          // Send to Flask API: POST /api/v1/auth/login
          const res = await window.NovaApi.post('/auth/login', {
            email: emailEl.value.trim(),
            password: passEl.value,
          });

          const user = res.user || {
            email: emailEl.value.trim(),
            token: res.token || res.access_token,
            name: res.name || 'Flask User'
          };

          localStorage.setItem(window.NovaConfig.STORAGE_KEYS.USER, JSON.stringify(user));
          window.NovaCommon.showToast('Logged in via Flask backend!', 'success');
          setTimeout(() => { window.location.href = 'index.html'; }, 600);
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In';
        window.NovaCommon.showToast(`Login failed: ${err.message}`, 'error');
      }
    });
  }

  function initRegister() {
    const form = document.getElementById('register-form');
    const quickfillBtn = document.getElementById('quickfill-register-btn');
    if (!form) return;

    if (quickfillBtn) {
      quickfillBtn.addEventListener('click', () => {
        document.getElementById('reg-name').value = 'Taylor Jordan';
        document.getElementById('reg-email').value = 'taylor.jordan@example.com';
        document.getElementById('reg-password').value = 'PracticePass123!';
        document.getElementById('reg-confirm-password').value = 'PracticePass123!';
        window.NovaCommon.showToast('Sample registration details filled.', 'info');
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameEl = document.getElementById('reg-name');
      const emailEl = document.getElementById('reg-email');
      const passEl = document.getElementById('reg-password');
      const confirmEl = document.getElementById('reg-confirm-password');
      let isValid = true;

      if (!nameEl.value.trim() || nameEl.value.trim().length < 2) {
        nameEl.classList.add('is-invalid');
        isValid = false;
      } else {
        nameEl.classList.remove('is-invalid');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailEl.value.trim() || !emailRegex.test(emailEl.value.trim())) {
        emailEl.classList.add('is-invalid');
        isValid = false;
      } else {
        emailEl.classList.remove('is-invalid');
      }

      if (!passEl.value || passEl.value.length < 6) {
        passEl.classList.add('is-invalid');
        isValid = false;
      } else {
        passEl.classList.remove('is-invalid');
      }

      if (confirmEl.value !== passEl.value) {
        confirmEl.classList.add('is-invalid');
        isValid = false;
      } else {
        confirmEl.classList.remove('is-invalid');
      }

      if (!isValid) {
        window.NovaCommon.showToast('Please correct form validation issues.', 'warning');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Creating Account...';

      const isMock = window.NovaConfig.isMockMode();

      try {
        if (isMock) {
          const newUser = {
            name: nameEl.value.trim(),
            email: emailEl.value.trim(),
            token: 'demo-reg-token-' + Date.now(),
            role: 'customer'
          };
          localStorage.setItem(window.NovaConfig.STORAGE_KEYS.USER, JSON.stringify(newUser));
          window.NovaCommon.showToast(`Account created for ${newUser.name}!`, 'success');

          setTimeout(() => {
            window.location.href = 'index.html';
          }, 600);
        } else {
          // Send to Flask API: POST /api/v1/auth/register
          const res = await window.NovaApi.post('/auth/register', {
            name: nameEl.value.trim(),
            email: emailEl.value.trim(),
            password: passEl.value,
          });

          const user = res.user || {
            email: emailEl.value.trim(),
            token: res.token,
            name: nameEl.value.trim()
          };

          localStorage.setItem(window.NovaConfig.STORAGE_KEYS.USER, JSON.stringify(user));
          window.NovaCommon.showToast('Registered with Flask backend!', 'success');
          setTimeout(() => { window.location.href = 'index.html'; }, 600);
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Demo Account';
        window.NovaCommon.showToast(`Registration error: ${err.message}`, 'error');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    initRegister();
  });

  window.NovaAuth = {
    initLogin,
    initRegister,
  };
})(window);
