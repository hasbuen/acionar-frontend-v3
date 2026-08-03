import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Building, Lock, Mail, Phone, Palette } from 'lucide-react';

export function Login() {
  const { login, registerTenant } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 450 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #0d9488, #f59e0b)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Sparkles color="#fff" size={24} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Acionar v3</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {isRegister ? 'Cadastre seu estabelecimento multi-tenant' : 'Acesse seu painel de gestão'}
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subdomínio / Slug do Estabelecimento</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                className="form-input"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: patriciabeato"
                required
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label>Nome do Estabelecimento / Empresa</label>
              <input
                className="form-input"
                type="text"
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                placeholder="ex: Patrícia Beato Estética"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>E-mail do Proprietário / Profissional</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              className="form-input"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label>WhatsApp / Telefone de Contato</label>
                <input
                  className="form-input"
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-8888"
                />
              </div>

              <div className="form-group">
                <label>Cor Marca Principal</label>
                <input
                  type="color"
                  value={corPrimaria}
                  onChange={(e) => setCorPrimaria(e.target.value)}
                  style={{ width: '100%', height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                />
              </div>
            </>
          )}

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Processando...' : isRegister ? 'Criar Estabelecimento v3' : 'Entrar no Acionar v3'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          {isRegister ? 'Já possui um estabelecimento?' : 'Ainda não tem conta?'}
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, marginLeft: 6, cursor: 'pointer' }}
          >
            {isRegister ? 'Fazer Login' : 'Cadastrar Empresa'}
          </button>
        </div>
      </div>
    </div>
  );
}
