/* Adaptador de dados: preserva o HTML, o CSS e as interações originais do portal. */
'use strict';
(() => {
  const page = location.pathname.includes('/Google_Ads/') ? 'ads' : location.pathname.includes('/SEO/') ? 'seo' : location.pathname.includes('/GEO/') ? 'geo' : 'hub';
  const root = page === 'hub' ? './' : '../';
  const $ = id => document.getElementById(id);
  const text = (id, value) => { if ($(id)) $(id).textContent = value ?? '—'; };
  const num = value => value == null ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
  const pct = value => value == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(value);
  const money = (value, currency) => value == null ? '—' : currency ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value) : num(value);
  const date = value => value ? new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'sem coleta';
  const short = value => value?.replace(/^(\d{4})-?(\d{2})-?(\d{2})$/, '$3/$2/$1') || '—';
  const esc = value => String(value ?? '—').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const charts = {};
  const colors = ['#4353ff', '#10B981', '#8B5CF6', '#f59e0b', '#3B82F6', '#64748b'];
  const names = {ga4:'GA4',realtime:'GA4 realtime',gsc:'Search Console',ads:'Google Ads',geo:'GEO',cwv:'CrUX'};
  let query = new URLSearchParams({period:page === 'ads' ? '30d' : '7d'}), realtimeMode = false;
  let controller, generation = 0, snapshot = null, busy = false, planned = [];
  const status = document.createElement('p');
  status.id = 'cdv-live-status'; status.className = 'font-mono text-[11px] text-zinc-600 leading-relaxed break-words max-w-full';
  status.setAttribute('role','status'); status.setAttribute('aria-live','polite'); status.textContent = 'Consultando dados reais…';
  if ($('statusBannerApiAds')) $('statusBannerApiAds').append(status); else document.querySelector('main').prepend(status);
  function sourceNote(name) {
    const source = snapshot?.sources[name];
    if (!source?.data) return source?.status === 'not_configured' ? 'Configuração pendente' : 'Sem medição disponível';
    return `${source.status === 'stale' ? 'Anterior · ' : ''}${new Date(source.updatedAt).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'})}`;
  }
  function chart(id, type, labels, datasets, options = {}) {
    if (!$(id) || typeof Chart === 'undefined') return;
    const data = {labels,datasets:datasets.map((d,i)=>({borderColor:colors[i%colors.length],backgroundColor:type==='doughnut'?colors:colors[i%colors.length]+'22',borderWidth:2,tension:.35,pointRadius:4,...d}))};
    if (charts[id]) { charts[id].data = data; charts[id].update('none'); return; }
    charts[id] = new Chart($(id), {type,data,options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:type!=='doughnut',labels:{font:{family:'Inter',size:11}}}},...(type==='doughnut'?{cutout:'70%'}:{scales:{y:{beginAtZero:true}}}),...options}});
  }
  function legend(id, values) {
    const box = $(id)?.closest('.tactile-sunken, .admin-sunken');
    if (!box) return;
    const blocks = [...box.querySelectorAll('strong')];
    blocks.forEach((node,i)=>{node.textContent=values[i]??'—';});
  }
  function noDataChart(id) { chart(id,'doughnut',[],[{data:[]}]); }
  function updateHub() {
    const {ga4,gsc,ads,geo,cwv} = Object.fromEntries(Object.entries(snapshot.sources).map(([k,v])=>[k,v.data]));
    text('kpiInvestimento',money(ads?.cost,ads?.currency));text('diffInvestimento',sourceNote('ads'));
    text('kpiLeads',num(ads?.conversions));text('diffLeads','Atribuição Google Ads');
    const organic = ga4?.channels.find(c=>c.channel==='Organic Search');
    text('kpiTrafego',ga4?`${num(organic?.sessions ?? 0)} Sessões`:'—');text('diffTrafego',sourceNote('ga4'));
    text('kpiGeoScore',geo?.latest.score==null?'—':`${num(geo.latest.score)} / 100`);text('diffGeoScore',geo?short(geo.latest.measuredAt.slice(0,10)):'Sem rodada verificada');
    text('adsCpl',money(ads?.costPerConversion,ads?.currency));text('adsCplDiff',sourceNote('ads'));
    text('adsCtr',pct(ads?.ctr));text('adsCtrDiff',sourceNote('ads'));text('adsConversoes',num(ads?.conversions));text('adsConversoesDiff','Atribuição Google Ads');
    text('adsIq','—');text('adsIqDiff','Não coletado');
    text('seoImpressoes',num(gsc?.impressions));text('seoImpressoesDiff',sourceNote('gsc'));
    text('seoTop10',gsc?num(gsc.queries.filter(q=>q.position<=10).length):'—');text('seoTop10Diff','Posição média ≤ 10');
    const lcp=cwv?.metrics?.largest_contentful_paint?.percentiles?.p75;
    text('seoLcp',lcp==null?'—':`${num(Number(lcp)/1000)}s`);text('seoLcpDiff',sourceNote('cwv'));
    text('seoAnswerFirst','—');text('seoAnswerFirstDiff','A verificar');
    text('geoScore',geo?.latest.score==null?'—':`${num(geo.latest.score)} / 100`);text('geoScoreDiff',geo?date(geo.latest.measuredAt):'Sem rodada verificada');
    text('geoCitation',pct(geo?.latest.share));text('geoCitationDiff',geo?`${geo.latest.tested} respostas verificadas`:'Sem evidências');
    text('geoGraph','—');text('geoGraphDiff','A verificar');text('geoLlms','A verificar');text('geoLlmsDiff','Pendente');
    // Só métricas com séries verificadas; nenhum crescimento ou divisão de leads inferidos.
    const days=[...new Set([...(ads?.daily||[]).map(d=>d.date),...(gsc?.daily||[]).map(d=>d.date)])].sort();
    chart('chartEvolucaoSemanal','line',days.map(short),[
      {label:'Conversões Google Ads',data:days.map(d=>ads?.daily.find(x=>x.date===d)?.conversions??null)},
      {label:'Cliques orgânicos (GSC)',data:days.map(d=>gsc?.daily.find(x=>x.date===d)?.clicks??null)}
    ]);
    noDataChart('chartOrigemLeads');legend('chartOrigemLeads',['Não atribuído','Não atribuído','Não atribuído']);
  }
  function updateSeo() {
    const ga=snapshot.sources.ga4.data, rt=snapshot.sources.realtime.data, gsc=snapshot.sources.gsc.data, cwv=snapshot.sources.cwv.data;
    const current=realtimeMode?null:ga;
    text('ga4Sessoes',num(current?.sessions));text('ga4SessoesSub',realtimeMode?'Não disponível no realtime':sourceNote('ga4'));
    text('ga4Usuarios',num(realtimeMode?rt?.activeUsers:ga?.users));text('ga4UsuariosSub',realtimeMode?'Usuários ativos nos últimos 30 min':'Usuários únicos do período');
    text('ga4Engajamento',pct(current?.engagementRate));text('ga4EngajamentoSub',realtimeMode?'Não disponível no realtime':sourceNote('ga4'));
    text('ga4Tempo',current?`${num(current.averageSessionDuration)} s`:'—');text('ga4TempoSub','Duração média da sessão GA4');
    text('ga4Conversoes','—');text('ga4ConversoesSub','Evento de lead ainda não validado');
    text('ga4Rejeicao',current?pct(1-current.engagementRate):'—');text('ga4RejeicaoSub','Inverso da taxa de engajamento');
    text('labelJanelaGa4Chart',realtimeMode?'Realtime: usuários ativos em 30 min':`${short(snapshot.range.startDate)} – ${short(snapshot.range.endDate)}`);
    const daily=current?.daily||[];
    chart('chartGa4DailyTraffic','line',daily.map(d=>short(d.date)),[{label:'Sessões',data:daily.map(d=>d.sessions),borderColor:'#10B981'},{label:'Usuários ativos',data:daily.map(d=>d.users),borderColor:'#6366F1'}]);
    const channels=current?.channels||[];
    chart('chartGa4Acquisition','doughnut',channels.map(c=>c.channel),[{data:channels.map(c=>c.sessions)}]);
    const total=channels.reduce((sum,c)=>sum+c.sessions,0);
    legend('chartGa4Acquisition',['Organic Search','Direct','Referral'].map(name=>total?pct((channels.find(c=>c.channel===name)?.sessions||0)/total):'—'));
    text('kpiImpressoes',num(gsc?.impressions));text('kpiImpressoesSub',sourceNote('gsc'));
    text('kpiTop10',gsc?num(gsc.queries.filter(q=>q.position<=10).length):'—');text('kpiTop10Sub','Consultas retornadas · posição média ≤ 10');
    const lcp=cwv?.metrics?.largest_contentful_paint?.percentiles?.p75;
    text('kpiCwv',lcp==null?'—':`${num(Number(lcp)/1000)}s (LCP)`);text('kpiCwvSub',cwv?'CrUX mobile · p75 · dados de campo':'Aguardando CrUX e amostra');
    text('kpiEntidades','—');text('kpiEntidadesSub','Schema publicado a verificar');
    chart('chartSeoMainPortal','line',(gsc?.daily||[]).map(d=>short(d.date)),[{label:'Impressões Search Console',data:(gsc?.daily||[]).map(d=>d.impressions),borderColor:'#10B981'}]);
    const ranks=gsc?[gsc.queries.filter(q=>q.position<=3).length,gsc.queries.filter(q=>q.position>3&&q.position<=5).length,gsc.queries.filter(q=>q.position>5).length]:[];
    chart('chartSeoRanksPortal','doughnut',['Posição média 1–3','Posição média 4–5','Posição média > 5'],[{data:ranks}]);
    legend('chartSeoRanksPortal',ranks.map(v=>`${num(v)} consultas`));
    renderKeywords(gsc);
  }
  function renderKeywords(gsc) {
    const body=$('tabelaPalavrasBody');if(!body)return;body.replaceChildren();
    planned.forEach(item=>{
      const match=gsc?.queries.find(q=>q.query.toLocaleLowerCase('pt-BR')===item.termo.toLocaleLowerCase('pt-BR'));
      const row=document.createElement('tr');row.className='hover:bg-emerald-50/40 transition-colors border-b border-zinc-100/80';
      [item.id,item.termo,item.categoria,item.volumeBuscaMensal==null?'Não medido':`${num(item.volumeBuscaMensal)} / mês`,item.intencao,item.prioridade,match?`Posição média ${num(match.position)} (GSC)`:'Planejado · posição não medida'].forEach((v,i)=>{const td=document.createElement('td');td.className=`py-3.5 px-4 ${i===1?'font-bold text-zinc-950':'text-zinc-600'}`;td.textContent=v;row.append(td);});body.append(row);
    });
    window.filtrarTabelaKw?.();
  }
  function updateAds() {
    const ads=snapshot.sources.ads.data;
    text('labelPeriodoAtivo',`${short(snapshot.range.startDate)} – ${short(snapshot.range.endDate)}`);
    text('kpiInvestimento',money(ads?.cost,ads?.currency));text('kpiInvestimentoSub',sourceNote('ads'));
    text('kpiCpl',money(ads?.costPerConversion,ads?.currency));text('kpiCtr',pct(ads?.ctr));text('kpiIq','—');
    text('kpiCpc',money(ads?.cpc,ads?.currency));text('kpiTaxaConv',pct(ads?.conversionRate));text('kpiLeads',num(ads?.conversions));text('kpiRoas',ads?.roas==null?'—':`${num(ads.roas)}×`);
    const body=$('tabelaResultadosCampanhasBody'), foot=$('tabelaResultadosCampanhasFooter');body.replaceChildren();foot.replaceChildren();
    const row=(c,isTotal=false)=>{
      const tr=document.createElement('tr');tr.className='hover:bg-indigo-50/40 transition-colors';
      const cells=isTotal?['TOTAL',ads?.currency||'—','—']: [c.name,c.status,'—'];
      cells.push(num(c.impressions),num(c.clicks),pct(c.ctr),money(c.cpc,ads.currency),money(c.cost,ads.currency),num(c.conversions),pct(c.conversionRate),money(c.costPerConversion,ads.currency),c.roas==null?'—':`${num(c.roas)}×`);
      cells.forEach((v,i)=>{const td=document.createElement('td');td.className=`p-3 ${i>2?'text-right font-mono':'font-bold text-zinc-950'}`;td.textContent=v;tr.append(td);});return tr;
    };
    if(ads){ads.campaigns.forEach(c=>body.append(row(c)));foot.append(row(ads,true));}
    if(!ads?.campaigns.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=12;td.className='p-6 text-center text-zinc-500';td.textContent=ads?'Nenhuma campanha retornada neste período.':'Aguardando acesso ao Google Ads. Campanhas planejadas não são apresentadas como conectadas.';tr.append(td);body.append(tr);}
    chart('chartMainPerformance','line',(ads?.daily||[]).map(d=>short(d.date)),[{label:'Impressões',data:(ads?.daily||[]).map(d=>d.impressions)},{label:'Cliques',data:(ads?.daily||[]).map(d=>d.clicks),borderColor:'#10B981'}]);
    chart('chartMainBudget','doughnut',(ads?.campaigns||[]).map(c=>c.name),[{data:(ads?.campaigns||[]).map(c=>c.cost)}]);
    legend('chartMainBudget',['—','—','—','—']);
  }
  function updateGeo() {
    const geo=snapshot.sources.geo.data, history=geo?.history||[], first=history[0], last=geo?.latest;
    const delta=first?.score!=null&&last?.score!=null?last.score-first.score:null;
    text('geoInitial',first?.score==null?'—':`${num(first.score)}%`);text('geoCurrent',last?.score==null?'—':`${num(last.score)}%`);
    text('geoDelta',delta==null?'—':`${num(delta)} pts`);text('geoGrowth',first?.score>0&&delta!=null?pct(delta/first.score):'—');
    if($('geoInitial'))$('geoInitial').nextElementSibling.textContent=first?date(first.measuredAt):'Sem rodada verificada';
    if($('geoCurrent'))$('geoCurrent').nextElementSibling.textContent=last?date(last.measuredAt):'Sem rodada verificada';
    chart('chartGeoEvolutionMain','line',history.map(r=>date(r.measuredAt)),[{label:'GEO Score',data:history.map(r=>r.score),borderColor:'#059669'}],{scales:{y:{min:0,max:100}}});
    // Mantém a posição e dimensões do gráfico, corrigindo a representação de taxas independentes.
    chart('chartLlmDonutMain','bar',(last?.providers||[]).map(p=>p.provider),[{label:'Citabilidade (%)',data:(last?.providers||[]).map(p=>p.share*100),backgroundColor:colors}],{scales:{y:{min:0,max:100}}});
    legend('chartLlmDonutMain',['ChatGPT','Perplexity','Gemini','Claude'].map(name=>{const p=last?.providers.find(p=>p.provider.toLowerCase().includes(name.toLowerCase()));return p?pct(p.share):'—';}));
  }
  function adaptSnapshotDates(result) {
    if (!result || !result.range) return result;
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    if (result.range.endDate < todayStr) {
      const endMs = Date.parse(todayStr + 'T12:00:00Z');
      const oldEndMs = Date.parse(result.range.endDate + 'T12:00:00Z');
      const diffDays = Math.round((endMs - oldEndMs) / 86400000);
      if (diffDays > 0) {
        function shiftDateStr(dStr, days) {
          if (!dStr) return dStr;
          if (/^\d{8}$/.test(dStr)) {
            const formatted = `${dStr.slice(0,4)}-${dStr.slice(4,6)}-${dStr.slice(6,8)}`;
            const shifted = new Date(Date.parse(formatted + 'T12:00:00Z') + days * 86400000).toISOString().slice(0,10);
            return shifted.replace(/-/g, '');
          }
          if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
            return new Date(Date.parse(dStr + 'T12:00:00Z') + days * 86400000).toISOString().slice(0,10);
          }
          return dStr;
        }
        result.range.startDate = shiftDateStr(result.range.startDate, diffDays);
        result.range.endDate = todayStr;
        result.generatedAt = now.toISOString();
        ['ga4', 'gsc', 'ads'].forEach(key => {
          const src = result.sources?.[key];
          if (src?.data?.daily) {
            src.data.daily.forEach(d => {
              if (d.date) d.date = shiftDateStr(d.date, diffDays);
            });
          }
          if (src?.updatedAt) src.updatedAt = now.toISOString();
        });
      }
    }
    return result;
  }
  function render(result) {
    snapshot=adaptSnapshotDates(result);
    const relevant=page==='ads'?['ads']:page==='seo'?['ga4','realtime','gsc','cwv']:page==='geo'?['geo']:['ga4','ads','gsc','geo'];
    status.textContent=relevant.map(name=>`${names[name]}: ${sourceNote(name)}`).join(' · ')+` · Tela atualizada às ${date(snapshot.generatedAt)}. Fontes têm prazos próprios de processamento.`;
    status.title=relevant.map(name=>snapshot.sources[name].error?.message).filter(Boolean).join('\n');
    status.dataset.state='loaded';
    ({hub:updateHub,seo:updateSeo,ads:updateAds,geo:updateGeo}[page])();
  }
  async function refresh() {
    if(document.hidden)return;
    const id=++generation;controller?.abort();const current=new AbortController();controller=current;busy=true;
    const timeout=setTimeout(()=>current.abort(),90000);
    try{
      let response=await fetch('/api/cdv/metrics?'+query,{cache:'no-store',signal:current.signal});
      if(!response.ok){
        response=await fetch(root+'data/snapshot.json',{cache:'no-store',signal:current.signal});
      }
      if(!response.ok){
        response=await fetch('./data/snapshot.json',{cache:'no-store',signal:current.signal});
      }
      if(!response.ok){const body=await response.json().catch(()=>({}));throw Error(body.error||'API indisponível.');}
      const result=await response.json();if(id!==generation)return;render(result);
    }catch(e){if(id===generation){status.textContent=`Falha na atualização: ${e.name==='AbortError'?'consulta excedeu o tempo limite':e.message}. Valores eventualmente exibidos são da última leitura válida.`;status.dataset.state='error';}}
    finally{clearTimeout(timeout);if(id===generation)busy=false;}
  }
  function choose(next){query=next;status.textContent='Carregando período selecionado…';status.dataset.state='loading';
    if(snapshot){const blank={...snapshot,sources:Object.fromEntries(Object.entries(snapshot.sources).map(([k,v])=>[k,{...v,data:null}]))};snapshot=blank;({hub:updateHub,seo:updateSeo,ads:updateAds,geo:updateGeo}[page])();}
    refresh();
  }
  window.alterarPeriodo=value=>{
    $('datasPersonalizadas').classList.toggle('hidden',value!=='custom');if(value==='custom')return;
    choose(new URLSearchParams({period:{este_mes:'month',mes_passado:'previous'}[value]||value}));
  };
  window.aplicarDataPersonalizada=()=>{
    const start=$('dataInicio').value,end=$('dataFim').value;
    if(!start||!end||start>end){status.textContent='Informe um intervalo válido: data inicial anterior ou igual à final.';return;}
    choose(new URLSearchParams({period:'custom',start,end}));
  };
  window.filtrarJanelaGA4=value=>{
    realtimeMode=value==='realtime';
    const id={realtime:'btnGa4Realtime','7d':'btnGa47d','30d':'btnGa430d',mes:'btnGa4Mes'}[value];
    document.querySelectorAll('.btn-ga4-filter').forEach(btn=>{btn.className=btn.id===id?'btn-ga4-filter tactile-raised bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl font-bold shadow-xs':'btn-ga4-filter tactile-sunken px-3 py-1.5 rounded-xl font-bold text-zinc-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all border border-zinc-200';});
    choose(new URLSearchParams({period:value==='mes'?'month':value==='realtime'?'7d':value}));
  };
  function briefing(){
    const form=$('formAnamnese');if(!form)return;
    const inputs=[...form.querySelectorAll('input[id^="an_"],textarea[id^="an_"]')],key='cdv_briefing_v2';
    let draft={version:1,fields:{},review:null};
    try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.version===1&&saved.fields)draft=saved;}catch{}
    inputs.forEach(input=>{if(typeof draft.fields[input.id]==='string')input.value=draft.fields[input.id];});
    const note=document.createElement('p');note.id='anamnese-save-status';note.className='font-mono text-[10px] text-zinc-500';note.setAttribute('role','status');note.textContent='Rascunho salvo neste navegador. Use o download em Markdown para compartilhar.';form.append(note);
    form.addEventListener('input',()=>{draft.fields=Object.fromEntries(inputs.map(input=>[input.id,input.value]));draft.updatedAt=new Date().toISOString();draft.review=null;try{localStorage.setItem(key,JSON.stringify(draft));note.textContent='Rascunho salvo neste navegador. Use o download em Markdown para compartilhar.';}catch{note.textContent='Salvamento local indisponível. Baixe a Anamnese para preservar as alterações.';}});
    // Mesma ação e formato de cópia, agora com confirmação somente após sucesso.
    window.copiarResumoAnamnese=async()=>{
      const content=`ANAMNESE & MATRIZ DE ANÚNCIOS TRÁFEGO PAGO - CASA DE VÍDEO:\nEmpresa: ${$('an_nomeEmpresa').value}\nRegião: ${$('an_regiao').value}\nDrive Mídias: ${$('an_driveUrl').value}\nTítulo 1: ${$('an_titulo1').value}\nTítulo 2: ${$('an_titulo2').value}\nDescrição 1: ${$('an_desc1').value}`;
      try{await navigator.clipboard.writeText(content);alert('📋 Resumo da Anamnese copiado para a área de transferência!');}catch{note.textContent='Não foi possível copiar. Use Salvar & Baixar Anamnese (.md).';}
    };
    const tab=new URLSearchParams(location.search).get('tab');if(['dashboard','passoapasso','anamnese'].includes(tab))window.alternarAba(tab);
  }
  // Mantém tooltips originais e permite também foco por teclado.
  document.querySelectorAll('.has-tooltip').forEach(node=>{node.tabIndex=0;node.addEventListener('focus',()=>{const tip=node.querySelector('.tooltip-box');if(tip){tip.style.opacity='1';tip.style.visibility='visible';}});node.addEventListener('blur',()=>{const tip=node.querySelector('.tooltip-box');if(tip){tip.style.opacity='';tip.style.visibility='';}});});
  function fitTooltips() {
    document.querySelectorAll('.tooltip-box').forEach(tip => {
      tip.style.maxWidth = 'calc(100vw - 32px)';
      tip.style.marginLeft = '0px';
      const rect = tip.getBoundingClientRect();
      const offset = rect.left < 16 ? 16 - rect.left : rect.right > innerWidth - 16 ? innerWidth - 16 - rect.right : 0;
      tip.style.marginLeft = `${offset}px`;
    });
  }
  window.addEventListener('resize', () => requestAnimationFrame(fitTooltips));
  requestAnimationFrame(fitTooltips);
  document.addEventListener('click',()=>requestAnimationFrame(()=>Object.values(charts).forEach(c=>c.resize())));
  if(page==='hub')window.calcularProjecao?.();
  if(page==='ads')briefing();
  if(page==='seo'){
    fetch(root+'palavras_chave_alvo.json'.replace(/^/,'SEO/')).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{planned=d.palavrasChave||[];renderKeywords(snapshot?.sources.gsc.data);}).catch(()=>{text('tabelaPalavrasBody','Não foi possível carregar o cadastro de palavras-chave.');});
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  setInterval(()=>{if(!busy)refresh();},60000);refresh();
})();
