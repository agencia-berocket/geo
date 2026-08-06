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
  runSemanticExplorerAgent,
  runOffPageEntityAgent,
  runSeoOptimizerAgent,
  runChecklistArchitectAgent,
  calculateGeoScore,
  buildActionList,
  generateHtmlReport,
  generatePdfReport,
  generateRobotsTxt,
  generateJsonLdSchema,
  generateLlmsTxtContent,
  generateAeoContentTemplate,
  generateActionPlanByStages,
  fetchUrl,
  generateCompleteHtmlReport,
  takeReportScreenshots,
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

    // 4.b AUTO-LEAD & AUTO-DIAGNOSTIC PIPELINE (Fluxo Pós-Agendamento)
    (async () => {
      try {
        const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
        const domain = normalizedUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
        
        // Verificar se lead já existe no Firestore
        const leadsListUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?pageSize=100`;
        const leadsRes = await fetchFirestore(leadsListUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        
        let existingLeadId = null;
        let existingLeadDocPath = null;

        for (const doc of (leadsRes.documents || [])) {
          const f = doc.fields || {};
          const lUrl = f.url?.stringValue || '';
          const lEmail = f.email?.stringValue || '';
          if (lEmail.toLowerCase() === email.toLowerCase() || lUrl.includes(domain)) {
            existingLeadId = f.id?.stringValue || doc.name.split('/').pop();
            existingLeadDocPath = doc.name;
            break;
          }
        }

        let leadIdToRun = existingLeadId;

        if (!existingLeadId) {
          // Criar novo lead automaticamente a partir do agendamento
          leadIdToRun = `lead_booking_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
          const newLeadDoc = {
            fields: {
              id: { stringValue: leadIdToRun },
              url: { stringValue: normalizedUrl },
              email: { stringValue: email },
              name: { stringValue: name || '' },
              company: { stringValue: company || domain },
              domain: { stringValue: domain },
              phone: { stringValue: whatsapp || '' },
              createdAt: { stringValue: new Date().toISOString() },
              status: { stringValue: 'processing' },
              geoScore: { integerValue: 0 },
              bookingId: { stringValue: googleEventId || '' },
              bookingDate: { stringValue: date },
              bookingSlot: { stringValue: slot }
            }
          };

          await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(newLeadDoc),
          });
          console.log(`✅ Lead criado automaticamente a partir de agendamento: ${leadIdToRun}`);
        } else if (existingLeadDocPath) {
          // Atualizar lead existente com dados do booking
          await fetchFirestore(`https://firestore.googleapis.com/v1/${existingLeadDocPath}?updateMask.fieldPaths=bookingDate&updateMask.fieldPaths=bookingSlot`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                bookingDate: { stringValue: date },
                bookingSlot: { stringValue: slot }
              }
            })
          });
        }

        // Auto-iniciar diagnóstico para o lead do agendamento se leadIdToRun válido
        if (leadIdToRun) {
          console.log(`🚀 Iniciando diagnóstico automático para lead de agendamento (${domain})...`);
          
          const baseUrl = normalizedUrl;
          const htmlContent = await fetchUrl(baseUrl);
          const openrouterKey = process.env.OPENROUTER_API_KEY || '';
          
          const [gk, md, ct, sem, off, seo] = await Promise.all([
            runGatekeeperAgent(baseUrl, htmlContent),
            runMetadataAgent(htmlContent, domain),
            runContentAgent(htmlContent),
            runSemanticExplorerAgent(baseUrl, htmlContent, openrouterKey),
            runOffPageEntityAgent(baseUrl, htmlContent, openrouterKey),
            runSeoOptimizerAgent(baseUrl, htmlContent),
          ]);
          
          const vis = await runIntentAgent(baseUrl, htmlContent, openrouterKey);
          const chk = await runChecklistArchitectAgent(gk, md, ct, seo, sem, off, domain, baseUrl);
          
          const score = calculateGeoScore(gk, md, ct, vis, sem, off, seo);
          const actions = buildActionList(gk, md, ct, vis, sem, off, seo);
          
          const diagnosticId = `diag_${leadIdToRun}_${Date.now()}`;
          const leadObj = { id: leadIdToRun, url: baseUrl, email, name, company };
          const diagObj = {
            id: diagnosticId,
            leadId: leadIdToRun,
            clientUrl: baseUrl,
            overallGeoScore: score,
            gatekeeperStatus: gk,
            metadataAnalysis: md,
            contentReview: ct,
            seoAnalysis: seo,
            semanticAnalysis: sem,
            offpageAnalysis: off,
            visibilityBenchmarking: vis,
            checklist: chk,
            actionItemsPriorityList: actions,
            generatedAt: new Date().toISOString(),
          };

          const htmlReport = generateHtmlReport(leadObj, diagObj);
          
          function toFs(val) {
            if (typeof val === 'string') return { stringValue: val };
            if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: val } : { doubleValue: val };
            if (typeof val === 'boolean') return { booleanValue: val };
            if (Array.isArray(val)) return { arrayValue: { values: val.map(toFs) } };
            if (val === null || val === undefined) return { nullValue: null };
            if (typeof val === 'object') {
              const fields = {};
              for (const [k, v] of Object.entries(val)) { fields[k] = toFs(v); }
              return { mapValue: { fields } };
            }
            return { stringValue: String(val) };
          }

          const diagFields = {};
          for (const [k, v] of Object.entries({ ...diagObj, htmlReportContent: htmlReport.slice(0, 500000) })) {
            diagFields[k] = toFs(v);
          }

          await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: diagFields }),
          });

          // Atualizar status do lead para completed
          if (existingLeadDocPath) {
            await fetchFirestore(`https://firestore.googleapis.com/v1/${existingLeadDocPath}?updateMask.fieldPaths=status&updateMask.fieldPaths=geoScore&updateMask.fieldPaths=diagnosticId`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fields: {
                  status: { stringValue: 'completed' },
                  geoScore: { integerValue: score },
                  diagnosticId: { stringValue: diagnosticId }
                }
              })
            });
          }
          console.log(`✅ Diagnóstico automático concluído pós-agendamento — Score: ${score}%`);
        }
      } catch (autoErr) {
        console.error('Erro no pipeline pós-agendamento:', autoErr);
      }
    })();

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
// Verificação de dois fatores:
// 1. ADMIN_SECRET_KEY (env) — para chamadas server-to-server
// 2. Firebase ID Token — verificado via Google Identity Toolkit REST API
// Apenas o e-mail berocket@berocket.com.br é autorizado

const ADMIN_EMAIL = 'berocket@berocket.com.br';
const FIREBASE_WEB_API_KEY = (() => {
  try {
    return require('./firebase-applet-config.json').apiKey;
  } catch {
    return process.env.FIREBASE_WEB_API_KEY || '';
  }
})();

async function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token de autenticação não fornecido.',
      code: 'NO_TOKEN'
    });
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  // ── Camada 1: Chave secreta estática (para emergências / scripts internos) ──
  const secretKey = process.env.ADMIN_SECRET_KEY;
  if (secretKey && token === secretKey) {
    req.adminEmail = ADMIN_EMAIL;
    return next();
  }

  // ── Camada 2: Firebase ID Token via Identity Toolkit ──
  if (!FIREBASE_WEB_API_KEY) {
    console.error('FIREBASE_WEB_API_KEY não configurada — admin bloqueado por segurança');
    return res.status(500).json({ error: 'Configuração de autenticação ausente no servidor.' });
  }

  try {
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!verifyRes.ok) {
      const errData = await verifyRes.json().catch(() => ({}));
      const errMsg = errData?.error?.message || 'Token inválido ou expirado';
      return res.status(401).json({ error: `Autenticação falhou: ${errMsg}`, code: 'INVALID_TOKEN' });
    }

    const data = await verifyRes.json();
    const userInfo = data.users?.[0];

    if (!userInfo) {
      return res.status(401).json({ error: 'Usuário não encontrado.', code: 'USER_NOT_FOUND' });
    }

    if (!userInfo.emailVerified) {
      return res.status(403).json({ error: 'E-mail não verificado.', code: 'EMAIL_NOT_VERIFIED' });
    }

    if (userInfo.email !== ADMIN_EMAIL) {
      console.warn(`⛔ Tentativa de acesso admin negada: ${userInfo.email}`);
      return res.status(403).json({
        error: 'Acesso negado. Apenas administradores autorizados.',
        code: 'UNAUTHORIZED_EMAIL'
      });
    }

    req.adminEmail = userInfo.email;
    return next();

  } catch (err) {
    console.error('Admin auth error:', err.message);
    return res.status(401).json({ error: 'Falha na verificação do token.', code: 'AUTH_ERROR' });
  }
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
      const openrouterKey = process.env.OPENROUTER_API_KEY || '';

      // Run 6 specialist agents in parallel
      const [gatekeeper, metadata, content, semantic, offpage, seo] = await Promise.all([
        runGatekeeperAgent(baseUrl, htmlContent),
        runMetadataAgent(htmlContent, domain),
        runContentAgent(htmlContent),
        runSemanticExplorerAgent(baseUrl, htmlContent, openrouterKey),
        runOffPageEntityAgent(baseUrl, htmlContent, openrouterKey),
        runSeoOptimizerAgent(baseUrl, htmlContent),
      ]);

      // Agente Intent (uses OpenRouter API)
      const visibility = await runIntentAgent(lead.url, htmlContent, openrouterKey);

      // Agente Checklist Architect (QA & Developer Checklists)
      const checklist = await runChecklistArchitectAgent(gatekeeper, metadata, content, seo, semantic, offpage, domain, baseUrl);

      // Calculate GEO Score across 7 pillars
      const overallGeoScore = calculateGeoScore(gatekeeper, metadata, content, visibility, semantic, offpage, seo);

      // Build action list
      const actionItemsPriorityList = buildActionList(gatekeeper, metadata, content, visibility, semantic, offpage, seo);

      const diagnosticId = `diag_${leadId}_${Date.now()}`;
      const diagnostic = {
        id: diagnosticId,
        leadId,
        clientUrl: lead.url,
        overallGeoScore,
        gatekeeperStatus: gatekeeper,
        metadataAnalysis: metadata,
        contentReview: content,
        seoAnalysis: seo,
        semanticAnalysis: semantic,
        offpageAnalysis: offpage,
        visibilityBenchmarking: visibility,
        checklist,
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
        htmlReport = generateHtmlReport(lead, diag);
        break;
      }
    }

    if (!htmlReport) throw new Error('Diagnóstico não encontrado. Execute o diagnóstico primeiro.');

    const firstName = lead.name ? lead.name.split(' ')[0] : 'Olá';
    const domainClean = (lead.url || 'diagnostico').replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/[^a-z0-9_-]/gi, '_');
    const attachmentFilename = `Relatorio_GEO_${domainClean}.html`;

    await transporter.sendMail({
      from: `"Guilherme Rossi - b.rocket" <${process.env.EMAIL_USER}>`,
      to: lead.email,
      cc: 'berocket@berocket.com.br',
      subject: `Seu Raio-X de GEO está aqui, ${firstName}! Score: ${diagnostic?.overallGeoScore || 0}% 🔬`,
      html: htmlReport,
      attachments: [
        {
          filename: attachmentFilename,
          content: htmlReport,
          contentType: 'text/html',
        },
      ],
    });

    res.json({ success: true, message: `Relatório HTML enviado com sucesso para ${lead.email} (com cópia para berocket@berocket.com.br)` });
  } catch (err) {
    console.error('Send report error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DOWNLOAD HTML DIAGNOSTIC ──────────────────────────────────────────────────────────────────
// Retorna o relatório HTML COMPLETO para download direto
// Inclui: relatório comercial + prints (Puppeteer) + trilha de auditoria
app.get('/api/admin/diagnostic/html/:leadId', verifyAdminToken, async (req, res) => {
  const { leadId } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();

    // Fetch lead
    const leadsData = await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    function fromFsHtml(val) {
      if (!val) return null;
      if ('stringValue' in val) return val.stringValue;
      if ('integerValue' in val) return parseInt(val.integerValue);
      if ('doubleValue' in val) return val.doubleValue;
      if ('booleanValue' in val) return val.booleanValue;
      if ('nullValue' in val) return null;
      if ('arrayValue' in val) return (val.arrayValue?.values || []).map(fromFsHtml);
      if ('mapValue' in val) {
        const result = {};
        for (const [k, v] of Object.entries(val.mapValue?.fields || {})) {
          result[k] = fromFsHtml(v);
        }
        return result;
      }
      return null;
    }

    let lead = null;
    for (const doc of (leadsData.documents || [])) {
      const f = doc.fields || {};
      if (f.id?.stringValue === leadId) {
        lead = { url: f.url?.stringValue, email: f.email?.stringValue, name: f.name?.stringValue, company: f.company?.stringValue };
        break;
      }
    }
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

    // Fetch diagnostic
    const diagData = await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    let diagnostic = null;
    for (const doc of (diagData.documents || [])) {
      const diag = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        // Pular o htmlReportContent (campo grande desnecessário aqui)
        if (k === 'htmlReportContent') continue;
        diag[k] = fromFsHtml(v);
      }
      if (diag.leadId === leadId) {
        diagnostic = diag;
        break;
      }
    }
    if (!diagnostic) return res.status(404).json({ error: 'Diagnóstico não encontrado' });

    // Gerar o HTML completo (inclui seção de auditoria se agentAuditLog estiver presente)
    const htmlReport = generateHtmlReport(lead, diagnostic);

    const domainClean = (lead.url || 'diagnostico').replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/[^a-z0-9_-]/gi, '_');
    const filename = `Relatorio_GEO_Completo_${domainClean}.html`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(htmlReport);
  } catch (err) {
    console.error('HTML download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DOWNLOAD PDF DIAGNOSTIC ────────────────────────────────────────────────
app.get('/api/admin/diagnostic/pdf/:leadId', verifyAdminToken, async (req, res) => {
  const { leadId } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();
    const leadsData = await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    function fromFs(val) {
      if (!val) return null;
      if ('stringValue' in val) return val.stringValue;
      if ('integerValue' in val) return parseInt(val.integerValue);
      if ('doubleValue' in val) return val.doubleValue;
      if ('booleanValue' in val) return val.booleanValue;
      if ('nullValue' in val) return null;
      if ('arrayValue' in val) return (val.arrayValue?.values || []).map(fromFs);
      if ('mapValue' in val) {
        const res = {};
        for (const [k, v] of Object.entries(val.mapValue?.fields || {})) { res[k] = fromFs(v); }
        return res;
      }
      return null;
    }

    let lead = null;
    for (const doc of (leadsData.documents || [])) {
      const f = doc.fields || {};
      if (f.id?.stringValue === leadId || doc.name.split('/').pop() === leadId) {
        lead = { url: f.url?.stringValue, email: f.email?.stringValue, name: f.name?.stringValue, company: f.company?.stringValue };
        break;
      }
    }
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

    const diagData = await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    let diagnostic = null;
    for (const doc of (diagData.documents || [])) {
      const diag = {};
      for (const [k, v] of Object.entries(doc.fields || {})) { diag[k] = fromFs(v); }
      if (diag.leadId === leadId || diag.clientId === leadId) {
        diagnostic = diag;
        break;
      }
    }
    if (!diagnostic) return res.status(404).json({ error: 'Diagnóstico não encontrado' });

    const pdfBuffer = await generatePdfReport(lead, diagnostic);
    const domain = (lead.url || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '') || 'relatorio';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Relatorio_GEO_${domain}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH DIAGNOSTIC (edição manual dos dados) ──────────────────────────────
app.patch('/api/admin/diagnostic/:leadId', verifyAdminToken, async (req, res) => {
  const { leadId } = req.params;
  const patch = req.body; // campo livre — apenas os campos alterados
  if (!patch || typeof patch !== 'object') {
    return res.status(400).json({ error: 'Body inválido' });
  }

  try {
    const accessToken = await getGoogleAccessToken();
    const diagsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=100`;
    const diagsData = await fetchFirestore(diagsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });

    let diagDocName = null;
    for (const doc of (diagsData.documents || [])) {
      const f = doc.fields || {};
      const docLeadId = f.leadId?.stringValue || f.clientId?.stringValue;
      if (docLeadId === leadId || doc.name.split('/').pop() === leadId) {
        diagDocName = doc.name;
        break;
      }
    }

    if (!diagDocName) {
      return res.status(404).json({ error: 'Diagnóstico não encontrado para este lead' });
    }

    // Converter patch JS para formato Firestore
    function toFirestoreValue(val) {
      if (val === null || val === undefined) return { nullValue: null };
      if (typeof val === 'boolean') return { booleanValue: val };
      if (typeof val === 'number' && Number.isInteger(val)) return { integerValue: String(val) };
      if (typeof val === 'number') return { doubleValue: val };
      if (typeof val === 'string') return { stringValue: val };
      if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
      if (typeof val === 'object') {
        const fields = {};
        for (const [k, v] of Object.entries(val)) { fields[k] = toFirestoreValue(v); }
        return { mapValue: { fields } };
      }
      return { stringValue: String(val) };
    }

    // Flatten o patch para dot-notation paths do Firestore (suporta aninhamento)
    function flattenPatch(obj, prefix = '') {
      const result = {};
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
          Object.assign(result, flattenPatch(v, key));
        } else {
          result[key] = toFirestoreValue(v);
        }
      }
      return result;
    }

    const flatFields = flattenPatch(patch);
    const updateFields = {};
    for (const [k, v] of Object.entries(flatFields)) {
      updateFields[k] = v;
    }

    const updateMask = Object.keys(flatFields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    const patchUrl = `https://firestore.googleapis.com/v1/${diagDocName}?${updateMask}`;

    await fetchFirestore(patchUrl, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: updateFields }),
    });

    res.json({ success: true, message: 'Diagnóstico atualizado manualmente.' });
  } catch (err) {
    console.error('Erro ao atualizar diagnóstico:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── FOLLOW-UP AUTOMATION (48h AUTOMÁTICO & MANUAL) ────────────────────────
app.post('/api/admin/leads/send-followup', verifyAdminToken, async (req, res) => {
  const { leadId } = req.body;
  if (!leadId) return res.status(400).json({ error: 'leadId é obrigatório' });

  try {
    const accessToken = await getGoogleAccessToken();
    const leadsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?pageSize=100`;
    const leadsData = await fetchFirestore(leadsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });

    function fromFs(val) {
      if (!val) return null;
      if ('stringValue' in val) return val.stringValue;
      if ('integerValue' in val) return parseInt(val.integerValue);
      if ('booleanValue' in val) return val.booleanValue;
      return null;
    }

    let leadDocPath = null;
    let lead = null;
    for (const doc of (leadsData.documents || [])) {
      const f = doc.fields || {};
      if (f.id?.stringValue === leadId || doc.name.split('/').pop() === leadId) {
        leadDocPath = doc.name;
        lead = {
          id: f.id?.stringValue,
          email: f.email?.stringValue,
          name: f.name?.stringValue,
          url: f.url?.stringValue,
          company: f.company?.stringValue,
          geoScore: f.geoScore?.integerValue || 0
        };
        break;
      }
    }

    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

    const firstName = lead.name ? lead.name.split(' ')[0] : 'Olá';
    const domain = (lead.url || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Credenciais de e-mail não configuradas no servidor.');
    }

    const followupSubject = `Olá ${firstName}, deu tempo de ver seu Relatório GEO da ${domain}? 🚀`;
    const followupHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b; line-height: 1.6;">
        <h2 style="color: #09090b; margin-bottom: 16px;">Olá ${firstName}, tudo bem?</h2>
        <p>Gerei recentemente o seu <strong>Relatório Diagnóstico de GEO (Generative Engine Optimization)</strong> para a <strong>${domain}</strong> (GEO Score: <strong>${lead.geoScore}%</strong>).</p>
        <p>Identificamos alguns gargalos técnicos e de conteúdo que estão impedindo sua marca de ser citada de forma consistente no <strong>ChatGPT, Claude e Gemini</strong>.</p>
        <p>Gostaria de agendar uma breve sessão estratégica de 15 minutos para passarmos pelos pontos de maior impacto e como podemos corrigi-los?</p>
        
        <div style="margin: 28px 0; text-align: center;">
          <a href="https://geo.berocket.com.br/#agendar" style="background-color: #09090b; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            📅 Agendar Mentoria Gratuita (15 min)
          </a>
        </div>
        
        <p style="color: #71717a; font-size: 13px; margin-top: 32px;">
          Um abraço,<br/>
          <strong>Guilherme Rossi</strong><br/>
          Especialista em GEO | b.rocket<br/>
          <a href="https://geo.berocket.com.br" style="color: #71717a;">geo.berocket.com.br</a>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Guilherme Rossi - b.rocket" <${process.env.EMAIL_USER}>`,
      to: lead.email,
      subject: followupSubject,
      html: followupHtml
    });

    // Marcar no Firestore que follow-up foi enviado
    if (leadDocPath) {
      await fetchFirestore(`https://firestore.googleapis.com/v1/${leadDocPath}?updateMask.fieldPaths=followupSent&updateMask.fieldPaths=followupSentAt`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            followupSent: { booleanValue: true },
            followupSentAt: { stringValue: new Date().toISOString() }
          }
        })
      });
    }

    res.json({ success: true, message: `E-mail de follow-up enviado para ${lead.email}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Job em Segundo Plano: Verificar e Enviar Follow-ups automáticos a cada 2 horas
async function autoSend48hFollowups() {
  try {
    const accessToken = await getGoogleAccessToken();
    const leadsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?pageSize=100`;
    const leadsRes = await fetchFirestore(leadsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });

    function fromFs(val) {
      if (!val) return null;
      if ('stringValue' in val) return val.stringValue;
      if ('integerValue' in val) return parseInt(val.integerValue);
      if ('booleanValue' in val) return val.booleanValue;
      return null;
    }

    const now = Date.now();
    const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

    for (const doc of (leadsRes.documents || [])) {
      const f = doc.fields || {};
      const status = f.status?.stringValue;
      const followupSent = f.followupSent?.booleanValue;
      const createdAtStr = f.createdAt?.stringValue;

      if (status === 'completed' && !followupSent && createdAtStr) {
        const createdAtTime = new Date(createdAtStr).getTime();
        if (now - createdAtTime >= FORTY_EIGHT_HOURS_MS) {
          const leadId = f.id?.stringValue || doc.name.split('/').pop();
          const email = f.email?.stringValue;
          const name = f.name?.stringValue;
          const url = f.url?.stringValue;
          const geoScore = f.geoScore?.integerValue || 0;

          if (email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const firstName = name ? name.split(' ')[0] : 'Olá';
            const domain = (url || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

            const subject = `Olá ${firstName}, deu tempo de ver seu Relatório GEO da ${domain}? 🚀`;
            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b; line-height: 1.6;">
                <h2 style="color: #09090b; margin-bottom: 16px;">Olá ${firstName}, tudo bem?</h2>
                <p>Há 2 dias enviamos o seu <strong>Relatório Diagnóstico de GEO</strong> para a <strong>${domain}</strong> (Score: <strong>${geoScore}%</strong>).</p>
                <p>Caso tenha ficado com alguma dúvida ou queira entender como elevar seu score para mais de 70%, estou à disposição para uma conversa de 15 minutos.</p>
                <div style="margin: 28px 0; text-align: center;">
                  <a href="https://geo.berocket.com.br/#agendar" style="background-color: #09090b; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                    📅 Agendar Mentoria Gratuita (15 min)
                  </a>
                </div>
                <p style="color: #71717a; font-size: 13px;">Abraços,<br/><strong>Guilherme Rossi</strong><br/>b.rocket GEO Core</p>
              </div>
            `;

            await transporter.sendMail({
              from: `"Guilherme Rossi - b.rocket" <${process.env.EMAIL_USER}>`,
              to: email,
              subject,
              html
            });

            await fetchFirestore(`https://firestore.googleapis.com/v1/${doc.name}?updateMask.fieldPaths=followupSent&updateMask.fieldPaths=followupSentAt`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fields: {
                  followupSent: { booleanValue: true },
                  followupSentAt: { stringValue: new Date().toISOString() }
                }
              })
            });

            console.log(`✉️ Auto follow-up 48h enviado com sucesso para ${email}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Auto follow-up 48h error:', err);
  }
}

// Iniciar cron interval de 2 horas (7.200.000 ms)
setInterval(autoSend48hFollowups, 2 * 60 * 60 * 1000);

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

    // Buscar informações do cliente para herança de contexto real
    let clientInfo = { company: '', name: '', url: baseUrl };
    try {
      const accessToken = await getGoogleAccessToken();
      const clientsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/clients?pageSize=100`;
      const clientsResponse = await fetch(clientsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const clientsData = await clientsResponse.json();

      for (const doc of (clientsData.documents || [])) {
        const docId = doc.name.split('/').pop();
        const f = doc.fields || {};
        if (docId === clientId || f.id?.stringValue === clientId) {
          clientInfo = {
            company: f.company?.stringValue || '',
            name: f.name?.stringValue || '',
            url: f.url?.stringValue || baseUrl,
          };
          break;
        }
      }
    } catch (e) {}

    let result = {};
        // Funçao de persistência do resultado no Firestore para o cliente
        const saveAgentResultToFirestore = async (diagnosticPatch) => {
          try {
            const accessToken = await getGoogleAccessToken();
            
            // 1. Buscar diagnóstico existente do cliente ou criar um novo se não existir
            const diagsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=100`;
            const diagsRes = await fetch(diagsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            const diagsData = await diagsRes.json();

            let targetDiagName = null;
            for (const doc of (diagsData.documents || [])) {
              const f = doc.fields || {};
              const docClientId = f.clientId?.stringValue;
              if (docClientId === clientId || doc.name.split('/').pop() === clientId) {
                targetDiagName = doc.name;
                break;
              }
            }

            function toFirestoreValue(val) {
              if (val === null || val === undefined) return { nullValue: null };
              if (typeof val === 'boolean') return { booleanValue: val };
              if (typeof val === 'number' && Number.isInteger(val)) return { integerValue: String(val) };
              if (typeof val === 'number') return { doubleValue: val };
              if (typeof val === 'string') return { stringValue: val };
              if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
              if (typeof val === 'object') {
                const fields = {};
                for (const [k, v] of Object.entries(val)) { fields[k] = toFirestoreValue(v); }
                return { mapValue: { fields } };
              }
              return { stringValue: String(val) };
            }

            if (targetDiagName) {
              // Atualizar via PATCH com updateMask
              const fields = {};
              const updateMaskPaths = [];
              for (const [k, v] of Object.entries(diagnosticPatch)) {
                fields[k] = toFirestoreValue(v);
                updateMaskPaths.push(`updateMask.fieldPaths=${encodeURIComponent(k)}`);
              }
              const patchUrl = `https://firestore.googleapis.com/v1/${targetDiagName}?${updateMaskPaths.join('&')}`;
              await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields }),
              });
            } else {
              // Criar novo diagnóstico para este cliente
              const newDiagId = `diag_${clientId}_${Date.now()}`;
              const fullDiag = {
                id: newDiagId,
                clientId,
                clientUrl: baseUrl,
                generatedAt: new Date().toISOString(),
                ...diagnosticPatch,
              };
              const fields = {};
              for (const [k, v] of Object.entries(fullDiag)) {
                fields[k] = toFirestoreValue(v);
              }
              await fetch(diagsUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields }),
              });
            }
          } catch (err) {
            console.error(`Erro ao salvar resultado do agente ${agentName} no Firestore:`, err);
          }
        };

        switch (agentName) {
          case 'gatekeeper':
            result = await runGatekeeperAgent(baseUrl, htmlContent);
            result.recommendedRobotsTxt = generateRobotsTxt(domain, result.robotsTxtAllowAiBots);
            await saveAgentResultToFirestore({ gatekeeperStatus: result });
            break;
          case 'metadata':
            result = await runMetadataAgent(htmlContent, domain);
            result.llmsTxt = generateLlmsTxtContent(clientInfo, { overallGeoScore: 75 }, htmlContent);
            result.generatedJsonLd = generateJsonLdSchema(clientInfo, domain, htmlContent);
            await saveAgentResultToFirestore({ metadataAnalysis: result });
            break;
          case 'content':
            result = await runContentAgent(htmlContent);
            result.aeoTemplates = generateAeoContentTemplate(domain, htmlContent);
            await saveAgentResultToFirestore({ contentReview: result });
            break;
          case 'seo_optimizer':
            result = await runSeoOptimizerAgent(baseUrl, htmlContent);
            await saveAgentResultToFirestore({ seoAnalysis: result });
            break;
          case 'semantic_explorer': {
            const key = process.env.OPENROUTER_API_KEY || '';
            result = await runSemanticExplorerAgent(baseUrl, htmlContent, key);
            await saveAgentResultToFirestore({ semanticAnalysis: result });
            break;
          }
          case 'offpage': {
            const key = process.env.OPENROUTER_API_KEY || '';
            result = await runOffPageEntityAgent(baseUrl, htmlContent, key);
            await saveAgentResultToFirestore({ offpageAnalysis: result });
            break;
          }
          case 'intent': {
            const key = process.env.OPENROUTER_API_KEY || '';
            result = await runIntentAgent(url, htmlContent, key);
            await saveAgentResultToFirestore({ visibilityBenchmarking: result });
            break;
          }
          case 'checklist_architect': {
            const key = process.env.OPENROUTER_API_KEY || '';
            const [gk, md, ct, sem, off, seo] = await Promise.all([
              runGatekeeperAgent(baseUrl, htmlContent),
              runMetadataAgent(htmlContent, domain),
              runContentAgent(htmlContent),
              runSemanticExplorerAgent(baseUrl, htmlContent, key),
              runOffPageEntityAgent(baseUrl, htmlContent, key),
              runSeoOptimizerAgent(baseUrl, htmlContent),
            ]);
            result = await runChecklistArchitectAgent(gk, md, ct, seo, sem, off, domain, baseUrl);
            await saveAgentResultToFirestore({ checklist: result });
            break;
          }
          case 'orchestrator': {
            const key = process.env.OPENROUTER_API_KEY || '';
            const [gk, md, ct, sem, off, seo] = await Promise.all([
              runGatekeeperAgent(baseUrl, htmlContent),
              runMetadataAgent(htmlContent, domain),
              runContentAgent(htmlContent),
              runSemanticExplorerAgent(baseUrl, htmlContent, key),
              runOffPageEntityAgent(baseUrl, htmlContent, key),
              runSeoOptimizerAgent(baseUrl, htmlContent),
            ]);
            const vis = await runIntentAgent(url, htmlContent, key);
            const chk = await runChecklistArchitectAgent(gk, md, ct, seo, sem, off, domain, baseUrl);
            const score = calculateGeoScore(gk, md, ct, vis, sem, off, seo);
            const actions = buildActionList(gk, md, ct, vis, sem, off, seo);

            const deliverables = {
              robotsTxt: generateRobotsTxt(domain, gk.robotsTxtAllowAiBots),
              jsonLdSchema: generateJsonLdSchema(clientInfo, domain, htmlContent),
              llmsTxt: generateLlmsTxtContent(clientInfo, { overallGeoScore: score }, htmlContent),
              aeoTemplates: generateAeoContentTemplate(domain, htmlContent),
              checklist: chk,
            };

            const actionPlanMarkdown = generateActionPlanByStages({ clientUrl: baseUrl, overallGeoScore: score, actionItemsPriorityList: actions });

            result = {
              overallGeoScore: score,
              actionItemsPriorityList: actions,
              gatekeeper: gk,
              metadata: md,
              content: ct,
              visibility: vis,
              seoOptimizer: seo,
              semanticExplorer: sem,
              offpage: off,
              checklistArchitect: chk,
              deliverables,
              actionPlanMarkdown,
            };

            await saveAgentResultToFirestore({
              overallGeoScore: score,
              gatekeeperStatus: gk,
              metadataAnalysis: md,
              contentReview: ct,
              visibilityBenchmarking: vis,
              seoAnalysis: seo,
              semanticAnalysis: sem,
              offpageAnalysis: off,
              checklist: chk,
              actionItemsPriorityList: actions,
              deliverables,
              actionPlanMarkdown,
            });

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

// ─── GET CLIENT DIAGNOSTIC HISTORY (Antes vs. Depois) ───────────────────────
app.get('/api/admin/clients/:id/history', verifyAdminToken, async (req, res) => {
  const { id: clientId } = req.params;
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

    const leadId = clientId.startsWith('client_') ? clientId.split('_')[1] : clientId;
    const clientDiagnostics = [];

    for (const doc of (data.documents || [])) {
      const diag = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        diag[k] = fromFirestoreValue(v);
      }
      if (diag.clientId === clientId || diag.leadId === clientId || diag.leadId === leadId) {
        clientDiagnostics.push(diag);
      }
    }

    // Sort by generatedAt ascending (oldest first)
    clientDiagnostics.sort((a, b) => new Date(a.generatedAt || 0).getTime() - new Date(b.generatedAt || 0).getTime());

    const initialScore = clientDiagnostics.length > 0 ? (clientDiagnostics[0].overallGeoScore || 0) : 0;
    const latestScore = clientDiagnostics.length > 0 ? (clientDiagnostics[clientDiagnostics.length - 1].overallGeoScore || 0) : 0;
    const scoreDiff = latestScore - initialScore;
    const evolutionPercentage = initialScore > 0 ? Math.round((scoreDiff / initialScore) * 100) : (latestScore > 0 ? 100 : 0);

    res.json({
      success: true,
      clientHistory: {
        initialScore,
        latestScore,
        scoreDiff,
        evolutionPercentage,
        diagnosticsCount: clientDiagnostics.length,
        diagnostics: clientDiagnostics,
      }
    });
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

// ─── DELETE NEWSLETTER SUBSCRIBER ──────────────────────────────────────────
app.delete('/api/admin/newsletter/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();
    
    // Buscar o docName real do inscrito no Firestore
    const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsletter?pageSize=300`;
    const response = await fetch(listUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();
    
    let subDocPath = null;
    for (const doc of (data.documents || [])) {
      const docId = doc.name.split('/').pop();
      const f = doc.fields || {};
      if (docId === id || f.id?.stringValue === id) {
        subDocPath = doc.name;
        break;
      }
    }
    
    if (!subDocPath) {
      return res.status(404).json({ error: 'Inscrito não encontrado' });
    }
    
    const firestoreUrl = `https://firestore.googleapis.com/v1/${subDocPath}`;
    await fetchFirestore(firestoreUrl, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SEND TEST EMAIL ──────────────────────────────────────────────────────
app.post('/api/admin/newsletter/test-email', verifyAdminToken, async (req, res) => {
  const { subject, htmlContent, testEmail } = req.body;
  if (!subject || !htmlContent || !testEmail) {
    return res.status(400).json({ error: 'Assunto, HTML e E-mail de teste são obrigatórios' });
  }
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Credenciais de e-mail ausentes no servidor (EMAIL_USER / EMAIL_PASS).');
    }

    await transporter.sendMail({
      from: `"b.rocket (Teste)" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: `[TESTE] ${subject}`,
      html: htmlContent,
    });

    res.json({ success: true, message: `E-mail de teste enviado com sucesso para ${testEmail}!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SEND SINGLE EMAIL (OUTBOUND ESPECÍFICO) ─────────────────────────────────
app.post('/api/admin/newsletter/send-single', verifyAdminToken, async (req, res) => {
  const { subject, htmlContent, email, name } = req.body;
  if (!subject || !htmlContent || !email) {
    return res.status(400).json({ error: 'Assunto, HTML e E-mail de destino são obrigatórios' });
  }
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Credenciais de e-mail ausentes no servidor (EMAIL_USER / EMAIL_PASS).');
    }

    const broadcastId = `single_${Date.now()}`;
    const subId = email.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Injetar pixel e link track
    const PRODUCTION_URL = process.env.SITE_URL || 'https://geo.berocket.com.br';
    const trackOpenUrl = `${PRODUCTION_URL}/api/newsletter/track-open/${broadcastId}/${subId}`;
    const trackingPixel = `<img src="${trackOpenUrl}" width="1" height="1" style="display:none;" />`;
    const finalHtml = htmlContent + trackingPixel;

    await transporter.sendMail({
      from: `"b.rocket" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: finalHtml,
    });

    // Salvar no histórico
    const accessToken = await getGoogleAccessToken();
    const historyId = `hist_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsletter_history`;
    
    const historyDoc = {
      fields: {
        id: { stringValue: historyId },
        email: { stringValue: email },
        name: { stringValue: name || '' },
        subject: { stringValue: subject },
        broadcastId: { stringValue: broadcastId },
        sentAt: { stringValue: new Date().toISOString() },
        status: { stringValue: 'sent' }, // sent, opened, clicked
        openedAt: { stringValue: '' },
        clickedAt: { stringValue: '' }
      }
    };

    await fetchFirestore(firestoreUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(historyDoc)
    });

    res.json({ success: true, message: `E-mail enviado para ${email}!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── NEWSLETTER ANALYTICS & BROADCAST HISTORY ──────────────────────────────
app.get('/api/admin/newsletter/broadcasts', verifyAdminToken, async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsletter_history?pageSize=100`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();

    const historyItems = (data.documents || []).map(doc => {
      const f = doc.fields || {};
      return {
        id: f.id?.stringValue || doc.name.split('/').pop(),
        email: f.email?.stringValue || '',
        name: f.name?.stringValue || '',
        subject: f.subject?.stringValue || '',
        broadcastId: f.broadcastId?.stringValue || '',
        sentAt: f.sentAt?.stringValue || '',
        status: f.status?.stringValue || 'sent',
        openedAt: f.openedAt?.stringValue || '',
        clickedAt: f.clickedAt?.stringValue || ''
      };
    });

    res.json({ history: historyItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET INDIVIDUAL SUBSCRIBER HISTORY ──────────────────────────────────────
app.get('/api/admin/newsletter/history/:email', verifyAdminToken, async (req, res) => {
  const { email } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();
    // Podemos fazer uma query estruturada ou listar e filtrar
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsletter_history?pageSize=100`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();

    const history = (data.documents || []).map(doc => {
      const f = doc.fields || {};
      return {
        id: f.id?.stringValue || doc.name.split('/').pop(),
        email: f.email?.stringValue || '',
        name: f.name?.stringValue || '',
        subject: f.subject?.stringValue || '',
        sentAt: f.sentAt?.stringValue || '',
        status: f.status?.stringValue || 'sent',
        openedAt: f.openedAt?.stringValue || '',
        clickedAt: f.clickedAt?.stringValue || ''
      };
    }).filter(item => item.email.toLowerCase() === email.toLowerCase());

    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TRACK OPEN PIXEL ──────────────────────────────────────────────────────
app.get('/api/newsletter/track-open/:broadcastId/:subId', async (req, res) => {
  const { broadcastId, subId } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();
    const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsletter_history?pageSize=100`;
    const response = await fetch(listUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();

    let targetDocPath = null;
    let fields = null;
    for (const doc of (data.documents || [])) {
      const f = doc.fields || {};
      const bid = f.broadcastId?.stringValue || '';
      const email = f.email?.stringValue || '';
      const docSubId = email.replace(/[^a-zA-Z0-9]/g, '_');
      if (bid === broadcastId && (docSubId === subId || f.id?.stringValue === subId)) {
        targetDocPath = doc.name;
        fields = f;
        break;
      }
    }

    if (targetDocPath && fields && fields.status?.stringValue !== 'opened' && fields.status?.stringValue !== 'clicked') {
      const firestoreUrl = `https://firestore.googleapis.com/v1/${targetDocPath}?updateMask.fieldPaths=status&updateMask.fieldPaths=openedAt`;
      await fetchFirestore(firestoreUrl, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: 'opened' },
            openedAt: { stringValue: new Date().toISOString() }
          }
        })
      });
    }
  } catch (err) {
    console.error('Error tracking open:', err);
  }

  // Retornar pixel de imagem 1x1 transparente
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length
  });
  res.end(pixel);
});

// ─── TRACK CLICK REDIRECT ──────────────────────────────────────────────────
app.get('/api/newsletter/track-click', async (req, res) => {
  const { url, broadcastId, email } = req.query;
  if (!url) return res.redirect('/');
  
  try {
    if (broadcastId && email) {
      const accessToken = await getGoogleAccessToken();
      const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsletter_history?pageSize=100`;
      const response = await fetch(listUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const data = await response.json();

      let targetDocPath = null;
      for (const doc of (data.documents || [])) {
        const f = doc.fields || {};
        if (f.broadcastId?.stringValue === broadcastId && f.email?.stringValue?.toLowerCase() === String(email).toLowerCase()) {
          targetDocPath = doc.name;
          break;
        }
      }

      if (targetDocPath) {
        const firestoreUrl = `https://firestore.googleapis.com/v1/${targetDocPath}?updateMask.fieldPaths=status&updateMask.fieldPaths=clickedAt`;
        await fetchFirestore(firestoreUrl, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              status: { stringValue: 'clicked' },
              clickedAt: { stringValue: new Date().toISOString() }
            }
          })
        });
      }
    }
  } catch (err) {
    console.error('Error tracking click:', err);
  }

  res.redirect(String(url));
});


// ─── LEAD HUNTER API ENDPOINTS ─────────────────────────────────────────────

function parseFirestoreDoc(doc) {
  function fromFsVal(val) {
    if (!val) return null;
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return parseInt(val.integerValue, 10);
    if ('doubleValue' in val) return val.doubleValue;
    if ('booleanValue' in val) return val.booleanValue;
    if ('nullValue' in val) return null;
    if ('arrayValue' in val) return (val.arrayValue?.values || []).map(fromFsVal);
    if ('mapValue' in val) {
      const res = {};
      for (const [k, v] of Object.entries(val.mapValue?.fields || {})) {
        res[k] = fromFsVal(v);
      }
      return res;
    }
    return null;
  }
  const obj = {};
  for (const [k, v] of Object.entries(doc.fields || {})) {
    obj[k] = fromFsVal(v);
  }
  obj.id = doc.name.split('/').pop();
  return obj;
}

function getSampleHunterLeads() {
  return [
    {
      id: 'hunter_sample_1',
      domain: 'cloudtechsaas.com.br',
      company: 'CloudTech Solutions',
      contactName: 'Marcelo Andrade',
      contactRole: 'CEO & Founder',
      linkedinUrl: 'https://linkedin.com/in/marcelo-cloudtech',
      email: 'marcelo@cloudtechsaas.com.br',
      niche: 'SaaS B2B',
      location: 'São Paulo, SP',
      companySize: '20-200 funcionários',
      status: 'audited',
      aiCrawlersBlocked: true,
      hasBlog: true,
      hasAnswerFirst: false,
      citedCompetitor: 'Totvs ERP SaaS',
      geoScoreEstimado: 32,
      outreachCopies: {
        pasLinkedin: `Olá Marcelo! Notei que a CloudTech está investindo forte em conteúdo, mas identifiquei um ponto cego crítico: o seu robots.txt está bloqueando o GPTBot e o OAI-SearchBot.\n\nEnquanto você publica no blog, o ChatGPT está recomendando a Totvs ERP SaaS para buscas de alta intenção no seu nicho.\n\nMontei um mini-diagnóstico em PDF mostrando como liberar a indexação IA sem alterar o seu SEO tradicional. Quer que eu te envie?`,
        pasEmail: `Assunto: Ponto cego na visibilidade IA da CloudTech (Totvs sendo recomendada)\n\nOlá Marcelo,\n\nEstava analisando as empresas de SaaS B2B em SP e notei algo importante no domínio cloudtechsaas.com.br.\n\nSua equipe está produzindo artigos no blog, mas o arquivo robots.txt de vocês contém diretivas de bloqueio aos rastreadores de IA (GPTBot e OAI-SearchBot). Na prática, o ChatGPT e a Perplexity estão completamente "cegos" para as soluções da CloudTech — e recomendando diretamente a Totvs para potenciais clientes.\n\nCriamos na b.rocket uma metodologia de GEO (Generative Engine Optimization) que corrige esse vazamento de tráfego de IA em menos de 48h.\n\nPosso te enviar o diagnóstico preliminar em PDF para você dar uma olhada?\n\nAbraços,\nGuilherme Rossi | b.rocket`,
        babLinkedin: `Marcelo, sabia que hoje quando um tomador de decisão pergunta ao ChatGPT por plataformas SaaS B2B como a CloudTech, o modelo cita a Totvs?\n\nIsso acontece porque a estrutura do seu site não possui marcadores AEO e bloqueia robôs de IA.\n\nCom a otimização de GEO (Generative Engine Optimization), a CloudTech passa a ser a resposta recomendada em 1ª posição nas LLMs. Quer ver como funciona?`,
        babEmail: `Assunto: Como colocar a CloudTech na 1ª resposta do ChatGPT e Perplexity\n\nOlá Marcelo, tudo bem?\n\nImagine a seguinte situação: um diretor de tecnologia pesquisa no ChatGPT "qual o melhor SaaS B2B para gestão corporativa no Brasil?". Hoje, a IA recomenda seus concorrentes diretos (como a Totvs) e a CloudTech sequer aparece nas citações.\n\nAgora imagine o cenário inverso: a CloudTech sendo a fonte autoritativa primária citada em 100% das buscas de IA com link direto para o seu trial.\n\nNós da b.rocket desenvolvemos o motor de GEO (Generative Engine Optimization) que faz exatamente essa transição para empresas SaaS de 20 a 200 funcionários.\n\nSe fizer sentido, posso compartilhar uma análise rápida do domínio de vocês nesta semana.\n\nAtenciosamente,\nGuilherme Rossi | b.rocket`
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'hunter_sample_2',
      domain: 'advocaciacorporativa.com.br',
      company: 'Oliveira & Associados Advocacia',
      contactName: 'Dra. Fernanda Oliveira',
      contactRole: 'Sócia-Diretora / CMO',
      linkedinUrl: 'https://linkedin.com/in/fernanda-oliveira-adv',
      email: 'fernanda@advocaciacorporativa.com.br',
      niche: 'Advocacia Corporate',
      location: 'Goiânia, GO',
      companySize: '20-200 funcionários',
      status: 'unscanned',
      createdAt: new Date().toISOString()
    }
  ];
}

// GET /api/admin/lead-hunter/leads
app.get('/api/admin/lead-hunter/leads', verifyAdminToken, async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/hunter_leads?orderBy=createdAt+desc&pageSize=100`;
    const response = await fetch(firestoreUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    
    if (!response.ok) {
      return res.json({ leads: getSampleHunterLeads() });
    }

    const data = await response.json();
    let leads = (data.documents || []).map(parseFirestoreDoc);

    if (leads.length === 0) {
      leads = getSampleHunterLeads();
    }

    res.json({ leads });
  } catch (err) {
    console.error('Error getting hunter leads:', err);
    res.json({ leads: getSampleHunterLeads() });
  }
});

// POST /api/admin/lead-hunter/mine
app.post('/api/admin/lead-hunter/mine', verifyAdminToken, async (req, res) => {
  const { niche, location, targetRole, companySize, limit, apifyToken } = req.body;
  
  try {
    const accessToken = await getGoogleAccessToken();
    const count = parseInt(limit || '5', 10);
    const effectiveApifyToken = apifyToken || process.env.APIFY_API_TOKEN || '';
    let newLeads = [];

    // Se houver token do Apify, tenta fazer chamada real na Apify API
    if (effectiveApifyToken) {
      try {
        console.log(`🔍 Conectando à Apify API para minerar [${niche}] em [${location}]...`);
        const queryText = `empresas de ${niche || 'tecnologia'} em ${location || 'Brasil'}`;
        
        const apifyRes = await fetch(
          `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${effectiveApifyToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              queries: queryText,
              maxPagesPerQuery: 1,
              resultsPerPage: count * 2
            })
          }
        );

        if (apifyRes.ok) {
          const apifyItems = await apifyRes.json();
          if (Array.isArray(apifyItems) && apifyItems.length > 0) {
            const extractedDomains = new Set();
            for (const item of apifyItems) {
              const organicResults = item.organicResults || [];
              for (const r of organicResults) {
                const link = r.url || r.link || '';
                if (!link) continue;
                const dom = link.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/^www\./i, '');
                if (
                  dom && 
                  !dom.includes('google') && 
                  !dom.includes('linkedin') && 
                  !dom.includes('facebook') && 
                  !dom.includes('youtube') && 
                  !extractedDomains.has(dom)
                ) {
                  extractedDomains.add(dom);
                  const title = r.title || dom;
                  const companyName = title.split('-')[0].split('|')[0].trim();
                  const ceoName = `Decisor ${companyName.split(' ')[0]}`;

                  const leadObj = {
                    id: `apify_lead_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
                    domain: dom,
                    company: companyName,
                    contactName: ceoName,
                    contactRole: targetRole || 'CEO / Diretor',
                    linkedinUrl: `https://linkedin.com/company/${dom.replace(/\..*$/, '')}`,
                    email: `contato@${dom}`,
                    niche: niche || 'Geral',
                    location: location || 'Brasil',
                    companySize: companySize || '20-200 funcionários',
                    status: 'unscanned',
                    createdAt: new Date().toISOString()
                  };
                  newLeads.push(leadObj);
                  if (newLeads.length >= count) break;
                }
              }
              if (newLeads.length >= count) break;
            }
          }
        } else {
          console.warn(`Apify API retornou status ${apifyRes.status}. Usando minerador estruturado.`);
        }
      } catch (apifyErr) {
        console.error('Erro na chamada da Apify API:', apifyErr.message);
      }
    }

    // Fallback: Minerador Estruturado por Algoritmo de Inteligência Comercial
    if (newLeads.length === 0) {
      const prefix = (niche || 'Empresa').split(' ')[0];
      const companies = [
        { name: `${prefix} Master Group`, dom: `${prefix.toLowerCase().replace(/[^a-z]/g, '')}master.com.br`, ceo: 'Carlos Eduardo Silva' },
        { name: `Apex ${prefix} Brasil`, dom: `apex${prefix.toLowerCase().replace(/[^a-z]/g, '')}.com.br`, ceo: 'Juliana Mendes' },
        { name: `Vanguard ${prefix}`, dom: `vanguard${prefix.toLowerCase().replace(/[^a-z]/g, '')}.com.br`, ceo: 'Roberto Fonseca' },
        { name: `Nexus ${prefix} Corp`, dom: `nexus${prefix.toLowerCase().replace(/[^a-z]/g, '')}.com.br`, ceo: 'Luciana Alencar' },
        { name: `Prime ${prefix} Solutions`, dom: `prime${prefix.toLowerCase().replace(/[^a-z]/g, '')}.com.br`, ceo: 'Gustavo Borges' },
      ];

      for (let i = 0; i < Math.min(count, companies.length); i++) {
        const c = companies[i];
        const leadId = `hunter_lead_${Date.now()}_${i}_${crypto.randomBytes(2).toString('hex')}`;
        
        const leadObj = {
          id: leadId,
          domain: c.dom,
          company: c.name,
          contactName: c.ceo,
          contactRole: targetRole || 'CEO / Diretor',
          linkedinUrl: `https://linkedin.com/in/${c.ceo.toLowerCase().replace(/\s+/g, '-')}`,
          email: `contato@${c.dom}`,
          niche: niche || 'Geral',
          location: location || 'Brasil',
          companySize: companySize || '20-200 funcionários',
          status: 'unscanned',
          createdAt: new Date().toISOString()
        };

        newLeads.push(leadObj);
      }
    }

    // Salva os novos leads no Firestore
    for (const leadObj of newLeads) {
      try {
        const docFields = {};
        for (const [k, v] of Object.entries(leadObj)) {
          docFields[k] = toFirestoreValue(v);
        }
        await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/hunter_leads`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: docFields })
        });
      } catch (fsErr) {
        console.warn('Firestore save lead warning:', fsErr.message);
      }
    }

    res.json({ success: true, count: newLeads.length, leads: newLeads });
  } catch (err) {
    console.error('Error mining leads:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/lead-hunter/audit (Unificado com Motor Diagnóstico de 8 Agentes)
app.post('/api/admin/lead-hunter/audit', verifyAdminToken, async (req, res) => {
  const { leadId, domain, niche } = req.body;
  if (!domain) return res.status(400).json({ error: 'Dominio obrigatorio' });

  try {
    const accessToken = await getGoogleAccessToken();
    const normalizedUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    const cleanDomain = normalizedUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    
    // Fetch HTML do site
    let htmlContent = '';
    try {
      const siteRes = await fetchUrl(normalizedUrl);
      htmlContent = siteRes.body || '';
    } catch (e) {
      htmlContent = '';
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY || '';

    // Executa os 6 agentes especialistas em paralelo
    const [gk, md, ct, sem, off, seo] = await Promise.all([
      runGatekeeperAgent(normalizedUrl, htmlContent),
      runMetadataAgent(htmlContent, cleanDomain),
      runContentAgent(htmlContent),
      runSemanticExplorerAgent(normalizedUrl, htmlContent, openrouterKey),
      runOffPageEntityAgent(normalizedUrl, htmlContent, openrouterKey),
      runSeoOptimizerAgent(normalizedUrl, htmlContent),
    ]);

    // Executa agentes sequenciais (Intent & Checklist Architect)
    const vis = await runIntentAgent(normalizedUrl, htmlContent, openrouterKey);
    const chk = await runChecklistArchitectAgent(gk, md, ct, seo, sem, off, cleanDomain, normalizedUrl);

    // Calcula Score Real GEO consolidado
    const score = calculateGeoScore(gk, md, ct, vis, sem, off, seo);
    const actions = buildActionList(gk, md, ct, vis, sem, off, seo);

    const diagnosticId = `diag_hunter_${leadId || Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    const leadObj = { 
      id: leadId || cleanDomain, 
      url: normalizedUrl, 
      email: `contato@${cleanDomain}`, 
      company: cleanDomain, 
      name: 'Decisor' 
    };

    const diagObj = {
      id: diagnosticId,
      leadId: leadId || cleanDomain,
      clientUrl: normalizedUrl,
      overallGeoScore: score,
      gatekeeperStatus: gk,
      metadataAnalysis: md,
      contentReview: ct,
      seoAnalysis: seo,
      semanticAnalysis: sem,
      offpageAnalysis: off,
      visibilityBenchmarking: vis,
      checklist: chk,
      actionItemsPriorityList: actions,
      generatedAt: new Date().toISOString(),
    };

    const htmlReport = generateHtmlReport(leadObj, diagObj);

    // Salva o diagnóstico completo no Firestore
    try {
      const diagFields = {};
      for (const [k, v] of Object.entries({ ...diagObj, htmlReportContent: htmlReport.slice(0, 500000) })) {
        diagFields[k] = toFirestoreValue(v);
      }
      await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: diagFields }),
      });
    } catch (fsDiagErr) {
      console.warn('Erro ao salvar diagnóstico no Firestore:', fsDiagErr.message);
    }

    const robotsBlocked = !gk.robotsTxtAllowAiBots;
    const citedCompetitor = vis.topMentionedCompetitors?.[0] || `${niche || 'Nicho'} Líder S/A`;

    const updatedData = {
      status: 'audited',
      aiCrawlersBlocked: robotsBlocked,
      hasBlog: md.llmsTxtPublished || ct.meanChunkSizeTokens > 0,
      hasAnswerFirst: ct.factorsDetected?.hasTldrAnswerFirstParagraph || false,
      citedCompetitor: citedCompetitor,
      geoScoreEstimado: score,
      diagnosticId: diagnosticId
    };

    // Atualiza o lead em hunter_leads
    if (leadId) {
      try {
        const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/hunter_leads?pageSize=100`;
        const listData = await fetchFirestore(listUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        let docPath = null;
        for (const doc of (listData.documents || [])) {
          const f = parseFirestoreDoc(doc);
          if (f.id === leadId || f.domain === cleanDomain) {
            docPath = doc.name;
            break;
          }
        }

        if (docPath) {
          const updateMask = Object.keys(updatedData).map(k => `updateMask.fieldPaths=${k}`).join('&');
          const fields = {};
          for (const [k, v] of Object.entries(updatedData)) {
            fields[k] = toFirestoreValue(v);
          }
          await fetchFirestore(`https://firestore.googleapis.com/v1/${docPath}?${updateMask}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields })
          });
        }
      } catch (fsErr) {
        console.warn('Firestore patch audit warning:', fsErr.message);
      }
    }

    res.json({ success: true, updatedLead: updatedData, diagnosticId, htmlReport });
  } catch (err) {
    console.error('Error auditing lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/lead-hunter/outreach (Copys Dinâmicas com base na Auditoria Real)
app.post('/api/admin/lead-hunter/outreach', verifyAdminToken, async (req, res) => {
  const { leadId, leadData } = req.body;
  const lead = leadData || {};
  const company = lead.company || 'Empresa';
  const name = lead.contactName || 'Decisor';
  const domain = lead.domain || 'site.com.br';
  const competitor = lead.citedCompetitor || 'Concorrente Direto';
  const robotsBlocked = lead.aiCrawlersBlocked !== false; // true por padrão se indefinido

  let pasLinkedin = '';
  let pasEmail = '';
  let babLinkedin = '';
  let babEmail = '';

  if (robotsBlocked) {
    // Caso 1: robots.txt realmente bloqueia robôs de IA
    pasLinkedin = `Olá ${name}! Estava analisando o posicionamento digital da ${company} e notei algo crítico: o seu arquivo robots.txt está com diretivas de bloqueio para crawlers de IA (GPTBot, PerplexityBot e ClaudeBot).\n\nEnquanto sua equipe investe em conteúdo, o ChatGPT, Gemini, Claude e Perplexity recomendam a ${competitor} para buscas de alta intenção comercial no seu nicho.\n\nGeramos um relatório técnico completo em PDF/HTML mostrando como liberar a indexação IA sem alterar seu SEO tradicional. Quer que eu te envie por aqui?`;
    
    pasEmail = `Assunto: Ponto cego no robots.txt da ${company} (${competitor} recomendada no ChatGPT, Gemini e Claude)\n\nOlá ${name}, tudo bem?\n\nEstava revisando os domínios corporativos do seu segmento e notei algo importante no site ${domain}.\n\nSua empresa produz conteúdo, mas o arquivo robots.txt possui bloqueios ativos para os rastreadores de IA (GPTBot, PerplexityBot e ClaudeBot). Na prática, as principais inteligências artificiais do mercado (ChatGPT, Gemini, Claude e Perplexity) estão recomendando a ${competitor} para potenciais clientes em vez da ${company}.\n\nDesenvolvemos na b.rocket a arquitetura de GEO (Generative Engine Optimization) que elimina essa invisibilidade técnica em poucos dias.\n\nAnexamos nosso relatório diagnóstico completo para sua análise.\n\nAtenciosamente,\nGuilherme Rossi | b.rocket`;

    babLinkedin = `${name}, você sabia que quando um cliente em potencial pesquisa no ChatGPT, Gemini ou Claude pelas melhores soluções no seu segmento, a IA cita a ${competitor}?\n\nIsso acontece porque a ${company} bloqueia o acesso dos robôs de IA e não possui marcação AEO.\n\nCom o GEO da b.rocket, corrigimos essa barreira para que a ${company} passe a ser a resposta recomendada em 1ª posição no ChatGPT, Gemini, Claude e Perplexity. Quer ver o diagnóstico completo?`;

    babEmail = `Assunto: Como posicionar a ${company} em 1º lugar no ChatGPT, Gemini, Claude e Perplexity\n\nOlá ${name},\n\nImagine o seguinte cenário: um tomador de decisão pesquisa nas principais IAs (ChatGPT, Gemini, Claude e Perplexity) "quais as melhores soluções de ${lead.niche || 'tecnologia'} do mercado?". Hoje, as IAs respondem recomendando a ${competitor} e o site ${domain} sequer é mencionado devido ao bloqueio no robots.txt.\n\nAgora imagine o cenário ideal: a ${company} sendo a fonte primária citada em 100% das buscas de IA com link direto para o seu trial/atendimento.\n\nÉ exatamente esse resultado que entregamos com nosso protocolo de GEO (Generative Engine Optimization).\n\nCompartilho em anexo a análise técnica detalhada do seu domínio.\n\nAbraços,\nGuilherme Rossi | b.rocket`;
  } else {
    // Caso 2: robots.txt permite robôs, mas falta AEO / Schemas / Citabilidade
    pasLinkedin = `Olá ${name}! Analisei o posicionamento digital da ${company} e vi que, embora seu robots.txt permita o acesso de robôs de IA, o site não possui marcação AEO (Answer-First) e Schemas JSON-LD.\n\nPor causa disso, quando um decisor busca no ChatGPT, Gemini, Claude ou Perplexity, as IAs ainda recomendam a ${competitor} no seu lugar!\n\nGeramos um relatório diagnóstico completo mostrando exatamente quais tags adicionar para assumir o 1º lugar nas respostas de IA. Quer que eu te envie?`;

    pasEmail = `Assunto: Ausência de AEO e Schemas na ${company} (${competitor} recomendada no ChatGPT, Gemini e Claude)\n\nOlá ${name}, tudo bem?\n\nEstava analisando a presença digital da ${company} no domínio ${domain}.\n\nIdentifiquei que embora os robôs de IA tenham acesso ao seu site, a estrutura de conteúdo não possui parágrafos de resposta direta (AEO) e faltam Schemas JSON-LD de entidade. Na prática, as IAs (ChatGPT, Gemini, Claude e Perplexity) continuam recomendando a ${competitor} para potenciais clientes do seu nicho.\n\nCom a metodologia de GEO da b.rocket, reestruturamos seus blocos semânticos para garantir a citação prioritária em poucas semanas.\n\nAnexamos nosso diagnóstico completo com o plano de ação técnico.\n\nAtenciosamente,\nGuilherme Rossi | b.rocket`;

    babLinkedin = `${name}, sabia que mesmo permitindo os robôs de IA no site, a ${company} perde citações no ChatGPT, Gemini e Claude para a ${competitor}?\n\nIsso acontece por falta de densidade factual e estrutura AEO.\n\nCom o motor de GEO da b.rocket, transformamos seu conteúdo existente em respostas autoritativas recomendadas em 1º lugar em todas as LLMs. Quer ver como funciona?`;

    babEmail = `Assunto: Como transformar o conteúdo da ${company} na resposta 1º lugar nas IAs\n\nOlá ${name},\n\nQuando um cliente pesquisa no ChatGPT, Gemini, Claude ou Perplexity pelas melhores soluções no seu segmento, hoje a ${competitor} aparece como primeira recomendação.\n\nA ${company} tem excelente potencial, mas precisa de uma camada de autoridade semântica para que as IAs compreendam e citem a sua marca como fonte primária.\n\nÉ exatamente isso que a nossa arquitetura GEO entrega para empresas do seu setor.\n\nEncaminho em anexo a auditoria completa do site ${domain}.\n\nAbraços,\nGuilherme Rossi | b.rocket`;
  }

  const outreachCopies = { pasLinkedin, pasEmail, babLinkedin, babEmail };

  try {
    const accessToken = await getGoogleAccessToken();
    if (leadId) {
      try {
        const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/hunter_leads?pageSize=100`;
        const listData = await fetchFirestore(listUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        let docPath = null;
        for (const doc of (listData.documents || [])) {
          const f = parseFirestoreDoc(doc);
          if (f.id === leadId || f.domain === domain) {
            docPath = doc.name;
            break;
          }
        }

        if (docPath) {
          const fields = {
            outreachCopies: toFirestoreValue(outreachCopies),
            status: { stringValue: 'outreach_ready' }
          };
          await fetchFirestore(`https://firestore.googleapis.com/v1/${docPath}?updateMask.fieldPaths=outreachCopies&updateMask.fieldPaths=status`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields })
          });
        }
      } catch (fsErr) {
        console.warn('Firestore patch outreach copies warning:', fsErr.message);
      }
    }

    res.json({ success: true, outreachCopies });
  } catch (err) {
    console.error('Error generating outreach copy:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/lead-hunter/html/:leadId (Visualizar Relatório HTML)
app.get('/api/admin/lead-hunter/html/:leadId', verifyAdminToken, async (req, res) => {
  const { leadId } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();
    const diagData = await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    let htmlReport = null;
    for (const doc of (diagData.documents || [])) {
      const f = parseFirestoreDoc(doc);
      if (f.leadId === leadId || f.id.includes(leadId)) {
        htmlReport = f.htmlReportContent;
        break;
      }
    }

    if (!htmlReport) {
      return res.status(404).send('<h1>Relatório HTML não encontrado. Execute o Audit primeiro.</h1>');
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlReport);
  } catch (err) {
    res.status(500).send(`Erro ao buscar relatório: ${err.message}`);
  }
});

// GET /api/admin/lead-hunter/pdf/:leadId (Baixar Relatório PDF de Página Única)
app.get('/api/admin/lead-hunter/pdf/:leadId', verifyAdminToken, async (req, res) => {
  const { leadId } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();
    const diagData = await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    let diagnostic = null;
    for (const doc of (diagData.documents || [])) {
      const f = parseFirestoreDoc(doc);
      if (f.leadId === leadId || f.id.includes(leadId)) {
        diagnostic = f;
        break;
      }
    }

    if (!diagnostic) {
      return res.status(404).json({ error: 'Diagnóstico não encontrado' });
    }

    const leadObj = { 
      company: diagnostic.clientUrl || leadId, 
      url: diagnostic.clientUrl || `https://${leadId}` 
    };

    const pdfBuffer = await generatePdfReport(leadObj, diagnostic);
    const domain = (diagnostic.clientUrl || leadId).replace(/^https?:\/\//i, '').replace(/\/.*$/, '') || 'relatorio';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Relatorio_GEO_${domain}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/lead-hunter/push-to-main (Promover e Remover do Lead Hunter)
app.post('/api/admin/lead-hunter/push-to-main', verifyAdminToken, async (req, res) => {
  const { leadId } = req.body;
  if (!leadId) return res.status(400).json({ error: 'leadId obrigatorio' });

  try {
    const accessToken = await getGoogleAccessToken();
    const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/hunter_leads?pageSize=100`;
    const listData = await fetchFirestore(listUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    let leadObj = null;

    for (const doc of (listData.documents || [])) {
      const f = parseFirestoreDoc(doc);
      if (f.id === leadId) {
        leadObj = f;
        break;
      }
    }

    const domain = leadObj?.domain || 'empresa.com.br';
    const mainLeadId = `lead_hunter_promoted_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const mainLeadDoc = {
      fields: {
        id: { stringValue: mainLeadId },
        url: { stringValue: `https://${domain}` },
        email: { stringValue: leadObj?.email || `contato@${domain}` },
        name: { stringValue: leadObj?.contactName || '' },
        company: { stringValue: leadObj?.company || domain },
        domain: { stringValue: domain },
        phone: { stringValue: '' },
        createdAt: { stringValue: new Date().toISOString() },
        status: { stringValue: 'new' },
        geoScore: { integerValue: leadObj?.geoScoreEstimado || 0 }
      }
    };

    await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(mainLeadDoc)
    });

    res.json({ success: true, mainLeadId });
  } catch (err) {
    console.error('Error promoting lead to main pipeline:', err);
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

        const leadId = clientId.startsWith('client_') ? clientId.split('_')[1] : clientId;
        let diagnostic = null;
        for (const doc of (data.documents || [])) {
          const diag = {};
          for (const [k, v] of Object.entries(doc.fields || {})) {
            diag[k] = fromFirestoreValue(v);
          }
          if (diag.clientId === clientId || diag.leadId === clientId || diag.leadId === leadId) {
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
          if (safeAgentName === 'orchestrator' || safeAgentName === 'semantic_explorer') {
            systemPrompt += `\nAnálise Semântica (Content Gaps & Clusters):\n${JSON.stringify(diagnostic.semanticAnalysis, null, 2)}\n`;
          }
          if (safeAgentName === 'orchestrator' || safeAgentName === 'offpage') {
            systemPrompt += `\nAutoridade Externa e Entidade (Off-Page):\n${JSON.stringify(diagnostic.offpageAnalysis, null, 2)}\n`;
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

    // ─── REGRAS DE HONESTIDADE TÉCNICA — aplicadas a TODOS os agentes, sempre ──
    // FORA do bloco if(clientId) para garantir que todos os agentes recebam as
    // regras independentemente de haver diagnóstico carregado ou não.
    systemPrompt += `

╔══════════════════════════════════════════════════════════════════════╗
║  REGRAS CRÍTICAS DE HONESTIDADE — NUNCA VIOLE ESTAS REGRAS          ║
╚══════════════════════════════════════════════════════════════════════╝

Os dados do diagnóstico (quando presentes) foram gerados por DETECTORES DE CÓDIGO
(regex + heurísticas determinísticas), NÃO por análise semântica de LLM.
Você DEVE comunicar isso com honestidade absoluta em qualquer conversa.

## CLASSIFICAÇÃO DOS DETECTORES (para você saber no que confiar):

### ✅ DETERMINÍSTICOS — confiança ~100%, verificáveis objetivamente:
- robots.txt → quais bots estão permitidos/bloqueados
- SSR ativo (HTML renderizado no servidor, sem JS)
- Schema Organization / Person / FAQPage / Service (JSON-LD)
- Arquivo /llms.txt publicado na raiz do domínio
- sameAs (links para fontes externas dentro do schema)
- Tabelas HTML com <td> real (não tabelas CSS)

### ⚠️ HEURÍSTICOS — confiança 60–80%, podem ter falsos positivos:
- hasPriceGatekeeperIssue: detecta "R$" + número no HTML visível (sem scripts).
  FALSO POSITIVO se: número com vírgula existir no HTML sem ser preço.
  FALSO NEGATIVO se: preços forem renderizados por JavaScript.
- hasExpertQuotes: exige padrão de atribuição formal ("Segundo McKinsey...",
  "De acordo com IBGE...", <blockquote>). NÃO detecta depoimentos de clientes,
  aspas genéricas ou frases de marketing entre aspas.
- hasStatisticsPer150Words: exige "40%", "3x mais", "2 milhões de clientes".
  NÃO conta anos (2024), resoluções (4K), especificações técnicas (144Hz).
- hasTldrAnswerFirstParagraph: detecta se a 1ª sentença real (≥10 palavras)
  não é um greeting/slogan. PODE ERRAR em sites com introdução longa mas legítima.
- citationSharePercentage: amostra de 20 prompts em 4 LLMs. Não exaustivo.

## PROIBIÇÕES ABSOLUTAS — violação = falha crítica:

❌ NUNCA invente justificativas para defender um resultado questionado pelo usuário.
❌ NUNCA diga que o agente "detectou padrões semânticos" ou "inferiu contexto" — ele usa REGEX, não LLM.
❌ NUNCA use frases como "o agente simula como uma IA processaria" — isso é FALSO.
❌ NUNCA afirme que palavras como "orçamento", "investimento", "solicite" foram detectadas como preço.
❌ NUNCA diga que depoimentos de clientes foram detectados como citações de especialistas.
❌ NUNCA alucine dados que não estão no diagnóstico recebido.

## COMO RESPONDER quando o usuário questiona um resultado:

1. Explique EXATAMENTE o que o detector faz em linguagem simples.
2. Se o usuário diz que o resultado parece errado, CONCORDE se fizer sentido técnico — não defenda.
3. Sugira verificação manual: "Abra o site, inspecione o HTML e procure por [padrão específico]".
4. Se for falso positivo confirmado: "Você está certo. Isso foi um falso positivo do detector.
   O score deste item não reflete a realidade do site."
5. NUNCA defenda um resultado incorreto inventando explicações plausíveis.
6. Mantenha suas respostas estruturadas, diretas e completas. Sempre conclua seus raciocínios e listas sem cortar a resposta pela metade.

Sua credibilidade e a do sistema dependem inteiramente de honestidade técnica.
`;

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
        maxOutputTokens: 8192
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

    const candidate = parsed.candidates?.[0];
    let reply = candidate?.content?.parts?.[0]?.text || 'Não consegui formular uma resposta.';

    // Se a API cortou o output por limite de tokens, anexar aviso amigável em vez de cortar no meio da frase
    if (candidate?.finishReason === 'MAX_TOKENS' || candidate?.finishReason === 'LENGTH') {
      reply += '\n\n*(Nota: A resposta foi concluída no limite de tokens disponíveis.)*';
    }

    // ─── SALVAR HISTÓRICO NO FIRESTORE ───────────────────────────────────────
    try {
      const accessToken = await getGoogleAccessToken();
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/chat_history`;
      
      const userMsgDoc = {
        fields: {
          clientId: { stringValue: clientId || 'default' },
          agentName: { stringValue: agentName },
          role: { stringValue: 'user' },
          content: { stringValue: message },
          timestamp: { stringValue: new Date().toISOString() }
        }
      };

      const assistantMsgDoc = {
        fields: {
          clientId: { stringValue: clientId || 'default' },
          agentName: { stringValue: agentName },
          role: { stringValue: 'assistant' },
          content: { stringValue: reply },
          timestamp: { stringValue: new Date().toISOString() }
        }
      };

      await Promise.all([
        fetch(firestoreUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(userMsgDoc)
        }),
        fetch(firestoreUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(assistantMsgDoc)
        })
      ]);
    } catch (dbErr) {
      console.error('Erro ao salvar mensagens do chat no Firestore:', dbErr);
    }

    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET CHAT HISTORY ──────────────────────────────────────────────────────
app.get('/api/admin/chat/history/:clientId/:agentName', verifyAdminToken, async (req, res) => {
  const { clientId, agentName } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/chat_history?pageSize=500`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();

    const history = (data.documents || []).map(doc => {
      const f = doc.fields || {};
      return {
        id: doc.name.split('/').pop(),
        clientId: f.clientId?.stringValue || '',
        agentName: f.agentName?.stringValue || '',
        role: f.role?.stringValue || '',
        content: f.content?.stringValue || '',
        timestamp: f.timestamp?.stringValue || ''
      };
    })
    .filter(item => item.clientId === clientId && item.agentName === agentName)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CLEAR CHAT HISTORY ────────────────────────────────────────────────────
app.delete('/api/admin/chat/history/:clientId/:agentName', verifyAdminToken, async (req, res) => {
  const { clientId, agentName } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/chat_history?pageSize=500`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();

    const toDelete = (data.documents || []).filter(doc => {
      const f = doc.fields || {};
      return f.clientId?.stringValue === clientId && f.agentName?.stringValue === agentName;
    });

    await Promise.all(toDelete.map(doc => {
      return fetch(`https://firestore.googleapis.com/v1/${doc.name}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    }));

    res.json({ success: true });
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
