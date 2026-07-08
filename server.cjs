const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const nodemailer = require('nodemailer');
const ics = require('ics');

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

// Serve frontend static assets from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback all routes to frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
