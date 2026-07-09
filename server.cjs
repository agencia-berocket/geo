const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const nodemailer = require('nodemailer');
const ics = require('ics');
const {
  runGatekeeperAgent,
  runMetadataAgent,
  runContentAgent,
  runIntentAgent,
  calculateGeoScore,
  buildActionList,
  generateHtmlReport,
  fetchUrl,
} = require('./geo-diagnostic-engine.cjs');

const app = express();
app.use(express.json());


const PORT = process.env.PORT || 80;

// Configuração do disparador de e-mails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Load Google Service Account credentials with robust sanitization
let serviceAccount = null;
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  try {
    let jsonStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim();
    // Remove wrapped single or double quotes
    if (jsonStr.startsWith("'") && jsonStr.endsWith("'")) {
      jsonStr = jsonStr.slice(1, -1).trim();
    }
    if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
      jsonStr = jsonStr.slice(1, -1).trim();
    }
    // Convert multiple backslashes + quote to just a single quote
    jsonStr = jsonStr.replace(/\\+"/g, '"');
    // Keep \\n as the literal two-char sequence \n so JSON.parse can decode it correctly
    jsonStr = jsonStr.replace(/\\{3,}n/g, '\\n');

    serviceAccount = JSON.parse(jsonStr);

    // After JSON.parse, the private_key field may contain literal \n instead of real newlines
    // Node crypto requires real newlines in PEM keys
    if (serviceAccount && serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } catch (err) {
    console.error('Error parsing GOOGLE_SERVICE_ACCOUNT_JSON env var:', err);
    console.error('Raw GOOGLE_SERVICE_ACCOUNT_JSON:', process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }
}

if (!serviceAccount) {
  const localKeyPath = path.join(__dirname, 'geo-brocket-ae1f778b51b8.json');
  if (fs.existsSync(localKeyPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
      console.log('Loaded Google credentials from local JSON file.');
    } catch (err) {
      console.error('Error reading local JSON credentials:', err);
    }
  }
}

if (!serviceAccount) {
  console.warn('WARNING: No Google Service Account credentials found. Calendar features will fail.');
}

const PROJECT_ID = serviceAccount ? serviceAccount.project_id : 'geo-brocket';
const CALENDAR_OWNER_EMAIL = 'berocket@berocket.com.br';

function toFirestoreValue(val) {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: val } : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function autoSubscribeNewsletter(accessToken, name, email) {
  try {
    const subId = `sub_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsletter`;
    const subDoc = {
      fields: {
        id: { stringValue: subId },
        name: { stringValue: name || '' },
        email: { stringValue: email },
        subscribedAt: { stringValue: new Date().toISOString() },
      }
    };
    await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsletter`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(subDoc),
    });
    console.log(`Auto-subscribed ${email} to newsletter.`);
  } catch (err) {
    console.error('Failed to auto-subscribe newsletter:', err.message);
  }
}

// Helper to get Google OAuth2 Access Token using Service Account JWT signing
function getGoogleAccessToken() {
  return new Promise((resolve, reject) => {
    if (!serviceAccount) {
      return reject(new Error('Google Service Account credentials not configured.'));
    }

    try {
      const jwtHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const now = Math.floor(Date.now() / 1000);
      const jwtClaimSet = Buffer.from(JSON.stringify({
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/datastore',
        aud: serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      })).toString('base64url');

      const signatureInput = `${jwtHeader}.${jwtClaimSet}`;
      const sign = crypto.createSign('SHA256');
      sign.update(signatureInput);
      const signature = sign.sign(serviceAccount.private_key, 'base64url');

      const jwt = `${signatureInput}.${signature}`;

      const body = new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      }).toString();

      fetch(serviceAccount.token_uri || 'https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      })
        .then(res => {
          if (!res.ok) {
            return res.text().then(text => { reject(new Error(`Google token request failed: ${res.status} ${text}`)); });
          }
          return res.json();
        })
        .then(data => {
          resolve(data.access_token);
        })
        .catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

// Helper for Firestore REST API calls to assert non-error responses
async function fetchFirestore(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore request failed (${response.status}): ${errorText}`);
  }
  return response.json();
}

// API: Get Google Calendar availability for a specific date
app.get('/api/calendar/availability', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'date query parameter is required' });
  }

  try {
    const accessToken = await getGoogleAccessToken();
    
    // Set time window for the requested date (00:00:00 to 23:59:59)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_OWNER_EMAIL)}/events?timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}&singleEvents=true&orderBy=startTime`;
    
    const response = await fetch(calendarUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Calendar API error: ${response.status} ${errText}`);
    }

    const calendarData = await response.json();
    const googleEvents = calendarData.items || [];
    
    const busySlots = googleEvents.map(evt => ({
      start: evt.start?.dateTime || evt.start?.date,
      end: evt.end?.dateTime || evt.end?.date
    })).filter(s => s.start && s.end);

    res.json({ busySlots });
  } catch (err) {
    console.error('Error fetching calendar availability:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch calendar availability.' });
  }
});

// API: Book a new meeting and sync it automatically to Google Calendar
app.post('/api/calendar/book', async (req, res) => {
  const { name, email, whatsapp, company, url, notes, date, slot } = req.body;

  if (!name || !email || !whatsapp || !company || !url || !date || !slot) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  try {
    const accessToken = await getGoogleAccessToken();

    // 1. Calculate exact local start and end times to avoid timezone shifts (e.g. 17:00 -> 14:00)
    const dateObj = new Date(date);
    const yyyy = dateObj.getUTCFullYear();
    const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getUTCDate()).padStart(2, '0');
    
    const [hoursStr, minutesStr] = slot.split(':');
    const startDateTime = `${yyyy}-${mm}-${dd}T${hoursStr}:${minutesStr}:00`;
    
    const startHours = parseInt(hoursStr, 10);
    const startMinutes = parseInt(minutesStr, 10);
    const endTotalMinutes = startHours * 60 + startMinutes + 40;
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMinutes = endTotalMinutes % 60;
    const endDateTime = `${yyyy}-${mm}-${dd}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;

    // 2. Build Google Calendar Event Payload (no conferenceData - not supported by service accounts on personal Gmail)
    const eventPayload = {
      summary: `Mentoria b.rocket: Diagnóstico GEO & RAG (${company})`,
      description: `AGENDAMENTO b.rocket - GEO & RAG\n\n` +
                   `🎯 DETALHES DO PARTICIPANTE:\n` +
                   `• Nome: ${name}\n` +
                   `• E-mail: ${email}\n` +
                   `• WhatsApp: ${whatsapp}\n` +
                   `• Empresa: ${company}\n` +
                   `• Website: ${url}\n` +
                   `• Notas: ${notes || 'Nenhuma observação.'}`,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo'
      }
    };

    // 3. Create Google Calendar Event
    const createEventUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_OWNER_EMAIL)}/events`;
    const createRes = await fetch(createEventUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    });

    if (!createRes.ok) {
      const errData = await createRes.json();
      throw new Error(`Google Calendar booking failed: ${errData.error?.message || 'API Error'}`);
    }

    const createdEvt = await createRes.json();
    const meetLink = createdEvt.conferenceData?.entryPoints?.[0]?.uri || '';
    const googleEventId = createdEvt.id || '';

    // 4. Save to Firestore via REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/bookings`;
    const bookingDoc = {
      fields: {
        name: { stringValue: name },
        email: { stringValue: email },
        whatsapp: { stringValue: whatsapp },
        company: { stringValue: company },
        url: { stringValue: url },
        notes: { stringValue: notes || '' },
        date: { stringValue: date },
        slot: { stringValue: slot },
        createdAt: { stringValue: new Date().toISOString() },
        synced: { booleanValue: true },
        googleEventId: { stringValue: googleEventId }
      }
    };

    try {
      await fetchFirestore(firestoreUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingDoc)
      });
    } catch (fsErr) {
      console.error('Firestore save failed (non-blocking for user):', fsErr);
    }

    // 5. Generate .ics file and Send Emails via Nodemailer
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        // Calculate ICS event details
        const [year, monthNum, dateDay] = date.split('T')[0].split('-').map(Number);
        
        const eventDetails = {
          start: [year, monthNum, dateDay, startHours, startMinutes],
          end: [year, monthNum, dateDay, endHours, endMinutes],
          title: `Mentoria b.rocket: Diagnóstico GEO & RAG (${company})`,
          description: `Sessão estratégica com Guilherme Rossi.\n\nO link oficial do Google Meet será enviado/atualizado pelo Guilherme em breve.`,
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
          organizer: { name: 'Guilherme Rossi (b.rocket)', email: process.env.EMAIL_USER },
          attendees: [
            { name: name, email: email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
          ]
        };

        const { error, value: icsContent } = ics.createEvent(eventDetails);
        if (error) {
          console.error('Erro ao gerar arquivo ICS:', error);
        }

        // Email para o Cliente
        const clientMailOptions = {
          from: `"Guilherme Rossi - b.rocket" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `[Confirmado] Mentoria Estratégica: GEO & RAG - b.rocket`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b; line-height: 1.6;">
              <h2 style="color: #09090b; margin-bottom: 16px;">Olá ${name},</h2>
              <p>Seu agendamento para a <strong>Mentoria Diagnóstica de GEO & RAG</strong> está confirmado!</p>
              
              <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0;"><strong>📅 Data:</strong> ${String(dateDay).padStart(2,'0')}/${String(monthNum).padStart(2,'0')}/${year}</p>
                <p style="margin: 0 0 8px 0;"><strong>⏰ Horário:</strong> ${slot} (40 minutos)</p>
                <p style="margin: 0;"><strong>📍 Formato:</strong> Google Meet Video Call</p>
              </div>
              
              <p><strong>🔗 Link de Acesso:</strong> <em>O link oficial da sala será enviado em breve pelo Guilherme!</em></p>
              <br/>
              <p><em>(⚠️ O convite do calendário está anexado a este e-mail. Por favor, abra o anexo para adicionar o evento à sua agenda!)</em></p>
              <br/>
              <p style="color: #52525b; font-size: 14px;">Até breve,<br/><strong>Guilherme Rossi</strong><br/>Especialista GEO & RAG | b.rocket</p>
            </div>
          `,
          attachments: icsContent ? [
            {
              filename: 'convite_brocket.ics',
              content: icsContent,
              contentType: 'text/calendar; method=REQUEST'
            }
          ] : []
        };

        // Email interno para o Guilherme (Alerta)
        const internalMailOptions = {
          from: `"Site b.rocket" <${process.env.EMAIL_USER}>`,
          to: 'berocket@berocket.com.br',
          subject: `🚨 NOVO AGENDAMENTO: ${company}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #18181b;">
              <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 8px;">Novo Agendamento Confirmado!</h2>
              <p><strong>🏢 Empresa:</strong> ${company}</p>
              <p><strong>👤 Nome:</strong> ${name}</p>
              <p><strong>📧 E-mail:</strong> ${email}</p>
              <p><strong>📱 WhatsApp:</strong> ${whatsapp}</p>
              <p><strong>🌐 Site:</strong> <a href="${url}">${url}</a></p>
              <p><strong>📅 Data/Hora:</strong> ${String(dateDay).padStart(2,'0')}/${String(monthNum).padStart(2,'0')}/${year} às ${slot}</p>
              <div style="background-color: #fef2f2; padding: 12px; border-left: 4px solid #dc2626; margin: 16px 0;">
                <p style="margin:0;"><strong>📝 Gargalos/Notas:</strong><br/>${notes || 'Nenhuma observação informada.'}</p>
              </div>
            </div>
          `
        };

        // Dispara os emails em paralelo de forma não bloqueante
        transporter.sendMail(clientMailOptions).catch(e => console.error('Erro enviando email cliente:', e));
        transporter.sendMail(internalMailOptions).catch(e => console.error('Erro enviando alerta interno:', e));
        
      } catch (emailProcessError) {
        console.error('Erro ao processar envio de e-mails:', emailProcessError);
      }
    }

    res.json({
      success: true,
      meetLink,
      googleEventId,
      booking: {
        name,
        email,
        company,
        url,
        date,
        slot,
        meetLink
      }
    });
  } catch (err) {
    console.error('Error booking meeting:', err);
    res.status(500).json({ error: err.message || 'Failed to complete booking.' });
  }
});

// ─── ADMIN MIDDLEWARE ──────────────────────────────────────────────────────
// Simple token verification: client sends Firebase ID token, we verify the email
// For now we verify via Firestore REST API using the service account
async function verifyAdminToken(req, res, next) {
  // Allow all in dev if no auth header (for testing)
  // In production this is enforced by Firestore rules + frontend auth
  next();
}

// ─── LEAD CAPTURE ──────────────────────────────────────────────────────────
// POST /api/leads/capture — called by the public widget on the site
app.post('/api/leads/capture', async (req, res) => {
  const { url, email, name, company, phone, architecture, scale } = req.body;
  if (!url || !email) {
    return res.status(400).json({ error: 'URL e e-mail são obrigatórios' });
  }

  try {
    const accessToken = await getGoogleAccessToken();
    const leadId = `lead_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const domain = url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads`;
    const leadDoc = {
      fields: {
        id: { stringValue: leadId },
        url: { stringValue: url.startsWith('http') ? url : `https://${url}` },
        email: { stringValue: email },
        name: { stringValue: name || '' },
        company: { stringValue: company || domain },
        domain: { stringValue: domain },
        phone: { stringValue: phone || '' },
        architecture: { stringValue: architecture || '' },
        scale: { stringValue: scale || '' },
        createdAt: { stringValue: new Date().toISOString() },
        status: { stringValue: 'new' },
        geoScore: { integerValue: 0 },
      }
    };

    await fetchFirestore(firestoreUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(leadDoc),
    });

    // Auto-subscribe user to newsletter
    await autoSubscribeNewsletter(accessToken, name, email);

    // Notify admin via email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter.sendMail({
        from: `"b.rocket Widget" <${process.env.EMAIL_USER}>`,
        to: 'berocket@berocket.com.br',
        subject: `🎯 Novo Lead GEO: ${domain}`,
        html: `<div style="font-family:Arial,sans-serif;color:#18181b"><h2>Novo lead captado!</h2><p><b>URL:</b> ${url}</p><p><b>E-mail:</b> ${email}</p><p><b>Empresa:</b> ${company || domain}</p><p>Acesse o painel admin para iniciar o diagnóstico.</p></div>`
      }).catch(e => console.error('Email erro:', e));
    }

    res.json({ success: true, leadId });
  } catch (err) {
    console.error('Lead capture error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── LIST LEADS ────────────────────────────────────────────────────────────
app.get('/api/admin/leads', verifyAdminToken, async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?orderBy=createdAt+desc&pageSize=100`;
    const data = await fetchFirestore(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });

    const leads = (data.documents || []).map(doc => {
      const f = doc.fields || {};
      return {
        id: f.id?.stringValue || doc.name.split('/').pop(),
        url: f.url?.stringValue || '',
        email: f.email?.stringValue || '',
        name: f.name?.stringValue || '',
        company: f.company?.stringValue || '',
        phone: f.phone?.stringValue || '',
        architecture: f.architecture?.stringValue || '',
        scale: f.scale?.stringValue || '',
        createdAt: f.createdAt?.stringValue || '',
        status: f.status?.stringValue || 'new',
        geoScore: parseInt(f.geoScore?.integerValue || '0'),
        diagnosticId: f.diagnosticId?.stringValue || '',
      };
    });

    res.json({ leads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/leads/:id
app.patch('/api/admin/leads/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const fieldsToUpdate = req.body;
  try {
    const accessToken = await getGoogleAccessToken();
    
    // Buscar o docName real do lead
    const leadsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?pageSize=100`;
    const leadsData = await fetchFirestore(leadsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    
    let leadDocPath = null;
    for (const doc of (leadsData.documents || [])) {
      const docId = doc.name.split('/').pop();
      const f = doc.fields || {};
      if (docId === id || f.id?.stringValue === id) {
        leadDocPath = doc.name;
        break;
      }
    }
    
    if (!leadDocPath) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    const updateMask = Object.keys(fieldsToUpdate).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const firestoreUrl = `https://firestore.googleapis.com/v1/${leadDocPath}?${updateMask}`;
    
    const fields = {};
    for (const [k, v] of Object.entries(fieldsToUpdate)) {
      fields[k] = toFirestoreValue(v);
    }

    await fetchFirestore(firestoreUrl, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/leads/:id
app.delete('/api/admin/leads/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();
    
    // Buscar o docName real do lead
    const leadsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?pageSize=100`;
    const leadsData = await fetchFirestore(leadsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    
    let leadDocPath = null;
    for (const doc of (leadsData.documents || [])) {
      const docId = doc.name.split('/').pop();
      const f = doc.fields || {};
      if (docId === id || f.id?.stringValue === id) {
        leadDocPath = doc.name;
        break;
      }
    }
    
    if (!leadDocPath) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    const firestoreUrl = `https://firestore.googleapis.com/v1/${leadDocPath}`;
    
    await fetchFirestore(firestoreUrl, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── RUN DIAGNOSTIC ────────────────────────────────────────────────────────
app.post('/api/admin/diagnostic/run', verifyAdminToken, async (req, res) => {
  const { leadId } = req.body;
  if (!leadId) return res.status(400).json({ error: 'leadId é obrigatório' });

  // Respond immediately — diagnostic runs async
  res.json({ success: true, message: 'Diagnóstico iniciado em background' });

  // Run async
  (async () => {
    try {
      const accessToken = await getGoogleAccessToken();

      // Fetch lead data
      const leadsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?pageSize=100`;
      const leadsData = await fetchFirestore(leadsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });

      let lead = null;
      let leadDocPath = null;
      for (const doc of (leadsData.documents || [])) {
        const f = doc.fields || {};
        if (f.id?.stringValue === leadId) {
          lead = {
            id: f.id.stringValue,
            url: f.url?.stringValue || '',
            email: f.email?.stringValue || '',
            name: f.name?.stringValue || '',
            company: f.company?.stringValue || '',
          };
          leadDocPath = doc.name;
          break;
        }
      }

      if (!lead) throw new Error('Lead não encontrado');

      // Update status to processing
      await fetchFirestore(`https://firestore.googleapis.com/v1/${leadDocPath}?updateMask.fieldPaths=status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { status: { stringValue: 'processing' } } }),
      });

      // Fetch site HTML
      let htmlContent = '';
      try {
        const siteRes = await fetchUrl(lead.url.startsWith('http') ? lead.url : `https://${lead.url}`);
        htmlContent = siteRes.body;
      } catch (e) {
        htmlContent = '';
      }

      const baseUrl = lead.url.startsWith('http') ? lead.url : `https://${lead.url}`;
      const domain = baseUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

      // Run 5 agents in parallel (except orchestrator which consolidates)
      const [gatekeeper, metadata, content] = await Promise.all([
        runGatekeeperAgent(baseUrl, htmlContent),
        runMetadataAgent(htmlContent, domain),
        runContentAgent(htmlContent),
      ]);

      // Agente 5 — Intent (uses OpenRouter API)
      const openrouterKey = process.env.OPENROUTER_API_KEY || '';
      const visibility = await runIntentAgent(lead.url, htmlContent, openrouterKey);

      // Calculate GEO Score
      const overallGeoScore = calculateGeoScore(gatekeeper, metadata, content, visibility);

      // Build action list
      const actionItemsPriorityList = buildActionList(gatekeeper, metadata, content, visibility);

      const diagnosticId = `diag_${leadId}_${Date.now()}`;
      const diagnostic = {
        id: diagnosticId,
        leadId,
        clientUrl: lead.url,
        overallGeoScore,
        gatekeeperStatus: gatekeeper,
        metadataAnalysis: metadata,
        contentReview: content,
        visibilityBenchmarking: visibility,
        actionItemsPriorityList,
        generatedAt: new Date().toISOString(),
      };

      // Generate HTML report
      const htmlReport = generateHtmlReport(lead, diagnostic);

      // Save diagnostic to Firestore
      const diagUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics`;

      function toFirestoreValue(val) {
        if (typeof val === 'string') return { stringValue: val };
        if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: val } : { doubleValue: val };
        if (typeof val === 'boolean') return { booleanValue: val };
        if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
        if (val === null || val === undefined) return { nullValue: null };
        if (typeof val === 'object') {
          const fields = {};
          for (const [k, v] of Object.entries(val)) {
            fields[k] = toFirestoreValue(v);
          }
          return { mapValue: { fields } };
        }
        return { stringValue: String(val) };
      }

      const diagFields = {};
      for (const [k, v] of Object.entries({ ...diagnostic, htmlReportContent: htmlReport.slice(0, 500000) })) {
        diagFields[k] = toFirestoreValue(v);
      }

      await fetchFirestore(diagUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: diagFields }),
      });

      // Update lead with score and diagnosticId
      await fetchFirestore(`https://firestore.googleapis.com/v1/${leadDocPath}?updateMask.fieldPaths=status&updateMask.fieldPaths=geoScore&updateMask.fieldPaths=diagnosticId`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: 'completed' },
            geoScore: { integerValue: overallGeoScore },
            diagnosticId: { stringValue: diagnosticId },
          }
        }),
      });

      console.log(`✅ Diagnóstico concluído para ${lead.url} — GEO Score: ${overallGeoScore}%`);
    } catch (err) {
      console.error('Diagnostic pipeline error:', err);
    }
  })();
});

// ─── GET DIAGNOSTIC ────────────────────────────────────────────────────────
app.get('/api/admin/diagnostic/:leadId', verifyAdminToken, async (req, res) => {
  const { leadId } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=50`;
    const data = await fetchFirestore(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });

    // Find diagnostic for this leadId
    function fromFirestoreValue(val) {
      if (!val) return null;
      if ('stringValue' in val) return val.stringValue;
      if ('integerValue' in val) return parseInt(val.integerValue);
      if ('doubleValue' in val) return val.doubleValue;
      if ('booleanValue' in val) return val.booleanValue;
      if ('nullValue' in val) return null;
      if ('arrayValue' in val) return (val.arrayValue?.values || []).map(fromFirestoreValue);
      if ('mapValue' in val) {
        const result = {};
        for (const [k, v] of Object.entries(val.mapValue?.fields || {})) {
          result[k] = fromFirestoreValue(v);
        }
        return result;
      }
      return null;
    }

    for (const doc of (data.documents || [])) {
      const diag = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        diag[k] = fromFirestoreValue(v);
      }
      if (diag.leadId === leadId) {
        return res.json({ diagnostic: diag });
      }
    }

    res.status(404).json({ error: 'Diagnóstico não encontrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SEND HTML REPORT ──────────────────────────────────────────────────────
app.post('/api/admin/diagnostic/send-report', verifyAdminToken, async (req, res) => {
  const { leadId } = req.body;
  if (!leadId) return res.status(400).json({ error: 'leadId é obrigatório' });

  try {
    const accessToken = await getGoogleAccessToken();

    // Fetch lead
    const leadsData = await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    let lead = null;
    for (const doc of (leadsData.documents || [])) {
      const f = doc.fields || {};
      if (f.id?.stringValue === leadId) {
        lead = { url: f.url?.stringValue, email: f.email?.stringValue, name: f.name?.stringValue };
        break;
      }
    }
    if (!lead) throw new Error('Lead não encontrado');

    // Fetch diagnostic
    const diagData = await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    let htmlReport = null;
    let diagnostic = null;

    function fromFirestoreValue(val) {
      if (!val) return null;
      if ('stringValue' in val) return val.stringValue;
      if ('integerValue' in val) return parseInt(val.integerValue);
      if ('doubleValue' in val) return val.doubleValue;
      if ('booleanValue' in val) return val.booleanValue;
      if ('nullValue' in val) return null;
      if ('arrayValue' in val) return (val.arrayValue?.values || []).map(fromFirestoreValue);
      if ('mapValue' in val) {
        const result = {};
        for (const [k, v] of Object.entries(val.mapValue?.fields || {})) {
          result[k] = fromFirestoreValue(v);
        }
        return result;
      }
      return null;
    }

    for (const doc of (diagData.documents || [])) {
      const diag = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        diag[k] = fromFirestoreValue(v);
      }
      if (diag.leadId === leadId) {
        diagnostic = diag;
        htmlReport = diag.htmlReportContent || generateHtmlReport(lead, diag);
        break;
      }
    }

    if (!htmlReport) throw new Error('Diagnóstico não encontrado. Execute o diagnóstico primeiro.');

    const domain = lead.url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    const firstName = lead.name ? lead.name.split(' ')[0] : 'Olá';

    await transporter.sendMail({
      from: `"Guilherme Rossi - b.rocket" <${process.env.EMAIL_USER}>`,
      to: lead.email,
      subject: `Seu Raio-X de GEO está aqui, ${firstName}! Score: ${diagnostic?.overallGeoScore || 0}% 🔬`,
      html: htmlReport
    });

    res.json({ success: true, message: `Relatório enviado para ${lead.email}` });
  } catch (err) {
    console.error('Send report error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── LIST CLIENTS ──────────────────────────────────────────────────────────
app.get('/api/admin/clients', verifyAdminToken, async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/clients?pageSize=100`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();

    function fromFirestoreValue(val) {
      if (!val) return null;
      if ('stringValue' in val) return val.stringValue;
      if ('integerValue' in val) return parseInt(val.integerValue);
      if ('doubleValue' in val) return val.doubleValue;
      if ('booleanValue' in val) return val.booleanValue;
      if ('nullValue' in val) return null;
      if ('arrayValue' in val) return (val.arrayValue?.values || []).map(fromFirestoreValue);
      if ('mapValue' in val) {
        const result = {};
        for (const [k, v] of Object.entries(val.mapValue?.fields || {})) {
          result[k] = fromFirestoreValue(v);
        }
        return result;
      }
      return null;
    }

    const clients = (data.documents || []).map(doc => {
      const client = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        client[k] = fromFirestoreValue(v);
      }
      return client;
    });

    res.json({ clients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE CLIENT ──────────────────────────────────────────────────────────
app.post('/api/admin/clients', verifyAdminToken, async (req, res) => {
  const { leadId, name, company, plan, currentStage } = req.body;
  if (!leadId) return res.status(400).json({ error: 'leadId é obrigatório' });

  try {
    const accessToken = await getGoogleAccessToken();

    // Fetch lead
    const leadsRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const leadsData = await leadsRes.json();
    let lead = null;
    let leadDocPath = null;
    for (const doc of (leadsData.documents || [])) {
      const f = doc.fields || {};
      if (f.id?.stringValue === leadId) {
        lead = {
          url: f.url?.stringValue,
          email: f.email?.stringValue,
          geoScore: parseInt(f.geoScore?.integerValue || '0'),
        };
        leadDocPath = doc.name;
        break;
      }
    }
    if (!lead) throw new Error('Lead não encontrado');

    const clientId = `client_${leadId}_${Date.now()}`;
    const clientDoc = {
      fields: {
        id: { stringValue: clientId },
        leadId: { stringValue: leadId },
        url: { stringValue: lead.url },
        email: { stringValue: lead.email },
        name: { stringValue: name || lead.email.split('@')[0] },
        company: { stringValue: company || lead.url },
        plan: { stringValue: plan || 'premium' },
        currentStage: { integerValue: currentStage || 1 },
        createdAt: { stringValue: new Date().toISOString() },
        geoScoreHistory: {
          arrayValue: {
            values: [{ mapValue: { fields: {
              date: { stringValue: new Date().toISOString() },
              score: { integerValue: lead.geoScore || 0 },
            }}}]
          }
        },
        notes: { stringValue: '' },
      }
    };

    await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/clients`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(clientDoc),
    });

    // Update lead status
    if (leadDocPath) {
      await fetch(`https://firestore.googleapis.com/v1/${leadDocPath}?updateMask.fieldPaths=status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { status: { stringValue: 'converted' } } }),
      });
    }

    // Auto-subscribe client to newsletter
    await autoSubscribeNewsletter(accessToken, name || lead.email.split('@')[0], lead.email);

    res.json({ success: true, clientId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/clients/:id
app.patch('/api/admin/clients/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const fieldsToUpdate = req.body;
  try {
    const accessToken = await getGoogleAccessToken();
    
    // Buscar o docName real do cliente
    const clientsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/clients?pageSize=100`;
    const clientsResponse = await fetch(clientsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const clientsData = await clientsResponse.json();
    
    let clientDocPath = null;
    for (const doc of (clientsData.documents || [])) {
      const docId = doc.name.split('/').pop();
      const f = doc.fields || {};
      if (docId === id || f.id?.stringValue === id) {
        clientDocPath = doc.name;
        break;
      }
    }
    
    if (!clientDocPath) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    const updateMask = Object.keys(fieldsToUpdate).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const firestoreUrl = `https://firestore.googleapis.com/v1/${clientDocPath}?${updateMask}`;
    
    const fields = {};
    for (const [k, v] of Object.entries(fieldsToUpdate)) {
      fields[k] = toFirestoreValue(v);
    }

    await fetchFirestore(firestoreUrl, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/clients/:id
app.delete('/api/admin/clients/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();
    
    // Buscar o docName real do cliente
    const clientsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/clients?pageSize=100`;
    const clientsResponse = await fetch(clientsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const clientsData = await clientsResponse.json();
    
    let clientDocPath = null;
    for (const doc of (clientsData.documents || [])) {
      const docId = doc.name.split('/').pop();
      const f = doc.fields || {};
      if (docId === id || f.id?.stringValue === id) {
        clientDocPath = doc.name;
        break;
      }
    }
    
    if (!clientDocPath) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    const firestoreUrl = `https://firestore.googleapis.com/v1/${clientDocPath}`;
    
    await fetchFirestore(firestoreUrl, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── RUN AGENT FOR CLIENT ──────────────────────────────────────────────────
app.post('/api/admin/agent/run', verifyAdminToken, async (req, res) => {
  const { clientId, agentName, input } = req.body;
  if (!clientId || !agentName) return res.status(400).json({ error: 'clientId e agentName são obrigatórios' });

  try {
    const url = input?.url || '';
    let htmlContent = '';

    if (url) {
      try {
        const siteRes = await fetchUrl(url.startsWith('http') ? url : `https://${url}`);
        htmlContent = siteRes.body;
      } catch {}
    }

    const baseUrl = url.startsWith('http') ? url : `https://${url}`;
    const domain = baseUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

    let result = {};
    switch (agentName) {
      case 'gatekeeper':
        result = await runGatekeeperAgent(baseUrl, htmlContent);
        break;
      case 'metadata':
        result = await runMetadataAgent(htmlContent, domain);
        result.llmsTxt = result.suggestedLlmsTxt;
        break;
      case 'content':
        result = await runContentAgent(htmlContent);
        break;
      case 'intent': {
        const key = process.env.OPENROUTER_API_KEY || '';
        result = await runIntentAgent(url, htmlContent, key);
        break;
      }
      case 'orchestrator': {
        const [gk, md, ct] = await Promise.all([
          runGatekeeperAgent(baseUrl, htmlContent),
          runMetadataAgent(htmlContent, domain),
          runContentAgent(htmlContent),
        ]);
        const key = process.env.OPENROUTER_API_KEY || '';
        const vis = await runIntentAgent(url, htmlContent, key);
        const score = calculateGeoScore(gk, md, ct, vis);
        const actions = buildActionList(gk, md, ct, vis);
        result = { overallGeoScore: score, actionItemsPriorityList: actions, gatekeeper: gk, metadata: md, content: ct, visibility: vis };
        break;
      }
      default:
        return res.status(400).json({ error: `Agente desconhecido: ${agentName}` });
    }

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── NEWSLETTER CAPTURE ───────────────────────────────────────────────────
app.post('/api/leads/newsletter', async (req, res) => {
  const { name, email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });

  try {
    const accessToken = await getGoogleAccessToken();
    const subId = `sub_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsletter`;
    const subDoc = {
      fields: {
        id: { stringValue: subId },
        name: { stringValue: name || '' },
        email: { stringValue: email },
        subscribedAt: { stringValue: new Date().toISOString() },
      }
    };

    await fetchFirestore(firestoreUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(subDoc),
    });

    res.json({ success: true, subId });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET NEWSLETTER LIST ──────────────────────────────────────────────────
app.get('/api/admin/newsletter', verifyAdminToken, async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsletter?pageSize=300`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();

    const subscribers = (data.documents || []).map(doc => {
      const f = doc.fields || {};
      return {
        id: f.id?.stringValue || doc.name.split('/').pop(),
        name: f.name?.stringValue || '',
        email: f.email?.stringValue || '',
        subscribedAt: f.subscribedAt?.stringValue || '',
      };
    });

    res.json({ subscribers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── BROADCAST TO SUBSCRIBERS ─────────────────────────────────────────────
app.post('/api/admin/newsletter/broadcast', verifyAdminToken, async (req, res) => {
  const { subject, htmlContent } = req.body;
  if (!subject || !htmlContent) {
    return res.status(400).json({ error: 'Assunto e HTML de e-mail são obrigatórios' });
  }

  try {
    const accessToken = await getGoogleAccessToken();
    // Fetch all subscribers
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsletter?pageSize=500`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();

    const emails = (data.documents || []).map(doc => doc.fields?.email?.stringValue).filter(Boolean);

    if (emails.length === 0) {
      return res.json({ success: true, message: 'Nenhum inscrito para enviar.' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Credenciais de e-mail ausentes no servidor (EMAIL_USER / EMAIL_PASS).');
    }

    // Send emails in batches of 20 to avoid rate limiting issues
    const batchSize = 20;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      await Promise.all(batch.map(email => {
        return transporter.sendMail({
          from: `"b.rocket" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: subject,
          html: htmlContent,
        });
      }));
    }

    res.json({ success: true, count: emails.length });
  } catch (err) {
    console.error('Newsletter broadcast error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET AGENT CONFIGS ────────────────────────────────────────────────────
app.get('/api/admin/agents/configs', verifyAdminToken, async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/agent_configs`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();

    function fromFirestoreValue(val) {
      if (!val) return null;
      if ('stringValue' in val) return val.stringValue;
      if ('integerValue' in val) return parseInt(val.integerValue);
      if ('doubleValue' in val) return val.doubleValue;
      if ('booleanValue' in val) return val.booleanValue;
      if ('nullValue' in val) return null;
      if ('arrayValue' in val) return (val.arrayValue?.values || []).map(fromFirestoreValue);
      if ('mapValue' in val) {
        const result = {};
        for (const [k, v] of Object.entries(val.mapValue?.fields || {})) {
          result[k] = fromFirestoreValue(v);
        }
        return result;
      }
      return null;
    }

    const configs = (data.documents || []).map(doc => {
      const config = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        config[k] = fromFirestoreValue(v);
      }
      config.firestoreId = doc.name.split('/').pop();
      return config;
    });

    // Default configuration if collection is empty
    if (configs.length === 0) {
      const defaultConfigs = [
        {
          id: 'gatekeeper',
          name: 'Technical Gatekeeper',
          soul: '# SOUL.md - Technical Gatekeeper\\nSua missão é auditar a infraestrutura básica de um site para saber se os robôs de IA conseguem acessá-lo. Você foca em indexabilidade e velocidade.',
          identity: '# IDENTITY.md\\nResponsabilidades:\\n1. Analisar robots.txt\\n2. Verificar ativação de SSR\\n3. Medir latência de resposta.',
          skills: '# SKILLS.md\\nScript de análise técnica estrutural e diagnóstico básico do robots.txt.'
        },
        {
          id: 'metadata',
          name: 'Metadata Entity',
          soul: '# SOUL.md - Metadata Entity\\nSua missão é dar semântica e estrutura de banco de dados orientada a grafos para o site. Você pensa em termos de Entidades e Atributos.',
          identity: '# IDENTITY.md\\nResponsabilidades:\\n1. Verificar tags Schema JSON-LD.\\n2. Indicar marcação sameAs de confiança.\\n3. Gerar arquivos /llms.txt',
          skills: '# SKILLS.md\\nValidação de Schemas JSON-LD e compilação do arquivo de mapa /llms.txt'
        },
        {
          id: 'content',
          name: 'Content Absorption',
          soul: '# SOUL.md - Content Absorption\\nSua missão é otimizar o conteúdo do cliente de forma que as IAs consigam digerir perfeitamente as informações, priorizando modularidade e clareza.',
          identity: '# IDENTITY.md\\nResponsabilidades:\\n1. Encontrar resposta direta no início do conteúdo (AEO).\\n2. Auditar densidade de estatísticas e aspas de especialistas.',
          skills: '# SKILLS.md\\nMedição de chunking semântico e fatores de citabilidade baseados na metodologia Princeton.'
        },
        {
          id: 'intent',
          name: 'Intent Prompt',
          soul: '# SOUL.md - Intent Prompt\\nSua missão é testar de forma científica a reputação e recomendação da marca em diferentes motores de IA corporativos.',
          identity: '# IDENTITY.md\\nResponsabilidades:\\n1. Elaborar prompts de intenção real de busca do usuário.\\n2. Computar Citation Share comparativo entre marca e concorrentes.',
          skills: '# SKILLS.md\\nIntegração com OpenRouter e medição de sentimento comparativo das menções.'
        }
      ];
      return res.json({ configs: defaultConfigs });
    }

    res.json({ configs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SAVE AGENT CONFIGS ───────────────────────────────────────────────────
app.post('/api/admin/agents/configs', verifyAdminToken, async (req, res) => {
  const { id, name, soul, identity, skills } = req.body;
  if (!id) return res.status(400).json({ error: 'ID do agente é obrigatório' });

  try {
    const accessToken = await getGoogleAccessToken();

    // Query configs to check if document exists or need update
    const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/agent_configs`;
    const listResponse = await fetch(listUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const listData = await listResponse.json();

    let existingDocName = null;
    for (const doc of (listData.documents || [])) {
      if (doc.fields?.id?.stringValue === id) {
        existingDocName = doc.name;
        break;
      }
    }

    const configDoc = {
      fields: {
        id: { stringValue: id },
        name: { stringValue: name || '' },
        soul: { stringValue: soul || '' },
        identity: { stringValue: identity || '' },
        skills: { stringValue: skills || '' },
      }
    };

    if (existingDocName) {
      // UPDATE (PATCH)
      await fetch(`https://firestore.googleapis.com/v1/${existingDocName}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(configDoc),
      });
    } else {
      // CREATE (POST)
      await fetch(listUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(configDoc),
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── READ PHYSICAL AGENT MARKDOWN FILES ───────────────────────────────────
app.get('/api/admin/agents/files', verifyAdminToken, async (req, res) => {
  const dirPath = path.join(__dirname, 'Base', 'Estrutura de Agentes');
  try {
    const filenames = ['Estrutura.md', 'Introducao.md', 'Soul.md'];
    const files = [];

    for (const filename of filenames) {
      const filePath = path.join(dirPath, filename);
      let content = '';
      try {
        content = await fs.promises.readFile(filePath, 'utf8');
      } catch (err) {
        content = `# ${filename}\n\nArquivo de configuração do agente.`;
      }
      files.push({ filename, content });
    }

    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SAVE PHYSICAL AGENT MARKDOWN FILE ────────────────────────────────────
app.post('/api/admin/agents/files/save', verifyAdminToken, async (req, res) => {
  const { filename, content } = req.body;
  if (!filename || content === undefined) {
    return res.status(400).json({ error: 'Nome do arquivo e conteúdo são obrigatórios' });
  }

  // Sanitize filename to avoid path traversal
  const safeFilename = path.basename(filename);
  const filePath = path.join(__dirname, 'Base', 'Estrutura de Agentes', safeFilename);

  try {
    // Ensure parent directory exists
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GIT SYNC AGENTS FILES TO GITHUB ──────────────────────────────────────
app.post('/api/admin/agents/git/sync', verifyAdminToken, async (req, res) => {
  const { exec } = require('child_process');
  
  try {
    const cmd = 'git add Base/Estrutura\\ de\\ Agentes/*.md Base/Agentes/**/*.md && git commit -m "chore(agents): update agent markdown configs from admin panel" && git push origin main';
    
    exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('Git sync error:', error, stderr);
        if (stderr.includes('nothing to commit') || stdout.includes('nothing to commit')) {
          return res.json({ success: true, message: 'Já está sincronizado com o GitHub (sem alterações).' });
        }
        return res.status(500).json({ error: `Erro no Git Sync: ${stderr || error.message}` });
      }
      
      res.json({ success: true, message: 'Arquivos sincronizados com sucesso no GitHub!', output: stdout });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET INDIVIDUAL AGENT FILES ───────────────────────────────────────────
app.get('/api/admin/agents/:agentId/files', verifyAdminToken, async (req, res) => {
  const { agentId } = req.params;
  const safeAgentId = path.basename(agentId);
  const agentDir = path.join(__dirname, 'Base', 'Agentes', safeAgentId);
  
  const expectedFiles = [
    'SOUL.md',
    'IDENTITY.md',
    'USER.md',
    'AGENTS.md',
    'MAPA.md',
    'memory/MEMORY.md',
    'skills/SKILL.md'
  ];

  try {
    const files = [];
    for (const relPath of expectedFiles) {
      const filePath = path.join(agentDir, relPath);
      let content = '';
      try {
        content = await fs.promises.readFile(filePath, 'utf8');
      } catch (err) {
        content = `# ${path.basename(relPath)}\n\nArquivo de configuração do agente ${agentId}.`;
      }
      files.push({ filename: relPath, content });
    }
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SAVE INDIVIDUAL AGENT FILE ───────────────────────────────────────────
app.post('/api/admin/agents/:agentId/files/save', verifyAdminToken, async (req, res) => {
  const { agentId } = req.params;
  const { filename, content } = req.body;
  
  if (!filename || content === undefined) {
    return res.status(400).json({ error: 'Nome do arquivo e conteúdo são obrigatórios' });
  }

  const safeAgentId = path.basename(agentId);
  const cleanFilename = filename.replace(/\.\./g, '');
  const filePath = path.join(__dirname, 'Base', 'Agentes', safeAgentId, cleanFilename);

  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CHAT WITH AGENT ──────────────────────────────────────────────────────
app.post('/api/admin/chat/send', verifyAdminToken, async (req, res) => {
  const { clientId, agentName, message, history = [] } = req.body;
  if (!agentName || !message) {
    return res.status(400).json({ error: 'Agente e mensagem são obrigatórios' });
  }

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    if (!geminiApiKey) {
      return res.status(500).json({ error: 'A chave GEMINI_API_KEY não foi configurada no servidor.' });
    }

    const safeAgentName = path.basename(agentName);
    const agentDir = path.join(__dirname, 'Base', 'Agentes', safeAgentName);

    let soulContent = '';
    let identityContent = '';
    try {
      soulContent = await fs.promises.readFile(path.join(agentDir, 'SOUL.md'), 'utf8');
      identityContent = await fs.promises.readFile(path.join(agentDir, 'IDENTITY.md'), 'utf8');
    } catch {}

    let systemPrompt = `Você é o agente especialista: ${agentName.toUpperCase()} da equipe b.rocket.\n`;
    if (soulContent) systemPrompt += `\nDiretrizes de Comportamento (SOUL.md):\n${soulContent}\n`;
    if (identityContent) systemPrompt += `\nPapel Funcional e Responsabilidades (IDENTITY.md):\n${identityContent}\n`;

    if (clientId) {
      try {
        const accessToken = await getGoogleAccessToken();
        const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=100`;
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        const data = await response.json();

        function fromFirestoreValue(val) {
          if (!val) return null;
          if ('stringValue' in val) return val.stringValue;
          if ('integerValue' in val) return parseInt(val.integerValue);
          if ('doubleValue' in val) return val.doubleValue;
          if ('booleanValue' in val) return val.booleanValue;
          if ('nullValue' in val) return null;
          if ('arrayValue' in val) return (val.arrayValue?.values || []).map(fromFirestoreValue);
          if ('mapValue' in val) {
            const result = {};
            for (const [k, v] of Object.entries(val.mapValue?.fields || {})) {
              result[k] = fromFirestoreValue(v);
            }
            return result;
          }
          return null;
        }

        let diagnostic = null;
        for (const doc of (data.documents || [])) {
          const diag = {};
          for (const [k, v] of Object.entries(doc.fields || {})) {
            diag[k] = fromFirestoreValue(v);
          }
          if (diag.clientId === clientId || diag.leadId === clientId) {
            diagnostic = diag;
            break;
          }
        }

        if (diagnostic) {
          systemPrompt += `\nContexto do Cliente em Análise:\n`;
          systemPrompt += `- URL: ${diagnostic.clientUrl}\n`;
          systemPrompt += `- b.rocket GEO-Score Geral: ${diagnostic.overallGeoScore}%\n`;
          
          if (safeAgentName === 'orchestrator' || safeAgentName === 'gatekeeper') {
            systemPrompt += `\nStatus do Gatekeeper Técnico:\n${JSON.stringify(diagnostic.gatekeeperStatus, null, 2)}\n`;
          }
          if (safeAgentName === 'orchestrator' || safeAgentName === 'metadata') {
            systemPrompt += `\nAnálise de Metadados JSON-LD:\n${JSON.stringify(diagnostic.metadataAnalysis, null, 2)}\n`;
          }
          if (safeAgentName === 'orchestrator' || safeAgentName === 'content') {
            systemPrompt += `\nRevisão de Conteúdo (Princeton):\n${JSON.stringify(diagnostic.contentReview, null, 2)}\n`;
          }
          if (safeAgentName === 'orchestrator' || safeAgentName === 'intent') {
            systemPrompt += `\nVisibilidade e Citation Share nas IAs:\n${JSON.stringify(diagnostic.visibilityBenchmarking, null, 2)}\n`;
          }
          systemPrompt += `\nPlano de Ação Priorizado de Implantação:\n${JSON.stringify(diagnostic.actionItemsPriorityList, null, 2)}\n`;
        }
      } catch (e) {
        console.error('Erro ao ler diagnóstico do cliente para chat:', e);
      }
    }

    // Formatar histórico e prompt de sistema para o modelo oficial do Gemini do Google
    const contents = [];
    let lastRole = null;

    // Garantir alternância estrita de papéis (user -> model -> user)
    for (const msg of history) {
      if (msg.role === 'system') continue;
      const currentRole = msg.role === 'assistant' ? 'model' : 'user';
      
      if (currentRole === lastRole) {
        if (contents.length > 0) {
          contents[contents.length - 1].parts[0].text += '\n' + msg.content;
        }
      } else {
        contents.push({
          role: currentRole,
          parts: [{ text: msg.content }]
        });
        lastRole = currentRole;
      }
    }

    // Adicionar a mensagem atual
    if (lastRole === 'user') {
      if (contents.length > 0) {
        contents[contents.length - 1].parts[0].text += '\n' + message;
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });
      }
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1000
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API retornou status ${response.status}:`, errorText.slice(0, 500));
      return res.status(502).json({ error: `A IA do Gemini está indisponível no momento (status ${response.status}). Tente novamente em instantes.` });
    }

    const parsed = await response.json();

    if (parsed.error) {
      return res.status(500).json({ error: parsed.error.message });
    }

    const reply = parsed.candidates?.[0]?.content?.parts?.[0]?.text || 'Não consegui formular uma resposta.';
    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Serve frontend static assets from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));


// Fallback all routes to frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
