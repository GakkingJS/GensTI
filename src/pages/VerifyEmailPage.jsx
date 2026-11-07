import { useEffect, useState } from 'react';

function readTokenFromHash(hash) {
  if (!hash) return null;

  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(fragment);

  return params.get('token');
}

export default function VerifyEmailPage({ hash = '' }) {
  const tokenFromHash = readTokenFromHash(hash);

  const [token, setToken] = useState(tokenFromHash);
  const [status, setStatus] = useState(
    tokenFromHash ? 'ready' : 'missing',
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    const currentToken = readTokenFromHash(hash);

    setToken(currentToken);
    setStatus(currentToken ? 'ready' : 'missing');
    setMessage('');

    if (currentToken) {
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + window.location.search,
      );
    }
  }, [hash]);

  async function handleVerify() {
    if (!token || status !== 'ready') return;

    setStatus('working');

    try {
      const response = await fetch('/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setMessage('Tu correo fue verificado y la cuenta está activa.');
        setStatus('success');
      } else if (response.status === 400) {
        setMessage('El enlace es inválido, venció o ya fue utilizado.');
        setStatus('error');
      } else {
        setMessage('No pudimos completar la verificación. Inténtalo más tarde.');
        setStatus('error');
      }
    } catch {
      setMessage('No se pudo contactar con el servidor. Inténtalo más tarde.');
      setStatus('error');
    } finally {
      setToken(null);
    }
  }

  return (
    <section>
      <h1>Verificar correo</h1>

      {status === 'missing' && (
        <p>El enlace no contiene un token de verificación.</p>
      )}

      {status === 'ready' && (
        <>
          <p>Confirma para activar tu cuenta institucional.</p>

          <button type="button" onClick={handleVerify}>
            Verificar correo
          </button>
        </>
      )}

      {status === 'working' && <p>Verificando…</p>}

      {message && <p role="status">{message}</p>}
    </section>
  );
}