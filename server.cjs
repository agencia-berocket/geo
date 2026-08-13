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
  runSearchTermsAnalyzerAgent,
  runSemanticExplorerAgent,
  runOffPageEntityAgent,
  runSeoOptimizerAgent,
  runChecklistArchitectAgent,
  calculateGeoScore,
  buildActionList,
  generateHtmlReport,
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
app.use(express.json({ limit: '25mb' }));
app.use('/audits', express.static(path.join(__dirname, 'public', 'audits')));
app.use('/notes', express.static(path.join(__dirname, 'public', 'notes')));

function getAuditFolder(entityType, entityId) {
  const cleanType = entityType === 'client' ? 'client' : 'lead';
  const folderPath = path.join(__dirname, 'public', 'audits', `${cleanType}_${entityId}`);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
}

async function saveAuditArtifacts(entityType, entityId, leadObj, diagnosticObj) {
  try {
    const cleanType = entityType === 'client' ? 'client' : 'lead';
    const folderPath = getAuditFolder(cleanType, entityId);

    // 1. Relatório HTML completo (Auditoria Interna)
    const fullHtml = generateCompleteHtmlReport(leadObj, diagnosticObj);
    const htmlFilePath = path.join(folderPath, 'relatorio_geo.html');
    fs.writeFileSync(htmlFilePath, fullHtml, 'utf8');

    // 1b. Relatório HTML resumido (Proposta / Lead)
    const summaryHtml = generateHtmlReport(leadObj, diagnosticObj, { isInternal: false });
    const summaryHtmlFilePath = path.join(folderPath, 'relatorio_geo_resumido.html');
    fs.writeFileSync(summaryHtmlFilePath, summaryHtml, 'utf8');

    // 2. Screenshots das seções-chave via Puppeteer
    const screenshots = await takeReportScreenshots(fullHtml);
    const savedScreenshots = [];

    screenshots.forEach((sc, idx) => {
      const safeLabel = sc.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const fileName = `screenshot_${idx + 1}_${safeLabel}.png`;
      const filePath = path.join(folderPath, fileName);
      const buffer = Buffer.from(sc.base64, 'base64');
      fs.writeFileSync(filePath, buffer);
      savedScreenshots.push({
        label: sc.label,
        fileName,
        url: `/audits/${cleanType}_${entityId}/${fileName}`,
        createdAt: new Date().toISOString()
      });
    });

    // 3. Log JSON da auditoria completa
    const auditLogData = {
      entityType: cleanType,
      entityId,
      geoScore: diagnosticObj.overallGeoScore,
      clientUrl: diagnosticObj.clientUrl,
      generatedAt: diagnosticObj.generatedAt || new Date().toISOString(),
      agentAuditLog: diagnosticObj.visibilityBenchmarking?.agentAuditLog || [],
      savedScreenshots,
      htmlReportUrl: `/audits/${cleanType}_${entityId}/relatorio_geo.html`,
      htmlSummaryReportUrl: `/audits/${cleanType}_${entityId}/relatorio_geo_resumido.html`
    };
    fs.writeFileSync(path.join(folderPath, 'audit_log.json'), JSON.stringify(auditLogData, null, 2), 'utf8');

    console.log(`📁 Auditoria e ${savedScreenshots.length} prints salvos na pasta: ${folderPath}`);
    return auditLogData;
  } catch (err) {
    console.error('Erro ao salvar arquivos da auditoria:', err);
    return null;
  }
}


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
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    if (val.length === 0) return { arrayValue: {} };
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
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
          const htmlContent = (await fetchUrl(baseUrl)).body;
          const openrouterKey = process.env.OPENROUTER_API_KEY || '';
          const pageSpeedKey = process.env.GOOGLE_API_KEY || '';

          const [gk, md, ct, sem, off, seo] = await Promise.all([
            runGatekeeperAgent(baseUrl, htmlContent, pageSpeedKey),
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

// ─── CREATE LEAD MANUALLY (ADMIN) ─────────────────────────────────────────
app.post('/api/admin/leads', verifyAdminToken, async (req, res) => {
  const { url, email, name, company, phone, architecture, scale, status, contactName, contactRole, niche, linkedinUrl } = req.body;
  if (!url || !email) {
    return res.status(400).json({ error: 'URL e e-mail são obrigatórios' });
  }

  try {
    const accessToken = await getGoogleAccessToken();
    const leadId = `lead_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    const domain = cleanUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads`;
    const leadDoc = {
      fields: {
        id: { stringValue: leadId },
        url: { stringValue: cleanUrl },
        email: { stringValue: email },
        name: { stringValue: name || contactName || '' },
        contactName: { stringValue: contactName || name || '' },
        contactRole: { stringValue: contactRole || '' },
        niche: { stringValue: niche || '' },
        linkedinUrl: { stringValue: linkedinUrl || '' },
        company: { stringValue: company || domain },
        domain: { stringValue: domain },
        phone: { stringValue: phone || '' },
        architecture: { stringValue: architecture || '' },
        scale: { stringValue: scale || '' },
        createdAt: { stringValue: new Date().toISOString() },
        status: { stringValue: status || 'new' },
        source: { stringValue: 'direct' },
        geoScore: { integerValue: 0 },
      }
    };

    await fetchFirestore(firestoreUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(leadDoc),
    });

    res.json({ success: true, leadId });
  } catch (err) {
    console.error('Manual lead creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── LIST LEADS ────────────────────────────────────────────────────────────
app.get('/api/admin/leads', verifyAdminToken, async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    const leadsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?orderBy=createdAt+desc&pageSize=100`;
    const hunterUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/hunter_leads?orderBy=createdAt+desc&pageSize=100`;

    const [leadsRes, hunterRes] = await Promise.all([
      fetchFirestore(leadsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } }).catch(() => ({ documents: [] })),
      fetchFirestore(hunterUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } }).catch(() => ({ documents: [] })),
    ]);

    const leadDocs = leadsRes.documents || [];
    const hunterDocs = hunterRes.documents || [];

    const parseLead = (doc, isHunter = false) => {
      const f = doc.fields || {};
      const rawSource = f.source?.stringValue || (isHunter ? 'mining_google' : 'lp');
      let sourceLabel = f.sourceLabel?.stringValue || '';
      if (!sourceLabel) {
        if (rawSource === 'lp') sourceLabel = 'Landing Page (LP)';
        else if (rawSource === 'mining_google' || rawSource === 'google') sourceLabel = 'Mineração (Google)';
        else if (rawSource === 'mining_linkedin' || rawSource === 'linkedin') sourceLabel = 'Mineração (LinkedIn)';
        else if (rawSource === 'mining_import' || rawSource === 'import') sourceLabel = 'Mineração (Importación)';
        else if (rawSource === 'mining_auto' || rawSource === 'auto') sourceLabel = 'Mineração (IA Auto)';
        else sourceLabel = 'Direto / Outro';
      }

      const domain = f.domain?.stringValue || f.url?.stringValue?.replace(/^https?:\/\//i, '').replace(/\/.*$/, '') || f.company?.stringValue || '';
      const url = f.url?.stringValue || (domain ? `https://${domain}` : '');

      return {
        id: f.id?.stringValue || doc.name.split('/').pop(),
        url: url,
        domain: domain,
        email: f.email?.stringValue || '',
        name: f.name?.stringValue || f.contactName?.stringValue || '',
        contactName: f.contactName?.stringValue || f.name?.stringValue || '',
        company: f.company?.stringValue || domain,
        phone: f.phone?.stringValue || '',
        architecture: f.architecture?.stringValue || '',
        scale: f.scale?.stringValue || '',
        createdAt: f.createdAt?.stringValue || new Date().toISOString(),
        status: f.status?.stringValue || 'new',
        source: rawSource,
        sourceLabel: sourceLabel,
        contactRole: f.contactRole?.stringValue || '',
        linkedinUrl: f.linkedinUrl?.stringValue || '',
        niche: f.niche?.stringValue || 'Geral',
        location: f.location?.stringValue || 'Brasil',
        companySize: f.companySize?.stringValue || '',
        temperature: f.temperature?.stringValue || 'cold',
        sequenceStage: parseInt(f.sequenceStage?.integerValue || '0'),
        responded: f.responded?.booleanValue || false,
        geoScore: parseInt(f.geoScore?.integerValue || f.geoScoreEstimado?.integerValue || '0'),
        geoScoreEstimado: parseInt(f.geoScoreEstimado?.integerValue || f.geoScore?.integerValue || '0'),
        diagnosticId: f.diagnosticId?.stringValue || '',
        searchTerms: (f.searchTerms?.arrayValue?.values || []).map(v => v.stringValue || '').filter(Boolean),
        searchTermsStatus: f.searchTermsStatus?.stringValue || 'pending',
        companyOverview: f.companyOverview?.stringValue || '',
        searchTermsAnalyzedAt: f.searchTermsAnalyzedAt?.stringValue || '',
        searchTermsApprovedAt: f.searchTermsApprovedAt?.stringValue || '',
        outreachCopies: f.outreachCopies?.mapValue?.fields
          ? Object.fromEntries(Object.entries(f.outreachCopies.mapValue.fields).map(([k, v]) => [k, v.stringValue || '']))
          : {},
        sentHistory: (f.sentHistory?.arrayValue?.values || []).map(v => {
          const item = v.mapValue?.fields || {};
          return {
            copyKey: item.copyKey?.stringValue || '',
            sentAt: item.sentAt?.stringValue || '',
            channel: item.channel?.stringValue || 'email',
            subject: item.subject?.stringValue || '',
            attachPdf: item.attachPdf?.booleanValue || false,
          };
        }),
        emailSentAt: f.emailSentAt?.stringValue || '',
        pipelineStage: f.pipelineStage?.stringValue || '',
        commercialStage: f.commercialStage?.stringValue || '',
        nextAction: f.nextAction?.stringValue || '',
        nextFollowupDate: f.nextFollowupDate?.stringValue || '',
        lastInteraction: f.lastInteraction?.stringValue || '',
        firstContactAt: f.firstContactAt?.stringValue || '',
        respondedAt: f.respondedAt?.stringValue || '',
        lastContactAt: f.lastContactAt?.stringValue || '',
        meetingDate: f.meetingDate?.stringValue || '',
        proposalDate: f.proposalDate?.stringValue || '',
        closedAt: f.closedAt?.stringValue || '',
        stageChangedAt: f.stageChangedAt?.stringValue || '',
        followupCount: parseInt(f.followupCount?.integerValue || '0'),
        assignedTo: f.assignedTo?.stringValue || 'Guilherme',
        notes: f.notes?.stringValue || '',
        noteAttachments: (f.noteAttachments?.arrayValue?.values || []).map(v => {
          const item = v.mapValue?.fields || {};
          return {
            id: item.id?.stringValue || '',
            name: item.name?.stringValue || '',
            url: item.url?.stringValue || '',
            sizeBytes: parseInt(item.sizeBytes?.integerValue || item.sizeBytes?.doubleValue || '0'),
            fileType: item.fileType?.stringValue || 'other',
            createdAt: item.createdAt?.stringValue || '',
          };
        }),
      };
    };

    const mainLeads = leadDocs.map(doc => parseLead(doc, false));
    const hunterLeads = hunterDocs.map(doc => parseLead(doc, true));

    // Dedup by ID or URL/domain
    const seenIds = new Set();
    const allLeads = [];

    for (const lead of [...mainLeads, ...hunterLeads]) {
      if (!seenIds.has(lead.id)) {
        seenIds.add(lead.id);
        allLeads.push(lead);
      }
    }

    allLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ leads: allLeads });
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

    // Buscar o docName real do lead (procura em leads e hunter_leads)
    const found = await findLeadDoc(accessToken, id);

    if (!found) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    const leadDocPath = found.docPath;

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

    // Buscar o docName real do lead (procura em leads e hunter_leads)
    const found = await findLeadDoc(accessToken, id);

    if (!found) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const firestoreUrl = `https://firestore.googleapis.com/v1/${found.docPath}`;

    await fetchFirestore(firestoreUrl, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SEARCH TERMS ANALYZER & EDIT ENDPOINTS ──────────────────────────────────
app.post('/api/admin/leads/:leadId/analyze-search-terms', verifyAdminToken, async (req, res) => {
  const { leadId } = req.params;
  try {
    const accessToken = await getGoogleAccessToken();
    const found = await findLeadDoc(accessToken, leadId);

    let lead = null;
    let leadDocPath = null;
    if (found) {
      lead = found.fields;
      leadDocPath = found.docPath;
    }

    if (!lead || !leadDocPath) return res.status(404).json({ error: 'Lead não encontrado' });

    const leadUrl = lead.url || (lead.domain ? `https://${lead.domain}` : '');
    const baseUrl = leadUrl.startsWith('http') ? leadUrl : `https://${leadUrl}`;
    let htmlContent = '';
    try {
      const siteRes = await fetchUrl(baseUrl);
      htmlContent = siteRes.body;
    } catch (e) {
      htmlContent = '';
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY || '';
    const result = await runSearchTermsAnalyzerAgent(baseUrl, htmlContent, openrouterKey);

    const updateMask = 'updateMask.fieldPaths=searchTerms&updateMask.fieldPaths=searchTermsStatus&updateMask.fieldPaths=companyOverview&updateMask.fieldPaths=searchTermsAnalyzedAt';
    const firestoreUrl = `https://firestore.googleapis.com/v1/${leadDocPath}?${updateMask}`;

    const fields = {
      searchTerms: toFirestoreValue(result.searchTerms),
      searchTermsStatus: toFirestoreValue('generated'),
      companyOverview: toFirestoreValue(result.companyOverview),
      searchTermsAnalyzedAt: toFirestoreValue(new Date().toISOString()),
    };

    await fetchFirestore(firestoreUrl, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    res.json({
      success: true,
      searchTerms: result.searchTerms,
      companyOverview: result.companyOverview,
      searchTermsStatus: 'generated',
      searchTermsAnalyzedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Erro na análise de termos de pesquisa:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/leads/:leadId/save-search-terms', verifyAdminToken, async (req, res) => {
  const { leadId } = req.params;
  const { searchTerms } = req.body;

  if (!Array.isArray(searchTerms) || searchTerms.length === 0 || searchTerms.some(t => !t || !t.trim())) {
    return res.status(400).json({ error: 'É necessário fornecer os 14 termos de pesquisa devidamente preenchidos.' });
  }

  const cleanTerms = searchTerms.map(t => String(t).trim()).slice(0, 14);

  try {
    const accessToken = await getGoogleAccessToken();
    const found = await findLeadDoc(accessToken, leadId);

    if (!found) return res.status(404).json({ error: 'Lead não encontrado' });
    const leadDocPath = found.docPath;

    const updateMask = 'updateMask.fieldPaths=searchTerms&updateMask.fieldPaths=searchTermsStatus&updateMask.fieldPaths=searchTermsApprovedAt';
    const firestoreUrl = `https://firestore.googleapis.com/v1/${leadDocPath}?${updateMask}`;

    const fields = {
      searchTerms: toFirestoreValue(cleanTerms),
      searchTermsStatus: toFirestoreValue('approved'),
      searchTermsApprovedAt: toFirestoreValue(new Date().toISOString()),
    };

    await fetchFirestore(firestoreUrl, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    res.json({
      success: true,
      searchTerms: cleanTerms,
      searchTermsStatus: 'approved',
    });
  } catch (err) {
    console.error('Erro ao salvar termos de pesquisa:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── RUN DIAGNOSTIC ────────────────────────────────────────────────────────
app.post('/api/admin/diagnostic/run', verifyAdminToken, async (req, res) => {
  const { leadId } = req.body;
  if (!leadId) return res.status(400).json({ error: 'leadId é obrigatório' });

  let lead = null;
  let leadDocPath = null;
  let accessToken = null;

  try {
    accessToken = await getGoogleAccessToken();

    // Fetch lead data (busca em ambas as coleções: leads (LP) e hunter_leads (Lead Hunter))
    const found = await findLeadDoc(accessToken, leadId);

    if (found) {
      const f = found.fields;
      lead = {
        id: f.id || leadId,
        url: f.url || (f.domain ? `https://${f.domain}` : ''),
        email: f.email || '',
        name: f.name || '',
        company: f.company || '',
        searchTerms: (f.searchTerms || []).filter(Boolean),
        searchTermsStatus: f.searchTermsStatus || 'pending',
      };
      leadDocPath = found.docPath;
    }

    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

    // TRAVA DE EXECUÇÃO: Se os 10 termos não estiverem preenchidos/aprovados, recusa a execução
    if (!lead.searchTerms || lead.searchTerms.length === 0 || lead.searchTermsStatus !== 'approved') {
      return res.status(400).json({
        error: 'O diagnóstico está travado! É necessário analisar e aprovar os 10 termos de pesquisa antes de executar o diagnóstico completo.',
        requiresSearchTerms: true
      });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  // Respond immediately — diagnostic runs async
  res.json({ success: true, message: 'Diagnóstico iniciado em background' });

  // Run async
  (async () => {
    try {
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
      const pageSpeedKey = process.env.GOOGLE_API_KEY || '';

      // Run 6 specialist agents in parallel
      const [gatekeeper, metadata, content, semantic, offpage, seo] = await Promise.all([
        runGatekeeperAgent(baseUrl, htmlContent, pageSpeedKey),
        runMetadataAgent(htmlContent, domain),
        runContentAgent(htmlContent),
        runSemanticExplorerAgent(baseUrl, htmlContent, openrouterKey),
        runOffPageEntityAgent(baseUrl, htmlContent, openrouterKey),
        runSeoOptimizerAgent(baseUrl, htmlContent),
      ]);

      // Agente Intent (uses OpenRouter API with approved custom search terms)
      const visibility = await runIntentAgent(lead.url, htmlContent, openrouterKey, lead.searchTerms);

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

      // Salvar artefatos e prints de tela na pasta dedicada do lead
      await saveAuditArtifacts('lead', leadId, lead, diagnostic);

      console.log(`✅ Diagnóstico concluído para ${lead.url} — GEO Score: ${overallGeoScore}%`);
    } catch (err) {
      console.error('Diagnostic pipeline error:', err);
      // Marca o status como falho para que o front pare de aguardar em vez de travar em 'processing' para sempre
      try {
        await fetchFirestore(`https://firestore.googleapis.com/v1/${leadDocPath}?updateMask.fieldPaths=status`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { status: { stringValue: 'failed' } } }),
        });
      } catch (patchErr) {
        console.error('Failed to mark diagnostic as failed:', patchErr);
      }
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

    // Fetch lead (busca em leads e hunter_leads)
    const found = await findLeadDoc(accessToken, leadId);
    if (!found) throw new Error('Lead não encontrado');
    const lead = { url: found.fields.url, email: found.fields.email, name: found.fields.name };

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

    // 1. Fetch diagnostic by id, leadId or clientId
    const diagData = await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    let diagnostic = null;
    for (const doc of (diagData.documents || [])) {
      const docNameId = doc.name.split('/').pop();
      const diag = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        if (k === 'htmlReportContent') continue;
        diag[k] = fromFsHtml(v);
      }
      if (diag.id === leadId || docNameId === leadId || diag.leadId === leadId || diag.clientId === leadId) {
        diagnostic = diag;
        break;
      }
    }
    if (!diagnostic) return res.status(404).json({ error: 'Diagnóstico não encontrado' });

    // 2. Fetch lead info from leads, hunter_leads, or clients
    let lead = null;

    // Check leads collection
    const leadsData = await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    for (const doc of (leadsData.documents || [])) {
      const f = doc.fields || {};
      if (f.id?.stringValue === leadId || f.id?.stringValue === diagnostic.leadId || f.id?.stringValue === diagnostic.clientId) {
        lead = { url: f.url?.stringValue, email: f.email?.stringValue, name: f.name?.stringValue, company: f.company?.stringValue };
        break;
      }
    }

    // Check hunter_leads collection if not found
    if (!lead) {
      const hunterData = await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/hunter_leads?pageSize=100`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      for (const doc of (hunterData.documents || [])) {
        const f = parseFirestoreDoc(doc);
        if (f.id === leadId || f.id === diagnostic.leadId || f.domain === leadId) {
          lead = { url: f.url || `https://${f.domain}`, email: f.email, name: f.contactName || f.name, company: f.company || f.domain };
          break;
        }
      }
    }

    // Check clients collection if not found
    if (!lead) {
      const clientsData = await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/clients?pageSize=100`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      for (const doc of (clientsData.documents || [])) {
        const f = parseFirestoreDoc(doc);
        if (f.id === leadId || f.id === diagnostic.clientId || f.leadId === leadId || f.leadId === diagnostic.leadId) {
          lead = { url: f.url, email: f.email, name: f.name, company: f.company };
          break;
        }
      }
    }

    // Fallback if lead still not found
    if (!lead) {
      const targetUrl = diagnostic.clientUrl || (leadId.startsWith('http') ? leadId : `https://${leadId}`);
      lead = { url: targetUrl, company: diagnostic.company || diagnostic.clientCompany || leadId };
    }

    // Gerar o HTML do cliente ou auditoria interna
    const mode = req.query.mode || req.query.type;
    const isInternal = mode === 'audit' || mode === 'internal' || req.query.isInternal === 'true';
    const htmlReport = isInternal 
      ? generateCompleteHtmlReport(lead, diagnostic)
      : generateHtmlReport(lead, diagnostic, { isInternal: false });

    const domainClean = (lead.url || 'diagnostico').replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/[^a-z0-9_-]/gi, '_');
    const filename = isInternal ? `Relatorio_GEO_Auditoria_${domainClean}.html` : `Relatorio_GEO_Resumido_${domainClean}.html`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(htmlReport);
  } catch (err) {
    console.error('HTML download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── REDIRECIONAMENTO LEGADO DE PDF PARA HTML ─────────────────────────────
app.get('/api/admin/diagnostic/pdf/:leadId', verifyAdminToken, (req, res) => {
  res.redirect(`/api/admin/diagnostic/html/${req.params.leadId}`);
});

// ─── AUDIT FILES & SCREENSHOTS API ──────────────────────────────────────────
// GET /api/admin/audits/:entityType/:entityId
app.get('/api/admin/audits/:entityType/:entityId', verifyAdminToken, async (req, res) => {
  const { entityType, entityId } = req.params;
  try {
    const cleanType = entityType === 'client' ? 'client' : 'lead';
    const folderPath = path.join(__dirname, 'public', 'audits', `${cleanType}_${entityId}`);
    const auditJsonPath = path.join(folderPath, 'audit_log.json');

    let auditData = null;
    if (fs.existsSync(auditJsonPath)) {
      try {
        auditData = JSON.parse(fs.readFileSync(auditJsonPath, 'utf8'));
      } catch (e) {}
    }

    let files = [];
    if (fs.existsSync(folderPath)) {
      const rawFiles = fs.readdirSync(folderPath);
      files = rawFiles.map(fn => {
        const full = path.join(folderPath, fn);
        const stat = fs.statSync(full);
        return {
          name: fn,
          url: `/audits/${cleanType}_${entityId}/${fn}`,
          isImage: /\.(png|jpg|jpeg|webp|gif)$/i.test(fn),
          isHtml: /\.html$/i.test(fn),
          sizeBytes: stat.size,
          createdAt: stat.birthtime.toISOString()
        };
      });
    }

    res.json({
      success: true,
      auditFolderUrl: `/audits/${cleanType}_${entityId}`,
      auditData,
      files
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/audits/:entityType/:entityId/upload — Upload custom screenshots/prints
app.post('/api/admin/audits/:entityType/:entityId/upload', verifyAdminToken, async (req, res) => {
  const { entityType, entityId } = req.params;
  const { fileName, base64Data, label } = req.body;

  if (!base64Data) {
    return res.status(400).json({ error: 'base64Data é obrigatório' });
  }

  try {
    const cleanType = entityType === 'client' ? 'client' : 'lead';
    const folderPath = getAuditFolder(cleanType, entityId);

    const safeName = (fileName || `print_auditoria_${Date.now()}.png`).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const filePath = path.join(folderPath, safeName);
    fs.writeFileSync(filePath, buffer);

    const auditJsonPath = path.join(folderPath, 'audit_log.json');
    let auditData = { savedScreenshots: [] };
    if (fs.existsSync(auditJsonPath)) {
      try { auditData = JSON.parse(fs.readFileSync(auditJsonPath, 'utf8')); } catch (e) {}
    }
    if (!auditData.savedScreenshots) auditData.savedScreenshots = [];

    const newScreen = {
      label: label || safeName,
      fileName: safeName,
      url: `/audits/${cleanType}_${entityId}/${safeName}`,
      createdAt: new Date().toISOString()
    };
    auditData.savedScreenshots.push(newScreen);
    fs.writeFileSync(auditJsonPath, JSON.stringify(auditData, null, 2), 'utf8');

    res.json({
      success: true,
      message: 'Print de tela para auditoria salvo com sucesso!',
      screenshot: newScreen
    });
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

    // Busca em leads e hunter_leads
    const found = await findLeadDoc(accessToken, leadId);
    if (!found) return res.status(404).json({ error: 'Lead não encontrado' });

    const leadDocPath = found.docPath;
    const lead = {
      id: found.fields.id,
      email: found.fields.email,
      name: found.fields.name,
      url: found.fields.url,
      company: found.fields.company,
      geoScore: found.fields.geoScore || 0,
    };

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

// ─── CREATE CLIENT (convert lead → client) ─────────────────────────────────
app.post('/api/admin/clients', verifyAdminToken, async (req, res) => {
  const { leadId, name, company, plan, currentStage } = req.body;
  if (!leadId) return res.status(400).json({ error: 'leadId é obrigatório' });

  try {
    const accessToken = await getGoogleAccessToken();

    // Busca em `leads` E `hunter_leads` — leads minerados vivem na segunda coleção
    const found = await findLeadDoc(accessToken, leadId);
    if (!found) throw new Error('Lead não encontrado');
    const lead = found.fields;

    const clientId = `client_${leadId}_${Date.now()}`;
    const initialScore = parseInt(lead.geoScore || lead.geoScoreEstimado || 0) || 0;

    // Herança de Bloco de Notas e Anexos do Lead
    const leadNotes = lead.notes || '';
    const rawLeadAttachments = lead.noteAttachments || [];
    const clientAttachments = rawLeadAttachments.map(att => {
      const fileName = att.url ? att.url.split('/').pop() : att.name;
      return {
        ...att,
        url: `/notes/client_${clientId}/${fileName}`
      };
    });

    // Copia física da pasta de notas do lead para a pasta do cliente se existir
    const leadNotesFolder = path.join(__dirname, 'public', 'notes', `lead_${leadId}`);
    const clientNotesFolder = path.join(__dirname, 'public', 'notes', `client_${clientId}`);
    if (fs.existsSync(leadNotesFolder)) {
      if (!fs.existsSync(clientNotesFolder)) {
        fs.mkdirSync(clientNotesFolder, { recursive: true });
      }
      try {
        const files = fs.readdirSync(leadNotesFolder);
        for (const file of files) {
          fs.copyFileSync(path.join(leadNotesFolder, file), path.join(clientNotesFolder, file));
        }
      } catch (copyErr) {
        console.warn('Aviso ao copiar pasta de notas:', copyErr.message);
      }
    }

    const clientPayload = {
      id: clientId,
      leadId,
      url: lead.url || '',
      email: lead.email || '',
      name: name || lead.contactName || lead.name || (lead.email || '').split('@')[0],
      company: company || lead.company || lead.domain || lead.url || '',
      plan: plan || 'premium',
      currentStage: currentStage || 1,
      createdAt: new Date().toISOString(),
      geoScoreHistory: [{ date: new Date().toISOString(), score: initialScore }],
      notes: leadNotes,
      noteAttachments: clientAttachments,
      // Campos herdados de contato/prospecção do lead
      contactName: lead.contactName || lead.name || '',
      contactRole: lead.contactRole || '',
      phone: lead.phone || '',
      linkedinUrl: lead.linkedinUrl || '',
      niche: lead.niche || '',
      location: lead.location || '',
      companySize: lead.companySize || '',
      domain: lead.domain || '',
      source: lead.source || '',
      sourceLabel: lead.sourceLabel || '',
      // Diagnóstico feito ainda como lead, herdado como "diagnóstico de entrada"
      initialDiagnosticId: lead.diagnosticId || '',
      initialGeoScore: initialScore,
      // Histórico de prospecção
      searchTerms: lead.searchTerms || [],
      companyOverview: lead.companyOverview || '',
      outreachCopies: lead.outreachCopies || {},
      sentHistory: lead.sentHistory || [],
      convertedAt: new Date().toISOString(),
    };

    const fields = {};
    for (const [k, v] of Object.entries(clientPayload)) {
      fields[k] = toFirestoreValue(v);
    }

    await fetchFirestore(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/clients`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    // Sincroniza status + temperature + pipelineStage no lead original (mantém consultável, some da visão ativa)
    await fetchFirestore(`https://firestore.googleapis.com/v1/${found.docPath}?updateMask.fieldPaths=status&updateMask.fieldPaths=temperature&updateMask.fieldPaths=pipelineStage`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          status: { stringValue: 'converted' },
          temperature: { stringValue: 'converted' },
          pipelineStage: { stringValue: 'converted' },
        },
      }),
    });

    // Auto-subscribe client to newsletter
    if (lead.email) {
      await autoSubscribeNewsletter(accessToken, clientPayload.name, lead.email).catch(() => {});
    }

    res.json({ success: true, clientId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── NOTES & ATTACHMENTS API ────────────────────────────────────────────────
// POST /api/admin/notes/:entityType/:entityId/upload
app.post('/api/admin/notes/:entityType/:entityId/upload', verifyAdminToken, async (req, res) => {
  const { entityType, entityId } = req.params;
  const { fileName, base64Data, fileType } = req.body;
  if (!fileName || !base64Data) {
    return res.status(400).json({ error: 'fileName e base64Data são obrigatórios.' });
  }

  try {
    const cleanType = entityType === 'client' ? 'client' : 'lead';
    const folderPath = path.join(__dirname, 'public', 'notes', `${cleanType}_${entityId}`);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const filePath = path.join(folderPath, safeName);
    const base64Pure = base64Data.replace(/^data:.*?;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Pure, 'base64'));

    const fileUrl = `/notes/${cleanType}_${entityId}/${safeName}`;
    const stat = fs.statSync(filePath);

    let detectedType = fileType || 'other';
    if (!fileType) {
      if (/\.(png|jpg|jpeg|webp|gif)$/i.test(fileName)) detectedType = 'image';
      else if (/\.html?$/i.test(fileName)) detectedType = 'html';
      else if (/\.pdf$/i.test(fileName)) detectedType = 'pdf';
      else if (/\.(docx?|xlsx?|pptx?|txt|csv)$/i.test(fileName)) detectedType = 'document';
    }

    const newAttachment = {
      id: `att_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      name: fileName,
      url: fileUrl,
      sizeBytes: stat.size,
      fileType: detectedType,
      createdAt: new Date().toISOString()
    };

    const accessToken = await getGoogleAccessToken();
    const collection = cleanType === 'client' ? 'clients' : 'leads';

    const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?pageSize=100`;
    const listData = await fetchFirestore(listUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });

    let targetDoc = null;
    for (const doc of (listData.documents || [])) {
      const f = parseFirestoreDoc(doc);
      if (f.id === entityId || doc.name.endsWith(`/${entityId}`)) {
        targetDoc = doc;
        break;
      }
    }

    if (targetDoc) {
      const parsed = parseFirestoreDoc(targetDoc);
      const currentAtts = parsed.noteAttachments || [];
      const updatedAtts = [...currentAtts, newAttachment];

      await fetchFirestore(`https://firestore.googleapis.com/v1/${targetDoc.name}?updateMask.fieldPaths=noteAttachments`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            noteAttachments: toFirestoreValue(updatedAtts)
          }
        })
      });
    }

    res.json({ success: true, attachment: newAttachment });
  } catch (err) {
    console.error('Note attachment upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/notes/:entityType/:entityId/attachment/:attachmentId
app.delete('/api/admin/notes/:entityType/:entityId/attachment/:attachmentId', verifyAdminToken, async (req, res) => {
  const { entityType, entityId, attachmentId } = req.params;
  try {
    const cleanType = entityType === 'client' ? 'client' : 'lead';
    const accessToken = await getGoogleAccessToken();
    const collection = cleanType === 'client' ? 'clients' : 'leads';

    const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?pageSize=100`;
    const listData = await fetchFirestore(listUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });

    let targetDoc = null;
    for (const doc of (listData.documents || [])) {
      const f = parseFirestoreDoc(doc);
      if (f.id === entityId || doc.name.endsWith(`/${entityId}`)) {
        targetDoc = doc;
        break;
      }
    }

    if (targetDoc) {
      const parsed = parseFirestoreDoc(targetDoc);
      const currentAtts = parsed.noteAttachments || [];
      const toDelete = currentAtts.find(a => a.id === attachmentId);
      const updatedAtts = currentAtts.filter(a => a.id !== attachmentId);

      if (toDelete && toDelete.url) {
        const localPath = path.join(__dirname, 'public', toDelete.url.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          try { fs.unlinkSync(localPath); } catch (_e) {}
        }
      }

      await fetchFirestore(`https://firestore.googleapis.com/v1/${targetDoc.name}?updateMask.fieldPaths=noteAttachments`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            noteAttachments: toFirestoreValue(updatedAtts)
          }
        })
      });
    }

    res.json({ success: true });
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
    let associatedLeadId = null;
    for (const doc of (clientsData.documents || [])) {
      const docId = doc.name.split('/').pop();
      const f = parseFirestoreDoc(doc);
      if (docId === id || f.id === id) {
        clientDocPath = doc.name;
        associatedLeadId = f.leadId;
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

    // Limpar resquícios na coleção de leads e hunter_leads se existirem
    try {
      const targetId = associatedLeadId || id;
      const foundLead = await findLeadDoc(accessToken, targetId);
      if (foundLead) {
        await fetchFirestore(`https://firestore.googleapis.com/v1/${foundLead.docPath}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
      }
    } catch (cleanErr) {
      console.warn('Aviso: falha ao limpar lead associado ao excluir cliente:', cleanErr.message);
    }

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
    let clientInfo = { company: '', name: '', url: baseUrl, searchTerms: [] };
    try {
      const accessToken = await getGoogleAccessToken();
      const clientsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/clients?pageSize=100`;
      const clientsData = await fetchFirestore(clientsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });

      for (const doc of (clientsData.documents || [])) {
        const docId = doc.name.split('/').pop();
        const f = doc.fields || {};
        if (docId === clientId || f.id?.stringValue === clientId) {
          clientInfo = {
            company: f.company?.stringValue || '',
            name: f.name?.stringValue || '',
            url: f.url?.stringValue || baseUrl,
            searchTerms: (f.searchTerms?.arrayValue?.values || []).map(v => v.stringValue).filter(Boolean),
          };
          break;
        }
      }
    } catch (e) {}

    let result = {};
    // Função de persistência do resultado no Firestore para o cliente
    const saveAgentResultToFirestore = async (diagnosticPatch, createNew = false) => {
      const accessToken = await getGoogleAccessToken();
      const diagsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=100`;
      const diagsData = await fetchFirestore(diagsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });

      let latestDiagDoc = null;
      let latestDiagDate = 0;

      if (!createNew) {
        for (const doc of (diagsData.documents || [])) {
          const f = doc.fields || {};
          const docClientId = f.clientId?.stringValue;
          const docLeadId = f.leadId?.stringValue;
          if (docClientId === clientId || docLeadId === clientId || doc.name.split('/').pop() === clientId) {
            const genAt = f.generatedAt?.stringValue ? new Date(f.generatedAt.stringValue).getTime() : 0;
            if (!latestDiagDoc || genAt > latestDiagDate) {
              latestDiagDoc = doc;
              latestDiagDate = genAt;
            }
          }
        }
      }

      if (latestDiagDoc && !createNew) {
        // Atualizar diagnóstico mais recente existente via PATCH
        const fields = {};
        const updateMaskPaths = [];
        const patchData = { ...diagnosticPatch, generatedAt: new Date().toISOString() };
        for (const [k, v] of Object.entries(patchData)) {
          fields[k] = toFirestoreValue(v);
          updateMaskPaths.push(`updateMask.fieldPaths=${encodeURIComponent(k)}`);
        }
        const patchUrl = `https://firestore.googleapis.com/v1/${latestDiagDoc.name}?${updateMaskPaths.join('&')}`;
        await fetchFirestore(patchUrl, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        });
      } else {
        // Criar NOVO documento de diagnóstico para este cliente (novo marco temporal na linha do tempo)
        const newDiagId = `diag_${clientId}_${Date.now()}`;
        const fullDiag = {
          id: newDiagId,
          clientId,
          leadId: clientId,
          clientUrl: baseUrl,
          generatedAt: new Date().toISOString(),
          ...diagnosticPatch,
        };
        const fields = {};
        for (const [k, v] of Object.entries(fullDiag)) {
          fields[k] = toFirestoreValue(v);
        }
        await fetchFirestore(diagsUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        });
      }

      // Se o patch inclui overallGeoScore, atualizar o histórico do cliente no doc de clientes
      if (diagnosticPatch.overallGeoScore !== undefined) {
        const clientsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/clients?pageSize=100`;
        const clientsData = await fetchFirestore(clientsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        let clientDocName = null;
        let existingGeoHistory = [];

        for (const doc of (clientsData.documents || [])) {
          const docId = doc.name.split('/').pop();
          const f = doc.fields || {};
          if (docId === clientId || f.id?.stringValue === clientId) {
            clientDocName = doc.name;
            if (f.geoScoreHistory?.arrayValue?.values) {
              existingGeoHistory = f.geoScoreHistory.arrayValue.values.map(v => {
                const m = v.mapValue?.fields || {};
                return {
                  date: m.date?.stringValue || new Date().toISOString(),
                  score: m.score?.integerValue ? parseInt(m.score.integerValue, 10) : (m.score?.doubleValue || 0)
                };
              });
            }
            break;
          }
        }

        if (clientDocName) {
          const newScore = Math.round(diagnosticPatch.overallGeoScore);
          const newHistoryItem = { date: new Date().toISOString(), score: newScore };
          const updatedHistory = [...existingGeoHistory, newHistoryItem];

          const fields = {
            geoScoreHistory: toFirestoreValue(updatedHistory),
            geoScore: { integerValue: String(newScore) },
            latestGeoScore: { integerValue: String(newScore) },
          };
          const updateMask = 'updateMask.fieldPaths=geoScoreHistory&updateMask.fieldPaths=geoScore&updateMask.fieldPaths=latestGeoScore';
          await fetchFirestore(`https://firestore.googleapis.com/v1/${clientDocName}?${updateMask}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields }),
          });
        }
      }
    };

        switch (agentName) {
          case 'gatekeeper': {
            const pageSpeedKey = process.env.GOOGLE_API_KEY || '';
            result = await runGatekeeperAgent(baseUrl, htmlContent, pageSpeedKey);
            result.recommendedRobotsTxt = generateRobotsTxt(domain, result.robotsTxtAllowAiBots);
            await saveAgentResultToFirestore({ gatekeeperStatus: result });
            break;
          }
          case 'metadata': {
            result = await runMetadataAgent(htmlContent, domain);
            let existingScore = null;
            try {
              const accessToken = await getGoogleAccessToken();
              const diagsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/diagnostics?pageSize=100`;
              const diagsRes = await fetch(diagsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
              const diagsData = await diagsRes.json();
              for (const doc of (diagsData.documents || [])) {
                const f = doc.fields || {};
                if (f.clientId?.stringValue === clientId || doc.name.split('/').pop() === clientId) {
                  existingScore = f.overallGeoScore?.integerValue !== undefined
                    ? parseInt(f.overallGeoScore.integerValue, 10)
                    : (f.overallGeoScore?.doubleValue ?? null);
                  break;
                }
              }
            } catch (e) {}
            result.llmsTxt = generateLlmsTxtContent(clientInfo, { overallGeoScore: existingScore }, htmlContent);
            result.generatedJsonLd = generateJsonLdSchema(clientInfo, domain, htmlContent);
            await saveAgentResultToFirestore({ metadataAnalysis: result });
            break;
          }
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
            result = await runIntentAgent(url, htmlContent, key, clientInfo.searchTerms);
            await saveAgentResultToFirestore({ visibilityBenchmarking: result });
            break;
          }
          case 'checklist_architect': {
            const key = process.env.OPENROUTER_API_KEY || '';
            const pageSpeedKey = process.env.GOOGLE_API_KEY || '';
            const [gk, md, ct, sem, off, seo] = await Promise.all([
              runGatekeeperAgent(baseUrl, htmlContent, pageSpeedKey),
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
            const pageSpeedKey = process.env.GOOGLE_API_KEY || '';
            const [gk, md, ct, sem, off, seo] = await Promise.all([
              runGatekeeperAgent(baseUrl, htmlContent, pageSpeedKey),
              runMetadataAgent(htmlContent, domain),
              runContentAgent(htmlContent),
              runSemanticExplorerAgent(baseUrl, htmlContent, key),
              runOffPageEntityAgent(baseUrl, htmlContent, key),
              runSeoOptimizerAgent(baseUrl, htmlContent),
            ]);
            const vis = await runIntentAgent(url, htmlContent, key, clientInfo.searchTerms);
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
            }, true);

            // Salvar pasta de auditoria e prints para o cliente
            await saveAuditArtifacts('client', clientId, { id: clientId, url: baseUrl, company: clientInfo.company, name: clientInfo.name }, { clientUrl: baseUrl, overallGeoScore: score, gatekeeperStatus: gk, metadataAnalysis: md, contentReview: ct, visibilityBenchmarking: vis, seoAnalysis: seo, semanticAnalysis: sem, offpageAnalysis: off, checklist: chk, actionItemsPriorityList: actions, generatedAt: new Date().toISOString() });

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

    // Busca o leadId ORIGINAL no doc do cliente — derivar de clientId.split('_') quebra porque
    // o leadId também contém underscores (formato lead_<timestamp>_<hex>)
    const clientsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/clients?pageSize=100`;
    const clientsData = await fetchFirestore(clientsUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    let originalLeadId = null;
    for (const doc of (clientsData.documents || [])) {
      const docId = doc.name.split('/').pop();
      const f = doc.fields || {};
      if (docId === clientId || f.id?.stringValue === clientId) {
        originalLeadId = f.leadId?.stringValue || null;
        break;
      }
    }

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

    const clientDiagnostics = [];

    for (const doc of (data.documents || [])) {
      const diag = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        diag[k] = fromFirestoreValue(v);
      }
      // Considera diagnósticos indexados por clientId (gerados via runAgentForClient) e
      // diagnósticos indexados pelo leadId original (o diagnóstico inicial, feito antes da conversão)
      if (diag.clientId === clientId || diag.leadId === clientId || (originalLeadId && diag.leadId === originalLeadId)) {
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
  // Não injetamos dados fictícios — lista começa vazia
  return [];
}

// Busca um lead pelo id em ambas as coleções unificadas (leads = LP, hunter_leads = Lead Hunter)
async function findLeadDoc(accessToken, leadId) {
  const collections = ['leads', 'hunter_leads'];
  const results = await Promise.all(collections.map(collection => {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?pageSize=100`;
    return fetchFirestore(url, { headers: { 'Authorization': `Bearer ${accessToken}` } }).catch(() => ({ documents: [] }));
  }));

  for (let i = 0; i < collections.length; i++) {
    for (const doc of (results[i].documents || [])) {
      const docId = doc.name.split('/').pop();
      const f = doc.fields || {};
      if (docId === leadId || f.id?.stringValue === leadId) {
        return { docPath: doc.name, collection: collections[i], fields: parseFirestoreDoc(doc) };
      }
    }
  }
  return null;
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

// Normaliza texto para comparação de localização, removendo acentos e caixa (ex: "São Paulo" -> "sao paulo")
function normalizeLocationText(text) {
  return (text || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Formatação de telefone com DDD do Brasil garantido (ex: (11) 99999-8888 ou (11) 3333-4444)
function formatBrazilianPhone(rawPhone, siteText = '') {
  if (!rawPhone) return '';

  let digits = String(rawPhone).replace(/\D/g, '');

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const numDdd = parseInt(ddd, 10);
    if (numDdd >= 11 && numDdd <= 99) {
      return `(${ddd}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
  }

  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const numDdd = parseInt(ddd, 10);
    if (numDdd >= 11 && numDdd <= 99) {
      return `(${ddd}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
  }

  if (digits.startsWith('0800') || digits.startsWith('0300')) {
    if (digits.length === 11) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
  }

  if ((digits.length === 8 || digits.length === 9) && siteText) {
    const dddMatch = siteText.match(/(?:\(?([1-9]{2})\)?[\s\-.]?)(?:9\d{4}|\d{4})/);
    if (dddMatch) {
      const foundDDD = dddMatch[1];
      if (digits.length === 9) return `(${foundDDD}) ${digits.slice(0, 5)}-${digits.slice(5)}`;
      if (digits.length === 8) return `(${foundDDD}) ${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
  }

  return '';
}

// Refinamento de nicho baseado nas palavras-chave do site para EVITAR classificações genéricas tipo "SaaS" ou "Geral"
function refineNiche(extractedNiche, title = '', metaDesc = '', cleanText = '') {
  const combinedText = `${title} ${metaDesc} ${cleanText}`.toLowerCase();

  const isGenericOrSaas = !extractedNiche || 
    /^(saas|geral|tecnologia|software|outros|desconhecido|empresa|site|b2b|b2c)$/i.test(extractedNiche.trim());

  if (isGenericOrSaas) {
    if (/clínica|médic|saúde|odontol|dentista|hospital|pediatra|dermatol|psicolog|oftalmo|fisioter|psiquiat/i.test(combinedText)) return 'Clínica Médica / Saúde';
    if (/advoc|advogad|jurídic|direito|lei|tributár|trabalhista|previdenci|cível/i.test(combinedText)) return 'Advocacia / Jurídico';
    if (/contabil|contador|fiscal|tributár|escritório de contab|perícia fiscal/i.test(combinedText)) return 'Contabilidade / Audit';
    if (/imobiliár|imóve|corretor|aluguel|venda de imóve|residencial|condomí|apartamento/i.test(combinedText)) return 'Imobiliária / Corretores';
    if (/construç|engenhar|obra|reforma|arquitet|empreendimento|infraestrutura/i.test(combinedText)) return 'Construção Civil & Engenharia';
    if (/energia solar|fotovoltaic|painel solar|inversor solar|geração distribuída/i.test(combinedText)) return 'Energia Solar / Renováveis';
    if (/e-commerce|loja virtual|comprar online|comércio eletrônico|vestuário|calcado/i.test(combinedText)) return 'E-commerce / Varejo';
    if (/estética|beleza|salão|barbearia|cosmétic|depilação|spa|harmonização/i.test(combinedText)) return 'Estética & Bem-Estar';
    if (/restaurante|pizzaria|hambúrguer|gastronom|comida|delivery|bistrô|churrascaria/i.test(combinedText)) return 'Gastronomia & Restaurantes';
    if (/escola|colégio|curso|faculdade|educaç|ensino|treinamento|vestibular/i.test(combinedText)) return 'Educação / Cursos';
    if (/logístic|transporte|frete|cargas|armazenagem|expedição/i.test(combinedText)) return 'Logística & Transporte';
    if (/pousada|hotel|turismo|viag|resort|hospedagem/i.test(combinedText)) return 'Turismo & Hotelaria';
    if (/oficina|mecánic|funilar|auto|veículo|mecanic|peças automot/i.test(combinedText)) return 'Automotivo / Oficina';
    if (/agência|marketing|design|publicidad|propaganda|branding|social media/i.test(combinedText)) return 'Marketing & Comunicação';
    if (/consultor|assessoria|gestão de negócios|planejamento estratégico/i.test(combinedText)) return 'Consultoria / Gestão';
    if (/indústria|fabric|manufatur|usinagem|equipamentos industriais/i.test(combinedText)) return 'Indústria & Manufatura';
    if (/seguranç|alarme|monitoramento|cftv|portaria/i.test(combinedText)) return 'Segurança Patrimonial';
    if (/móve|marcenaria|decoraç|design de interiores/i.test(combinedText)) return 'Móveis & Decoração';
  }

  if (extractedNiche && !isGenericOrSaas) {
    return extractedNiche.trim();
  }

  return 'Serviços & Negócios';
}

// Função utilitária para varredura profunda de e-mail, telefone e LinkedIn no site da empresa
async function extractLeadContactFromSite(domain) {
  let email = '';
  let phone = '';
  let linkedinUrl = '';
  let accumulatedText = '';

  if (!domain) return { email, phone, linkedinUrl, accumulatedText };

  const cleanDom = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/^www\./i, '');
  const pagesToCrawl = [
    `https://${cleanDom}`,
    `https://${cleanDom}/contato`,
    `https://${cleanDom}/fale-conosco`,
    `https://${cleanDom}/sobre`,
    `https://${cleanDom}/contact`
  ];

  for (const pageUrl of pagesToCrawl) {
    try {
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; GoogleBot/2.1)'
        },
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok) {
        const html = await res.text();
        accumulatedText += `\n --- PAGE (${pageUrl}) ---\n` + html.replace(/<[^>]+>/g, ' ');

        // 1. E-mail via href="mailto:..."
        if (!email) {
          const mailtoMatch = html.match(/href="mailto:([^"?#\s]+)"/i);
          if (mailtoMatch) {
            const rawMail = mailtoMatch[1].toLowerCase().trim();
            const isInvalid = rawMail.includes('wix.com') || rawMail.includes('example.com') || rawMail.includes('sentry.io') || rawMail.endsWith('.png') || rawMail.endsWith('.jpg');
            if (!isInvalid) email = rawMail;
          }
        }

        // 2. E-mail via Regex no HTML bruto
        if (!email) {
          const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
          const matches = html.match(emailRegex) || [];
          for (const m of matches) {
            const cleanM = m.toLowerCase();
            const isInvalid = cleanM.endsWith('.png') || cleanM.endsWith('.jpg') || cleanM.endsWith('.svg') || cleanM.endsWith('.webp') || cleanM.includes('example') || cleanM.includes('domain') || cleanM.includes('schema.org') || cleanM.includes('sentry') || cleanM.includes('wixpress') || cleanM.includes('bootstrap');
            if (!isInvalid) {
              email = cleanM;
              break;
            }
          }
        }

        // 3. Telefone via WhatsApp link (wa.me, api.whatsapp.com, web.whatsapp.com)
        if (!phone) {
          const waMatch = html.match(/href="https?:\/\/(?:wa\.me|api\.whatsapp\.com\/send\?phone=|web\.whatsapp\.com\/send\?phone=)(\d+)"/i);
          if (waMatch) {
            phone = formatBrazilianPhone(waMatch[1], html);
          }
        }

        // 4. Telefone via href="tel:..."
        if (!phone) {
          const telMatch = html.match(/href="tel:([^"]+)"/i);
          if (telMatch) {
            phone = formatBrazilianPhone(telMatch[1], html);
          }
        }

        // 5. Telefone via microdados itemprop="telephone"
        if (!phone) {
          const itemPropMatch = html.match(/itemprop="telephone"[^>]*>([^<]+)</i);
          if (itemPropMatch) {
            phone = formatBrazilianPhone(itemPropMatch[1], html);
          }
        }

        // 6. Telefone via Regex no HTML bruto (garantindo DDD)
        if (!phone) {
          const rawPhoneMatches = html.match(/(?:\+?55[\s.\-]?)?(?:\(?([1-9]{2})\)?[\s.\-]?)?(?:9?\d{4}[\s.\-]?\d{4}|\d{4}[\s.\-]?\d{4})/g) || [];
          for (const rawP of rawPhoneMatches) {
            const formatted = formatBrazilianPhone(rawP, html);
            if (formatted) {
              phone = formatted;
              break;
            }
          }
        }

        // 7. LinkedIn via URL no HTML
        if (!linkedinUrl) {
          const linkedinMatch = html.match(/href="(https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[^"?#\s]+)"/i);
          if (linkedinMatch) {
            linkedinUrl = linkedinMatch[1];
          }
        }
      }
    } catch (_err) {
      // Ignora timeouts / 404 de subpáginas
    }
  }

  return { email, phone, linkedinUrl, accumulatedText };
}

// Agente Extrator de Dados de Lead via IA (Gemini 2.5 Flash)
async function extractLeadInfoWithAI(url, htmlContent, type = 'website') {
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  if (!geminiApiKey || !htmlContent) {
    return null;
  }

  try {
    const titleMatch = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const metaDescMatch = htmlContent.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) || htmlContent.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';
    const cleanText = htmlContent
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 5000);

    const systemPrompt = `Você é um agente especialista em inteligência comercial e prospecção B2B (SDR/BDR).
Sua tarefa é analisar o título, descrição meta e texto extraído de uma empresa (${type}: ${url}) e extrair dados comerciais precisos.

Título da Página: "${title}"
Descrição Meta: "${metaDesc}"
Texto Extraído: "${cleanText}"

REGRAS RÍGIDAS DE EXTRAÇÃO:
1. "niche": Identifique o nicho de mercado REAL e ESPECÍFICO da empresa com base no seu ramo de atuação (ex: "Clínica Médica / Saúde", "Advocacia", "Contabilidade", "Imobiliária", "Energia Solar", "E-commerce de Moda", "Construção Civil", "Gastronomia", "Educação", "Estética & Beleza", "Oficina Automotiva", "Consultoria de Vendas", "Agência de Marketing", "Indústria Metalúrgica", etc.).
   CRÍTICO: NUNCA classifique como "SaaS" ou "Tecnologia" a não ser que a empresa seja EXPLICITAMENTE uma plataforma de software vendida como serviço (ex: CRM, ERP online). Se for um negócio físico, prestador de serviço tradicional ou comércio, use o nicho real do segmento! NUNCA use "Geral".
2. "phone": Extraia o telefone de contato principal ou WhatsApp da empresa COM DDD de 2 dígitos (ex: "(11) 99999-8888" ou "(21) 3333-4444").
3. "company": Nome oficial ou fantasia limpo da empresa (sem sufixos como "| Home" ou "- Página Oficial").
4. "contactName": Nome do decisor, sócio, fundador ou diretor se citado, senão "".
5. "contactRole": Cargo do decisor (ex: CEO, Founder, Diretor, Sócio) se identificado, senão "".
6. "email": E-mail oficial de contato se citado.
7. "location": Cidade e Estado da empresa no Brasil (ex: "São Paulo, SP" ou "Rio de Janeiro, RJ").

Retorne APENAS um JSON estrito (sem tags markdown nem explicações) no seguinte formato:
{
  "company": "Nome da empresa",
  "contactName": "",
  "contactRole": "",
  "email": "email@empresa.com",
  "phone": "(11) 99999-8888",
  "linkedinUrl": "",
  "domain": "empresa.com.br",
  "niche": "Nicho Específico Real",
  "location": "Cidade, UF"
}`;

    const payload = {
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000)
    });

    if (res.ok) {
      const data = await res.json();
      const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawReply.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    }
  } catch (err) {
    console.warn('Gemini lead extraction error:', err.message);
  }
  return null;
}


// POST /api/admin/lead-hunter/mine
app.post('/api/admin/lead-hunter/mine', verifyAdminToken, async (req, res) => {
  const { niche, location, targetRole, companySize, limit, source, urls } = req.body;
  const miningSource = source || 'google';
  
  try {
    const accessToken = await getGoogleAccessToken();
    const count = parseInt(limit || '5', 10);
    const effectiveApifyToken = process.env.APIFY_API_TOKEN || '';
    let newLeads = [];
    let apifyErrorMsg = '';

    // ─── 0. FONTE IMPORTAÇÃO POR LISTA DE URLS ────────────────────────────────────
    if (miningSource === 'import') {
      const rawUrls = urls || [];
      let urlList = Array.isArray(rawUrls) ? rawUrls : String(rawUrls).split('\n');
      urlList = urlList.map(u => u.trim()).filter(u => u && !u.startsWith('#'));

      if (urlList.length === 0) {
        return res.status(400).json({ error: 'Nenhuma URL válida fornecida para importação.' });
      }

      console.log(`📥 Importando e varrendo ${urlList.length} URLs fornecidas...`);

      for (const itemUrl of urlList) {
        try {
          let targetUrl = itemUrl.startsWith('http://') || itemUrl.startsWith('https://') ? itemUrl : `https://${itemUrl}`;
          let parsedUrl;
          try {
            parsedUrl = new URL(targetUrl);
          } catch (_e) {
            console.warn(`URL inválida ignorada na importação: ${itemUrl}`);
            continue;
          }

          const rawHost = parsedUrl.hostname.toLowerCase();
          const cleanDom = rawHost.replace(/^www\./i, '');
          const isLinkedInProfile = /linkedin\.com\/in\//i.test(targetUrl);
          const isLinkedInCompany = /linkedin\.com\/company\//i.test(targetUrl);
          const isLinkedIn = isLinkedInProfile || isLinkedInCompany;

          let htmlContent = '';
          try {
            const pageRes = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
              },
              signal: AbortSignal.timeout(8000)
            });
            if (pageRes.ok) {
              htmlContent = await pageRes.text();
            }
          } catch (_fetchErr) {
            // Ignora timeout/fetch error e segue com fallbacks
          }

          // 1. Extração profunda por Regex se for site corporativo
          const siteContacts = (!isLinkedIn && cleanDom)
            ? await extractLeadContactFromSite(cleanDom)
            : { email: '', phone: '', linkedinUrl: '', accumulatedText: '' };

          // 2. Extração via Agente IA (Gemini 2.5 Flash) com conteúdo consolidado das subpáginas
          const combinedContent = `${htmlContent}\n${siteContacts.accumulatedText || ''}`;
          const aiExtracted = await extractLeadInfoWithAI(targetUrl, combinedContent, isLinkedInProfile ? 'linkedin_profile' : isLinkedInCompany ? 'linkedin_company' : 'website');

          // 3. Consolidação dos dados extraídos com fallbacks inteligentes
          let companyName = aiExtracted?.company || '';
          if (!companyName) {
            if (isLinkedInProfile) {
              const titleMatch = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
              companyName = titleMatch ? titleMatch[1].split('|')[0].split('-')[0].trim() : 'Perfil LinkedIn';
            } else {
              const domTitle = cleanDom.split('.')[0];
              companyName = domTitle.charAt(0).toUpperCase() + domTitle.slice(1);
            }
          }
          companyName = companyName.split('|')[0].split(' - ')[0].trim();

          let contactName = aiExtracted?.contactName || '';
          if (!contactName && isLinkedInProfile) {
            const titleMatch = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            if (titleMatch) {
              contactName = titleMatch[1].split('-')[0].split('|')[0].trim();
            }
          }

          let contactRole = aiExtracted?.contactRole || targetRole || 'Diretor / CEO';
          let finalEmail = siteContacts.email || aiExtracted?.email || '';
          
          // Garante telefone no formato brasileiro com DDD
          let rawPhone = siteContacts.phone || aiExtracted?.phone || '';
          let finalPhone = formatBrazilianPhone(rawPhone, combinedContent);

          let finalLinkedin = isLinkedInProfile ? targetUrl : (siteContacts.linkedinUrl || aiExtracted?.linkedinUrl || '');
          
          // Garante nicho preciso sem SaaS/Geral delirante
          const tMatch = combinedContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          const mMatch = combinedContent.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) || combinedContent.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i);
          const tStr = tMatch ? tMatch[1] : '';
          const mStr = mMatch ? mMatch[1] : '';
          
          let detectedNiche = refineNiche(aiExtracted?.niche, tStr, mStr, combinedContent);
          let finalNiche = (niche && niche !== 'Geral' && niche !== 'SaaS') ? niche : detectedNiche;

          let finalLocation = aiExtracted?.location || location || 'Brasil';
          let finalDomain = aiExtracted?.domain || cleanDom;

          const leadObj = {
            id: `import_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
            domain: finalDomain,
            website: targetUrl,
            company: companyName,
            contactName: contactName,
            contactRole: contactRole,
            linkedinUrl: finalLinkedin,
            email: finalEmail,
            phone: finalPhone,
            address: finalLocation,
            niche: finalNiche,
            location: finalLocation,
            companySize: companySize || '20-200 funcionários',
            source: 'import',
            status: 'unscanned',
            createdAt: new Date().toISOString()
          };

          newLeads.push(leadObj);
        } catch (itemErr) {
          console.warn(`Erro ao processar URL ${itemUrl}:`, itemErr.message);
        }
      }
    }

    // ─── 1. FONTE GOOGLE / MAPS (Locais e Empresas Reais Validadas) ─────────────────
    if (miningSource === 'google') {
      console.log(`🌐 Buscando empresas reais para [${niche}] em [${location}]...`);

      // ── TENTATIVA A: Apify Google Maps Actor (Google Meu Negócio / Places Oficial) ──
      if (effectiveApifyToken) {
        try {
          console.log(`📍 Disparando Apify Google Maps Actor (compass/crawler-google-places)...`);
          const mapQuery = `${niche || 'Empresas'} ${location || 'Brasil'}`.trim();

          const mapsRes = await fetch(
            `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${effectiveApifyToken}&timeout=120&memory=512`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                searchStringsArray: [mapQuery, `${niche} em ${location}`],
                locationQuery: `${location}, Brasil`,
                maxCrawledPlacesPerSearch: Math.min(Math.max(count * 4, 20), 60),
                language: 'pt-BR'
              })
            }
          );

          if (mapsRes.ok) {
            const places = await mapsRes.json();
            const extractedDomains = new Set();
            const extractedPlaceKeys = new Set();

            if (Array.isArray(places) && places.length > 0) {
              for (const place of places) {
                const placeTitle = place.title || place.name || '';
                if (!placeTitle) continue;

                // Dedup por lugar (título + endereço), já que muitos locais não têm site/domínio próprio
                const placeKey = `${placeTitle.toLowerCase()}|${(place.address || '').toLowerCase()}`;
                if (extractedPlaceKeys.has(placeKey)) continue;
                extractedPlaceKeys.add(placeKey);

                const rawWebsite = place.website || place.url || '';
                // fullUrl preserva o path completo (ex: instagram.com/setebarbasbarber); dom fica só com o hostname
                const fullUrl = rawWebsite && !/^https?:\/\//i.test(rawWebsite) ? `https://${rawWebsite}` : rawWebsite;
                let dom = rawWebsite
                  ? rawWebsite.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/^www\./i, '').toLowerCase()
                  : '';

                // Domínios de agregadores/portais que não representam o site oficial do negócio
                const aggregatorStopDomains = [
                  'google.com', 'maps.google', 'youtube.com', 'twitter.com', 'x.com',
                  'tripadvisor.com', 'doctoralia.com.br', 'guiamais.com.br', 'telelistas.net',
                  'listamais.com.br', 'acharesteticas.com.br', 'jusbrasil.com.br', 'reclameaqui.com.br'
                ];
                if (dom && aggregatorStopDomains.some(sd => dom.includes(sd))) continue;
                if (dom && extractedDomains.has(dom)) continue;
                if (dom) extractedDomains.add(dom);

                // Redes sociais (Instagram/Facebook/WhatsApp) contam como "site" válido para negócios
                // locais sem domínio próprio — não devem ser descartadas, apenas não usadas no crawler de e-mail.
                const isSocialOnly = !!dom && (dom.includes('instagram.com') || dom.includes('facebook.com') || dom.includes('whatsapp.com'));

                // Formata endereço e contato real do Google Maps
                const realPhone = place.phone || place.phoneUnformatted || '';
                const realAddress = place.address || place.street || `${location}, Brasil`;

                // ── Varredura profunda de e-mail e contatos diretamente no site oficial (pula redes sociais) ──
                const contacts = (dom && !isSocialOnly) ? await extractLeadContactFromSite(dom) : { email: '', phone: '', linkedinUrl: '' };

                const leadObj = {
                  id: `google_maps_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
                  domain: dom,
                  website: fullUrl || '',
                  isSocialOnly,
                  company: placeTitle,
                  contactName: '',
                  contactRole: targetRole || 'Diretor / CEO',
                  linkedinUrl: place.socialMediaProfiles?.linkedIn || contacts.linkedinUrl || '',
                  email: contacts.email || '',
                  phone: formatBrazilianPhone(realPhone || contacts.phone || ''),
                  address: realAddress,
                  niche: (niche && niche !== 'Geral' && niche !== 'SaaS') ? niche : refineNiche(niche, placeTitle, realAddress, placeTitle),
                  location: location || 'Brasil',
                  companySize: companySize || '10-50 funcionários',
                  source: 'google',
                  status: 'unscanned',
                  createdAt: new Date().toISOString()
                };
                newLeads.push(leadObj);
                if (newLeads.length >= count) break;
              }
            }
          }
        } catch (mapsErr) {
          console.warn('Google Maps Apify Actor warning:', mapsErr.message);
        }
      }

      // ── TENTATIVA B: Filtro Orgânico Estrito (Filtrando agregadores, listas e locais desalinhados) ──
      if (newLeads.length < count) {
        try {
          console.log(`🔎 Complementando via Busca Orgânica Estrita para [${niche}] em [${location}]...`);
          const queryText = `site oficial "${niche || 'empresa'}" "${location || 'Brasil'}" contato`;
          
          const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(queryText)}`;
          const searchRes = await fetch(searchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });

          if (searchRes.ok) {
            const html = await searchRes.text();
            const extractedDomains = new Set(newLeads.map(l => l.domain));
            
            const titleRegex = /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
            let match;

            while ((match = titleRegex.exec(html)) !== null && newLeads.length < count) {
              let rawUrl = match[1] || '';
              let rawTitle = match[2] || '';
              
              if (rawUrl.includes('uddg=')) {
                const urlMatch = rawUrl.match(/uddg=([^&]+)/);
                if (urlMatch) rawUrl = decodeURIComponent(urlMatch[1]);
              }

              let dom = rawUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/^www\./i, '').toLowerCase();
              
              // 1. Filtro rigoroso de portais de lista/agregadores/blogs
              const stopDomains = [
                'duckduckgo', 'google', 'facebook', 'youtube', 'instagram', 'twitter', 'x.com', 
                'wikipedia', 'reclameaqui', 'jusbrasil', 'glassdoor', 'g2.com', 'clutch.co', 
                'medium.com', 'linkedin', 'listamais', 'acharesteticas', 'doctoralia', 'telelistas', 
                'guiamais', 'tripadvisor', 'saasbr', 'catracalivre', 'eblog', 'blog', 'noticias',
                'g1.globo', 'uol.com', 'terra.com'
              ];
              const isStopDomain = stopDomains.some(sd => dom.includes(sd));
              if (isStopDomain || extractedDomains.has(dom)) continue;

              // 2. Filtro rigoroso no título (rejeita páginas que são coletâneas/listas)
              const cleanTitleLower = rawTitle.replace(/<[^>]+>/g, '').toLowerCase();
              const isListicleTitle = [
                'lista', 'melhores', 'top 10', 'top 5', 'top 20', 'ranking', 'empresas de',
                'database', 'carreiras', 'vagas', 'descubra', 'guia', 'catalogo', 'encontre',
                'coletânea', 'opções de', 'diretório'
              ].some(word => cleanTitleLower.includes(word));

              if (isListicleTitle) continue;

              let cleanTitle = rawTitle.replace(/<[^>]+>/g, '').split('-')[0].split('|')[0].split(':')[0].trim();
              if (!cleanTitle || ['home', 'início', 'contato', 'são paulo', 'brasil', 'faça seu agendamento'].includes(cleanTitle.toLowerCase())) {
                cleanTitle = dom.split('.')[0].replace(/[^a-zA-Z0-9]/g, ' ');
                cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
              }

              // ── 3. Varredura profunda de e-mail e contatos ──
              const contacts = await extractLeadContactFromSite(dom);
              let hasLocationMatch = false;
              let siteHtmlForAddress = '';

              try {
                const siteRes = await fetch(`https://${dom}`, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GoogleBot/2.1)' },
                  signal: AbortSignal.timeout(6000)
                });

                if (siteRes.ok) {
                  const siteHtml = await siteRes.text();
                  siteHtmlForAddress = siteHtml;
                  const siteText = normalizeLocationText(siteHtml.replace(/<[^>]+>/g, ' '));

                  // Valida se o local pesquisado é mencionado no site do lead (ex: "Ilhabela"),
                  // tolerando acentos, maiúsculas/minúsculas e "Ilha Bela" vs "Ilhabela"
                  const locTerm = normalizeLocationText(location || '');
                  const locTermNoSpaces = locTerm.replace(/\s+/g, '');
                  const domNorm = normalizeLocationText(dom);
                  if (
                    !locTerm || locTerm === 'brasil' || locTerm === 'brazil' ||
                    siteText.includes(locTerm) || siteText.replace(/\s+/g, '').includes(locTermNoSpaces) ||
                    domNorm.includes(locTerm) || domNorm.includes(locTermNoSpaces)
                  ) {
                    hasLocationMatch = true;
                  }
                }
              } catch (_siteErr) {
                // Site lento/offline/bloqueando bots: não há como validar o texto, então não descarta
                // por engano — apenas evita afirmar uma correspondência que não foi confirmada.
                hasLocationMatch = true;
              }

              // Se a localização não bater e não veio de timeout/erro, descarta (evita "portais" fora do local)
              if (!hasLocationMatch && location && location.toLowerCase() !== 'brasil') continue;

              extractedDomains.add(dom);

              // Tenta extrair um endereço real do site (padrão de logradouro BR); se não achar, usa o termo buscado como aproximação
              let extractedAddress = '';
              if (siteHtmlForAddress) {
                const addressMatch = siteHtmlForAddress
                  .replace(/<[^>]+>/g, ' ')
                  .match(/(?:Rua|Av\.|Avenida|Alameda|Travessa|Praça)[^,\n<]{5,80},?[^\n<]{0,60}\d{5}-?\d{3}?/i);
                if (addressMatch) extractedAddress = addressMatch[0].replace(/\s+/g, ' ').trim();
              }

              const leadObj = {
                id: `google_native_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
                domain: dom,
                company: cleanTitle,
                contactName: '',
                contactRole: targetRole || 'Diretor / CEO',
                linkedinUrl: contacts.linkedinUrl || '',
                email: contacts.email || '',
                phone: contacts.phone || '',
                address: extractedAddress || `${location || 'Brasil'} (aproximado)`,
                niche: niche || 'Geral',
                location: location || 'Brasil',
                companySize: companySize || '10-50 funcionários',
                source: 'google',
                status: 'unscanned',
                createdAt: new Date().toISOString()
              };
              newLeads.push(leadObj);
            }
          }
        } catch (gErr) {
          console.warn('Erro na busca orgânica:', gErr.message);
        }
      }
    }

    // ─── 2. FONTE LINKEDIN: harvestapi/linkedin-profile-search (Melhor actor — 35K usuários, sem cookies) ───
    if (miningSource === 'linkedin' || (miningSource === 'auto' && newLeads.length === 0)) {
      if (effectiveApifyToken) {
        try {
          // Trata cargo e nicho para evitar falhas por caracteres especiais tipo "/" ou múltiplos cargos
          const rawRoles = (targetRole || 'CEO').split(/[/,;|]+/).map(r => r.trim()).filter(Boolean);
          const primaryRole = rawRoles[0] || 'CEO';
          const cleanNiche = (niche || 'SaaS').replace(/[/,;|]+/g, ' ').trim();

          // Tenta combinações progressivas de busca para garantir que retorne perfis reais no LinkedIn.
          // Limitado a 2 tentativas: cada chamada ao actor é cobrada (pay-per-event), então mais
          // variações = mais custo por clique de mineração sem ganho proporcional de acerto.
          const searchQueries = [
            `${primaryRole} ${cleanNiche}`.trim(),
            `${cleanNiche}`.trim()
          ].filter((q, idx, arr) => q && arr.indexOf(q) === idx);

          // Normaliza localização sem acentos para compatibilidade com os filtros do LinkedIn (ex: "São Paulo" -> "Sao Paulo")
          const locClean = (location || 'Brazil')
            .replace(/[ãáàâä]/gi, 'a')
            .replace(/[éèêë]/gi, 'e')
            .replace(/[íìîï]/gi, 'i')
            .replace(/[óòôöõ]/gi, 'o')
            .replace(/[úùûü]/gi, 'u')
            .replace(/ç/gi, 'c')
            .trim();

          const locArray = [locClean, 'Brazil'].filter((l, i, a) => l && a.indexOf(l) === i);

          let profiles = [];
          let lastApifyStatus = 200;
          let lastErrText = '';

          for (const queryKw of searchQueries) {
            console.log(`💼 Conectando ao Apify harvestapi/linkedin-profile-search [searchQuery: "${queryKw}"] [locations: "${locArray.join(', ')}"]...`);

            let apifyRes;
            try {
              apifyRes = await fetch(
                `https://api.apify.com/v2/acts/harvestapi~linkedin-profile-search/run-sync-get-dataset-items?token=${effectiveApifyToken}&timeout=120&memory=512`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    searchQuery: queryKw,
                    locations: locArray,
                    maxItems: Math.min(count * 2, 50),
                    profileScraperMode: 'Short'
                  }),
                  signal: AbortSignal.timeout(130000)
                }
              );
            } catch (fetchErr) {
              lastApifyStatus = 0;
              lastErrText = fetchErr.name === 'TimeoutError' ? 'Timeout ao aguardar resposta da Apify (>130s)' : fetchErr.message;
              console.warn(`Apify falha de rede/timeout: ${lastErrText}`);
              break;
            }

            if (apifyRes.ok) {
              const resData = await apifyRes.json();
              if (Array.isArray(resData) && resData.length > 0) {
                profiles = resData;
                break; // Encontrou perfis reais!
              }
            } else if (apifyRes.status === 429) {
              // Rate limit: aguarda um pouco e tenta a próxima variação de query em vez de desistir na hora
              lastApifyStatus = 429;
              lastErrText = await apifyRes.text().catch(() => '');
              console.warn(`Apify rate limit (429), aguardando antes de tentar próxima query...`);
              await new Promise(r => setTimeout(r, 3000));
              continue;
            } else {
              lastApifyStatus = apifyRes.status;
              lastErrText = await apifyRes.text().catch(() => '');
              console.warn(`Apify erro HTTP ${apifyRes.status}: ${lastErrText.slice(0, 300)}`);
              break; // Se deu erro de token/autenticação/status HTTP, interrompe para reportar o erro real
            }
          }

          const extractedLinks = new Set();
          if (Array.isArray(profiles) && profiles.length > 0) {
            for (const p of profiles) {
              // Campos reais do dataset harvestapi/linkedin-profile-search (profileScraperMode "Short"):
              // firstName/lastName (não "fullName"), linkedinUrl (não "profileUrl"), currentPosition (não "currentCompany")
              const realPersonName = p.fullName
                || [p.firstName, p.lastName].filter(Boolean).join(' ')
                || p.name
                || p.title?.split('-')[0]
                || '';
              const realRole = p.headline || p.title || targetRole || 'CEO';
              const realCompany = p.currentPosition?.[0]?.companyName
                || p.currentCompany?.name
                || p.company
                || p.companyName
                || '';
              const linkedinUrl = p.linkedinUrl || p.profileUrl || p.url
                || (p.publicIdentifier ? `https://www.linkedin.com/in/${p.publicIdentifier}` : '');

              if (!linkedinUrl || extractedLinks.has(linkedinUrl)) continue;
              extractedLinks.add(linkedinUrl);

              const domBase = realCompany.toLowerCase().replace(/[^a-z0-9]/g, '');
              const dom = domBase ? `${domBase}.com.br` : '';

              const leadObj = {
                id: `apify_linkedin_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
                domain: dom,
                company: realCompany || 'Empresa LinkedIn',
                contactName: realPersonName || 'Decisor',
                contactRole: realRole,
                linkedinUrl: linkedinUrl,
                photoUrl: p.photoUrl || p.profilePicture || '',
                email: '',
                phone: '',
                address: p.location || location || 'Brasil',
                niche: niche || 'Geral',
                location: location || 'Brasil',
                companySize: companySize || '20-200 funcionários',
                source: 'linkedin',
                status: 'unscanned',
                createdAt: new Date().toISOString()
              };
              newLeads.push(leadObj);
              if (newLeads.length >= count) break;
            }
          }

          if (newLeads.length === 0) {
            if (lastApifyStatus === 401 || lastApifyStatus === 403) {
              apifyErrorMsg = `Apify recusou a autenticação (erro ${lastApifyStatus}). O APIFY_API_TOKEN configurado no servidor é inválido, expirou ou não tem permissão para rodar o actor harvestapi/linkedin-profile-search.`;
            } else if (lastApifyStatus === 402 || /credit|insufficient.*usage|not enough/i.test(lastErrText)) {
              apifyErrorMsg = `Créditos da conta Apify esgotados (erro ${lastApifyStatus}). Verifique o saldo/plano da conta Apify vinculada ao APIFY_API_TOKEN.`;
            } else if (lastApifyStatus === 429) {
              apifyErrorMsg = `Apify aplicou rate limit (429) em todas as tentativas. Aguarde alguns minutos e tente novamente.`;
            } else if (lastApifyStatus !== 200) {
              apifyErrorMsg = `Apify API erro ${lastApifyStatus}: ${lastErrText.slice(0, 200)}. Verifique a chave APIFY_API_TOKEN no servidor.`;
            } else {
              apifyErrorMsg = `Nenhum perfil encontrado no LinkedIn para "${targetRole}" + "${niche}" em "${location}". Tente simplificar os termos.`;
            }
          }
        } catch (apifyErr) {
          apifyErrorMsg = `Erro ao conectar na Apify API: ${apifyErr.message}`;
          console.error(apifyErrorMsg);
        }
      } else {
        apifyErrorMsg = 'Para minerar no LinkedIn, certifique-se de que a variável de ambiente APIFY_API_TOKEN está configurada no servidor (Coolify).';
      }
    }

    // Se o usuário solicitou mineração real com Apify mas o token falhou/está ausente, informa o erro ao invés de simular dados silenciosamente
    if (newLeads.length === 0 && effectiveApifyToken && apifyErrorMsg) {
      return res.status(400).json({ error: apifyErrorMsg });
    }

    // Sem resultado real: retorna erro em vez de gerar dados fictícios
    if (newLeads.length === 0) {
      const msg = miningSource === 'linkedin'
        ? 'Nenhum perfil encontrado no LinkedIn. Verifique se a variável APIFY_API_TOKEN está configurada no servidor e tente novamente com filtros diferentes.'
        : `Nenhuma empresa real encontrada para "${niche}" em "${location}". Tente refinar os filtros (nicho mais específico ou outra localização).`;
      return res.status(400).json({ error: msg });
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
    const pageSpeedKey = process.env.GOOGLE_API_KEY || '';

    // Executa os 6 agentes especialistas em paralelo
    const [gk, md, ct, sem, off, seo] = await Promise.all([
      runGatekeeperAgent(normalizedUrl, htmlContent, pageSpeedKey),
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

// Mapa entre o framework selecionado na UI e as chaves geradas em outreachCopies
const OUTREACH_FRAMEWORK_KEYS = {
  PAS: 'pas',
  BAB: 'bab',
  PASTOR: 'pastor',
  QUEST: 'quest',
  '4Ps': 'ps4',
  FAB: 'fab',
  ACCA: 'acca',
  '4Us': 'us4',
  'Falsa Lógica': 'falsaLogica',
};

// POST /api/admin/lead-hunter/outreach (9 Frameworks de Copywriting Calibrados com Diagnóstico Real e GEO Intent)
app.post('/api/admin/lead-hunter/outreach', verifyAdminToken, async (req, res) => {
  const { leadId, leadData, framework } = req.body;

  let lead = leadData || {};
  let accessToken = null;
  let foundLead = null;
  try {
    accessToken = await getGoogleAccessToken();
    if (leadId) {
      foundLead = await findLeadDoc(accessToken, leadId);
      if (foundLead) {
        // Dados reais do lead têm prioridade sobre o que veio no body
        lead = { ...lead, ...foundLead.fields };
      }
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  // 🔒 TRAVAMENTO DE SEGURANÇA: Exige aprovação dos 14 Termos de Pesquisa Estratégicos (GEO Intent)
  const searchTermsStatus = lead.searchTermsStatus;
  const searchTerms = Array.isArray(lead.searchTerms) ? lead.searchTerms : [];

  if (searchTermsStatus !== 'approved' || searchTerms.length < 10) {
    return res.status(400).json({
      error: 'A geração de copy requer que os 14 Termos de Pesquisa Estratégicos (GEO Intent) tenham sido analisados e aprovados para este lead na Etapa 2.'
    });
  }

  // 🧠 BASE DE CONHECIMENTO DO AGENTE SOBRE O LEAD (Nicho, Visão Geral, Produtos/Serviços e 14 Termos)
  const company = lead.company || 'Empresa';
  const name = lead.contactName || lead.name || 'Decisor';
  const domain = lead.domain || (lead.url ? lead.url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '') : 'site.com.br');
  const competitor = lead.citedCompetitor || 'Concorrente Direto';
  const niche = lead.niche || 'serviços e produtos corporativos';
  const robotsBlocked = lead.aiCrawlersBlocked !== false;
  const score = lead.geoScoreEstimado || lead.geoScore || 30;
  const companyOverview = lead.companyOverview || `Atuação no segmento de ${niche}.`;

  const topTerm1 = searchTerms[0] || `onde contratar ${niche}`;
  const topTerm2 = searchTerms[1] || `melhor empresa de ${niche}`;
  const topTerm3 = searchTerms[2] || `serviços de ${niche}`;

  const overviewDetail = companyOverview ? ` (${companyOverview.replace(/\.$/, '')})` : '';

  // 1. Framework PAS (Problema, Agitação, Solução)
  const pasLinkedin = robotsBlocked
    ? `Olá ${name}! Analisei a presença digital da ${company}${overviewDetail} e notei algo crítico: seu robots.txt está bloqueando robôs de IA (GPTBot, PerplexityBot e ClaudeBot).\n\nQuando clientes pesquisam no ChatGPT por "${topTerm1}", as IAs indicam a ${competitor}.\n\nGeramos um relatório técnico mostrando como liberar a indexação sem alterar seu SEO. Quer que eu te envie?`
    : `Olá ${name}! Analisei o posicionamento da ${company}${overviewDetail} e vi que falta marcação AEO (Answer-First) e Schemas JSON-LD.\n\nNas buscas no ChatGPT por "${topTerm1}" e "${topTerm2}", as IAs recomendam a ${competitor} no seu lugar!\n\nGeramos um relatório diagnóstico completo mostrando como assumir o 1º lugar. Posso te enviar?`;

  const pasEmail = robotsBlocked
    ? `Assunto: Ponto cego no robots.txt da ${company} (${competitor} recomendada no ChatGPT e Gemini)\n\nOlá ${name}, tudo bem?\n\nAnalisamos o posicionamento da ${company} no mercado de ${niche}${overviewDetail}.\n\nAo testar buscas de clientes nas inteligências artificiais — como "${topTerm1}" e "${topTerm2}" —, identificamos que o site ${domain} possui bloqueios ativos para os robôs de IA (GPTBot, PerplexityBot e ClaudeBot). Na prática, o ChatGPT, Gemini, Claude e Perplexity recomendam a ${competitor} para potenciais clientes em vez da ${company}.\n\nDesenvolvemos na b.rocket o protocolo de GEO (Generative Engine Optimization) que elimina essa invisibilidade técnica.\n\nAnexamos nosso relatório diagnóstico completo para sua análise.\n\nAtenciosamente,\nGuilherme Rossi | b.rocket`
    : `Assunto: Ausência de AEO e Schemas na ${company} (${competitor} recomendada no ChatGPT e Claude)\n\nOlá ${name}, tudo bem?\n\nAnalisamos a presença digital da ${company}${overviewDetail} no domínio ${domain}.\n\nIdentificamos que embora os robôs de IA tenham acesso ao seu site, falta sintaxe de resposta direta (AEO) e Schemas JSON-LD. Em buscas reais por "${topTerm1}", as IAs continuam recomendando a ${competitor}.\n\nCom o GEO da b.rocket, reestruturamos seus blocos semânticos para garantir citação prioritária nas LLMs.\n\nAnexamos nosso diagnóstico completo com o plano de ação.\n\nAtenciosamente,\nGuilherme Rossi | b.rocket`;

  // 2. Framework BAB (Before, After, Bridge)
  const babLinkedin = robotsBlocked
    ? `${name}, sabia que quando clientes pesquisam no ChatGPT ou Gemini por "${topTerm1}", a IA cita a ${competitor}?\n\nIsso ocorre porque a ${company}${overviewDetail} bloqueia robôs de IA no robots.txt.\n\nCom o GEO da b.rocket, liberamos essa barreira para que a ${company} seja a 1ª opção recomendada. Quer ver o diagnóstico?`
    : `${name}, sabia que ao buscar por "${topTerm1}" nas IAs, a ${company}${overviewDetail} perde citações para a ${competitor}?\n\nFalta estrutura AEO e Schemas JSON-LD.\n\nCom a b.rocket, transformamos seu conteúdo em respostas recomendadas nas LLMs. Quer ver como funciona?`;

  const babEmail = `Assunto: Como posicionar a ${company} em 1º lugar no ChatGPT, Gemini, Claude e Perplexity\n\nOlá ${name},\n\nImagine o cenário: um cliente em potencial pesquisa no ChatGPT "${topTerm1}". Hoje, as IAs respondem recomendando a ${competitor} e o site ${domain} (${niche}) fica de fora.\n\nAgora imagine o cenário ideal: a ${company}${overviewDetail} sendo citada como autoridade recomendada em 100% das buscas de IA.\n\nEntregamos esse resultado com nosso protocolo de Generative Engine Optimization (GEO).\n\nCompartilho em anexo a análise técnica do seu domínio.\n\nAbraços,\nGuilherme Rossi | b.rocket`;

  // 3. Framework PASTOR (Problema, Amplificação, Solução, Transformação, Oferta, Resposta)
  const pastorLinkedin = `Olá ${name}! [P] A ${company} está invisível nas IAs: ao pesquisarem por "${topTerm1}", a recomendação vai para a ${competitor}.\n\n[A] Na era do tráfego Zero-Click, depender do SEO antigo é um risco para empresas de ${niche}.\n\n[S/T] Nossa metodologia GEO de Princeton aumenta em até 40% a citabilidade de marcas.\n\n[O/R] Elaborei o relatório completo da ${company}. Quer que eu te envie o HTML?`;

  const pastorEmail = `Assunto: Diagnóstico PASTOR — Como a ${company} pode assumir a liderança nas IAs generativas\n\nOlá ${name},\n\n[PROBLEMA] Se um cliente perguntar ao ChatGPT por "${topTerm1}", a ${company}${overviewDetail} não é citada.\n\n[AMPLIFICAÇÃO] Com o tráfego resolvido dentro das IAs, manter o site ${domain} com Score GEO de ${score}% significa perder negócios para a ${competitor}.\n\n[SOLUÇÃO] A b.rocket aplica o protocolo GEO (Generative Engine Optimization) baseado em pesquisas de Princeton e Georgia Tech.\n\n[TRANSFORMAÇÃO] Nossos clientes atingem +40% de citação direta no ChatGPT, Gemini, Claude e Perplexity.\n\n[OFERTA] Concluímos a auditoria do seu site incluindo correções de robots.txt, Schemas e blocos AEO.\n\n[RESPOSTA] Responda este e-mail para agendar uma reunião rápida de alinhamento.\n\nAtenciosamente,\nGuilherme Rossi | b.rocket`;

  // 4. Framework QUEST (Qualificar, Compreender, Educar, Estimular, Transição)
  const questLinkedin = `Olá ${name}! Diagnóstico exclusivo para lideranças da ${company}.\n\nEntendemos a frustração no segmento de ${niche} ao ver IAs recomendando a ${competitor} em buscas por "${topTerm1}".\n\nLLMs exigem marcação AEO e busca vetorial.\n\nEstimulamos o cenário onde a ${company} é recomendada em 100% dos testes. Posso enviar o relatório?`;

  const questEmail = `Assunto: Análise Exclusiva QUEST para a liderança da ${company}\n\nOlá ${name},\n\n[QUALIFICAR] Este e-mail é destinado à liderança da ${company}.\n\n[COMPREENDER] Sabemos a frustração no mercado de ${niche} ao ver assistentes de IA recomendando a ${competitor} em buscas como "${topTerm1}".\n\n[EDUCAR] Diferente do Google tradicional, as LLMs absorvem o site ${domain} em chunks vetoriais. ${robotsBlocked ? `Hoje o seu robots.txt bloqueia essa leitura.` : `Falta sintaxe AEO (Answer-First) no seu conteúdo.`}\n\n[ESTIMULAR] Imagine a ${company}${overviewDetail} aparecendo como indicação #1 quando tomadores de decisão buscarem por "${topTerm2}".\n\n[TRANSIÇÃO] Disponibilizamos em anexo a auditoria técnica da b.rocket. Vamos conversar nesta semana?\n\nAbraços,\nGuilherme Rossi | b.rocket`;

  // 5. Framework 4Ps (Picture, Promessa, Prova, Push)
  const ps4Linkedin = `${name}, imagine o ChatGPT gerando respostas sobre "${topTerm1}" e citando a ${company} como opção #1 de ${niche}!\n\nPrometemos preparar sua infraestrutura técnica para dominar citações de IA em 30 dias.\n\nProvado por pesquisas científicas de Princeton. Quer receber o relatório?`;

  const ps4Email = `Assunto: Dominando as recomendações de IA: Relatório 4Ps da ${company}\n\nOlá ${name},\n\n[PICTURE] Imagine o Gemini, ChatGPT, Claude e Perplexity respondendo a buscas como "${topTerm1}" e posicionando a ${company}${overviewDetail} como autoridade máxima.\n\n[PROMESSA] O protocolo GEO da b.rocket ajusta sua arquitetura técnica para alcançar liderança orgânica nas LLMs em 30 dias.\n\n[PROVA] Metodologia respaldada por pesquisas de Princeton, Cornell e Georgia Tech, comprovando ganho de até 40% em citação de IA.\n\n[PUSH] Confira o diagnóstico do site ${domain} em anexo e agende uma conversa com nosso time.\n\nAtenciosamente,\nGuilherme Rossi | b.rocket`;

  // 6. Framework FAB (Features, Advantages, Benefits)
  const fabLinkedin = `${name}, implementamos no site ${domain} as Features de Schemas JSON-LD e AEO para ${niche}.\n\nA Vantagem é permitir que robôs do ChatGPT e Gemini leiam e entendam a ${company} sem erros.\n\nO Benefício: a ${company} passa a ser citada em buscas por "${topTerm1}". Quer ver a análise?`;

  const fabEmail = `Assunto: Apresentação Técnica FAB — GEO para a ${company}\n\nOlá ${name},\n\nAnalisamos o domínio ${domain} da ${company}${overviewDetail} sob a ótica da estrutura FAB:\n\n• [FEATURE]: Implementação de diretivas limpas no robots.txt, Schemas JSON-LD e /llms.txt.\n• [ADVANTAGE]: Permite que os robôs do ChatGPT, Gemini e Claude absorvam a entidade da ${company} sem erros de contexto.\n• [BENEFIT]: Sua marca supera a ${competitor} e é citada em pesquisas cruciais como "${topTerm1}" e "${topTerm2}".\n\nAcesse o relatório diagnóstico em anexo para conferir o roadmap.\n\nAtenciosamente,\nGuilherme Rossi | b.rocket`;

  // 7. Framework ACCA (Alerta, Compreensão, Convicção, Ação)
  const accaLinkedin = `Alerta ${name}: Buscas por ${niche} migraram para IAs! Em pesquisas como "${topTerm1}", hoje a ${competitor} é a recomendada.\n\nConvicção: O GEO b.rocket é a garantia de relevância digital da ${company}.\n\nSolicite a auditoria completa por aqui!`;

  const accaEmail = `Assunto: ALERTA GEO — A revolução do tráfego Zero-Click na ${company}\n\nOlá ${name},\n\n[ALERTA] O tráfego de busca tradicional está migrando para assistentes virtuais de IA.\n\n[COMPREENSÃO] Quando potenciais clientes pesquisam nas IAs por "${topTerm1}", se o site ${domain} ${robotsBlocked ? 'bloqueia robôs no robots.txt' : 'não possui blocos AEO e Schemas'}, a ${company} torna-se invisível enquanto a ${competitor} ganha o cliente.\n\n[CONVICÇÃO] Obter a auditoria e aplicar o protocolo GEO da b.rocket é o caminho seguro para garantir a citabilidade da sua marca.\n\n[AÇÃO] Baixe a análise da ${company}${overviewDetail} em anexo e agende um horário.\n\nAbraços,\nGuilherme Rossi | b.rocket`;

  // 8. Framework 4Us (Útil, Urgente, Único, Ultra-específico)
  const us4Linkedin = `Sua marca invisível nas IAs? Score GEO da ${company} (${niche}) em ${score}%. Em buscas por "${topTerm1}", a ${competitor} é recomendada.\n\nVeja como liberar visibilidade de IA no nosso relatório exclusivo. Quer receber?`;

  const us4Email = `Assunto: [ÚLTIMOS DIAS] Score GEO da ${company} em ${score}% — ${competitor} lidera nas IAs\n\nOlá ${name},\n\n[ÚTIL] Como resolver a invisibilidade da ${company} nas inteligências artificiais.\n\n[URGENTE] A ${competitor} está capturando os leads de alta intenção comercial no ChatGPT e Gemini em buscas por "${topTerm1}".\n\n[ÚNICO] Metodologia exclusiva de Generative Engine Optimization (GEO) desenvolvida pela b.rocket.\n\n[ULTRA-ESPECÍFICO] O diagnóstico do site ${domain} (${overviewDetail.trim()}) revelou GEO Score de ${score}%, ${robotsBlocked ? 'com restrição ativa para robôs no robots.txt' : 'ausência de sintaxe AEO Answer-First'}.\n\nLeia a análise técnica completa em anexo.\n\nAtenciosamente,\nGuilherme Rossi | b.rocket`;

  // 9. Framework Falsa Lógica (Persuasão Incontestável)
  const falsaLogicaLinkedin = `Olá ${name}! A ${competitor} não está no topo do ChatGPT em buscas por "${topTerm1}" porque o produto deles é "melhor".\n\nEles estão lá porque o site tem robôs liberados, Schemas JSON-LD e AEO.\n\nSe corrigirmos esses 3 itens técnicos na ${company}, assumimos o 1º lugar deles nas IAs. Quer ver o plano?`;

  const falsaLogicaEmail = `Assunto: A verdadeira razão técnica da ${competitor} estar em 1º lugar nas IAs\n\nOlá ${name},\n\nAo analisar buscas por ${niche} no ChatGPT, Gemini, Claude e Perplexity — como "${topTerm1}" e "${topTerm2}" —, uma coisa chama atenção: a ${competitor} aparece como primeira indicação.\n\nMas a verdade é que o serviço/produto deles não é superior ao da ${company}${overviewDetail}, nem eles investem fortunas nisso.\n\nA razão é 100% técnica: o site deles possui diretivas limpas no robots.txt, Schemas JSON-LD estruturados e parágrafos em AEO.\n\nA conclusão lógica é simples: se implementarmos essas 3 camadas no site ${domain}, a ${company} passa a capturar as citações primárias em todas as IAs.\n\nElaboramos a auditoria completa da ${company} mostrando cada linha necessária. Confira em anexo.\n\nAbraços,\nGuilherme Rossi | b.rocket`;

  const outreachCopies = {
    pasLinkedin, pasEmail,
    babLinkedin, babEmail,
    pastorLinkedin, pastorEmail,
    questLinkedin, questEmail,
    ps4Linkedin, ps4Email,
    fabLinkedin, fabEmail,
    accaLinkedin, accaEmail,
    us4Linkedin, us4Email,
    falsaLogicaLinkedin, falsaLogicaEmail
  };

  // Framework selecionado na UI (ex: 'PAS', '4Ps', 'Falsa Lógica') -> textos específicos pedidos pelo front
  const frameworkKey = OUTREACH_FRAMEWORK_KEYS[framework] || 'pas';
  const emailText = outreachCopies[`${frameworkKey}Email`] || '';
  const linkedinText = outreachCopies[`${frameworkKey}Linkedin`] || '';

  try {
    if (foundLead) {
      try {
        const fields = {
          outreachCopies: toFirestoreValue(outreachCopies),
          status: { stringValue: 'outreach_ready' }
        };
        await fetchFirestore(`https://firestore.googleapis.com/v1/${foundLead.docPath}?updateMask.fieldPaths=outreachCopies&updateMask.fieldPaths=status`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields })
        });
      } catch (fsErr) {
        console.warn('Firestore patch outreach copies warning:', fsErr.message);
      }
    }

    res.json({ success: true, outreachCopies, emailText, linkedinText, framework: framework || 'PAS' });
  } catch (err) {
    console.error('Error generating outreach copy:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/lead-hunter/html/:leadId (Visualizar Relatório HTML Simplificado do Cliente)
app.get('/api/admin/lead-hunter/html/:leadId', verifyAdminToken, async (req, res) => {
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
      return res.status(404).json({ error: 'Diagnóstico não encontrado para este lead. Execute o diagnóstico real antes de gerar o relatório.' });
    }

    const leadObj = {
      company: diagnostic?.clientUrl || leadId,
      url: diagnostic?.clientUrl || `https://${leadId}`
    };

    const clientHtml = generateHtmlReport(leadObj, diagnostic);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(clientHtml);
  } catch (err) {
    res.status(500).send(`Erro ao buscar relatório: ${err.message}`);
  }
});

// GET /api/admin/lead-hunter/pdf/:leadId (Entregar Relatório HTML)
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
      return res.status(404).json({ error: 'Diagnóstico não encontrado para este lead. Execute o diagnóstico real antes de gerar o relatório.' });
    }

    const leadObj = {
      company: diagnostic?.clientUrl || leadId,
      url: diagnostic?.clientUrl || `https://${leadId}`
    };

    const htmlContent = generateHtmlReport(leadObj, diagnostic);
    const domain = (diagnostic?.clientUrl || leadId).replace(/^https?:\/\//i, '').replace(/\/.*$/, '') || 'relatorio';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Relatorio_GEO_${domain}.html"`);
    res.send(htmlContent);
  } catch (err) {
    console.error('HTML report download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/lead-hunter/leads/:leadId (Atualizar Estado, Copys, Temperatura e Pipeline)
app.patch('/api/admin/lead-hunter/leads/:leadId', verifyAdminToken, async (req, res) => {
  const { leadId } = req.params;
  const updateFields = req.body;

  try {
    const accessToken = await getGoogleAccessToken();
    const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/hunter_leads?pageSize=100`;
    const listData = await fetchFirestore(listUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    let docPath = null;

    for (const doc of (listData.documents || [])) {
      const f = parseFirestoreDoc(doc);
      if (f.id === leadId) {
        docPath = doc.name;
        break;
      }
    }

    if (!docPath) {
      return res.status(404).json({ error: 'Lead não encontrado no Firestore' });
    }

    const updateMask = Object.keys(updateFields).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const fields = {};
    for (const [k, v] of Object.entries(updateFields)) {
      fields[k] = toFirestoreValue(v);
    }

    await fetchFirestore(`https://firestore.googleapis.com/v1/${docPath}?${updateMask}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    res.json({ success: true, leadId, updatedFields: updateFields });
  } catch (err) {
    console.error('Error updating hunter lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/lead-hunter/leads/:leadId (Excluir Lead Hunter)
app.delete('/api/admin/lead-hunter/leads/:leadId', verifyAdminToken, async (req, res) => {
  const { leadId } = req.params;

  try {
    const accessToken = await getGoogleAccessToken();
    const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/hunter_leads?pageSize=100`;
    const listData = await fetchFirestore(listUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    let docPath = null;

    for (const doc of (listData.documents || [])) {
      const f = parseFirestoreDoc(doc);
      if (f.id === leadId) {
        docPath = doc.name;
        break;
      }
    }

    if (docPath) {
      await fetchFirestore(`https://firestore.googleapis.com/v1/${docPath}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    }

    res.json({ success: true, deletedId: leadId });
  } catch (err) {
    console.error('Error deleting hunter lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/lead-hunter/send-email (Enviar E-mail com Relatório Incorporado no Corpo)
app.post('/api/admin/lead-hunter/send-email', verifyAdminToken, async (req, res) => {
  const { leadId, framework } = req.body;
  const recipientEmail = req.body.recipientEmail || req.body.email;
  const emailBody = req.body.emailBody || req.body.bodyHtml;
  const subject = req.body.subject;
  const attachPdf = req.body.attachPdf ?? req.body.attachReportLink ?? false;

  if (!recipientEmail || !emailBody) {
    return res.status(400).json({ error: 'E-mail de destino e corpo do e-mail são obrigatórios' });
  }

  try {
    let accessToken = null;
    let foundLead = null;
    if (leadId) {
      try {
        accessToken = await getGoogleAccessToken();
        foundLead = await findLeadDoc(accessToken, leadId);
      } catch (e) {
        console.warn('findLeadDoc warning:', e.message);
      }
    }

    let finalHtml = null;

    // Se solicitado incorporar o relatório de diagnóstico HTML no corpo do e-mail
    if (attachPdf && leadId) {
      if (!accessToken) {
        accessToken = await getGoogleAccessToken();
      }
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
        return res.status(404).json({ error: 'Diagnóstico não encontrado para este lead. Execute o diagnóstico real antes de enviar o relatório por e-mail.' });
      }

      const companyName = foundLead?.fields?.company || foundLead?.fields?.domain || recipientEmail.split('@')[1] || 'Cliente';
      const websiteUrl = foundLead?.fields?.url || `https://${foundLead?.fields?.domain || recipientEmail.split('@')[1] || 'site.com'}`;
      const leadObj = { company: companyName, url: websiteUrl };

      // Gera o HTML do relatório incorporando a mensagem/copy do usuário no topo
      finalHtml = generateHtmlReport(leadObj, diagnostic, { userMessage: emailBody });
    } else {
      // Sem o relatório de diagnóstico incorporado: formata a mensagem em um layout HTML limpo e responsivo
      const formattedBody = emailBody
        .trim()
        .split(/\n\s*\n/)
        .map(p => `<p style="margin:0 0 12px; font-size:14px; line-height:1.6; color:#18181b;">${p.replace(/\n/g, '<br/>')}</p>`)
        .join('');

      finalHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/></head>
<body style="background-color:#f4f5f8; font-family:'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin:0; padding:20px;">
  <div style="max-width:650px; margin:0 auto; background:#ffffff; padding:28px; border-radius:16px; border:1px solid #e8e8eb; box-shadow:0px 10px 30px rgba(13,20,33,0.04);">
    ${formattedBody}
  </div>
</body>
</html>`;
    }

    const mailOptions = {
      from: `"Guilherme Rossi | b.rocket" <${process.env.EMAIL_USER || 'workflows.berocket@gmail.com'}>`,
      to: recipientEmail,
      subject: subject || 'Diagnóstico de Visibilidade GEO — b.rocket',
      text: emailBody,
      html: finalHtml,
      attachments: []
    };

    await transporter.sendMail(mailOptions);

    // Registra o envio no histórico do lead e zera o cronômetro de follow-up
    if (leadId) {
      try {
        const accessToken = await getGoogleAccessToken();
        const found = await findLeadDoc(accessToken, leadId);
        if (found) {
          const sentAt = new Date().toISOString();
          const sentHistory = [...(found.fields.sentHistory || []), {
            copyKey: framework || 'PAS',
            sentAt,
            channel: 'email',
            subject: subject || '',
            attachPdf: !!attachPdf,
          }];
          const fields = {
            sentHistory: toFirestoreValue(sentHistory),
            emailSentAt: toFirestoreValue(sentAt),
            pipelineStage: toFirestoreValue('email_sent'),
            status: { stringValue: 'contacted' },
          };
          await fetchFirestore(`https://firestore.googleapis.com/v1/${found.docPath}?updateMask.fieldPaths=sentHistory&updateMask.fieldPaths=emailSentAt&updateMask.fieldPaths=pipelineStage&updateMask.fieldPaths=status`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields })
          });
        }
      } catch (fsErr) {
        console.warn('Aviso: falha ao registrar histórico de envio de e-mail:', fsErr.message);
      }
    }

    res.json({ success: true, recipientEmail });
  } catch (err) {
    console.error('Error sending outreach email:', err);
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


// ─── GET AGENTS HEALTH (status real baseado em credenciais configuradas) ──
app.get('/api/admin/agents/health', verifyAdminToken, async (req, res) => {
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasPageSpeed = !!process.env.GOOGLE_API_KEY;
  const hasFirestore = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  const agents = [
    { id: 'orchestrator', name: 'Orquestrador', status: hasFirestore ? 'online' : 'degraded', requiredEnv: ['GOOGLE_SERVICE_ACCOUNT_JSON'] },
    { id: 'gatekeeper', name: 'Technical Gatekeeper', status: 'online', requiredEnv: [], note: hasPageSpeed ? 'Core Web Vitals habilitados (PageSpeed)' : 'Core Web Vitals indisponíveis — configure GOOGLE_API_KEY' },
    { id: 'metadata', name: 'Metadata Entity', status: 'online', requiredEnv: [] },
    { id: 'content', name: 'Content Absorption', status: 'online', requiredEnv: [] },
    { id: 'seo_optimizer', name: 'SEO Optimizer', status: 'online', requiredEnv: [] },
    { id: 'semantic_explorer', name: 'Semantic Explorer', status: hasOpenRouter ? 'online' : 'unavailable', requiredEnv: ['OPENROUTER_API_KEY'] },
    { id: 'offpage', name: 'Off-Page Entity Monitor', status: 'online', requiredEnv: [], note: 'Verificação de perfis externos via HTTP direto — não depende de chave.' },
    { id: 'intent', name: 'Intent Prompt (OpenRouter)', status: hasOpenRouter ? 'online' : 'unavailable', requiredEnv: ['OPENROUTER_API_KEY'] },
    { id: 'checklist_architect', name: 'Checklist Architect', status: 'online', requiredEnv: [] },
  ];

  res.json({ success: true, agents, checkedAt: new Date().toISOString() });
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
