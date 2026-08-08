import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import { ArrowRight, Building2, CalendarCheck2, Check, Eye, EyeOff, Lock, LockKeyhole, Mail, Moon, ShieldCheck, ShieldQuestion, Sparkles, Sun, WalletCards, Zap } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [tenantSlug, setTenantSlug] = useState(() => localStorage.getItem('acionar_v3_slug') || '');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('color-theme');
    if (saved) return saved === 'dark';
    return false; // Padrão de fábrica é claro (false)
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tenantValido, setTenantValido] = useState(false);

  useEffect(() => {
    if (!tenantSlug.trim()) {
      setTenantValido(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const slugFormatted = tenantSlug.trim().toLowerCase();
        const response = await fetch(`/api/public/tenant/${slugFormatted}`);
        if (response.ok) {
          setTenantValido(true);
        } else {
          setTenantValido(false);
        }
      } catch (err) {
        setTenantValido(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [tenantSlug]);

  React.useEffect(() => {
    const saved = localStorage.getItem('color-theme') || 'light';
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDark(false);
    }

    // Animações sutis com GSAP
    gsap.fromTo('.login-box',
      { opacity: 0, scale: 0.96, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'power2.out' }
    );
    gsap.fromTo('.login-field',
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.1 }
    );
    gsap.fromTo('.login-logo',
      { opacity: 0, scale: 0.6, rotate: -15 },
      { opacity: 1, scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(1.5)' }
    );
  }, []);

  React.useEffect(() => {
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href = dark ? "/logo-tema-escuro.png?v=4" : "/logo-tema-claro.png?v=4";
    }
  }, [dark]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(tenantSlug.trim().toLowerCase(), email.trim().toLowerCase(), senha);
    } catch (err) {
      setError('Não foi possível conectar, verifique suas credenciais ou acione o suporte');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('color-theme', next ? 'dark' : 'light');
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#eef4fb] text-slate-900 dark:bg-[#030712] dark:text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-600/10" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl dark:bg-indigo-600/10" />
      </div>

      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between pt-safe-top">
        <div className="flex items-center gap-2">
          <img src={dark ? "/logo-tema-escuro.png?v=4" : "/logo-tema-claro.png?v=4"} alt="Logo Acionar" className="login-logo h-10 w-10 object-contain rounded-xl shadow-lg shadow-blue-500/10" />
          <div>
            <span className="block text-xl font-black tracking-tight text-slate-900 dark:text-white">Acionar</span>
            <span className="block text-[9px] font-extrabold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">GESTÃO QUE ACOMPANHA VOCÊ</span>
          </div>
        </div>
        <button type="button" aria-label="Alternar Tema" onClick={toggleTheme} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      <main className="relative z-10 w-full max-w-6xl mx-auto my-auto py-6 sm:py-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <section className="hidden lg:block space-y-7 px-4 xl:px-10 animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> SEU NEGÓCIO EM MOVIMENTO</span>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-slate-950 dark:text-white xl:text-6xl">Mais tempo para cuidar do que <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">faz você crescer.</span></h1>
              <p className="max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">Agenda, clientes, caixa e estoque em uma experiência simples, rápida e feita para a rotina de profissionais autônomos.</p>
            </div>
            <div className="grid max-w-lg grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60"><CalendarCheck2 className="h-5 w-5 text-blue-600" /><p className="mt-3 text-xs font-bold">Agenda leve</p></div>
              <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60"><WalletCards className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-xs font-bold">Caixa claro</p></div>
              <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60"><ShieldCheck className="h-5 w-5 text-violet-600" /><p className="mt-3 text-xs font-bold">Acesso seguro</p></div>
            </div>
          </section>

          <section className="w-full max-w-md mx-auto login-box">
            <div className="mx-auto w-full overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_80px_-24px_rgba(37,99,235,0.35)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85 sm:p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/20">
                      <LockKeyhole className="h-3 w-3" /> ÁREA DO PROFISSIONAL
                    </span>

                    {/* Quick Demo Autofill Pill */}
                    <div className="relative group/demo">
                      <button
                        type="button"
                        className="text-[11px] font-bold text-amber-500 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/60"
                      >
                        <ShieldQuestion className="h-3 w-3" /> 
                      </button>
                      <div className="absolute right-0 top-full mt-2 hidden w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur group-hover/demo:block dark:border-slate-800 dark:bg-slate-900 z-30">
                        <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">Centrais do assinante</p>
                        <button
                          type="button"
                          onClick={() => handleDemoFill('patriciabeato', 'patricia@estudio.com', '123456')}
                          className="w-full text-left px-2 py-1.5 text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                        >
                          Acesso a FAQs e Dúvidas
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDemoFill('barbervip', 'contato@barbervip.com', '123456')}
                          className="w-full text-left px-2 py-1.5 text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                        >
                          Suporte
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {error && <div className="flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-600 dark:text-rose-300"><span>{error}</span></div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5 login-field">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Empreendimento</label>
                      {tenantValido && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 dark:text-emerald-400 animate-fade-in">
                          <Check className="h-3.5 w-3.5" /> Validado
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)} required placeholder="ex.: suaempresa" autoCapitalize="none" autoCorrect="off" className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-28 sm:pr-32 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        <span className="rounded-lg bg-slate-200/60 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:text-slate-400 border border-slate-300/30 dark:border-slate-700/50">
                          .acionar.online
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400">Use o identificador fornecido na implantação da sua empresa.</p>
                  </div>
                  <div className="space-y-1.5 login-field">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="seuemail@empresa.com" className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100" />
                    </div>
                  </div>
                  <div className="space-y-1.5 login-field">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input type={showPassword ? 'text' : 'password'} value={senha} onChange={(event) => setSenha(event.target.value)} required placeholder="••••••••" className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100" />
                      <button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword((value) => !value)} className="absolute right-0 top-0 flex h-full items-center px-4 text-slate-400 hover:text-blue-600">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-animated login-field mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-blue-500/25 disabled:opacity-50"><span>{loading ? 'Entrando...' : 'Entrar'}</span><ArrowRight className="h-4 w-4" /></button>
                </form>

                <div className="login-field flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-[10px] font-semibold text-slate-400 dark:border-slate-800 dark:text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Seus dados ficam protegidos</div>
                <footer className="w-full pb-safe-bottom text-center text-xs text-slate-400 dark:text-slate-600">© 2026 Acionar.</footer>
              </div>
            </div>
          </section>
        </div>
      </main>

      
    </div>
  );
}
