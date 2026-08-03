import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, CalendarCheck2, WalletCards, ShieldCheck, Mail, Lock, ArrowRight, Eye, EyeOff, Building, Phone, Palette } from 'lucide-react';

export function Login() {
  const { login, registerTenant } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [slug, setSlug] = useState('patriciabeato');
  const [email, setEmail] = useState('contato@patriciabeato.com');
  const [senha, setSenha] = useState('123456');
  const [nomeEmpresa, setNomeEmpresa] = useState('Patrícia Beato Estética');
  const [telefone, setTelefone] = useState('(11) 99999-8888');
  const [corPrimaria, setCorPrimaria] = useState('#0d9488');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await registerTenant({
          slug,
          nome_empresa: nomeEmpresa,
          email_proprietario: email,
          senha,
          telefone,
          cor_primaria: corPrimaria,
        });
      } else {
        await login(slug, email, senha);
      }
    } catch (err) {
      setError(err.message || 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#eef4fb] text-slate-900 transition-colors duration-300 dark:bg-[#030712] dark:text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Background Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-600/10"></div>
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl dark:bg-indigo-600/10"></div>
      </div>

      {/* Header superior */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between pt-safe-top mb-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-[1.15rem] bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 font-black text-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xl font-black tracking-tight text-slate-900 dark:text-white">Acionar v3</span>
            <span className="block text-[9px] font-extrabold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">GESTÃO QUE ACOMPANHA VOCÊ</span>
          </div>
        </div>
      </header>

      {/* Card Principal */}
      <main className="relative z-10 w-full max-w-6xl mx-auto my-auto py-4 sm:py-6">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Hero Desktop */}
          <section className="hidden lg:block space-y-7 px-4 xl:px-10 animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.12)]"></span>
              SEU NEGÓCIO EM MOVIMENTO
            </span>

            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-slate-950 dark:text-white xl:text-6xl">
                Mais tempo para cuidar do que <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">faz você crescer.</span>
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">
                Agenda, clientes, caixa e estoque em uma experiência simples, rápida e feita para a rotina de profissionais autônomos.
              </p>
            </div>

            <div className="grid max-w-lg grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
                <CalendarCheck2 className="h-5 w-5 text-blue-600" />
                <p className="mt-3 text-xs font-bold text-slate-700 dark:text-slate-200">Agenda leve</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
                <WalletCards className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-xs font-bold text-slate-700 dark:text-slate-200">Caixa claro</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
                <ShieldCheck className="h-5 w-5 text-violet-600" />
                <p className="mt-3 text-xs font-bold text-slate-700 dark:text-slate-200">Acesso seguro</p>
              </div>
            </div>
          </section>

          {/* Form Card */}
          <section className="w-full max-w-md mx-auto lg:max-w-none animate-scale-in">
            <div className="relative rounded-3xl border border-white/80 bg-white/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70">
              <div className="space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    <Building className="h-3 w-3" /> {isRegister ? 'NOVO ESTABELECIMENTO' : 'ÁREA DO PROFISSIONAL'}
                  </span>
                  <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {isRegister ? 'Cadastre sua Empresa' : 'Bem-vindo de volta'}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {isRegister ? 'Crie seu espaço com schema PostgreSQL multi-tenant' : 'Entre para continuar cuidando do seu dia com mais leveza.'}
                  </p>
                </div>

                {error && (
                  <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs font-bold text-rose-500 text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Subdomínio / Slug do Estabelecimento
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="ex: patriciabeato"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-950"
                      />
                    </div>
                  </div>

                  {isRegister && (
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Nome da Empresa
                      </label>
                      <input
                        type="text"
                        value={nomeEmpresa}
                        onChange={(e) => setNomeEmpresa(e.target.value)}
                        placeholder="ex: Patrícia Beato Estética"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-950"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      E-mail do Proprietário
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="patricia@acionar.online"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-950"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Senha de Acesso
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-11 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-950"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isRegister && (
                    <>
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          WhatsApp de Contato
                        </label>
                        <input
                          type="text"
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                          placeholder="(11) 99999-8888"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-950"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Cor da Marca
                        </label>
                        <input
                          type="color"
                          value={corPrimaria}
                          onChange={(e) => setCorPrimaria(e.target.value)}
                          className="w-full h-10 rounded-xl border-none cursor-pointer"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-animated flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-500/25 transition disabled:opacity-50 mt-2"
                  >
                    <span>{loading ? 'Processando...' : isRegister ? 'Criar Estabelecimento v3' : 'Entrar'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                  {isRegister ? 'Já possui um cadastrado?' : 'Ainda não tem conta?'}
                  <button
                    onClick={() => setIsRegister(!isRegister)}
                    className="ml-1.5 font-bold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {isRegister ? 'Fazer Login' : 'Cadastrar Empresa'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
