require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto  = require('crypto');
const fs      = require('fs');
const path    = require('path');
const { importJWK, SignJWT } = require('jose');

const app = express();
const PORT           = process.env.PORT             || 3000;
const MOCKPASS_BASE  = process.env.MOCKPASS_BASE_URL || 'http://localhost:5156';
const CLIENT_ID      = process.env.OIDC_CLIENT_ID    || 'delegated-authority-demo';
const CLIENT_SECRET  = process.env.OIDC_CLIENT_SECRET || 'not-a-real-secret';
const REDIRECT_URI   = process.env.OIDC_REDIRECT_URI  || 'http://localhost:3000/auth/callback';
const SESSION_SECRET = process.env.SESSION_SECRET     || 'dev-only-change-in-prod';
const OIDC_V2_RP_SECRET_PATH =
  process.env.OIDC_V2_RP_SECRET_PATH ||
  path.join(__dirname, 'node_modules', '@opengovsg', 'mockpass', 'static', 'certs', 'oidc-v2-rp-secret.json');

// ─── Data layer ───────────────────────────────────────────────────────────────
const paths = {
  delegations:    path.join(__dirname, 'data', 'delegations.json'),
  personas:       path.join(__dirname, 'data', 'personas.json'),
  opg:            path.join(__dirname, 'data', 'opg-registry.json'),
  auditLog:       path.join(__dirname, 'data', 'audit-log.json'),
  serviceProviders: path.join(__dirname, 'data', 'service-providers.json'),
};

let delegations   = JSON.parse(fs.readFileSync(paths.delegations,    'utf8'));
const personas    = JSON.parse(fs.readFileSync(paths.personas,       'utf8'));
let opgRegistry   = JSON.parse(fs.readFileSync(paths.opg,            'utf8'));
let auditLog      = JSON.parse(fs.readFileSync(paths.auditLog,       'utf8'));
const servicePros = JSON.parse(fs.readFileSync(paths.serviceProviders,'utf8'));

const save = (key, data) => fs.writeFileSync(paths[key], JSON.stringify(data, null, 2));

// Backward compatibility for older seed values.
opgRegistry = opgRegistry.map(r => ({
  ...r,
  status: r.status === 'registered' ? 'pending_acceptance' : r.status,
}));
delegations = delegations.map(d => ({
  ...d,
  status: d.status === 'pending' ? 'pending_acceptance' : d.status,
}));

// ─── In-memory SP session store ───────────────────────────────────────────────
const spSessions = {};

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: 'lax', httpOnly: true },
}));
app.use(express.static(path.join(__dirname, 'public')));

const requireAuth = (req, res, next) => {
  if (!req.session.nric) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

// ─── PKCE helpers ─────────────────────────────────────────────────────────────
const makeVerifier  = () => crypto.randomBytes(32).toString('base64url');
const makeChallenge = v  => crypto.createHash('sha256').update(v).digest('base64url');
const nricFromSub   = sub => ((sub || '').match(/s=([^,]+)/i) || [])[1]?.toUpperCase();
const maskNric      = n   => n[0] + 'XXXX' + n.slice(-4);

let rpSigningJwk = null;
async function buildV2ClientAssertion() {
  if (!rpSigningJwk) {
    const keyset = JSON.parse(fs.readFileSync(OIDC_V2_RP_SECRET_PATH, 'utf8'));
    rpSigningJwk = keyset.keys.find(k => k.use === 'sig') || keyset.keys[0];
    if (!rpSigningJwk) throw new Error('No signing JWK found for MockPass v2 token exchange');
  }

  const now = Math.floor(Date.now() / 1000);
  const key = await importJWK(rpSigningJwk, rpSigningJwk.alg || 'ES512');
  return new SignJWT({})
    .setProtectedHeader({
      alg: rpSigningJwk.alg || 'ES512',
      kid: rpSigningJwk.kid,
      typ: 'JWT',
    })
    .setIssuer(CLIENT_ID)
    .setSubject(CLIENT_ID)
    .setAudience(`${MOCKPASS_BASE}/singpass/v2`)
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .setJti(crypto.randomBytes(16).toString('hex'))
    .sign(key);
}

// ─── Auth routes ──────────────────────────────────────────────────────────────
app.get('/auth/login', (req, res) => {
  const verifier  = makeVerifier();
  const challenge = makeChallenge(verifier);
  const nonce     = crypto.randomBytes(16).toString('hex');
  const state     = crypto.randomBytes(16).toString('hex');

  req.session.pkce = { verifier, nonce, state };

  const params = new URLSearchParams({
    response_type: 'code', client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI, scope: 'openid uinfin',
    nonce, state,
    code_challenge: challenge, code_challenge_method: 'S256',
  });
  res.redirect(`${MOCKPASS_BASE}/singpass/v2/auth?${params}`);
});

app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`/?error=${encodeURIComponent(error)}`);

  const pkce = req.session.pkce || {};
  if (state !== pkce.state) return res.redirect('/?error=invalid_state');

  try {
    const clientAssertion = await buildV2ClientAssertion();
    const tokenRes = await fetch(`${MOCKPASS_BASE}/singpass/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code,
        redirect_uri: REDIRECT_URI, client_id: CLIENT_ID,
        code_verifier: pkce.verifier,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error('Token exchange failed:', tokenRes.status, body);
      return res.redirect('/?error=token_exchange_failed');
    }

    const { id_token } = await tokenRes.json();
    const payload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64url').toString('utf8'));
    const nric    = nricFromSub(payload.sub);
    if (!nric) return res.redirect('/?error=nric_not_found');

    delete req.session.pkce;
    req.session.nric = nric;
    res.redirect('/app');
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/?error=callback_error');
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ─── App page (protected) ─────────────────────────────────────────────────────
app.get('/app', (req, res) => {
  if (!req.session.nric) return res.redirect('/auth/login');
  res.sendFile(path.join(__dirname, 'public', 'app', 'index.html'));
});

// ─── API: current user ────────────────────────────────────────────────────────
app.get('/api/me', requireAuth, (req, res) => {
  const { nric } = req.session;
  const persona  = personas[nric] || { name: 'Unknown User', age: null };

  const grantedDelegations = delegations.filter(
    d => d.principalNric === nric
  );
  const delegatedAuthorities = delegations.filter(
    d => d.delegateNric === nric && d.status === 'active'
  ).map(d => ({
    id: d.id, principalNric: d.principalNric, principalName: d.principalName,
    relationship: d.relationship, basis: d.basis, grantedAt: d.grantedAt,
    scope: d.scope, opgId: d.opgId,
  }));

  const delegatedAuthorityTiles = delegations.filter(
    d => d.delegateNric === nric
  ).map(d => {
    const reg = d.opgId ? opgRegistry.find(r => r.id === d.opgId) : null;
    const lifecycleStatus = reg?.status || d.status || 'pending_acceptance';
    return {
      id: d.id, principalNric: d.principalNric, principalName: d.principalName,
      relationship: d.relationship, basis: d.basis, grantedAt: d.grantedAt,
      scope: d.scope, opgId: d.opgId,
      lifecycleStatus,
      triggerCondition: reg?.triggerCondition || 'incapacity_certified_by_doctor',
      canAccept: lifecycleStatus === 'pending_acceptance' && reg?.doneeNric === nric,
    };
  });

  res.json({
    nric, name: persona.name, age: persona.age,
    grantedDelegations, delegatedAuthorities, delegatedAuthorityTiles,
  });
});

// ─── API: SGFinDex insurance data ─────────────────────────────────────────────
app.get('/api/sgfindex/:nric', requireAuth, (req, res) => {
  const requesterNric = req.session.nric;
  const targetNric    = req.params.nric.toUpperCase();

  const isOwn      = requesterNric === targetNric;
  const delegation = !isOwn && delegations.find(
    d => d.principalNric === targetNric && d.delegateNric === requesterNric && d.status === 'active'
  );

  if (!isOwn && !delegation) return res.status(403).json({ error: 'No delegated authority' });

  const persona = personas[targetNric];
  if (!persona) return res.status(404).json({ error: 'Not found' });

  res.json({
    nric:        isOwn ? targetNric : maskNric(targetNric),
    name:        isOwn ? persona.name : persona.maskedName,
    isDelegated: !isOwn,
    policies:    persona.sgfindex?.policies || [],
    lastUpdated: persona.sgfindex?.lastUpdated,
  });
});

// ─── API: financial data (CPF, housing, income) ───────────────────────────────
app.get('/api/financial/:nric', requireAuth, (req, res) => {
  const requesterNric = req.session.nric;
  const targetNric    = req.params.nric.toUpperCase();

  const isOwn      = requesterNric === targetNric;
  const delegation = !isOwn && delegations.find(
    d => d.principalNric === targetNric && d.delegateNric === requesterNric && d.status === 'active'
  );

  if (!isOwn && !delegation) return res.status(403).json({ error: 'No delegated authority' });

  const persona = personas[targetNric];
  if (!persona) return res.status(404).json({ error: 'Not found' });

  res.json({
    nric:           isOwn ? targetNric : maskNric(targetNric),
    name:           isOwn ? persona.name : persona.maskedName,
    isDelegated:    !isOwn,
    condition:      persona.condition,
    conditionLabel: persona.conditionLabel,
    delegation:     delegation || null,
    data: {
      cpf:        persona.cpf,
      employment: persona.employment,
      housing:    persona.housing,
      insurance:  persona.insurance,
    },
  });
});

// ─── API: delegation management ───────────────────────────────────────────────
app.post('/api/delegation', requireAuth, (req, res) => {
  const principalNric = req.session.nric;
  const { delegateNric, relationship, basis } = req.body;

  const normalized = (delegateNric || '').trim().toUpperCase();
  if (!/^[STFG]\d{7}[A-Z]$/.test(normalized))
    return res.status(400).json({ error: 'Invalid NRIC format' });
  if (normalized === principalNric)
    return res.status(400).json({ error: 'Cannot delegate to yourself' });

  delegations = delegations.filter(
    d => !(d.principalNric === principalNric && d.delegateNric === normalized)
  );

  const principalPersona = personas[principalNric] || {};
  const delegatePersona  = personas[normalized] || {};

  const newDel = {
    id: `d${Date.now()}`,
    principalNric, principalName: principalPersona.name || principalNric,
    delegateNric: normalized, delegateName: delegatePersona.name || normalized,
    relationship: relationship || 'Family member',
    basis: basis || 'Voluntary – in-app authorisation',
    grantedAt: new Date().toISOString(),
    status: 'active',
    scope: ['cpf', 'employment', 'housing', 'insurance', 'sgfindex'],
  };

  delegations.push(newDel);
  save('delegations', delegations);
  res.json({ success: true, delegation: newDel });
});

app.delete('/api/delegation/:id', requireAuth, (req, res) => {
  const del = delegations.find(d => d.id === req.params.id && d.principalNric === req.session.nric);
  if (!del) return res.status(404).json({ error: 'Not found' });
  del.status = 'revoked';
  save('delegations', delegations);
  res.json({ success: true });
});

// ─── API: OPG registry ────────────────────────────────────────────────────────
app.get('/api/opg/registry', requireAuth, (req, res) => {
  const { nric } = req.session;
  res.json({
    asDonor: opgRegistry.filter(r => r.donorNric === nric),
    asDonee: opgRegistry.filter(r => r.doneeNric === nric),
  });
});

app.post('/api/opg/nominate', requireAuth, (req, res) => {
  const { nric } = req.session;
  const { doneeNric, relationship } = req.body;

  const normalized = (doneeNric || '').trim().toUpperCase();
  if (!/^[STFG]\d{7}[A-Z]$/.test(normalized))
    return res.status(400).json({ error: 'Invalid NRIC' });
  if (normalized === nric)
    return res.status(400).json({ error: 'Cannot nominate yourself' });
  const existingActiveOrRegistered = opgRegistry.find(
    r => r.donorNric === nric && r.status !== 'revoked'
  );
  if (existingActiveOrRegistered) {
    return res.status(400).json({
      error: 'Each principal can only have one nominee. Withdraw the current nomination first.',
    });
  }

  const donorPersona = personas[nric] || {};
  const doneePersona = personas[normalized] || {};

  const reg = {
    id: `lpa-${Date.now()}`,
    donorNric: nric, donorName: donorPersona.name || nric,
    doneeNric: normalized, doneeName: doneePersona.name || normalized,
    relationship: relationship || 'Family member',
    scope: 'property_and_affairs',
    registeredAt: new Date().toISOString(),
    activatedAt: null, acceptedAt: null, status: 'pending_acceptance',
    triggerCondition: 'incapacity_certified_by_doctor',
    certificate: null,
  };

  opgRegistry.push(reg);
  save('opg', opgRegistry);

  // Create pending delegation
  delegations = delegations.filter(
    d => !(d.principalNric === nric && d.delegateNric === normalized)
  );
  const newDel = {
    id: `d${Date.now()}`,
    principalNric: nric, principalName: donorPersona.name || nric,
    delegateNric: normalized, delegateName: doneePersona.name || normalized,
    relationship: reg.relationship, basis: 'Lasting Power of Attorney',
    grantedAt: reg.registeredAt, status: 'pending_acceptance',
    opgId: reg.id,
    scope: ['cpf', 'employment', 'housing', 'insurance', 'sgfindex'],
  };
  delegations.push(newDel);
  save('delegations', delegations);

  // Audit entry
  addAuditEntry({
    type: 'lpa_registered',
    actorNric: nric, actorName: donorPersona.name || nric,
    principalNric: nric, principalName: donorPersona.name || nric,
    serviceProvider: 'Office of the Public Guardian',
    basis: 'Voluntary nomination',
    notifyNrics: [nric, normalized],
  });

  res.json({ success: true, registration: reg });
});

app.post('/api/opg/nomination/:id/accept', requireAuth, (req, res) => {
  const { nric } = req.session;
  const reg = opgRegistry.find(r => r.id === req.params.id);
  if (!reg) return res.status(404).json({ error: 'LPA nomination not found' });
  if (reg.doneeNric !== nric) return res.status(403).json({ error: 'Only nominated delegate can accept' });
  if (reg.status === 'revoked') return res.status(400).json({ error: 'Cannot accept a revoked nomination' });
  if (reg.status !== 'pending_acceptance') return res.status(400).json({ error: 'Nomination is not pending acceptance' });

  reg.status = 'nominated';
  reg.acceptedAt = new Date().toISOString();

  const del = delegations.find(d => d.opgId === reg.id);
  if (del) del.status = 'nominated';

  save('opg', opgRegistry);
  save('delegations', delegations);

  addAuditEntry({
    type: 'lpa_accepted',
    actorNric: nric, actorName: personas[nric]?.name || nric,
    principalNric: reg.donorNric, principalName: reg.donorName,
    serviceProvider: 'Office of the Public Guardian',
    basis: 'Delegate accepted nomination',
    notifyNrics: [reg.donorNric, reg.doneeNric],
  });

  res.json({ success: true, nomination: reg });
});

app.delete('/api/opg/nomination/:id', requireAuth, (req, res) => {
  const { nric } = req.session;
  const reg = opgRegistry.find(r => r.id === req.params.id && r.donorNric === nric);
  if (!reg) return res.status(404).json({ error: 'LPA nomination not found' });
  if (reg.status === 'revoked') return res.status(400).json({ error: 'LPA already revoked' });

  reg.status = 'revoked';
  reg.revokedAt = new Date().toISOString();
  reg.revokedBy = nric;

  delegations.forEach(d => {
    if (d.opgId === reg.id) d.status = 'revoked';
  });

  save('opg', opgRegistry);
  save('delegations', delegations);

  addAuditEntry({
    type: 'lpa_revoked',
    actorNric: nric, actorName: personas[nric]?.name || nric,
    principalNric: reg.donorNric, principalName: reg.donorName,
    serviceProvider: 'Office of the Public Guardian',
    basis: 'Principal withdrew nomination',
    notifyNrics: [reg.donorNric, reg.doneeNric],
  });

  res.json({ success: true, nomination: reg });
});

// ─── API: hospital trigger (LPA activation) ───────────────────────────────────
app.post('/api/hospital/certify', (req, res) => {
  const { patientNric, doctorName, hospital, diagnosis } = req.body;

  const normalized = (patientNric || '').trim().toUpperCase();
  const regs = opgRegistry.filter(r => r.donorNric === normalized && r.status === 'nominated');

  if (!regs.length) {
    return res.status(404).json({ error: 'No registered LPA found for this patient' });
  }

  const certificate = {
    doctorName: doctorName || 'DR UNKNOWN',
    hospital:   hospital   || 'Singapore General Hospital',
    certifiedAt: new Date().toISOString(),
    diagnosis:   diagnosis || 'Assessed unable to make property and affairs decisions',
  };

  regs.forEach(reg => {
    reg.status      = 'active';
    reg.activatedAt = certificate.certifiedAt;
    reg.certificate = certificate;

    // Activate corresponding delegation
    const del = delegations.find(d => d.opgId === reg.id);
    if (del) del.status = 'active';

    // Audit entry
    addAuditEntry({
      type: 'lpa_activated',
      actorNric: 'SYSTEM_HOSPITAL', actorName: hospital || 'Singapore General Hospital',
      principalNric: normalized, principalName: reg.donorName,
      serviceProvider: hospital || 'Singapore General Hospital',
      basis: 'Doctor-certified incapacity',
      certificate,
      notifyNrics: [normalized, reg.doneeNric],
    });
  });

  save('opg', opgRegistry);
  save('delegations', delegations);

  res.json({
    success: true,
    activatedCount: regs.length,
    donees: regs.map(r => ({ doneeName: r.doneeName, doneeNric: r.doneeNric })),
  });
});

// ─── API: audit log ───────────────────────────────────────────────────────────
app.get('/api/audit-log', requireAuth, (req, res) => {
  const { nric } = req.session;
  const entries = auditLog
    .filter(e => e.notifyNrics?.includes(nric))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50);
  res.json(entries);
});

// ─── API: SP session (QR scan simulation) ────────────────────────────────────
app.post('/api/sp-session', requireAuth, (req, res) => {
  const actorNric    = req.session.nric;
  const { spId, principalNric } = req.body;

  const sp = servicePros[spId];
  if (!sp) return res.status(400).json({ error: 'Unknown service provider' });

  const isDelegated = !!principalNric && principalNric !== actorNric;
  const targetNric  = isDelegated ? principalNric.toUpperCase() : actorNric;

  if (isDelegated) {
    const delegation = delegations.find(
      d => d.principalNric === targetNric && d.delegateNric === actorNric && d.status === 'active'
    );
    if (!delegation) return res.status(403).json({ error: 'No active delegation — LPA may not be activated yet' });

    const opgReg = opgRegistry.find(
      r => r.donorNric === targetNric && r.doneeNric === actorNric && r.status === 'active'
    );

    addAuditEntry({
      type: 'delegated_access',
      actorNric, actorName: personas[actorNric]?.name || actorNric,
      principalNric: targetNric, principalName: personas[targetNric]?.name || targetNric,
      serviceProvider: sp.name, spId,
      scopesAccessed: sp.delegatedScopes,
      basis: delegation.basis,
      opgVerified: !!opgReg,
      notifyNrics: [actorNric, targetNric],
    });
  }

  const token = crypto.randomBytes(24).toString('hex');
  spSessions[token] = {
    actorNric, targetNric, spId, isDelegated,
    scopes:    isDelegated ? sp.delegatedScopes : sp.ownScopes,
    spName:    sp.name,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  res.json({ token, spUrl: `${sp.url}?token=${token}` });
});

app.get('/api/sp-session/:token', (req, res) => {
  const sess = spSessions[req.params.token];
  if (!sess)              return res.status(404).json({ error: 'Session not found' });
  if (Date.now() > sess.expiresAt) {
    delete spSessions[req.params.token];
    return res.status(410).json({ error: 'Session expired' });
  }

  const persona = personas[sess.targetNric] || {};
  res.json({
    ...sess,
    persona: {
      nric:    sess.isDelegated ? maskNric(sess.targetNric) : sess.targetNric,
      name:    sess.isDelegated ? persona.maskedName : persona.name,
      age:     persona.age,
      data:    filterByScopes(persona, sess.scopes),
    },
  });
});

// ─── API: service providers list ─────────────────────────────────────────────
app.get('/api/service-providers', (req, res) => res.json(servicePros));

// ─── API: health check ────────────────────────────────────────────────────────
app.get('/api/ping', (req, res) => res.json({ ok: true, mockpassUrl: MOCKPASS_BASE }));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addAuditEntry(fields) {
  const entry = {
    id: `a${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    scopesAccessed: [],
    spId: null, serviceProvider: null,
    ...fields,
  };
  auditLog.unshift(entry);
  save('auditLog', auditLog);
  return entry;
}

function filterByScopes(persona, scopes) {
  const out = {};
  if (scopes.includes('personal'))          out.personal  = { name: persona.name, age: persona.age };
  if (scopes.includes('cpf.oa'))            out.cpfOa     = persona.cpf?.oa;
  if (scopes.includes('cpf.sa'))            out.cpfSa     = persona.cpf?.sa;
  if (scopes.includes('cpf.ma'))            out.cpfMa     = persona.cpf?.ma;
  if (scopes.includes('cpf.ra'))            out.cpfRa     = persona.cpf?.ra;
  if (scopes.includes('income'))            out.employment = persona.employment;
  if (scopes.includes('housing'))           out.housing   = persona.housing;
  if (scopes.includes('sgfindex.policies')) out.sgfindex  = persona.sgfindex;
  return out;
}

app.listen(PORT, () => {
  console.log(`\n  ✦ CareAuth SG – Delegated Authority Demo`);
  console.log(`  ──────────────────────────────────────────`);
  console.log(`  App:        http://localhost:${PORT}`);
  console.log(`  Singpass:   http://localhost:${PORT}/app   (login required)`);
  console.log(`  Hospital:   http://localhost:${PORT}/hospital`);
  console.log(`  MockPass:   ${MOCKPASS_BASE}\n`);
  console.log(`  Demo NRICs (pick from MockPass dropdown):`);
  console.log(`  S9812379B  TAN AH KOW     — principal, stroke    (LPA pending activation)`);
  console.log(`  S9912370B  TAN MEI LING   — delegate, daughter   (activate via hospital page)`);
  console.log(`  S9812353I  LIM BOON HUAT  — principal, dementia  (LPA already active)`);
  console.log(`  S9912363Z  LIM SOO HUA    — delegate, spouse     (can demo fully)\n`);
});
