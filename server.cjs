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

    const firestoreRes = await fetch(firestoreUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingDoc)
    });

    if (!firestoreRes.ok) {
      console.error('Firestore save failed (non-blocking for user):', await firestoreRes.text());
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
  const { url, email, name, company } = req.body;
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
        createdAt: { stringValue: new Date().toISOString() },
        status: { stringValue: 'new' },
        geoScore: { integerValue: 0 },
      }
    };

    await fetch(firestoreUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(leadDoc),
    });

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
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();

    const leads = (data.documents || []).map(doc => {
      const f = doc.fields || {};
      return {
        id: f.id?.stringValue || doc.name.split('/').pop(),
        url: f.url?.stringValue || '',
        email: f.email?.stringValue || '',
        name: f.name?.stringValue || '',
        company: f.company?.stringValue || '',
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
      const leadsRes = await fetch(leadsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const leadsData = await leadsRes.json();

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
      await fetch(`https://firestore.googleapis.com/v1/${leadDocPath}?updateMask.fieldPaths=status`, {
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

      await fetch(diagUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: diagFields }),
      });

      // Update lead with score and diagnosticId
      await fetch(`https://firestore.googleapis.com/v1/${leadDocPath}?updateMask.fieldPaths=status&updateMask.fieldPaths=geoScore&updateMask.fieldPaths=diagnosticId`, {
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
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();

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
    const leadsRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const leadsData = await leadsRes.json();
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
    const diagRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const diagData = await diagRes.json();
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
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#18181b">
          <div style="background:#09090b;padding:24px;border-radius:12px 12px 0 0">
            <p style="color:#3b82f6;font-family:monospace;font-size:11px;margin:0">b.rocket // GEO_CORE_V10 // DIAGNÓSTICO COMPLETO</p>
          </div>
          <div style="padding:24px;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 12px 12px">
            <h2 style="color:#09090b">Olá ${firstName},</h2>
            <p>O diagnóstico completo de GEO do site <strong>${domain}</strong> foi concluído.</p>
            <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
              <p style="font-size:12px;color:#71717a;margin:0 0 4px">Seu GEO Score inicial</p>
              <p style="font-size:48px;font-weight:800;color:${diagnostic?.overallGeoScore >= 70 ? '#16a34a' : diagnostic?.overallGeoScore >= 40 ? '#d97706' : '#dc2626'};margin:0">${diagnostic?.overallGeoScore || 0}%</p>
            </div>
            <p>O relatório completo com o diagnóstico de todos os 4 agentes e o plano de ação priorizado está <strong>anexado a este e-mail</strong>.</p>
            <p>Se quiser discutir os resultados e entender como podemos melhorar sua visibilidade nas IAs, estamos disponíveis:</p>
            <div style="text-align:center;margin:24px 0">
              <a href="https://geo.berocket.com.br#pricing" style="background:#09090b;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:14px">Falar com Guilherme →</a>
            </div>
            <p style="color:#71717a;font-size:13px">Até breve,<br><strong>Guilherme Rossi</strong><br>Especialista GEO & RAG | b.rocket</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `raio-x-geo-${domain}.html`,
          content: htmlReport,
          contentType: 'text/html',
        }
      ]
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

    res.json({ success: true, clientId });
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

// Serve frontend static assets from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback all routes to frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
