import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Video, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Sparkles, 
  Lock, 
  LogOut, 
  UserCheck, 
  RefreshCw, 
  Check, 
  ArrowRight,
  ExternalLink,
  Settings,
  Eye
} from 'lucide-react';
import { initAuth, googleSignIn, logout, db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc,
  updateDoc
} from 'firebase/firestore';

interface MeetingSchedulerProps {
  onClose?: () => void;
}

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export default function MeetingScheduler({ onClose }: MeetingSchedulerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'date-time' | 'details' | 'confirm' | 'success' | 'admin'>('date-time');
  
  // Auth state (For Guilherme / Admin only)
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Calendar choices state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [busyEvents, setBusyEvents] = useState<any[]>([]);
  const [isLoadingBusy, setIsLoadingBusy] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Visitor details state
  const [name, setName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Execution states
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<any | null>(null);

  // Admin states
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [calendarLastUpdated, setCalendarLastUpdated] = useState<string | null>(null);

  // Generate weekday list for next 14 days
  const [availableDays, setAvailableDays] = useState<Date[]>([]);

  // Generate weekdays
  useEffect(() => {
    const days: Date[] = [];
    let current = new Date();
    if (current.getHours() >= 17) {
      current.setDate(current.getDate() + 1);
    }
    
    let count = 0;
    while (count < 14) {
      const d = new Date(current);
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        days.push(d);
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    setAvailableDays(days);
    
    if (days.length > 0) {
      setSelectedDate(days[0]);
    }
  }, []);

  // Initialize Auth state listener to identify if Guilherme is already logged in
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        
        // Auto-refresh admin bookings list if logged in user is Guilherme
        if (currentUser.email === 'workflows.berocket@gmail.com' || currentUser.email === 'berocket@berocket.com.br') {
          if (step === 'admin') {
            loadAllBookings();
          }
        }
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, [step]);

  // Fetch combined availability (Firestore settings cache + Firestore bookings) on date change
  useEffect(() => {
    if (!selectedDate) return;
    loadAvailability(selectedDate);
    setSelectedSlot(null); // Reset selected slot when date changes
  }, [selectedDate]);

  // Listener for custom open event
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      // Reset flow to date-time when opening
      setStep('date-time');
    };
    window.addEventListener('open-booking-modal', handleOpen);
    return () => window.removeEventListener('open-booking-modal', handleOpen);
  }, []);

  // Load busy timeslots from Google Calendar via backend API
  const loadAvailability = async (date: Date) => {
    setIsLoadingBusy(true);
    setFetchError(null);
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const res = await fetch(`/api/calendar/availability?date=${formattedDate}`);
      if (!res.ok) {
        throw new Error('Falha ao consultar disponibilidade do servidor.');
      }
      const data = await res.json();
      setBusyEvents(data.busySlots || []);
    } catch (err: any) {
      console.error('Error fetching availability:', err);
      setFetchError('Não foi possível obter a disponibilidade em tempo real.');
      setBusyEvents([]);
    } finally {
      setIsLoadingBusy(false);
    }
  };

  // Check if slot is busy on combined list
  const isSlotBusy = (slot: string) => {
    if (!selectedDate || busyEvents.length === 0) return false;

    const [hours, minutes] = slot.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 40);

    return busyEvents.some(event => {
      const startVal = event.start?.dateTime || event.start?.date || event.start;
      const endVal = event.end?.dateTime || event.end?.date || event.end;
      if (!startVal || !endVal) return false;
      const eventStart = new Date(startVal);
      const eventEnd = new Date(endVal);
      return slotStart < eventEnd && slotEnd > eventStart;
    });
  };

  // Handle Google Sign In specifically for Guilherme (Especialista) to access the admin console
  const handleAdminAccess = async () => {
    setBookingError(null);
    if (user && (user.email === 'workflows.berocket@gmail.com' || user.email === 'berocket@berocket.com.br')) {
      setStep('admin');
      loadAllBookings();
    } else {
      setIsLoggingIn(true);
      try {
        const result = await googleSignIn();
        if (result) {
          setUser(result.user);
          setToken(result.accessToken);
          if (result.user.email === 'workflows.berocket@gmail.com' || result.user.email === 'berocket@berocket.com.br') {
            setStep('admin');
            loadAllBookings();
          } else {
            setBookingError('Este painel é restrito apenas ao e-mail do especialista Guilherme.');
            await logout();
            setUser(null);
            setToken(null);
          }
        }
      } catch (err: any) {
        console.error('Admin login error:', err);
        setBookingError('Não foi possível conectar com a sua conta Google. Tente novamente.');
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  // Load all bookings from Firestore for Guilherme's dashboard
  const loadAllBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const q = query(collection(db, 'bookings'), orderBy('date', 'desc'), orderBy('slot', 'asc'));
      const snap = await getDocs(q);
      const bookingsList: any[] = [];
      snap.forEach((doc) => {
        bookingsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setAllBookings(bookingsList);
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Run synchronization engine: updates freebusy cache & registers unsynced bookings to Google Calendar
  const handleAdminSync = async () => {
    if (!token || !user) {
      setBookingError('Não autorizado. Por favor, conecte sua conta Google novamente.');
      return;
    }
    setIsSyncing(true);
    setSyncLogs([]);
    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`);
      setSyncLogs([...logs]);
    };

    addLog('Iniciando ciclo de sincronização automatizada...');

    try {
      // 1. Fetch Guilherme's Google Calendar busy times for the next 14 days
      addLog('Consultando sua agenda pessoal do Google...');
      const now = new Date();
      const twoWeeksOut = new Date();
      twoWeeksOut.setDate(now.getDate() + 14);

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${twoWeeksOut.toISOString()}&singleEvents=true&orderBy=startTime`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Falha ao conectar com a API do Google Calendar.');
      }

      const calendarData = await res.json();
      const googleEvents = calendarData.items || [];
      
      const busySlots = googleEvents.map((evt: any) => ({
        start: evt.start?.dateTime || evt.start?.date,
        end: evt.end?.dateTime || evt.end?.date
      })).filter((s: any) => s.start && s.end);

      // Save to Firestore settings
      addLog(`Salvando ${busySlots.length} compromissos na nuvem do b.rocket para liberação de slots...`);
      const lastUpdatedStr = new Date().toISOString();
      await setDoc(doc(db, 'settings', 'calendar_availability'), {
        busySlots,
        lastUpdated: lastUpdatedStr,
        updatedBy: user.email
      });
      setCalendarLastUpdated(lastUpdatedStr);
      addLog('✔ Slots livres de Guilherme sincronizados com sucesso!');

      // 2. Fetch and process Unsynced bookings from clients
      addLog('Buscando novos agendamentos recebidos de clientes...');
      const q = query(collection(db, 'bookings'), where('synced', '==', false));
      const bookingsSnap = await getDocs(q);
      const pendingBookings = bookingsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      addLog(`Encontrado(s) ${pendingBookings.length} agendamento(s) pendente(s) de integração.`);

      for (const b of pendingBookings) {
        addLog(`Integrando agendamento de ${b.name} (${b.company})...`);
        
        const [hours, minutes] = b.slot.split(':').map(Number);
        const start = new Date(b.date);
        start.setHours(hours, minutes, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 40);

        // Build calendar event payload with Google Meet Request
        const eventPayload = {
          summary: `Mentoria b.rocket: Diagnóstico GEO & RAG (${b.company})`,
          description: `Olá ${b.name},\n\nSua sessão estratégica de 40 minutos com o especialista Guilherme (b.rocket) foi agendada e confirmada!\n\n` +
                       `🎯 DETALHES DO PARTICIPANTE:\n` +
                       `• Nome completo: ${b.name}\n` +
                       `• E-mail: ${b.email}\n` +
                       `• Empresa: ${b.company}\n` +
                       `• Website: ${b.url}\n` +
                       `• Notas/Gargalos: ${b.notes || 'Análise geral sem anotações.'}\n\n` +
                       `🔗 A sala oficial do Google Meet foi criada automaticamente e está disponível em anexo neste convite.`,
          start: {
            dateTime: start.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: end.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          attendees: [
            { email: 'berocket@berocket.com.br' },
            { email: b.email }
          ],
          conferenceData: {
            createRequest: {
              requestId: `brocket-sync-${b.id}-${Date.now()}`,
              conferenceSolutionKey: {
                type: 'hangoutsMeet'
              }
            }
          }
        };

        const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventPayload)
        });

        if (createRes.ok) {
          const createdEvt = await createRes.json();
          const meetLink = createdEvt.conferenceData?.entryPoints?.[0]?.uri || '';
          const eventId = createdEvt.id || '';

          // Update Firestore booking document
          await updateDoc(doc(db, 'bookings', b.id), {
            synced: true,
            meetLink: meetLink,
            googleEventId: eventId
          });

          addLog(`✔ Sucesso! Convite enviado para ${b.email}. Google Meet gerado: ${meetLink || 'Google Meet link criado'}`);
        } else {
          const errData = await createRes.json();
          addLog(`❌ Erro ao criar convite de ${b.name}: ${errData.error?.message || 'Erro de API'}`);
        }
      }

      addLog('🎉 Todo o ciclo de sincronização foi finalizado com sucesso!');
      loadAllBookings();
    } catch (err: any) {
      console.error('Sync error:', err);
      addLog(`❌ Erro crítico: ${err.message || 'Falha de comunicação.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Create booking via backend API (creates event in Google Calendar and records in Firestore)
  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedSlot) return;

    setIsBooking(true);
    setBookingError(null);

    try {
      const res = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email: visitorEmail,
          company,
          url,
          notes,
          date: selectedDate.toISOString(),
          slot: selectedSlot
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao realizar agendamento.');
      }

      const result = await res.json();
      setCreatedEvent(result.booking);
      setStep('success');
    } catch (err: any) {
      console.error('Error saving booking:', err);
      setBookingError(err.message || 'Não foi possível registrar seu agendamento no momento. Tente novamente.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
    setTimeout(() => {
      setStep('date-time');
      setSelectedSlot(null);
      setBookingError(null);
      setCreatedEvent(null);
      setName('');
      setVisitorEmail('');
      setCompany('');
      setUrl('');
      setNotes('');
    }, 500);
  };

  const handleLogoutAdmin = async () => {
    await logout();
    setStep('date-time');
  };

  // Helper formatting dates in PT-BR
  const formatDatePT = (d: Date) => {
    const daysWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return {
      dayName: daysWeek[d.getDay()],
      dayNum: d.getDate(),
      month: months[d.getMonth()]
    };
  };

  // Dynamic Whatsapp helper for client backup notification
  const handleWhatsAppNotify = () => {
    if (!createdEvent) return;
    const dateFormatted = new Date(createdEvent.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    const text = encodeURIComponent(
      `Olá Guilherme, acabei de agendar uma Reunião Diagnóstica pelo site!\n\n` +
      `📅 Data: ${dateFormatted} às ${createdEvent.slot}\n` +
      `👤 Nome: ${createdEvent.name}\n` +
      `🏢 Empresa: ${createdEvent.company}\n` +
      `📧 E-mail: ${createdEvent.email}\n` +
      `Gostaria de agilizar o envio do link de acesso!`
    );
    window.open(`https://wa.me/5511940595792?text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          onClick={handleClose}
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md z-[110] flex items-start justify-center p-4 pt-6 md:pt-16 pb-12 overflow-y-auto no-scrollbar"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white border border-zinc-200 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 my-auto no-scrollbar"
          >
            {/* Modal Header */}
            <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-4 flex items-center justify-between relative">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <span className="font-mono text-[9px] md:text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest">
                  GOOGLE_CALENDAR_ENGINE // B.ROCKET_MEETING
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-zinc-200/80 active:scale-95 transition-all text-zinc-500 hover:text-zinc-950 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8">
              
              {/* STEP 1: SELECT DATE & TIME (Standard Entry) */}
              {step === 'date-time' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-extrabold text-lg text-zinc-950 uppercase tracking-tight">Escolha o Dia e Horário</h4>
                      <p className="text-zinc-500 text-[11px] font-light mt-0.5">Sessão com o especialista Guilherme C. Rossi.</p>
                    </div>
                    {calendarLastUpdated && (
                      <div className="hidden sm:flex items-center gap-1 font-mono text-[8px] text-zinc-400 uppercase">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Sincronizado {new Date(calendarLastUpdated).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>

                  {fetchError && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-[11px] leading-relaxed">
                      {fetchError}
                    </div>
                  )}

                  {/* Horizontal Scroll Days list */}
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Dias Disponíveis</span>
                    <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                      {availableDays.map((d, index) => {
                        const isSelected = selectedDate && selectedDate.toDateString() === d.toDateString();
                        const info = formatDatePT(d);
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedDate(d)}
                            className={`flex flex-col items-center justify-center shrink-0 w-14 py-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-zinc-950 border-zinc-950 text-white shadow-md scale-102'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                            }`}
                          >
                            <span className="font-mono text-[9px] font-bold uppercase tracking-wider block">{info.dayName}</span>
                            <span className="font-display font-black text-sm mt-1 block">{info.dayNum}</span>
                            <span className="font-mono text-[8px] text-zinc-400 block mt-0.5 uppercase">{info.month}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots Grid */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Horários Livres (Duração: 40min)</span>
                      {isLoadingBusy && (
                        <div className="flex items-center gap-1 font-mono text-[8px] text-zinc-400 uppercase">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-zinc-400" />
                          <span>Verificando...</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {TIME_SLOTS.filter((slot) => !isSlotBusy(slot)).map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-3.5 rounded-xl text-center border font-mono text-xs font-bold transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-red-600 border-red-600 text-white shadow-md'
                                : 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-300'
                            }`}
                          >
                            <span>{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {bookingError && (
                    <div className="bg-red-50 border border-red-250 text-red-700 rounded-xl p-3 text-xs">
                      {bookingError}
                    </div>
                  )}

                  {/* Navigation Actions */}
                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-end">
                    <button
                      disabled={!selectedSlot}
                      onClick={() => setStep('details')}
                      className={`font-mono text-xs font-bold px-6 py-3.5 tracking-widest uppercase transition-all duration-200 flex items-center gap-1.5 rounded-xl ${
                        selectedSlot
                          ? 'bg-zinc-950 text-white hover:bg-zinc-900 cursor-pointer'
                          : 'bg-zinc-150 text-zinc-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Avançar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: USER DETAILS FORM */}
              {step === 'details' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-display font-extrabold text-lg text-zinc-950 uppercase tracking-tight">Detalhes do Agendamento</h4>
                    <p className="text-zinc-500 text-[11px] font-light mt-0.5">Preencha os dados da sua empresa para podermos gerar o briefing da reunião.</p>
                  </div>

                  <div className="space-y-3">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="font-mono text-[9px] text-zinc-400 uppercase font-bold block">Seu Nome Completo *</label>
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-950 px-4 py-3 text-xs md:text-sm font-sans rounded-xl focus:outline-none transition-colors"
                        placeholder="Ex: João Silva"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="font-mono text-[9px] text-zinc-400 uppercase font-bold block">Seu E-mail Corporativo *</label>
                      <input 
                        type="email" 
                        required
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-950 px-4 py-3 text-xs md:text-sm font-sans rounded-xl focus:outline-none transition-colors"
                        placeholder="joao@empresa.com.br"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Company */}
                      <div className="space-y-1">
                        <label className="font-mono text-[9px] text-zinc-400 uppercase font-bold block">Sua Empresa *</label>
                        <input 
                          type="text" 
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-950 px-4 py-3 text-xs md:text-sm font-sans rounded-xl focus:outline-none transition-colors"
                          placeholder="Nome da empresa"
                        />
                      </div>

                      {/* Site URL */}
                      <div className="space-y-1">
                        <label className="font-mono text-[9px] text-zinc-400 uppercase font-bold block">Site / URL *</label>
                        <input 
                          type="text" 
                          required
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-950 px-4 py-3 text-xs md:text-sm font-sans rounded-xl focus:outline-none transition-colors"
                          placeholder="exemplo.com.br"
                        />
                      </div>
                    </div>

                    {/* Brief notes */}
                    <div className="space-y-1">
                      <label className="font-mono text-[9px] text-zinc-400 uppercase font-bold block">Qual o maior desafio ou dúvida sobre RAG/IA/GEO? (Opcional)</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-950 px-4 py-3 text-xs font-sans rounded-xl focus:outline-none transition-colors resize-none"
                        placeholder="Ex: Instabilidade nas respostas, indexação lenta, baixa citação de marca..."
                      />
                    </div>
                  </div>

                  {/* Navigation Actions */}
                  <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                    <button
                      onClick={() => setStep('date-time')}
                      className="font-mono text-xs font-bold px-4 py-3 text-zinc-400 hover:text-zinc-950 transition-colors uppercase tracking-wider"
                    >
                      Voltar
                    </button>
                    
                    <button
                      disabled={!name || !visitorEmail || !company || !url || !visitorEmail.includes('@')}
                      onClick={() => setStep('confirm')}
                      className={`font-mono text-xs font-bold px-6 py-3.5 tracking-widest uppercase transition-all duration-200 flex items-center gap-1.5 rounded-xl ${
                        name && visitorEmail && company && url && visitorEmail.includes('@')
                          ? 'bg-zinc-950 text-white hover:bg-zinc-900 cursor-pointer'
                          : 'bg-zinc-150 text-zinc-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Avançar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: USER CONFIRMATION DIALOG */}
              {step === 'confirm' && (
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2.5 text-zinc-950 font-bold">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                      <h4 className="font-display font-black text-sm uppercase tracking-tight">
                        Confirmar Reunião na Agenda de Guilherme?
					  </h4>
                    </div>
                    <p className="text-xs text-zinc-650 leading-relaxed font-light">
                      Você está reservando um espaço oficial na agenda do Guilherme. Ele receberá seu briefing e enviará o convite do <strong className="text-zinc-950 font-bold">Google Meet</strong> diretamente para o seu e-mail corporativo cadastrado.
                    </p>
                  </div>

                  {/* Summary grid */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-3">
                    <span className="font-mono text-[9px] text-zinc-400 uppercase font-black tracking-widest">RESUMO DO COMPROMISSO</span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-zinc-200/60">
                        <span className="text-zinc-500 font-light">Especialista:</span>
                        <span className="font-bold text-zinc-950">Guilherme Rossi (b.rocket)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-200/60">
                        <span className="text-zinc-500 font-light">Dia Escolhido:</span>
                        <span className="font-bold text-zinc-950">
                          {selectedDate ? selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-200/60">
                        <span className="text-zinc-500 font-light">Horário:</span>
                        <span className="font-mono font-bold text-zinc-950 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          {selectedSlot} (Duração: 40m)
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-200/60">
                        <span className="text-zinc-500 font-light">Seu E-mail:</span>
                        <span className="font-mono font-bold text-zinc-950">{visitorEmail}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-500 font-light">Formato:</span>
                        <span className="font-mono font-bold text-zinc-950 text-red-600 flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                          Google Meet Video Call
                        </span>
                      </div>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs">
                      {bookingError}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-zinc-100 flex justify-between items-center gap-4">
                    <button
                      onClick={() => setStep('details')}
                      disabled={isBooking}
                      className="font-mono text-xs font-bold px-4 py-3 text-zinc-400 hover:text-zinc-950 transition-colors uppercase tracking-wider"
                    >
                      Voltar
                    </button>
                    
                    <button
                      disabled={isBooking}
                      onClick={handleConfirmBooking}
                      className="flex-grow inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-150 disabled:text-zinc-400 text-white font-mono text-xs font-bold px-6 py-4 uppercase tracking-widest transition-all rounded-xl cursor-pointer shadow-md"
                    >
                      {isBooking ? (
                        <RefreshCw className="w-4 h-4 animate-spin animate-infinite" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      <span>{isBooking ? 'Agendando...' : 'Confirmar e Agendar'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SUCCESS */}
              {step === 'success' && createdEvent && (
                <div className="space-y-6 text-center py-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-150">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display font-black text-xl md:text-2xl text-zinc-950 uppercase tracking-tight">
                      Agendamento Pré-Aprovado!
                    </h3>
                    <p className="text-zinc-500 text-xs md:text-sm font-light max-w-sm mx-auto leading-relaxed">
                      Seu diagnóstico foi agendado e registrado com sucesso. Guilherme irá validar o briefing e enviar o convite oficial do Google Meet para o e-mail <strong className="text-zinc-900 font-bold">{createdEvent.email}</strong> em instantes!
                    </p>
                  </div>

                  {/* Booking details card */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-left space-y-3 max-w-sm mx-auto">
                    <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <span className="font-mono text-xs font-bold text-zinc-900">
                        {createdEvent.slot} - {new Date(createdEvent.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-500 font-light leading-relaxed">
                      Sua vaga foi pré-bloqueada no banco de dados para evitar conflitos de horários.
                    </div>

                    <button
                      onClick={handleWhatsAppNotify}
                      className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-mono text-[10px] font-bold py-3 uppercase tracking-widest transition-all rounded-xl cursor-pointer shadow-md"
                    >
                      Notificar no WhatsApp
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-zinc-100 flex justify-center">
                    <button
                      onClick={handleClose}
                      className="bg-zinc-950 hover:bg-zinc-900 text-white font-mono text-xs font-bold px-8 py-3.5 uppercase tracking-widest transition-all rounded-xl cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}

              {/* ADMIN MODE: CONTROLLER FOR GUILHERME */}
              {step === 'admin' && (
                <div className="space-y-6">
                  {/* Status Profile */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-display font-black text-sm">
                        G
                      </div>
                      <div>
                        <h4 className="font-display font-black text-sm text-zinc-950 uppercase tracking-tight">Guilherme C. Rossi</h4>
                        <span className="font-mono text-[9px] text-zinc-400 block">{user?.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleLogoutAdmin}
                      className="p-1.5 border border-zinc-200 hover:border-red-200 hover:text-red-600 rounded-lg transition-colors bg-white text-zinc-400"
                      title="Sair do Modo Admin"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      disabled={isSyncing}
                      onClick={handleAdminSync}
                      className="w-full inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400 text-white font-mono text-xs font-bold py-4 uppercase tracking-widest transition-all rounded-xl cursor-pointer shadow-md border-t border-zinc-800"
                    >
                      {isSyncing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>{isSyncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR AGORA COM GOOGLE AGENDA'}</span>
                    </button>
                    <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
                      Isso atualizará os horários ocupados no site e enviará convites automáticos com salas do <strong>Google Meet</strong> para novos agendamentos!
                    </p>
                  </div>

                  {/* Sync logs output console */}
                  {syncLogs.length > 0 && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-zinc-300 space-y-1 max-h-36 overflow-y-auto shadow-inner select-text">
                      <div className="text-zinc-500 border-b border-zinc-800 pb-1 mb-1.5 uppercase font-bold text-[9px]">Console de Sincronização:</div>
                      {syncLogs.map((log, idx) => (
                        <div key={idx} className={log.includes('✔') ? 'text-emerald-400 font-bold' : log.includes('❌') ? 'text-red-500 font-bold' : 'text-zinc-350'}>
                          {log}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recent Bookings List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Todos os Agendamentos no Banco ({allBookings.length})</span>
                      <button 
                        onClick={loadAllBookings}
                        className="font-mono text-[9px] text-red-600 hover:underline font-bold uppercase"
                      >
                        Recarregar
                      </button>
                    </div>

                    {isLoadingBookings ? (
                      <div className="text-center py-6">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
                      </div>
                    ) : allBookings.length === 0 ? (
                      <div className="text-center py-6 text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
                        Nenhum agendamento registrado até o momento.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
                        {allBookings.map((b) => {
                          const dateObj = new Date(b.date);
                          const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                          return (
                            <div key={b.id} className="bg-zinc-50 border border-zinc-200/80 p-3.5 rounded-xl space-y-2 text-xs flex flex-col justify-between select-text">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-bold text-zinc-900">{b.name}</h5>
                                  <span className="text-[10px] text-zinc-500 font-mono block">{b.company} ({b.url})</span>
                                </div>
                                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                                  b.synced 
                                    ? 'bg-emerald-50 border border-emerald-150 text-emerald-600'
                                    : 'bg-amber-50 border border-amber-150 text-amber-600'
                                }`}>
                                  {b.synced ? 'Sincronizado' : 'Pendente'}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center justify-between text-[10px] pt-1.5 border-t border-zinc-150 gap-2">
                                <div className="font-mono text-zinc-600 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-400" />
                                  <span>{dateStr} às {b.slot}</span>
                                </div>
                                <div className="text-zinc-500 font-light">{b.email}</div>
                              </div>
                              {b.synced && b.meetLink && (
                                <a 
                                  href={b.meetLink}
                                  target="_blank"
                                  className="mt-1 w-full inline-flex items-center justify-center gap-1 text-[9px] font-mono font-bold py-1.5 bg-white border border-emerald-150 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors uppercase"
                                >
                                  <Video className="w-3 h-3 text-emerald-500 animate-pulse" />
                                  Entrar no Google Meet
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-zinc-100 flex justify-end">
                    <button
                      onClick={() => setStep('date-time')}
                      className="bg-zinc-100 hover:bg-zinc-150 text-zinc-800 font-mono text-xs font-bold px-6 py-3 uppercase tracking-widest transition-all rounded-xl cursor-pointer border border-zinc-200"
                    >
                      Ver Modo Cliente
                    </button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
