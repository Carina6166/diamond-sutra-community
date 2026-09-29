(() => {
  const S = window.SUTRA_DATA;
  const C = window.APP_CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const todayKey = () => new Date().toISOString().slice(0,10);
  const pad = n => String(n).padStart(2,'0');
  const state = {
    tab: 'today',
    lang: localStorage.getItem('ds_lang') || 'simp',
    nickname: localStorage.getItem('ds_nickname') || '法友',
    fontSize: Number(localStorage.getItem('ds_font') || 18),
    reminder: localStorage.getItem('ds_reminder') || '07:30',
    chapter: Number(localStorage.getItem('ds_chapter') || 1),
    timerSeconds: 0,
    timerRunning: false,
    timerHandle: null,
    monthOffset: 0,
    deferredInstall: null,
    cloud: { enabled:false, client:null, userId:null }
  };

  const strings = {
    simp: {
      navToday:'今日', navRead:'读诵', navCheckin:'打卡', navGroup:'共修', navMe:'我的',
      daily:'每日读诵 · 共修', title:'金刚经', today:'今日', streak:'连续天数', month:'本月打卡', total:'累计读诵',
      days:'天', times:'次', task:'今日功课', begin:'开始读诵', zoom:'每周三线上共学', canada:'加拿大', central:'美国中部',
      joinZoom:'打开 Zoom', copyInfo:'复制会议信息', read:'完整经文', chapter:'选择章节', font:'字号', timer:'读诵计时',
      start:'开始', pause:'暂停', finish:'完成并打卡', opening:'开经偈', appendix:'附录 / 日课', checkin:'每日打卡', minutes:'读诵时长（分钟）', note:'心得 / 回向（仅保存在本机）', save:'完成今日打卡',
      prev:'上个月', next:'下个月', badges:'连续读诵徽章', leaderboard:'共修排行榜', localMode:'目前为个人模式。配置 Supabase 后即可显示真实共修排行榜。',
      cloudMode:'已连接共修排行榜', refresh:'刷新榜单', settings:'个人设置', nickname:'共修名', language:'经文语言', reminder:'每日提醒时间',
      calendarReminder:'添加每日提醒到日历', notify:'开启浏览器提醒', install:'安装到手机主屏幕', export:'导出打卡数据', import:'导入打卡数据',
      share:'分享到微信 / 朋友', shareCopied:'链接已复制，可粘贴到微信发送', copied:'已复制', saved:'已打卡，随喜！', noUrl:'部署到公开网址后即可分享链接。',
      unlocked:'已解锁', locked:'未解锁', source:'经文依据用户提供的中台禅寺《金刚般若波罗蜜经》版本整理，中文为鸠摩罗什译本。',
      reminderTip:'网页关闭后，普通浏览器无法保证后台定时提醒；“添加到日历”是最稳妥的每日提醒方式。', sync:'同步到共修榜', synced:'已同步', cloudError:'共修榜暂时无法连接'
    },
    trad: {
      navToday:'今日', navRead:'讀誦', navCheckin:'打卡', navGroup:'共修', navMe:'我的',
      daily:'每日讀誦 · 共修', title:'金剛經', today:'今日', streak:'連續天數', month:'本月打卡', total:'累計讀誦',
      days:'天', times:'次', task:'今日功課', begin:'開始讀誦', zoom:'每週三線上共學', canada:'加拿大', central:'美國中部',
      joinZoom:'打開 Zoom', copyInfo:'複製會議資訊', read:'完整經文', chapter:'選擇章節', font:'字號', timer:'讀誦計時',
      start:'開始', pause:'暫停', finish:'完成並打卡', opening:'開經偈', appendix:'附錄 / 日課', checkin:'每日打卡', minutes:'讀誦時長（分鐘）', note:'心得 / 回向（僅保存在本機）', save:'完成今日打卡',
      prev:'上個月', next:'下個月', badges:'連續讀誦徽章', leaderboard:'共修排行榜', localMode:'目前為個人模式。配置 Supabase 後即可顯示真實共修排行榜。',
      cloudMode:'已連接共修排行榜', refresh:'刷新榜單', settings:'個人設定', nickname:'共修名', language:'經文語言', reminder:'每日提醒時間',
      calendarReminder:'加入每日提醒到行事曆', notify:'開啟瀏覽器提醒', install:'安裝到手機主畫面', export:'匯出打卡資料', import:'匯入打卡資料',
      share:'分享到微信 / 朋友', shareCopied:'連結已複製，可貼到微信傳送', copied:'已複製', saved:'已打卡，隨喜！', noUrl:'部署到公開網址後即可分享連結。',
      unlocked:'已解鎖', locked:'未解鎖', source:'經文依據使用者提供的中台禪寺《金剛般若波羅蜜經》版本整理，中文為鳩摩羅什譯本。',
      reminderTip:'網頁關閉後，普通瀏覽器無法保證背景定時提醒；「加入行事曆」是最穩妥的每日提醒方式。', sync:'同步到共修榜', synced:'已同步', cloudError:'共修榜暫時無法連接'
    }
  };
  const t = k => strings[state.lang][k] || k;

  function getCheckins(){ try{return JSON.parse(localStorage.getItem('ds_checkins')||'{}')}catch{return{}} }
  function setCheckins(v){ localStorage.setItem('ds_checkins',JSON.stringify(v)); }
  function getNotes(){ try{return JSON.parse(localStorage.getItem('ds_notes')||'{}')}catch{return{}} }
  function setNotes(v){ localStorage.setItem('ds_notes',JSON.stringify(v)); }
  function dateFromKey(k){ const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d); }
  function keyFromDate(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
  function sortedCheckinKeys(){ return Object.keys(getCheckins()).filter(k=>getCheckins()[k]?.done).sort(); }
  function currentStreak(){
    const c=getCheckins(); let d=new Date(); let streak=0;
    const today=todayKey();
    if(!c[today]?.done){ d.setDate(d.getDate()-1); }
    while(true){ const k=keyFromDate(d); if(c[k]?.done){streak++; d.setDate(d.getDate()-1);} else break; }
    return streak;
  }
  function maxStreak(){
    const ks=sortedCheckinKeys(); if(!ks.length) return 0; let max=1,cur=1;
    for(let i=1;i<ks.length;i++){
      const a=dateFromKey(ks[i-1]), b=dateFromKey(ks[i]);
      const diff=Math.round((b-a)/86400000); if(diff===1){cur++;max=Math.max(max,cur)}else cur=1;
    }
    return max;
  }
  function monthCount(){ const p=todayKey().slice(0,7); return sortedCheckinKeys().filter(k=>k.startsWith(p)).length; }
  function totalCount(){ return sortedCheckinKeys().length; }
  function totalMinutes(){ return Object.values(getCheckins()).reduce((a,v)=>a+(v?.minutes||0),0); }
  function dailyQuote(){ const q=S.quotes[state.lang]; const d=new Date(); const seed=Number(`${d.getFullYear()}${d.getMonth()+1}${d.getDate()}`); return q[seed%q.length]; }
  function formatDate(){ return new Intl.DateTimeFormat(state.lang==='trad'?'zh-Hant':'zh-Hans',{weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(new Date()); }
  function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(el._to); el._to=setTimeout(()=>el.classList.remove('show'),2200); }
  function escapeHtml(s=''){ return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function textWithBreaks(s=''){ return escapeHtml(s).replace(/•/g,'<span class="sep"> · </span>').replace(/\n/g,'<br>'); }

  function updateChrome(){
    document.documentElement.lang=state.lang==='trad'?'zh-Hant':'zh-Hans';
    document.documentElement.style.setProperty('--fs',`${state.fontSize}px`);
    $('#headerEyebrow').textContent=t('daily'); $('#headerTitle').textContent=t('title');
    $('#langBtn').textContent=state.lang==='simp'?'繁':'简';
    $$('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
    $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));
  }

  function render(){ updateChrome(); const fn={today:renderToday,read:renderRead,checkin:renderCheckin,group:renderGroup,profile:renderProfile}[state.tab]; fn(); }

  function renderToday(){
    const view=$('#view'); const streak=currentStreak(); const checked=getCheckins()[todayKey()]?.done;
    view.innerHTML=`
      <section class="card hero">
        <div class="date">${formatDate()}</div>
        <p class="quote">${textWithBreaks(dailyQuote())}</p>
        <div class="quote-note">${state.lang==='trad'?'今日一句':'今日一句'}</div>
      </section>
      <div class="stats">
        <div class="stat"><strong>${streak}</strong><span>${t('streak')}</span></div>
        <div class="stat"><strong>${monthCount()}</strong><span>${t('month')}</span></div>
        <div class="stat"><strong>${totalCount()}</strong><span>${t('total')}</span></div>
      </div>
      <div class="section-title">${t('task')}</div>
      <section class="card">
        <div class="row between"><div><b>${checked ? (state.lang==='trad'?'今日已完成':'今日已完成') : (state.lang==='trad'?'今日尚未打卡':'今日尚未打卡')}</b><div class="muted">${state.lang==='trad'?'完整讀誦或按自己的功課安排':'完整读诵或按自己的功课安排'}</div></div><span class="pill">${checked?'✓':'○'}</span></div>
        <div class="divider"></div>
        <div class="row"><button class="primary grow" id="beginRead">${t('begin')}</button><button class="secondary" id="goCheckin">${t('navCheckin')}</button></div>
      </section>
      <div class="section-title">${t('zoom')}</div>
      ${zoomCard()}
      <section class="card">
        <div class="row between"><div><b>${t('reminder')}</b><div class="muted">${state.reminder}</div></div><button class="ghost" id="calendarReminderToday">${t('calendarReminder')}</button></div>
      </section>
      <div class="source">${t('source')}</div>
    `;
    $('#beginRead').onclick=()=>go('read'); $('#goCheckin').onclick=()=>go('checkin'); $('#calendarReminderToday').onclick=downloadIcs;
    bindZoom();
  }

  function zoomCard(){ const z=C.zoom; return `<section class="card">
    <div class="zoom-title">${state.lang==='trad'?z.labelTrad:z.labelSimp}</div>
    <div class="muted">🇨🇦 ${t('canada')}：${z.canada}<br>🇺🇸 ${t('central')}：${z.central}</div>
    <div class="divider"></div><div class="muted">Meeting ID: ${z.meetingId}<br>Passcode: ${z.passcode}</div>
    <div class="row" style="margin-top:12px"><button class="primary" id="openZoom">${t('joinZoom')}</button><button class="secondary" id="copyZoom">${t('copyInfo')}</button></div>
  </section>`; }
  function bindZoom(){
    $('#openZoom')?.addEventListener('click',()=>window.open(C.zoom.url,'_blank','noopener'));
    $('#copyZoom')?.addEventListener('click',()=>copyText(`${C.zoom.url}\nMeeting ID: ${C.zoom.meetingId}\nPasscode: ${C.zoom.passcode}`));
  }

  function renderRead(){
    const chapters=S.chapters, c=chapters.find(x=>x.no===state.chapter)||chapters[0]; const trad=state.lang==='trad';
    const op=S.opening[state.lang]; const lit=S.liturgy;
    $('#view').innerHTML=`
      <div class="reading-toolbar">
        <section class="card" style="margin-bottom:8px;padding:12px">
          <div class="row">
            <div class="grow"><select id="chapterSelect">${chapters.map(x=>`<option value="${x.no}" ${x.no===state.chapter?'selected':''}>${x.no}. ${trad?x.titleTrad:x.titleSimp}</option>`).join('')}</select></div>
            <button class="ghost" id="fontMinus">A−</button><button class="ghost" id="fontPlus">A＋</button>
          </div>
        </section>
      </div>
      <section class="card">
        <div class="timer" id="timer">${formatTimer(state.timerSeconds)}</div>
        <div class="row" style="justify-content:center"><button class="${state.timerRunning?'secondary':'primary'}" id="timerToggle">${state.timerRunning?t('pause'):t('start')}</button><button class="ghost" id="finishRead">${t('finish')}</button></div>
      </section>
      <section class="card">
        <div class="section-title" style="text-align:center;margin-top:0">${t('opening')}</div>
        <div class="sutra-opening">${op.map(textWithBreaks).join('<br>')}</div>
        <div class="chapter"><h2>${trad?c.titleTrad:c.titleSimp}</h2><div class="chapter-text">${textWithBreaks(trad?c.textTrad:c.textSimp)}</div></div>
        <div class="row between" style="margin-top:24px"><button class="ghost" id="prevChapter" ${state.chapter<=1?'disabled':''}>←</button><span class="muted">${state.chapter} / 32</span><button class="ghost" id="nextChapter" ${state.chapter>=32?'disabled':''}>→</button></div>
      </section>
      <div class="section-title">${t('appendix')}</div>
      ${lit.map(x=>`<section class="card"><b>${trad?x.titleTrad:x.titleSimp}</b><div class="chapter-text" style="margin-top:10px">${textWithBreaks(trad?x.textTrad:x.textSimp)}</div></section>`).join('')}
      <div class="source">${t('source')}</div>
    `;
    $('#chapterSelect').onchange=e=>{state.chapter=Number(e.target.value);localStorage.setItem('ds_chapter',state.chapter);renderRead();window.scrollTo({top:0,behavior:'smooth'})};
    $('#fontMinus').onclick=()=>{state.fontSize=Math.max(15,state.fontSize-1);localStorage.setItem('ds_font',state.fontSize);renderRead()};
    $('#fontPlus').onclick=()=>{state.fontSize=Math.min(26,state.fontSize+1);localStorage.setItem('ds_font',state.fontSize);renderRead()};
    $('#timerToggle').onclick=toggleTimer; $('#finishRead').onclick=finishRead;
    $('#prevChapter').onclick=()=>{if(state.chapter>1){state.chapter--;localStorage.setItem('ds_chapter',state.chapter);renderRead();window.scrollTo({top:0,behavior:'smooth'})}};
    $('#nextChapter').onclick=()=>{if(state.chapter<32){state.chapter++;localStorage.setItem('ds_chapter',state.chapter);renderRead();window.scrollTo({top:0,behavior:'smooth'})}};
  }
  function formatTimer(sec){return `${pad(Math.floor(sec/3600))}:${pad(Math.floor((sec%3600)/60))}:${pad(sec%60)}`}
  function toggleTimer(){
    state.timerRunning=!state.timerRunning;
    if(state.timerRunning){ state.timerHandle=setInterval(()=>{state.timerSeconds++; const el=$('#timer'); if(el)el.textContent=formatTimer(state.timerSeconds);},1000); }
    else {clearInterval(state.timerHandle);state.timerHandle=null;}
    renderRead();
  }
  function finishRead(){ clearInterval(state.timerHandle); state.timerHandle=null; state.timerRunning=false; localStorage.setItem('ds_pending_minutes',Math.max(1,Math.round(state.timerSeconds/60))); state.timerSeconds=0; go('checkin'); }

  function renderCheckin(){
    const pending=Number(localStorage.getItem('ds_pending_minutes')||0); const c=getCheckins()[todayKey()]||{}; const notes=getNotes();
    $('#view').innerHTML=`
      <section class="card">
        <div class="row between"><div><b>${t('checkin')}</b><div class="muted">${formatDate()}</div></div><span class="pill">${c.done?'✓':''}</span></div>
        <div class="field"><label>${t('minutes')}</label><input id="minutes" type="number" min="0" max="1440" value="${c.minutes ?? pending ?? 0}"></div>
        <div class="field"><label>${t('note')}</label><textarea id="note">${escapeHtml(notes[todayKey()]||'')}</textarea></div>
        <button class="primary" id="saveCheckin" style="width:100%">${t('save')}</button>
      </section>
      ${calendarCard()}
      <section class="card"><div class="stats"><div class="stat"><strong>${currentStreak()}</strong><span>${t('streak')}</span></div><div class="stat"><strong>${totalCount()}</strong><span>${t('total')}</span></div><div class="stat"><strong>${totalMinutes()}</strong><span>${state.lang==='trad'?'總分鐘':'总分钟'}</span></div></div></section>
    `;
    $('#saveCheckin').onclick=saveCheckin; $('#prevMonth').onclick=()=>{state.monthOffset--;renderCheckin()}; $('#nextMonth').onclick=()=>{state.monthOffset++;renderCheckin()};
  }
  function saveCheckin(){
    const mins=Math.max(0,Number($('#minutes').value||0)); const c=getCheckins(); c[todayKey()]={done:true,minutes:mins,updatedAt:new Date().toISOString()}; setCheckins(c);
    const n=getNotes(); n[todayKey()]=$('#note').value.trim(); setNotes(n); localStorage.removeItem('ds_pending_minutes'); toast(t('saved')); maybeSync(todayKey()); renderCheckin();
  }
  function calendarCard(){
    const base=new Date(); base.setDate(1); base.setMonth(base.getMonth()+state.monthOffset); const y=base.getFullYear(), m=base.getMonth(); const first=new Date(y,m,1); const last=new Date(y,m+1,0); const start=(first.getDay()+6)%7; const c=getCheckins();
    const names=state.lang==='trad'?['一','二','三','四','五','六','日']:['一','二','三','四','五','六','日']; let cells=names.map(x=>`<div class="dow">${x}</div>`).join('');
    for(let i=0;i<start;i++)cells+='<div></div>';
    for(let d=1;d<=last.getDate();d++){const dt=new Date(y,m,d), k=keyFromDate(dt);cells+=`<div class="day ${c[k]?.done?'done':''} ${k===todayKey()?'today':''}">${d}</div>`}
    return `<section class="card"><div class="calendar-head"><button class="ghost" id="prevMonth">‹</button><b>${y} / ${m+1}</b><button class="ghost" id="nextMonth">›</button></div><div class="calendar">${cells}</div></section>`;
  }

  function renderGroup(){
    const max=maxStreak(); const badgeDays=[7,21,49,108];
    $('#view').innerHTML=`
      <div class="section-title">${t('badges')}</div>
      <div class="badge-grid">${badgeDays.map(n=>`<div class="badge ${max>=n?'unlocked':''}"><div class="medal">${max>=n?'🏵️':'○'}</div><b>${n} ${t('days')}</b><div class="small muted">${max>=n?t('unlocked'):t('locked')}</div></div>`).join('')}</div>
      <div class="section-title">${t('leaderboard')}</div>
      <section class="card">
        <div class="row between"><div><b>${state.cloud.enabled?t('cloudMode'):t('localMode')}</b></div><button class="ghost" id="refreshBoard">${t('refresh')}</button></div>
        <div id="board" class="leaderboard" style="margin-top:10px">${localBoardHtml()}</div>
      </section>
      <div class="section-title">${t('zoom')}</div>${zoomCard()}
    `;
    bindZoom(); $('#refreshBoard').onclick=loadLeaderboard; if(state.cloud.enabled)loadLeaderboard();
  }
  function localBoardHtml(){ return `<div class="leader-row"><div class="rank">1</div><div><b>${escapeHtml(state.nickname)}</b><div class="muted small">${state.lang==='trad'?'本機紀錄':'本机记录'}</div></div><div><b>${currentStreak()} ${t('days')}</b><div class="muted small">${totalCount()} ${t('times')}</div></div></div>`; }

  function renderProfile(){
    $('#view').innerHTML=`
      <section class="card">
        <b>${t('settings')}</b>
        <div class="field"><label>${t('nickname')}</label><input id="nickname" type="text" maxlength="20" value="${escapeHtml(state.nickname)}"></div>
        <div class="field"><label>${t('language')}</label><div class="toggle"><button id="simpBtn" class="${state.lang==='simp'?'on':''}">简体</button><button id="tradBtn" class="${state.lang==='trad'?'on':''}">繁體</button></div></div>
        <div class="field"><label>${t('reminder')}</label><input id="reminderTime" type="time" value="${state.reminder}"></div>
        <div class="row"><button class="secondary" id="calendarReminder">${t('calendarReminder')}</button><button class="ghost" id="notifyBtn">${t('notify')}</button></div>
        <div class="notice" style="margin-top:12px">${t('reminderTip')}</div>
      </section>
      <section class="card install-tip" id="installCard"><b>${t('install')}</b><div class="muted">${state.lang==='trad'?'像 App 一樣放到手機主畫面':'像 App 一样放到手机主屏幕'}</div><button class="primary" id="installBtn" style="margin-top:12px">${t('install')}</button></section>
      <section class="card"><div class="row"><button class="secondary" id="shareProfile">${t('share')}</button><button class="ghost" id="exportBtn">${t('export')}</button><label class="ghost" style="display:inline-flex;align-items:center">${t('import')}<input type="file" id="importFile" accept="application/json" hidden></label></div></section>
      <section class="card"><b>${state.lang==='trad'?'共修排行榜設定（可選）':'共修排行榜设置（可选）'}</b><div class="muted">${state.cloud.enabled?t('cloudMode'):(state.lang==='trad'?'目前所有資料只保存在本機。若要多人共修排行榜，依 README 設定免費 Supabase 即可，不需要中國手機號。':'目前所有数据只保存在本机。若要多人共修排行榜，按 README 设置免费 Supabase 即可，不需要中国手机号。')}</div></section>
      <div class="source">${t('source')}</div>
    `;
    $('#nickname').onchange=e=>{state.nickname=e.target.value.trim()||'法友';localStorage.setItem('ds_nickname',state.nickname);syncProfile()};
    $('#simpBtn').onclick=()=>setLang('simp'); $('#tradBtn').onclick=()=>setLang('trad');
    $('#reminderTime').onchange=e=>{state.reminder=e.target.value;localStorage.setItem('ds_reminder',state.reminder);toast(t('copied'))};
    $('#calendarReminder').onclick=downloadIcs; $('#notifyBtn').onclick=requestNotification; $('#shareProfile').onclick=shareApp; $('#exportBtn').onclick=exportData; $('#importFile').onchange=importData;
    if(state.deferredInstall){$('#installCard').classList.add('show');$('#installBtn').onclick=installApp}
  }

  function go(tab){state.tab=tab;render();window.scrollTo({top:0,behavior:'smooth'})}
  function setLang(lang){state.lang=lang;localStorage.setItem('ds_lang',lang);render()}
  function copyText(s){ navigator.clipboard?.writeText(s).then(()=>toast(t('copied'))).catch(()=>{const ta=document.createElement('textarea');ta.value=s;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast(t('copied'))}) }
  async function shareApp(){
    const data={title:state.lang==='trad'?'金剛經每日讀誦共修':'金刚经每日读诵共修',text:state.lang==='trad'?'一起每日讀誦、打卡共修':'一起每日读诵、打卡共修',url:location.href};
    if(location.protocol==='file:'){toast(t('noUrl'));return}
    try{ if(navigator.share){await navigator.share(data)} else {await navigator.clipboard.writeText(location.href);toast(t('shareCopied'))} }catch(e){ if(e.name!=='AbortError')toast(t('shareCopied')) }
  }

  function downloadIcs(){
    const [hh,mm]=state.reminder.split(':').map(Number); const now=new Date(); let start=new Date(now.getFullYear(),now.getMonth(),now.getDate(),hh,mm,0); if(start<now)start.setDate(start.getDate()+1); const end=new Date(start.getTime()+15*60000);
    const f=d=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Diamond Sutra Daily//EN\r\nBEGIN:VEVENT\r\nDTSTART:${f(start)}\r\nDTEND:${f(end)}\r\nRRULE:FREQ=DAILY\r\nSUMMARY:${state.lang==='trad'?'金剛經每日讀誦':'金刚经每日读诵'}\r\nDESCRIPTION:${state.lang==='trad'?'安住當下，每日讀誦。':'安住当下，每日读诵。'}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download='diamond-sutra-daily.ics';a.click();URL.revokeObjectURL(a.href);
  }
  async function requestNotification(){
    if(!('Notification'in window)){toast(state.lang==='trad'?'此瀏覽器不支援通知':'此浏览器不支持通知');return}
    const p=await Notification.requestPermission(); toast(p==='granted'?(state.lang==='trad'?'已開啟':'已开启'):(state.lang==='trad'?'未授權':'未授权'));
  }
  function reminderTick(){
    if(!('Notification'in window)||Notification.permission!=='granted')return; const d=new Date(), hm=`${pad(d.getHours())}:${pad(d.getMinutes())}`; const k='ds_notified_'+todayKey();
    if(hm===state.reminder&&!sessionStorage.getItem(k)){new Notification(state.lang==='trad'?'金剛經每日讀誦':'金刚经每日读诵',{body:state.lang==='trad'?'願以清淨心，安住當下。':'愿以清净心，安住当下。'});sessionStorage.setItem(k,'1')}
  }
  function exportData(){
    const data={version:1,checkins:getCheckins(),notes:getNotes(),settings:{lang:state.lang,nickname:state.nickname,fontSize:state.fontSize,reminder:state.reminder}}; const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=`diamond-sutra-checkins-${todayKey()}.json`;a.click();URL.revokeObjectURL(a.href);
  }
  function importData(e){const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(d.checkins)setCheckins(d.checkins);if(d.notes)setNotes(d.notes);if(d.settings){if(d.settings.nickname){state.nickname=d.settings.nickname;localStorage.setItem('ds_nickname',state.nickname)}if(d.settings.reminder){state.reminder=d.settings.reminder;localStorage.setItem('ds_reminder',state.reminder)}}toast(state.lang==='trad'?'匯入完成':'导入完成');render()}catch{toast(state.lang==='trad'?'檔案格式不正確':'文件格式不正确')}};r.readAsText(file)}
  async function installApp(){if(!state.deferredInstall)return;state.deferredInstall.prompt();await state.deferredInstall.userChoice;state.deferredInstall=null;renderProfile()}

  async function initCloud(){
    if(!C.supabaseUrl||!C.supabaseAnonKey||!window.supabase)return;
    try{
      const client=window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}}); let {data:{session}}=await client.auth.getSession();
      if(!session){const res=await client.auth.signInAnonymously();if(res.error)throw res.error;session=res.data.session}
      state.cloud={enabled:true,client,userId:session.user.id}; await syncProfile();
    }catch(e){console.warn('Supabase disabled',e)}
  }
  async function syncProfile(){ if(!state.cloud.enabled)return; try{await state.cloud.client.from('profiles').upsert({user_id:state.cloud.userId,nickname:state.nickname,updated_at:new Date().toISOString()})}catch{} }
  async function maybeSync(k){ if(!state.cloud.enabled)return; try{const c=getCheckins()[k];await state.cloud.client.from('checkins').upsert({user_id:state.cloud.userId,checkin_date:k,minutes:c.minutes||0});toast(t('synced'))}catch(e){console.warn(e)} }
  async function loadLeaderboard(){
    const box=$('#board'); if(!box)return; if(!state.cloud.enabled){box.innerHTML=localBoardHtml();return}
    box.innerHTML='<div class="muted">Loading…</div>';
    try{
      const since=new Date();since.setDate(since.getDate()-160); const sk=keyFromDate(since);
      const [pr,cr]=await Promise.all([state.cloud.client.from('profiles').select('user_id,nickname'),state.cloud.client.from('checkins').select('user_id,checkin_date,minutes').gte('checkin_date',sk)]);
      if(pr.error||cr.error)throw pr.error||cr.error;
      const names=Object.fromEntries(pr.data.map(x=>[x.user_id,x.nickname])); const grouped={};cr.data.forEach(x=>(grouped[x.user_id]??=[]).push(x.checkin_date));
      const calc=dates=>{const s=[...new Set(dates)].sort();let max=0,cur=0,prev=null;s.forEach(k=>{const d=dateFromKey(k);if(prev&&Math.round((d-prev)/86400000)===1)cur++;else cur=1;max=Math.max(max,cur);prev=d});let streak=0,d=new Date();const set=new Set(s);if(!set.has(todayKey()))d.setDate(d.getDate()-1);while(set.has(keyFromDate(d))){streak++;d.setDate(d.getDate()-1)}return{streak,total:s.length,max}};
      const rows=Object.entries(grouped).map(([uid,dates])=>({uid,name:names[uid]||'同修',...calc(dates)})).sort((a,b)=>b.streak-a.streak||b.total-a.total).slice(0,30);
      box.innerHTML=rows.length?rows.map((r,i)=>`<div class="leader-row"><div class="rank">${i+1}</div><div><b>${escapeHtml(r.name)}</b></div><div><b>${r.streak} ${t('days')}</b><div class="muted small">${r.total} ${t('times')}</div></div></div>`).join(''):'<div class="muted">暂无数据</div>';
    }catch(e){box.innerHTML=`<div class="notice">${t('cloudError')}</div>`}
  }

  $$('.nav-item').forEach(b=>b.onclick=()=>go(b.dataset.tab)); $('#langBtn').onclick=()=>setLang(state.lang==='simp'?'trad':'simp'); $('#shareBtn').onclick=shareApp;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferredInstall=e;if(state.tab==='profile')renderProfile()});
  if('serviceWorker'in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(console.warn);
  setInterval(reminderTick,30000);
  initCloud().finally(render);
})();
