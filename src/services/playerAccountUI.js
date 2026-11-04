import { cloud, loadProgress } from './playerCloud.js';
import './playerAccountUI.css';

export function initializePlayerAccountUI() {
  const root = document.createElement('aside');
  root.id = 'ninjuku-account';
  root.innerHTML = `
    <button id="ninjuku-account-toggle" type="button">Cuenta / Monedas</button>
    <section id="ninjuku-account-panel" aria-label="Cuenta de Ninjuku">
      <div class="ninjuku-account-head"><strong>MI CUENTA</strong><button id="ninjuku-account-close" type="button" aria-label="Cerrar panel">×</button></div>
      <p id="ninjuku-account-status" role="status"></p>
      <p class="ninjuku-account-intro">Crea una cuenta para guardar puntajes y monedas entre dispositivos, o juega como invitado.</p>
      <form id="ninjuku-auth-form">
        <label>Correo electrónico<input name="email" type="email" required autocomplete="email" /></label>
        <label>Contraseña<input name="password" type="password" minlength="6" required autocomplete="current-password" /></label>
        <div class="ninjuku-account-actions"><button type="submit" value="login">Entrar</button><button type="button" id="ninjuku-register">Registrarse</button></div>
      </form>
      <div id="ninjuku-player-profile" hidden>
        <p id="ninjuku-player-email"></p>
        <p id="ninjuku-player-stats">Cargando...</p>
        <button id="ninjuku-logout" type="button">Cerrar sesión</button>
      </div>
      <button id="ninjuku-account-guest" type="button">Continuar como invitado / Volver al juego</button>
    </section>`;
  document.body.append(root);
  const panel = root.querySelector('#ninjuku-account-panel');
  const status = root.querySelector('#ninjuku-account-status');
  const form = root.querySelector('#ninjuku-auth-form');
  const profile = root.querySelector('#ninjuku-player-profile');
  const emailText = root.querySelector('#ninjuku-player-email');
  const stats = root.querySelector('#ninjuku-player-stats');
  root.querySelector('#ninjuku-account-toggle').onclick = () => { panel.hidden = !panel.hidden; };
  root.querySelector('#ninjuku-account-close').onclick = () => { panel.hidden = true; };
  root.querySelector('#ninjuku-account-guest').onclick = () => { panel.hidden = true; };
  const message = text => { status.textContent = text; };
  const refresh = async () => {
    if (!cloud) { message('Falta configurar Supabase en .env.local'); form.hidden = true; profile.hidden = true; return; }
    try {
      const { data: { user } } = await cloud.auth.getUser();
      form.hidden = Boolean(user);
      profile.hidden = !user;
      if (!user) { message('Inicia sesión para conservar tus puntos y monedas.'); return; }
      emailText.textContent = user.email || 'Jugador';
      const p = await loadProgress();
      stats.textContent = `Partidas: ${p.games_played} | Mejor puntuación: ${p.best_score} | Puntos acumulados: ${p.total_score} | Monedas: ${p.coins}`;
      message('Cuenta conectada');
    } catch (error) { message(`Error: ${error.message}`); }
  };
  form.onsubmit = async event => {
    event.preventDefault();
    if (!cloud) return;
    const data = new FormData(form);
    message('Iniciando sesión...');
    const { error } = await cloud.auth.signInWithPassword({email: String(data.get('email')), password: String(data.get('password'))});
    if (error) message(error.message); else { form.reset(); await refresh(); }
  };
  root.querySelector('#ninjuku-register').onclick = async () => {
    if (!cloud) return;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    message('Registrando usuario...');
    const { data: result, error } = await cloud.auth.signUp({email: String(data.get('email')), password: String(data.get('password'))});
    if (error) message(error.message);
    else { form.reset(); await refresh(); if (!result.session) message('Revisa tu correo para confirmar la cuenta.'); }
  };
  root.querySelector('#ninjuku-logout').onclick = async () => {
    if (!cloud) return;
    const { error } = await cloud.auth.signOut();
    if (error) message(error.message); else await refresh();
  };
  cloud?.auth.onAuthStateChange(() => { setTimeout(() => { void refresh(); }, 0); });
  window.addEventListener('ninjuku:progress-updated', () => { void refresh(); });
  void refresh();
}
