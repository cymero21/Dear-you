import { useState, useEffect, useRef } from "react";

// ── Supabase config ────────────────────────────────────────────────
const SUPABASE_URL = "https://yvklmjojlxyhurvybfel.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2a2xtam9qbHh5aHVydnliZmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NjkxOTcsImV4cCI6MjA5MzE0NTE5N30.b8Q8-9t-qQmP1yDIZiC3DjQpsoIrOB-G_PZ9KmAncSk";
const TABLE = "pages";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

// ── Supabase helpers ───────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).slice(2, 9) +
         Math.random().toString(36).slice(2, 9);
}

async function savePage(id, data, password) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: { ...headers, "Prefer": "return=minimal" },
    body: JSON.stringify({ id, data: JSON.stringify(data), password }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Supabase error:", err);
    throw new Error("Save failed");
  }
}

async function updatePage(id, data, password) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers, "Prefer": "return=minimal" },
    body: JSON.stringify({ data: JSON.stringify(data), password }),
  });
  if (!res.ok) throw new Error("Update failed");
}

async function loadPage(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}&select=*`,
    { headers }
  );
  if (!res.ok) throw new Error("Load failed");
  const rows = await res.json();
  if (!rows.length) return null;
  return { ...JSON.parse(rows[0].data), password: rows[0].password };
}

// ── Compress image ─────────────────────────────────────────────────
async function compressImage(file, maxDim = 800, quality = 0.72) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      const c = document.createElement("canvas");
      c.width = width; c.height = height;
      c.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.src = url;
  });
}

// ── CSS ────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  @keyframes floatUp {
    0%   { transform:translateY(100vh); opacity:0; }
    10%  { opacity:.5; }
    90%  { opacity:.15; }
    100% { transform:translateY(-60px); opacity:0; }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(24px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes glow {
    0%,100% { text-shadow:0 0 20px rgba(200,150,90,.2); }
    50%      { text-shadow:0 0 50px rgba(200,150,90,.6),0 0 100px rgba(200,150,90,.1); }
  }
  .reveal { opacity:0; transform:translateY(32px); transition:opacity .85s ease,transform .85s ease; }
  .reveal.in { opacity:1; transform:translateY(0); }
  .upload-zone {
    border:1.5px dashed rgba(200,150,90,.35); border-radius:6px;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:8px; cursor:pointer; transition:border-color .2s,background .2s;
    position:relative; overflow:hidden;
  }
  .upload-zone:hover { border-color:rgba(200,150,90,.7); background:rgba(200,150,90,.04); }
  .upload-zone input[type=file] { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
  .upload-zone .hover-overlay {
    position:absolute; inset:0; background:rgba(10,6,24,.5);
    display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity .2s;
  }
  .upload-zone:hover .hover-overlay { opacity:1; }
  .gold-btn:hover  { background:rgba(200,150,90,.28) !important; }
  .ghost-btn:hover { border-color:rgba(240,232,224,.4) !important; color:rgba(240,232,224,.8) !important; }
  .copy-btn:hover  { background:rgba(200,150,90,.2) !important; }
  input:focus, textarea:focus { border-color:rgba(200,150,90,.55) !important; outline:none; }
  ::placeholder { color:rgba(240,232,224,.2) !important; }
  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-track { background:#0a0618; }
  ::-webkit-scrollbar-thumb { background:rgba(200,150,90,.3); border-radius:2px; }
`;

const C = {
  bg:    "#0a0618",
  gold:  "#c8965a",
  text:  "#f0e8e0",
  muted: "rgba(240,232,224,.45)",
  dim:   "rgba(240,232,224,.2)",
  border:"rgba(200,150,90,.18)",
};
const T = {
  display: { fontFamily:"'Cormorant Garamond',serif", fontWeight:300 },
  italic:  { fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" },
  label:   { fontFamily:"'DM Sans',sans-serif", fontSize:11, letterSpacing:3.5, textTransform:"uppercase", color:C.gold },
  body:    { fontFamily:"'DM Sans',sans-serif" },
};
const goldBtn  = { ...T.body, fontSize:12, letterSpacing:2.5, textTransform:"uppercase", background:"rgba(200,150,90,.12)", border:"1px solid rgba(200,150,90,.45)", color:C.gold, padding:"12px 32px", cursor:"pointer", transition:"all .2s", borderRadius:3 };
const ghostBtn = { ...T.body, fontSize:12, letterSpacing:2.5, textTransform:"uppercase", background:"transparent", border:"1px solid rgba(240,232,224,.15)", color:"rgba(240,232,224,.4)", padding:"12px 24px", cursor:"pointer", transition:"all .2s", borderRadius:3 };
const inputSt  = { ...T.body, fontSize:14, width:"100%", lineHeight:1.5, background:"rgba(255,255,255,.025)", border:`1px solid ${C.border}`, color:C.text, padding:"11px 15px", borderRadius:3, transition:"border-color .2s" };

// ── Particles ──────────────────────────────────────────────────────
function Particles() {
  return <>{Array.from({length:12},(_,i)=>(
    <div key={i} style={{
      position:"fixed", borderRadius:"50%", pointerEvents:"none", zIndex:0,
      background:"rgba(200,150,90,.3)", left:`${(i*8.3)%92}%`,
      width:`${2+i%3}px`, height:`${2+i%3}px`,
      animation:`floatUp ${9+i*1.4}s linear ${i*.9}s infinite`,
    }}/>
  ))}</>;
}

function Section({children, style}) {
  const ref = useRef(null);
  useEffect(()=>{
    const io = new IntersectionObserver(([e])=>{ if(e.isIntersecting) e.target.classList.add("in"); },{threshold:.08});
    if(ref.current) io.observe(ref.current);
    return ()=>io.disconnect();
  },[]);
  return <div ref={ref} className="reveal" style={style}>{children}</div>;
}

function ytEmbed(url) {
  if(!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null;
}

// ── PAGE READY SCREEN ──────────────────────────────────────────────
function PageReady({ pageId, onView }) {
  const shareLink = `${window.location.origin}?id=${pageId}`;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(()=>setCopied(false), 2500);
  }

  return (
    <div style={{
      background:C.bg, minHeight:"100vh", display:"flex",
      alignItems:"center", justifyContent:"center",
      flexDirection:"column", gap:28, padding:24, textAlign:"center",
    }}>
      <style>{css}</style>
      <Particles/>
      <div style={{zIndex:1}}>
        <div style={{fontSize:48, marginBottom:16}}>🎉</div>
        <p style={{...T.label, marginBottom:16}}>their page is ready</p>
        <h1 style={{...T.display, fontSize:"clamp(28px,6vw,48px)", color:C.text, marginBottom:12}}>
          Send them this link
        </h1>
        <p style={{...T.body, fontSize:13, color:C.muted, marginBottom:36}}>
          They'll open a beautiful page — no builder, no editing, just their gift.
        </p>

        {/* Link box */}
        <div style={{
          display:"flex", alignItems:"center", gap:0,
          border:`1px solid ${C.border}`, borderRadius:4,
          maxWidth:480, margin:"0 auto 24px",
          background:"rgba(255,255,255,.025)",
        }}>
          <p style={{
            ...T.body, fontSize:13, color:C.muted,
            padding:"12px 16px", flex:1, textAlign:"left",
            overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
          }}>
            {shareLink}
          </p>
          <button className="copy-btn" onClick={copy} style={{
            ...T.body, fontSize:12, letterSpacing:2, textTransform:"uppercase",
            background:"rgba(200,150,90,.1)", border:"none",
            borderLeft:`1px solid ${C.border}`,
            color:C.gold, padding:"12px 20px", cursor:"pointer",
            transition:"background .2s", whiteSpace:"nowrap", flexShrink:0,
          }}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>

        <div style={{display:"flex", gap:12, justifyContent:"center"}}>
          <button className="ghost-btn" style={ghostBtn} onClick={onView}>
            Preview their page
          </button>
        </div>

        <p style={{...T.body, fontSize:12, color:C.dim, marginTop:32}}>
          Save your edit link too:<br/>
          <span style={{color:"rgba(200,150,90,.5)"}}>
            {window.location.origin}?edit={pageId}
          </span>
        </p>
      </div>
    </div>
  );
}

// ── VIEWER ─────────────────────────────────────────────────────────
function Viewer({data}) {
  const embed    = ytEmbed(data.songUrl);
  const reasons  = (data.reasons||[]).filter(r=>r.trim());
  const memories = (data.memories||[]).filter(m=>m.imageB64||m.caption);

  return (
    <div style={{background:C.bg, minHeight:"100vh", width:"100%", overflowX:"hidden", color:C.text}}>
      <style>{css}</style>
      <Particles/>

      <div style={{
        minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        textAlign:"center", padding:"80px 24px", position:"relative",
        background: data.heroImageB64
          ? `linear-gradient(to bottom,rgba(10,6,24,.25) 0%,rgba(10,6,24,.72) 55%,${C.bg} 100%), url(${data.heroImageB64}) center/cover no-repeat`
          : `radial-gradient(ellipse at 50% 40%,#1c0f38 0%,${C.bg} 70%)`,
      }}>
        <div style={{animation:"fadeUp 1.1s ease .15s both", zIndex:1}}>
          <p style={{...T.label, marginBottom:22, opacity:.8}}>this was made just for you</p>
          <h1 style={{...T.display, fontSize:"clamp(60px,12vw,108px)", lineHeight:1, color:C.text, animation:"glow 4.5s ease-in-out infinite"}}>
            {data.partnerName||"My Love"}
          </h1>
          <div style={{width:52,height:1,background:C.gold,margin:"28px auto"}}/>
          <p style={{...T.italic, fontSize:"clamp(15px,2.2vw,19px)", color:C.muted}}>
            from {data.yourName||"someone who loves you"}, with everything
          </p>
        </div>
        <div style={{position:"absolute", bottom:34, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:8, ...T.label, fontSize:9, color:"rgba(200,150,90,.4)"}}>
          scroll
          <div style={{width:1,height:34,background:"linear-gradient(to bottom,rgba(200,150,90,.45),transparent)"}}/>
        </div>
      </div>

      {(data.songTitle||embed) && (
        <Section>
          <div style={{maxWidth:560,margin:"0 auto",padding:"90px 24px",textAlign:"center"}}>
            <p style={{...T.label, marginBottom:18}}>our song</p>
            {data.songTitle && <p style={{...T.italic, fontSize:"clamp(22px,4vw,38px)", color:C.text, marginBottom:32}}>&ldquo;{data.songTitle}&rdquo;</p>}
            {embed && <div style={{border:`1px solid ${C.border}`, borderRadius:4, overflow:"hidden"}}><iframe src={embed} width="100%" height="180" frameBorder="0" allowFullScreen style={{display:"block"}}/></div>}
          </div>
        </Section>
      )}

      <div style={{width:"min(360px,80%)",height:1,background:"linear-gradient(to right,transparent,rgba(200,150,90,.3),transparent)",margin:"0 auto"}}/>

      {reasons.length > 0 && (
        <Section>
          <div style={{maxWidth:620,margin:"0 auto",padding:"90px 24px"}}>
            <p style={{...T.label, textAlign:"center", marginBottom:48}}>why I love you</p>
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              {reasons.map((r,i)=>(
                <div key={i} style={{display:"flex", gap:20, alignItems:"flex-start", padding:"22px 26px", background:"rgba(200,150,90,.025)", border:`1px solid ${C.border}`, borderLeft:"2px solid rgba(200,150,90,.5)", borderRadius:"0 4px 4px 0"}}>
                  <span style={{...T.display, fontSize:28, color:"rgba(200,150,90,.22)", lineHeight:1, minWidth:26}}>{String(i+1).padStart(2,"0")}</span>
                  <p style={{...T.italic, fontSize:"clamp(16px,2.4vw,20px)", color:C.text, lineHeight:1.7}}>{r}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {data.message && (
        <Section>
          <div style={{maxWidth:560,margin:"0 auto",padding:"90px 24px",textAlign:"center"}}>
            <p style={{...T.label, marginBottom:40}}>my letter to you</p>
            <div style={{padding:"38px", border:`1px solid ${C.border}`, background:"rgba(200,150,90,.02)", position:"relative", borderRadius:4}}>
              {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i)=>(
                <div key={i} style={{position:"absolute",[v]:8,[h]:8,width:16,height:16, borderTop:v==="top"?`1px solid ${C.gold}`:"none", borderBottom:v==="bottom"?`1px solid ${C.gold}`:"none", borderLeft:h==="left"?`1px solid ${C.gold}`:"none", borderRight:h==="right"?`1px solid ${C.gold}`:"none"}}/>
              ))}
              <p style={{...T.italic, fontSize:"clamp(16px,2.3vw,19px)", color:C.text, lineHeight:1.95, textAlign:"left", whiteSpace:"pre-wrap"}}>{data.message}</p>
            </div>
          </div>
        </Section>
      )}

      {memories.length > 0 && (
        <Section>
          <div style={{maxWidth:860,margin:"0 auto",padding:"90px 24px"}}>
            <p style={{...T.label, textAlign:"center", marginBottom:48}}>our memories</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
              {memories.map((m,i)=>(
                <div key={i} style={{border:`1px solid ${C.border}`, borderRadius:4, overflow:"hidden"}}>
                  {m.imageB64 && <img src={m.imageB64} alt={m.caption||""} style={{width:"100%", aspectRatio:"4/3", objectFit:"cover", display:"block", filter:"sepia(.06) brightness(.88)"}}/>}
                  {m.caption && <div style={{padding:"10px 14px", background:C.bg, ...T.italic, fontSize:14, color:C.muted}}>{m.caption}</div>}
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {(data.favoritePhotos||[]).filter(p=>p.imageB64||p.caption).length > 0 && (
        <Section>
          <div style={{maxWidth:860,margin:"0 auto",padding:"90px 24px"}}>
            <p style={{...T.label, textAlign:"center", marginBottom:48}}>photos of you</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
              {(data.favoritePhotos||[]).filter(p=>p.imageB64||p.caption).map((p,i)=>(
                <div key={i} style={{border:`1px solid ${C.border}`, borderRadius:4, overflow:"hidden"}}>
                  {p.imageB64 && <img src={p.imageB64} alt={p.caption||""} style={{width:"100%", aspectRatio:"4/3", objectFit:"cover", display:"block", filter:"sepia(.06) brightness(.88)"}}/>}
                  {p.caption && <div style={{padding:"10px 14px", background:C.bg, ...T.italic, fontSize:14, color:C.muted}}>{p.caption}</div>}
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {(data.favorites?.movies||[]).filter(m=>m.trim()).length > 0 || (data.favorites?.songs||[]).filter(s=>s.trim()).length > 0 ? (
        <Section>
          <div style={{maxWidth:620,margin:"0 auto",padding:"90px 24px"}}>
            <p style={{...T.label, textAlign:"center", marginBottom:48}}>our favourites</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32}}>
              {(data.favorites?.movies||[]).filter(m=>m.trim()).length > 0 && (
                <div>
                  <p style={{...T.label, marginBottom:20, textAlign:"center"}}>movies</p>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {(data.favorites.movies||[]).filter(m=>m.trim()).map((m,i)=>(
                      <div key={i} style={{padding:"14px 16px", border:`1px solid ${C.border}`, borderRadius:4, ...T.italic, fontSize:14, color:C.text}}>{m}</div>
                    ))}
                  </div>
                </div>
              )}
              {(data.favorites?.songs||[]).filter(s=>s.trim()).length > 0 && (
                <div>
                  <p style={{...T.label, marginBottom:20, textAlign:"center"}}>songs</p>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {(data.favorites.songs||[]).filter(s=>s.trim()).map((s,i)=>(
                      <div key={i} style={{padding:"14px 16px", border:`1px solid ${C.border}`, borderRadius:4, ...T.italic, fontSize:14, color:C.text}}>{s}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Section>
      ) : null}

      {(data.futurePlans||[]).filter(p=>p.trim()).length > 0 && (
        <Section>
          <div style={{maxWidth:620,margin:"0 auto",padding:"90px 24px"}}>
            <p style={{...T.label, textAlign:"center", marginBottom:48}}>our future</p>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {(data.futurePlans||[]).filter(p=>p.trim()).map((plan,i)=>(
                <div key={i} style={{display:"flex", gap:16, alignItems:"flex-start", padding:"18px 22px", background:"rgba(200,150,90,.025)", border:`1px solid ${C.border}`, borderRadius:4}}>
                  <span style={{...T.display, fontSize:22, color:"rgba(200,150,90,.25)", lineHeight:1, minWidth:24, flexShrink:0}}>✦</span>
                  <p style={{...T.italic, fontSize:"clamp(14px,2vw,16px)", color:C.text, lineHeight:1.7}}>{plan}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section>
        <div style={{textAlign:"center", padding:"90px 24px 120px"}}>
          <div style={{width:40,height:1,background:C.gold,margin:"0 auto 32px"}}/>
          <p style={{...T.display, fontSize:"clamp(28px,5vw,52px)", color:C.text, marginBottom:16}}>you are everything.</p>
          <p style={{...T.italic, fontSize:"clamp(14px,2vw,17px)", color:"rgba(200,150,90,.65)"}}>— {data.yourName||"someone who loves you"}</p>
        </div>
      </Section>
    </div>
  );
}

// ── PHOTO UPLOAD ───────────────────────────────────────────────────
function PhotoUpload({value, onChange, height=180, label="Tap to choose a photo"}) {
  const handleFile = async e => {
    const file = e.target.files?.[0];
    if(!file) return;
    onChange(await compressImage(file));
    e.target.value = "";
  };
  return (
    <div className="upload-zone" style={{height, background:"rgba(200,150,90,.02)"}}>
      <input type="file" accept="image/*" onChange={handleFile}/>
      {value ? (
        <>
          <img src={value} alt="preview" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
          <div className="hover-overlay"><p style={{...T.body,fontSize:13,color:C.text,letterSpacing:2}}>change photo</p></div>
        </>
      ) : (
        <>
          <div style={{fontSize:28}}>📷</div>
          <p style={{...T.body,fontSize:13,color:C.muted}}>{label}</p>
          <p style={{...T.body,fontSize:11,color:C.dim}}>from your gallery</p>
        </>
      )}
    </div>
  );
}

// ── BUILDER ────────────────────────────────────────────────────────
function Field({label, children, style}) {
  return (
    <div style={{marginBottom:20,...style}}>
      <label style={{...T.label,display:"block",marginBottom:9}}>{label}</label>
      {children}
    </div>
  );
}

function Step({n, title, sub, children}) {
  return (
    <div style={{marginBottom:48}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:sub?8:24}}>
        <div style={{width:28,height:28,borderRadius:"50%",border:`1px solid ${C.gold}`,display:"flex",alignItems:"center",justifyContent:"center",...T.body,fontSize:12,color:C.gold,flexShrink:0}}>{n}</div>
        <h2 style={{...T.display,fontSize:22,color:C.text}}>{title}</h2>
      </div>
      {sub && <p style={{...T.body,fontSize:13,color:C.muted,marginBottom:20,paddingLeft:40}}>{sub}</p>}
      <div style={{paddingLeft:40}}>{children}</div>
    </div>
  );
}

function Builder({form, setForm, onSave, saving}) {
  const upd       = (k,v) => setForm(f=>({...f,[k]:v}));
  const updReason = (i,v) => { const r=[...form.reasons]; r[i]=v; setForm(f=>({...f,reasons:r})); };
  const updMem    = (i,k,v) => { const m=[...form.memories]; m[i]={...m[i],[k]:v}; setForm(f=>({...f,memories:m})); };

  return (
    <div style={{background:C.bg, minHeight:"100vh", color:C.text, padding:"60px 24px"}}>
      <style>{css}</style>
      <div style={{maxWidth:720, margin:"0 auto"}}>
        <div style={{textAlign:"center", marginBottom:56}}>
          <p style={{...T.label, marginBottom:14}}>Dear You</p>
          <h1 style={{...T.display, fontSize:"clamp(34px,7vw,56px)", marginBottom:12}}>Build What They See</h1>
          <p style={{...T.italic, fontSize:16, color:C.muted}}>Fill in the details below — it only takes a few minutes</p>
        </div>

        <Step n="1" title="Who is this for?">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Field label="Their name"><input style={inputSt} value={form.partnerName} onChange={e=>upd("partnerName",e.target.value)} placeholder="Sade"/></Field>
            <Field label="Your name"><input style={inputSt} value={form.yourName} onChange={e=>upd("yourName",e.target.value)} placeholder="Emeka"/></Field>
          </div>
        </Step>

        <Step n="2" title="Their photo" sub="This will be the first thing they see — pick a photo that means something.">
          <PhotoUpload value={form.heroImageB64} onChange={v=>upd("heroImageB64",v)} height={220} label="Tap to choose their photo"/>
        </Step>

        <Step n="3" title="Your song" sub="Paste the YouTube link of the song that's yours.">
          <Field label="Song name"><input style={inputSt} value={form.songTitle} onChange={e=>upd("songTitle",e.target.value)} placeholder="e.g. Die For You — The Weeknd"/></Field>
          <Field label="YouTube link"><input style={inputSt} value={form.songUrl} onChange={e=>upd("songUrl",e.target.value)} placeholder="https://youtube.com/watch?v=..."/></Field>
        </Step>

        <Step n="4" title="Why you love them" sub="These show up one by one, numbered. The specific ones hit hardest.">
          {form.reasons.map((r,i)=>(
            <Field key={i} label={`Reason ${i+1}`}>
              <input style={inputSt} value={r} onChange={e=>updReason(i,e.target.value)}
                placeholder={i===0?"The way you laugh before you finish the story...":i===1?"How you always know when something's wrong without me saying...":"Keep going..."}/>
            </Field>
          ))}
          <button className="ghost-btn" style={{...ghostBtn,fontSize:12,marginTop:4}} onClick={()=>setForm(f=>({...f,reasons:[...f.reasons,""]}))}>+ add another reason</button>
        </Step>

        <Step n="5" title="Your letter to them" sub="Write from the heart. It doesn't have to be perfect — just honest.">
          <Field label="Your message">
            <textarea style={{...inputSt,minHeight:180,resize:"vertical",lineHeight:1.8}} value={form.message} onChange={e=>upd("message",e.target.value)} placeholder="My love, from the moment I first saw you I knew something was different..."/>
          </Field>
        </Step>

        <Step n="6" title="Your memories together" sub="Add photos of your best moments. Give each one a short caption.">
          {form.memories.map((m,i)=>(
            <div key={i} style={{marginBottom:20,padding:"18px 20px",border:`1px solid ${C.border}`,borderRadius:4,background:"rgba(200,150,90,.02)"}}>
              <p style={{...T.label,marginBottom:14}}>Memory {i+1}</p>
              <PhotoUpload value={m.imageB64} onChange={v=>updMem(i,"imageB64",v)} height={160} label="Tap to add a photo"/>
              <div style={{marginTop:14}}>
                <Field label="Caption (optional)" style={{marginBottom:0}}>
                  <input style={inputSt} value={m.caption} onChange={e=>updMem(i,"caption",e.target.value)} placeholder="The night we stayed out till 3am talking..."/>
                </Field>
              </div>
            </div>
          ))}
          <button className="ghost-btn" style={{...ghostBtn,fontSize:12}} onClick={()=>setForm(f=>({...f,memories:[...f.memories,{imageB64:null,caption:""}]}))}>+ add another memory</button>
        </Step>

                {/* Favourite Photos */}
      <Step n="7" title="Favourite photos of them"
        sub="Not memories together — just photos you love of them.">
        {form.favoritePhotos.map((p, i) => (
          <div key={i} style={{
            marginBottom: 20, padding: "18px 20px",
            border: `1px solid ${C.border}`, borderRadius: 4,
            background: "rgba(200,150,90,.02)",
          }}>
            <p style={{ ...T.label, marginBottom: 14 }}>Photo {i + 1}</p>
            <PhotoUpload
              value={p.imageB64}
              onChange={v => {
                const arr = [...form.favoritePhotos];
                arr[i] = { ...arr[i], imageB64: v };
                setForm(f => ({ ...f, favoritePhotos: arr }));
              }}
              height={160}
              label="Tap to add a photo"
            />
            <div style={{ marginTop: 14 }}>
              <Field label="Caption (optional)" style={{ marginBottom: 0 }}>
                <input style={inputSt} value={p.caption}
                  onChange={e => {
                    const arr = [...form.favoritePhotos];
                    arr[i] = { ...arr[i], caption: e.target.value };
                    setForm(f => ({ ...f, favoritePhotos: arr }));
                  }}
                  placeholder="My favourite photo of you because..."
                />
              </Field>
            </div>
          </div>
        ))}
        <button className="ghost-btn" style={{ ...ghostBtn, fontSize: 12 }}
          onClick={() => setForm(f => ({
            ...f, favoritePhotos: [...f.favoritePhotos, { imageB64: null, caption: "" }]
          }))}>
          + add another photo
        </button>
      </Step>

      {/* Movies & Songs */}
      <Step n="8" title="Your favourites"
        sub="Movies and songs that are yours — together or just theirs.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <p style={{ ...T.label, marginBottom: 16 }}>Movies</p>
            {form.favorites.movies.map((m, i) => (
              <Field key={i} label={`Movie ${i + 1}`} style={{ marginBottom: 12 }}>
                <input style={inputSt} value={m}
                  onChange={e => {
                    const movies = [...form.favorites.movies];
                    movies[i] = e.target.value;
                    setForm(f => ({ ...f, favorites: { ...f.favorites, movies } }));
                  }}
                  placeholder={i === 0 ? "The Notebook" : i === 1 ? "Set It Up" : "Keep going..."} />
              </Field>
            ))}
            <button className="ghost-btn" style={{ ...ghostBtn, fontSize: 11 }}
              onClick={() => setForm(f => ({
                ...f, favorites: { ...f.favorites, movies: [...f.favorites.movies, ""] }
              }))}>
              + add movie
            </button>
          </div>
          <div>
            <p style={{ ...T.label, marginBottom: 16 }}>Songs</p>
            {form.favorites.songs.map((s, i) => (
              <Field key={i} label={`Song ${i + 1}`} style={{ marginBottom: 12 }}>
                <input style={inputSt} value={s}
                  onChange={e => {
                    const songs = [...form.favorites.songs];
                    songs[i] = e.target.value;
                    setForm(f => ({ ...f, favorites: { ...f.favorites, songs } }));
                  }}
                  placeholder={i === 0 ? "Die For You" : i === 1 ? "Dandelions" : "Keep going..."} />
              </Field>
            ))}
            <button className="ghost-btn" style={{ ...ghostBtn, fontSize: 11 }}
              onClick={() => setForm(f => ({
                ...f, favorites: { ...f.favorites, songs: [...f.favorites.songs, ""] }
              }))}>
              + add song
            </button>
          </div>
        </div>
      </Step>

      {/* Future Plans */}
      <Step n="9" title="Our future plans"
        sub="Things you want to do together. Places, experiences, dreams.">
        {form.futurePlans.map((plan, i) => (
          <Field key={i} label={`Plan ${i + 1}`}>
            <input style={inputSt} value={plan}
              onChange={e => {
                const arr = [...form.futurePlans];
                arr[i] = e.target.value;
                setForm(f => ({ ...f, futurePlans: arr }));
              }}
              placeholder={
                i === 0 ? "Travel to Santorini together..." :
                i === 1 ? "Cook a full meal from scratch..." :
                "One day we will..."
              }
            />
          </Field>
        ))}
        <button className="ghost-btn" style={{ ...ghostBtn, fontSize: 12 }}
          onClick={() => setForm(f => ({ ...f, futurePlans: [...f.futurePlans, ""] }))}>
          + add a plan
        </button>
      </Step>

        <Step n="7" title="Protect your page" sub="Set a password so only you can come back and make changes.">
          <Field label="Choose a password">
            <input type="password" style={inputSt} value={form.password} onChange={e=>upd("password",e.target.value)} placeholder="something only you'll remember"/>
          </Field>
        </Step>

        <div style={{textAlign:"center", paddingBottom:80}}>
          <button className="gold-btn" style={{...goldBtn,fontSize:13,padding:"15px 48px",opacity:saving?.6:1}} onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save & Create Their Link →"}
          </button>
          <p style={{...T.body,fontSize:12,color:C.muted,marginTop:16}}>Once you save, you'll get a unique link to send them.</p>
        </div>
      </div>
    </div>
  );

}



// ── UNLOCK ─────────────────────────────────────────────────────────
function Unlock({value, onChange, onSubmit, error, onBack}) {
  return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20,padding:24}}>
      <style>{css}</style>
      <p style={T.label}>enter your password to edit</p>
      <input type="password" value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onSubmit()} placeholder="your password" style={{...inputSt,width:240,textAlign:"center",letterSpacing:2}}/>
      {error && <p style={{...T.body,fontSize:13,color:"rgba(220,90,90,.8)"}}>{error}</p>}
      <div style={{display:"flex",gap:12}}>
        <button className="ghost-btn" style={ghostBtn} onClick={onBack}>back</button>
        <button className="gold-btn"  style={goldBtn}  onClick={onSubmit}>unlock</button>
      </div>
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────
const emptyForm = {
  partnerName:"", yourName:"", heroImageB64:null,
  songTitle:"", songUrl:"", message:"",
  reasons:["","",""],
  memories:[{imageB64:null,caption:""},{imageB64:null,caption:""}],
  favoritePhotos:[{imageB64:null,caption:""},{imageB64:null,caption:""}],
  favorites:{ movies:["","",""], songs:["","",""] },
  futurePlans:["","",""],
  password:"",
};

export default function App() {
  const [mode,    setMode]   = useState("loading");
  const [pageData,setPage]   = useState(null);
  const [pageId,  setPageId] = useState(null);
  const [form,    setForm]   = useState(emptyForm);
  const [pass,    setPass]   = useState("");
  const [passErr, setErr]    = useState("");
  const [saving,  setSaving] = useState(false);

  useEffect(()=>{
    (async()=>{
      const params = new URLSearchParams(window.location.search);
      const id     = params.get("id");
      const editId = params.get("edit");

      if(id || editId) {
        const targetId = id || editId;
        try {
          const data = await loadPage(targetId);
          if(!data) { setMode("builder"); return; }
          setPage(data);
          setPageId(targetId);
          setMode(id ? "viewer" : "unlock");
        } catch { setMode("builder"); }
      } else {
        setMode("builder");
      }
    })();
  },[]);

  async function save() {
    if(!form.password.trim()){ alert("Please set a password to protect your page."); return; }
    setSaving(true);
    try {
      const id = pageId || generateId();
      if(pageId) {
        await updatePage(id, form, form.password);
      } else {
        await savePage(id, form, form.password);
      }
      setPageId(id);
      setPage({...form});
      setMode("ready");
    } catch(e) {
      alert("Couldn't save. Make sure RLS is disabled in Supabase and try again.");
      console.error(e);
    } finally { setSaving(false); }
  }

  function tryUnlock() {
    if(pass===pageData?.password){
      setForm({...pageData}); setMode("builder"); setPass(""); setErr("");
    } else { setErr("Wrong password — try again."); }
  }

  if(mode==="loading") return (
    <div style={{background:C.bg,height:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{css}</style>
      <div style={{...T.italic,fontSize:18,color:"rgba(200,150,90,.4)",animation:"fadeUp 1.5s ease infinite"}}>loading…</div>
    </div>
  );
  if(mode==="viewer") return <Viewer data={pageData}/>;
  if(mode==="ready")  return <PageReady pageId={pageId} onView={()=>setMode("viewer")}/>;
  if(mode==="unlock") return <Unlock value={pass} onChange={setPass} onSubmit={tryUnlock} error={passErr} onBack={()=>setMode("viewer")}/>;
  return <Builder form={form} setForm={setForm} onSave={save} saving={saving}/>;
}
