import type { GetServerSideProps } from 'next';
import { useEffect, useMemo } from 'react';

interface Props {
  destination: string;
  webUp: boolean;
  webUrlPublic: string;
  autoRedirect: boolean;
  to: 'login' | 'register';
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const webHealthUrl = process.env.WEB_HEALTH_URL;
  const webUrlInternal = process.env.WEB_URL_INTERNAL;
  const webUrlPublic = process.env.WEB_URL_PUBLIC || 'http://localhost:8080';

  const toParam = context.query.to as string | undefined;
  const to = toParam === 'register' ? 'register' : toParam === 'login' ? 'login' : 'login';
  const autorun = context.query.autorun === '1';
  const hasTo = toParam === 'login' || toParam === 'register';
  const autoRedirect = autorun || hasTo;

  console.log('[SSR] getServerSideProps:', { to, autorun, hasTo });
  console.log('[SSR] env:', { webHealthUrl, webUrlInternal, webUrlPublic });

  const candidates: (string | undefined)[] = [webHealthUrl, webUrlInternal];

  let webUp = false;
  for (const url of candidates) {
    if (!url) continue;
    try {
      console.log('[SSR] checking frontend health:', url);
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      clearTimeout(id);
      console.log('[SSR] health status:', url, res.status);
      if (res.ok) {
        webUp = true;
        break;
      }
    } catch (e) {
      console.log('[SSR] health error:', url, e instanceof Error ? e.message : String(e));
    }
  }

  const destPath = to === 'register' ? '/register' : '/login';
  const destination = webUp ? `${webUrlPublic}${destPath}` : `${webUrlPublic}/login`;

  console.log('[SSR] computed destination:', destination, 'webUp=', webUp);

  return {
    props: {
      destination,
      webUp,
      webUrlPublic,
      autoRedirect,
      to,
    },
  };
};

export default function Home({ destination, webUp, webUrlPublic, autoRedirect, to }: Props) {
  // Auto-redirigir con un pequeño retraso, salvo que se use ?noredirect=1
  useEffect(() => {
    if (!autoRedirect) return;
    const id = setTimeout(() => {
      window.location.href = destination;
    }, 1200);
    return () => clearTimeout(id);
  }, [autoRedirect, destination]);

  const statusLabel = useMemo(() => (webUp ? 'SPA en línea' : 'SPA no disponible'), [webUp]);
  const statusColor = webUp ? '#0a7f48' : '#b02a37';

  const loginUrl = `${webUrlPublic}/login`;
  const registerUrl = `${webUrlPublic}/register`;

  return (
    <div className="page">
      <header className="nav">
        <div className="brand">
          <img src="/Logo_TaskNotes.png" alt="TaskNotes" className="logo" />
          <span className="brand-name">TaskNotes</span>
        </div>
        <nav className="links">
          <a href="#features">Características</a>
          <a href="#benefits">Beneficios</a>
          <a href="#pricing">Planes</a>
          <a href="#about">Nosotros</a>
        </nav>
        <div className="cta">
          <a className="btn btn-outline" href={registerUrl}>Crear cuenta</a>
          <a className="btn btn-solid" href={loginUrl}>Entrar</a>
        </div>
      </header>

      <main className="hero">
        <div className="hero-left">
          <h1>
            Desbloquea tu productividad con notas y tareas inteligentes
          </h1>
          <p className="subtitle">
            Una plataforma moderna que combina notas, listas y etiquetas con búsqueda ultra-rápida en un ecosistema de microservicios.
          </p>
          <div className="hero-cta">
            <a className="btn btn-solid" href={loginUrl}>Ir a Login</a>
            <a className="btn btn-accent" href={registerUrl}>Ir a Registro</a>
            {autoRedirect ? (
              <span className="hint">Redirigiendo automáticamente… usa <code>?autorun=1</code> o define <code>?to=login|register</code></span>
            ) : (
              <span className="hint">Auto-redirección solo si usas <code>?autorun=1</code> o <code>?to=login|register</code></span>
            )}
          </div>

          <div className="metrics">
            <div className="metric"><div className="value">100K+</div><div className="label">Notas guardadas al día</div></div>
            <div className="metric"><div className="value">12K+</div><div className="label">Usuarios activos</div></div>
            <div className="metric"><div className="value">99.95%</div><div className="label">Disponibilidad</div></div>
            <div className="metric"><div className="value">15+</div><div className="label">Integraciones</div></div>
          </div>
        </div>
        <div className="hero-right">
          <div className="device-mock">
            <div className="rocket">🚀</div>
            <div className="mock-line" />
            <div className="mock-line short" />
            <div className="mock-cards">
              <div className="card" />
              <div className="card" />
              <div className="card" />
            </div>
          </div>
          <div className="status">
            <span className="badge" style={{ background: statusColor }}>{statusLabel}</span>
            <div className="status-details">
              <div>
                SPA público: <code>{webUrlPublic}</code>
              </div>
              <div>
                Destino calculado: <code>{destination}</code>
              </div>
              <div>
                Acción preferida: {to === 'register' ? 'Registrar nueva cuenta' : 'Iniciar sesión'}
              </div>
            </div>
          </div>
        </div>
      </main>

      <section id="features" className="features">
        <div className="feature">
          <div className="icon">⚡</div>
          <h3>Búsqueda instantánea</h3>
          <p>Encuentra cualquier nota o tarea al momento gracias a nuestro servicio de búsqueda indexada.</p>
        </div>
        <div className="feature">
          <div className="icon">🏷️</div>
          <h3>Etiquetas poderosas</h3>
          <p>Organiza con etiquetas y categorías para mantener tu información siempre a mano.</p>
        </div>
        <div className="feature">
          <div className="icon">🔒</div>
          <h3>Seguridad primero</h3>
          <p>Autenticación robusta y perfiles de usuario con control total sobre tus datos.</p>
        </div>
        <div className="feature">
          <div className="icon">🧩</div>
          <h3>Microservicios escalables</h3>
          <p>Arquitectura preparada para crecer sin comprometer rendimiento ni confiabilidad.</p>
        </div>
      </section>

      <section id="benefits" className="benefits">
        <div className="benefit">
          <h4>Menos fricción, más foco</h4>
          <p>Diseño limpio y accesible: captura ideas, tareas y recordatorios en segundos.</p>
        </div>
        <div className="benefit">
          <h4>Colabora sin esfuerzo</h4>
          <p>Comparte notas y listas con tu equipo, mantén sincronización y contexto.</p>
        </div>
        <div className="benefit">
          <h4>Automatiza tu flujo</h4>
          <p>Conecta TaskNotes con tus herramientas favoritas para disparar acciones y mantener todo en orden.</p>
        </div>
      </section>

      <section className="social">
        <div className="social-item">
          <strong>+12,000</strong>
          <span>Profesionales confían en TaskNotes</span>
        </div>
        <div className="social-item">
          <strong>Top 5</strong>
          <span>Herramienta de productividad en LATAM</span>
        </div>
        <div className="social-item">
          <strong>4.8/5</strong>
          <span>Calificación promedio de usuarios</span>
        </div>
      </section>

      <footer className="footer" id="about">
        <div>
          <span className="brand-foot">TaskNotes</span> — Hecho con ❤️ para ayudarte a pensar mejor.
        </div>
        <div className="foot-links">
          <a href={loginUrl}>Login</a>
          <a href={registerUrl}>Registro</a>
          <a href="#pricing">Planes</a>
          <a href="#features">Características</a>
        </div>
      </footer>

      <style jsx>{`
        :global(html, body) { margin:0; padding:0; }
        .page { min-height: 100vh; background: radial-gradient(1200px 600px at 20% 10%, #1e40af22, transparent), linear-gradient(135deg, #0f172a 0%, #0b1220 60%, #0b0f1a 100%); color: #e5e7eb; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif; }
        .nav { display:flex; align-items:center; justify-content:space-between; padding: 18px 28px; position: sticky; top: 0; backdrop-filter: blur(8px); background: rgba(2,8,23,0.6); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .brand { display:flex; align-items:center; gap:10px; }
        .logo { width:32px; height:32px; border-radius:6px; box-shadow: 0 10px 20px rgba(59,130,246,0.25); }
        .brand-name { font-weight: 700; letter-spacing: 0.2px; }
        .links { display:flex; gap:16px; opacity: 0.9; }
        .links a { color:#cbd5e1; text-decoration:none; font-size: 14px; }
        .links a:hover { color:#fff; }
        .cta { display:flex; gap:10px; }
        .btn { display:inline-block; text-decoration:none; font-weight:600; border-radius:10px; padding:10px 16px; font-size:14px; }
        .btn-outline { border:1px solid #334155; color:#cbd5e1; }
        .btn-outline:hover { border-color:#64748b; color:#fff; }
        .btn-solid { background:#3b82f6; color:#fff; box-shadow: 0 10px 20px rgba(59,130,246,0.25); }
        .btn-solid:hover { filter: brightness(1.05); }
        .btn-accent { background:#10b981; color:#0f172a; box-shadow: 0 10px 20px rgba(16,185,129,0.25); }
        .btn-accent:hover { filter: brightness(1.05); }

        .hero { display:grid; grid-template-columns: 1.1fr 0.9fr; gap: 32px; padding: 48px 28px 32px; max-width: 1100px; margin: 0 auto; }
        .hero-left h1 { font-size: 38px; line-height: 1.15; margin: 0 0 12px 0; }
        .subtitle { color: #cbd5e1; font-size: 16px; max-width: 640px; }
        .hero-cta { margin-top: 18px; display:flex; gap:12px; align-items:center; flex-wrap: wrap; }
        .hint { font-size: 12px; color: #94a3b8; }

        .metrics { margin-top: 22px; display:grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 12px; }
        .metric { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px; text-align:center; }
        .metric .value { font-size: 22px; font-weight: 700; }
        .metric .label { font-size: 12px; color: #94a3b8; }

        .hero-right { display:flex; flex-direction:column; gap: 12px; }
        .device-mock { background: linear-gradient(180deg, #0f172a, #0b1220); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px; height: 280px; position: relative; overflow:hidden; }
        .rocket { position:absolute; right: 22px; top: 18px; font-size: 28px; }
        .mock-line { height: 10px; background: rgba(255,255,255,0.08); border-radius: 8px; margin-top: 16px; }
        .mock-line.short { width: 70%; }
        .mock-cards { display:flex; gap: 10px; margin-top: 16px; }
        .card { flex:1; height: 140px; border-radius: 12px; background: radial-gradient(160px 100px at 60% 30%, rgba(59,130,246,0.25), transparent), rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .status { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .badge { padding:6px 10px; border-radius:999px; font-size:12px; color:#fff; }
        .status-details { font-size: 13px; color: #cbd5e1; display:grid; gap:4px; }
        .status-details code { background: #0b1220; padding: 2px 6px; border-radius: 6px; }

        .features { padding: 18px 28px 6px; max-width: 1100px; margin: 0 auto; display:grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .feature { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; }
        .feature .icon { font-size: 22px; }
        .feature h3 { margin: 6px 0; }
        .feature p { color: #94a3b8; font-size: 13px; }

        .benefits { padding: 10px 28px 6px; max-width: 1100px; margin: 0 auto; display:grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .benefit { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; }
        .benefit h4 { margin: 6px 0; }
        .benefit p { color: #94a3b8; font-size: 13px; }

        .social { padding: 14px 28px; max-width: 1100px; margin: 0 auto; display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .social-item { text-align:center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 12px; }
        .social-item strong { font-size: 20px; }
        .social-item span { display:block; color:#94a3b8; font-size: 12px; }

        .footer { margin-top: 12px; padding: 18px 28px 26px; display:flex; align-items:center; justify-content:space-between; color:#94a3b8; border-top: 1px solid rgba(255,255,255,0.06); max-width: 1100px; margin-left:auto; margin-right:auto; }
        .brand-foot { color:#fff; font-weight:600; }
        .foot-links { display:flex; gap: 14px; }
        .foot-links a { color:#cbd5e1; text-decoration:none; font-size: 14px; }
        .foot-links a:hover { color:#fff; }

        @media (max-width: 920px) {
          .hero { grid-template-columns: 1fr; }
          .features { grid-template-columns: 1fr 1fr; }
          .benefits { grid-template-columns: 1fr; }
          .social { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}