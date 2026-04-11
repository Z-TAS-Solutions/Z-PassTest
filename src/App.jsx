import React, { useState } from 'react';

// --- Base64URL <-> ArrayBuffer Helpers ---
const parseBase64url = (str) => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (str.length % 4)) % 4;
  str += '='.repeat(padLength);
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const bufferToBase64url = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

export default function PasskeyTester() {
  const [email, setEmail] = useState('');
  const [logs, setLogs] = useState([]);
  const [finalData, setFinalData] = useState(null);

  const API_BASE = 'http://104.43.91.57:8000/api/v1/webauthn';

  const addLog = (msg) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // ==========================================
  // 1. REGISTRATION FLOW
  // ==========================================
  const handleRegister = async () => {
    try {
      setLogs([]); setFinalData(null);
      addLog('Initiating /register/begin...');
      
      const beginRes = await fetch(`${API_BASE}/register/begin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const beginData = await beginRes.json();
      
      if (!beginRes.ok) throw new Error(`Begin Failed: ${JSON.stringify(beginData)}`);
      addLog('Received options. Prompting Biometrics/Security Key...');

      // Prepare options for the browser API
      const options = beginData.data.creation_data.publicKey;
      options.challenge = parseBase64url(options.challenge);
      options.user.id = parseBase64url(options.user.id);
      
      if (options.excludeCredentials) {
        options.excludeCredentials.forEach(cred => cred.id = parseBase64url(cred.id));
      }

      // Trigger WebAuthn Registration
      const credential = await navigator.credentials.create({ publicKey: options });
      addLog('Authenticator verified! Finalizing registration...');

      const finishPayload = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        credential_name: "My Test Passkey",
        response: {
          attestationObject: bufferToBase64url(credential.response.attestationObject),
          clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
        },
      };

      // Injecting X-Session-Token into Headers
      const finishRes = await fetch(`${API_BASE}/register/finish`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Token': beginData.data.session_token 
        },
        body: JSON.stringify(finishPayload),
      });
      
      const finishData = await finishRes.json();
      if (!finishRes.ok) throw new Error(`Finish Failed: ${JSON.stringify(finishData)}`);
      
      addLog('✅ Registration Complete!');
      setFinalData(finishData);

    } catch (err) {
      addLog(`❌ ERROR: ${err.message}`);
      console.error(err);
    }
  };

  // ==========================================
  // 2. LOGIN (ASSERTION) FLOW
  // ==========================================
  const handleLogin = async () => {
    try {
      setLogs([]); setFinalData(null);
      addLog('Initiating /login/begin...');

      const beginRes = await fetch(`${API_BASE}/login/begin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const beginData = await beginRes.json();
      
      if (!beginRes.ok) throw new Error(`Begin Failed: ${JSON.stringify(beginData)}`);
      addLog('Challenge received. Please authenticate...');

      // Adjusting to your Z-TAS nested data structure
      const options = beginData.data.assertion_data?.publicKey || beginData.data.publicKey;
      options.challenge = parseBase64url(options.challenge);
      
      if (options.allowCredentials) {
        options.allowCredentials.forEach(cred => cred.id = parseBase64url(cred.id));
      }

      // Trigger WebAuthn Login
      const assertion = await navigator.credentials.get({ publicKey: options });
      addLog('Assertion generated! Finalizing login...');

      const finishPayload = {
        id: assertion.id,
        rawId: bufferToBase64url(assertion.rawId),
        type: assertion.type,
        response: {
          authenticatorData: bufferToBase64url(assertion.response.authenticatorData),
          clientDataJSON: bufferToBase64url(assertion.response.clientDataJSON),
          signature: bufferToBase64url(assertion.response.signature),
          userHandle: assertion.response.userHandle ? bufferToBase64url(assertion.response.userHandle) : null,
        },
      };

      // Injecting X-Session-Token into Headers
      const finishRes = await fetch(`${API_BASE}/login/finish`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Token': beginData.data.session_token 
        },
        body: JSON.stringify(finishPayload),
      });

      const finishData = await finishRes.json();
      if (!finishRes.ok) throw new Error(`Finish Failed: ${JSON.stringify(finishData)}`);
      
      addLog('✅ Login Successful!');
      setFinalData(finishData);

    } catch (err) {
      addLog(`❌ ERROR: ${err.message}`);
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', backgroundColor: '#1a1a1a', color: '#e0e0e0', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', color: '#646cff' }}>Z-TAS Passkey Implementation Tester</h2>
      
      <div style={{ margin: '25px 0' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Target User Email</label>
        <input 
          type="email" 
          placeholder="oshadha@example.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#222', color: '#fff', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
          <button onClick={handleRegister} style={{ flex: 1, padding: '12px', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Register Passkey</button>
          <button onClick={handleLogin} style={{ flex: 1, padding: '12px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Login with Passkey</button>
        </div>
      </div>

      <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #333', height: '150px', overflowY: 'auto', marginBottom: '20px' }}>
        <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Session Logs</span>
        {logs.length === 0 && <p style={{ color: '#555', fontSize: '14px' }}>No activity yet...</p>}
        {logs.map((l, i) => <div key={i} style={{ fontSize: '13px', margin: '4px 0', borderLeft: '2px solid #444', paddingLeft: '8px' }}>{l}</div>)}
      </div>

      {finalData && (
        <div style={{ marginTop: '20px' }}>
          <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Final API Response</span>
          <pre style={{ background: '#000', color: '#00ff41', padding: '20px', borderRadius: '8px', overflowX: 'auto', fontSize: '13px', border: '1px solid #004d1a' }}>
            {JSON.stringify(finalData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}