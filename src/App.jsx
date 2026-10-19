import {useEffect,useState,useCallback} from 'react';
import {Routes,Route,Link,useParams,useNavigate} from 'react-router-dom';
import {createClient} from '@supabase/supabase-js';

const sb=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const FB_APP_ID='2266978280870421';
const CATS=[['राजनीति','#1c2a5a','🏛️'],['खेल','#2f5a3a','🏅'],['समाज','#c0644a','👥'],['स्वास्थ्य','#8fb08f','🌿'],['सौन्दर्य','#b8707c','🌸'],['शिक्षा','#e0b040','📚'],['तकनीक','#2b6c78','🌐'],['जीवन शैली','#c25a22','🏡'],['स्थानीय मुद्दे','#b44a30','📣'],['साहित्य','#4a0e17','🪶'],['फैशन','#7a0a28','👗'],['कानून','#3d4a5c','⚖️'],['सामयिक','#2f6f9f','📰'],['मनोरंजन','#9c3f7a','🎬'],['संगीत','#5b4a9a','🎵'],['संपादकीय','#43232b','🖋️']];
const fmt=d=>new Date(d).toLocaleString('hi-IN',{dateStyle:'long',timeStyle:'short'});
const mkSlug=t=>(t.trim().replace(/[^\p{L}\p{M}\p{N}\u200c\u200d]+/gu,'-').replace(/^-|-$/g,'').slice(0,60)||'rachna')+'-'+Math.random().toString(36).slice(2,7);

const useUser=()=>{
  const[u,setU]=useState(null),[ed,setEd]=useState(false);
  useEffect(()=>{
    const f=async s=>{
      setU(s?.user||null);
      if(s?.user){
        const{data}=await sb.from('profiles').select('is_editor').eq('id',s.user.id).single();
        setEd(!!data?.is_editor);
      } else setEd(false);
    };
    sb.auth.getSession().then(({data})=>f(data.session));
    const{data:l}=sb.auth.onAuthStateChange((_,s)=>f(s));
    return()=>l.subscription.unsubscribe();
  },[]);
  return[u,ed];
};

function Head({title,desc,img}){
  useEffect(()=>{
    document.title=title+' | वाक्-ऋचा';
    const m=(k,v,a='property')=>{
      let e=document.querySelector(`meta[${a}="${k}"]`);
      if(!e){e=document.createElement('meta');e.setAttribute(a,k);document.head.appendChild(e);}
      e.content=v;
    };
    m('description',desc||'','name');
    m('og:title',title);
    m('og:description',desc||'');
    m('og:url',location.href);
    if(img)m('og:image',img);
    let c=document.querySelector('link[rel=canonical]');
    if(!c){c=document.createElement('link');c.rel='canonical';document.head.appendChild(c);}
    c.href=location.href;
  },[title,desc,img]);
  return null;
}

function Auth({onDone}){
  const[email,setE]=useState(''),[pw,setP]=useState(''),[msg,setM]=useState('');
  const go=async up=>{
    const r=up?await sb.auth.signUp({email,password:pw}):await sb.auth.signInWithPassword({email,password:pw});
    setM(r.error?r.error.message:up?'खाता बन गया। यदि ईमेल पुष्टि माँगे तो पुष्टि करके प्रवेश करें।':'');
    if(!r.error&&!up)onDone?.();
  };
  const reset=async()=>{
    if(!email)return setM('पहले ऊपर अपना ईमेल लिखें।');
    const{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/naya-password'});
    setM(error?error.message:'पासवर्ड बदलने का लिंक आपके ईमेल पर भेज दिया गया है।');
  };
  return(
    <div className="box">
      <h2>प्रवेश करें</h2>
      <input placeholder="ईमेल" value={email} onChange={e=>setE(e.target.value)}/>
      <input type="password" placeholder="पासवर्ड (कम से कम 6 अक्षर)" value={pw} onChange={e=>setP(e.target.value)}/>
      <div className="row">
        <button onClick={()=>go(false)}>प्रवेश करें</button>
        <button className="alt" onClick={()=>go(true)}>नया खाता बनाएँ</button>
        <button className="alt" onClick={reset}>पासवर्ड भूल गए?</button>
      </div>
      <p className="note">{msg}</p>
    </div>
  );
}

function Layout({user,ed,children}){
  return(
    <>
      <header className="top">
        <nav>
          <Link to="/">मुख्य पृष्ठ</Link>
          {user&&<Link to="/meri">मेरी रचनाएँ</Link>}
          {user&&<Link to="/naya-password">पासवर्ड बदलें</Link>}
          {ed&&<Link to="/admin">संपादक पैनल</Link>}
          {ed&&<Link to="/sadasya">सभी सदस्य</Link>}
        </nav>
        <div className="auth">
          {user?<><span className="who" title={user.email}>{user.email}</span><button className="alt" onClick={()=>sb.auth.signOut()}>बाहर निकलें</button></>:<Link to="/login">प्रवेश करें</Link>}
        </div>
      </header>
      <div className="hero">
        <Link to="/"><h1 className="logo">वाक्-ऋचा</h1></Link>
        <p className="t1">डिजिटल साहित्यिक पत्रिका</p>
        <p className="t2">शब्दों की यात्रा, विचारों का संगम</p>
      </div>
      {children}
      <footer>© वाक्-ऋचा</footer>
    </>
  );
}

/* ---------- पूरी पत्रिका: एक अंक की तरह पढ़ें / PDF सहेजें ---------- */
// मुखपृष्ठ की तस्वीर इसी फ़ाइल के सबसे नीचे (COVER) में जुड़ी है

function Patrika(){
  const[posts,setPosts]=useState(null),[cms,setCms]=useState([]),[mon,setMon]=useState('all'),[withC,setWithC]=useState(true);
  useEffect(()=>{(async()=>{
    const{data}=await sb.from('posts').select('id,slug,title,author_name,category,body,image_url,created_at').eq('published',true).order('created_at',{ascending:true}).limit(1000);
    setPosts(data||[]);
    const r=await sb.from('comments').select('post_id,name,body,created_at').order('created_at',{ascending:true}).limit(5000);
    setCms(r.data||[]);
  })();},[]);
  if(!posts)return <main><p className="note">पत्रिका तैयार हो रही है…</p></main>;

  const monthLabel=k=>new Date(k+'-15').toLocaleDateString('hi-IN',{month:'long',year:'numeric'});
  const months=[...new Set(posts.map(p=>p.created_at.slice(0,7)))].sort().reverse();
  const list=mon==='all'?posts:posts.filter(p=>p.created_at.startsWith(mon));
  const groups=CATS.map(([name,color,ico])=>({name,color,ico,items:list.filter(p=>p.category===name)})).filter(g=>g.items.length);
  const known=new Set(CATS.map(c=>c[0]));
  const other=list.filter(p=>!known.has(p.category));
  if(other.length)groups.push({name:'अन्य',color:'#555',ico:'📄',items:other});
  const label=mon==='all'?'सम्पूर्ण संग्रह':monthLabel(mon);

  return(
    <main className="patrika">
      <Head title="पूरी पत्रिका" desc="वाक्-ऋचा की सभी रचनाएँ एक पत्रिका के रूप में"/>
      <style>{`
        .patrika .pcover img{display:block;width:100%;max-width:760px;margin:0 auto;border-radius:6px}
        .patrika .pcover{text-align:center;margin-bottom:28px}
        .patrika .pcat{border-left:6px solid;padding-left:10px;margin:36px 0 12px}
        .patrika .part{margin:0 0 26px}
        .patrika .pcm{margin:8px 0 0 12px;padding-left:10px;border-left:2px solid #bbb;font-size:.92em}
        @page{size:A4;margin:14mm}
        @media print{
          header.top,.hero,footer,.noprint,[role=status]{display:none!important}
          body{background:#fff!important}
          .patrika,.patrika *{color:#111!important;background:transparent!important}
          .patrika .pcover{page-break-after:always}
          .patrika .ptoc{page-break-after:always}
          .patrika .pcat{page-break-before:always;margin-top:0}
          .patrika .part h3{page-break-after:avoid}
          .patrika .part{page-break-inside:auto}
        }
      `}</style>

      <div className="noprint box">
        <h2>पूरी पत्रिका</h2>
        <p className="note">सभी प्रकाशित रचनाएँ एक अंक के रूप में। PDF के लिए "PDF सहेजें" दबाएँ और खुलने वाली विंडो में प्रिंटर की जगह <b>Save as PDF</b> चुनें।</p>
        <div className="row">
          <select value={mon} onChange={e=>setMon(e.target.value)}>
            <option value="all">सम्पूर्ण संग्रह</option>
            {months.map(k=><option key={k} value={k}>{monthLabel(k)}</option>)}
          </select>
          <label><input type="checkbox" checked={withC} onChange={e=>setWithC(e.target.checked)}/> पाठकों की टिप्पणियाँ भी जोड़ें</label>
          <button onClick={()=>window.print()}>PDF सहेजें / प्रिंट करें</button>
        </div>
      </div>

      <section className="pcover">
        <img src={COVER} alt="वाक्-ऋचा मुखपृष्ठ"/>
        <h2>{label}</h2>
        <p>{list.length} रचनाएँ</p>
      </section>

      {!list.length?<p className="note">इस अवधि में कोई प्रकाशित रचना नहीं है।</p>:(
        <>
          <section className="ptoc">
            <h2>अनुक्रमणिका</h2>
            {groups.map(g=>(
              <div key={g.name}>
                <h3>{g.ico} {g.name}</h3>
                <ul>{g.items.map(p=><li key={p.id}><a href={'#p-'+p.id}>{p.title}</a> — {p.author_name}</li>)}</ul>
              </div>
            ))}
          </section>

          {groups.map(g=>(
            <section key={g.name}>
              <h2 className="pcat" style={{borderColor:g.color}}>{g.ico} {g.name}</h2>
              {g.items.map(p=>{
                const mine=withC?cms.filter(c=>c.post_id===p.id):[];
                return(
                  <article key={p.id} id={'p-'+p.id} className="part">
                    <h3>{p.title}</h3>
                    <small>{p.author_name} · {fmt(p.created_at)}</small>
                    {p.image_url&&<img src={p.image_url} alt="" style={{maxWidth:'100%',display:'block',margin:'10px 0'}}/>}
                    <p className="body">{p.body}</p>
                    {mine.length>0&&(
                      <div>
                        <h4>पाठकों की टिप्पणियाँ</h4>
                        {mine.map((c,i)=><div key={i} className="pcm"><b>{c.name}</b>: {c.body}</div>)}
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          ))}
        </>
      )}
    </main>
  );
}

/* ---------- संपादक का संदेश / सुझाव आमंत्रण ---------- */
function EditorNote({user,ed}){
  const[note,setNote]=useState(null),[edit,setEdit]=useState(false);
  const[tp,setTp]=useState(''),[tx,setTx]=useState(''),[on,setOn]=useState(false),[msg,setMsg]=useState('');
  const[sg,setSg]=useState(''),[nm,setNm]=useState(''),[sent,setSent]=useState(false),[list,setList]=useState([]);
  const load=useCallback(async()=>{
    const{data}=await sb.from('site_notes').select('*').eq('id','suzav').maybeSingle();
    setNote(data||null);
    if(data){setTp(data.topic||'');setTx(data.text||'');setOn(!!data.active);}
  },[]);
  const loadList=useCallback(async()=>{
    if(!ed)return;
    const{data}=await sb.from('suggestions').select('*').order('created_at',{ascending:false}).limit(100);
    setList(data||[]);
  },[ed]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{loadList();},[loadList]);
  useEffect(()=>{setSent(false);},[note?.topic,note?.updated_at]);

  const save=async()=>{
    const{error}=await sb.from('site_notes').upsert({id:'suzav',topic:tp.trim()||null,text:tx.trim(),active:on,updated_at:new Date().toISOString()});
    if(error)return setMsg(error.message);
    setMsg('सुरक्षित हो गया।');setEdit(false);load();
  };
  const send=async()=>{
    if(!sg.trim())return;
    const name=nm.trim()||(user.email||'').split('@')[0];
    const{error}=await sb.from('suggestions').insert({topic:note?.topic||null,name,body:sg.trim()});
    if(error)return setMsg(error.message);
    setSg('');setSent(true);setMsg('');loadList();
  };

  const show=note?.active&&(note.topic||note.text);
  if(!show&&!ed)return null;
  return(
    <section className="box">
      {show?(
        <>
          {note.topic&&<h3>{note.topic}</h3>}
          {note.text&&<p className="body">{note.text}</p>}
          {user?(
            sent?<p className="note">आपका सुझाव संपादक तक पहुँच गया। धन्यवाद!</p>:(
              <>
                <input placeholder="आपका नाम (वैकल्पिक)" maxLength="60" value={nm} onChange={e=>setNm(e.target.value)}/>
                <textarea rows="3" maxLength="1000" placeholder="अपना सुझाव यहाँ लिखें" value={sg} onChange={e=>setSg(e.target.value)}/>
                <button onClick={send}>सुझाव भेजें</button>
              </>
            )
          ):<p className="note">सुझाव देने के लिए <Link to="/login" style={{textDecoration:'underline'}}>प्रवेश करें या खाता बनाएँ</Link></p>}
        </>
      ):<p className="note">सदस्यों को अभी कोई संदेश नहीं दिख रहा।</p>}
      {ed&&(
        <>
          {!edit&&<div className="row"><button className="alt" onClick={()=>setEdit(true)}>संपादक: संदेश बदलें</button></div>}
          {edit&&(
            <div className="box">
              <input placeholder="विषय (जैसे: अगले अंक के लिए कौन सा विषय हो?)" maxLength="120" value={tp} onChange={e=>setTp(e.target.value)}/>
              <textarea rows="3" maxLength="600" placeholder="सदस्यों के लिए संदेश" value={tx} onChange={e=>setTx(e.target.value)}/>
              <label><input type="checkbox" checked={on} onChange={e=>setOn(e.target.checked)}/> सदस्यों को दिखाएँ</label>
              <div className="row">
                <button onClick={save}>सुरक्षित करें</button>
                <button className="alt" onClick={()=>setEdit(false)}>रद्द करें</button>
              </div>
            </div>
          )}
          <p className="note">{msg}</p>
          <h4>आए हुए सुझाव ({list.length})</h4>
          {list.map(x=>(
            <div key={x.id} className="cm">
              <b>{x.name}</b> <small>{fmt(x.created_at)}{x.topic?' · '+x.topic:''}</small>
              <p>{x.body}</p>
              <button className="alt" onClick={async()=>{if(confirm('यह सुझाव हटाएँ?')){await sb.from('suggestions').delete().eq('id',x.id);loadList();}}}>हटाएँ</button>
            </div>
          ))}
        </>
      )}
    </section>
  );
}

function Home({user,ed}){
  const[f,setF]=useState([]),[cnt,setCnt]=useState({});
  useEffect(()=>{
    sb.from('posts').select('*').eq('featured',true).eq('published',true).order('created_at',{ascending:false}).limit(1).then(({data})=>setF(data||[]));
    sb.from('posts').select('category').eq('published',true).then(({data})=>{
      const o={};
      (data||[]).forEach(r=>{o[r.category]=(o[r.category]||0)+1;});
      setCnt(o);
    });
  },[]);
  return(
    <main>
      <Head title="मुख्य पृष्ठ" desc="शब्दों की यात्रा, विचारों का संगम"/>
      {f[0]&&<Link to={'/post/'+f[0].slug} className="feat"><span>संपादकीय</span><h2>{f[0].title}</h2><p>{f[0].body.slice(0,160)}…</p></Link>}
      <div className="grid">
        {CATS.map(([n,c,i])=>(
          <Link key={n} to={'/shreni/'+encodeURIComponent(n)} className="card" style={{background:c}}>
            <b>{n}<small>{cnt[n]||0} {(cnt[n]||0)===1?'रचना':'रचनाएँ'}</small></b><i>{i}</i>
          </Link>
        ))}
      </div>
      <p className="center"><Link className="btn" to="/likhein">अपनी रचना प्रकाशित करें</Link></p>
      <p className="center"><Link className="btn" to="/patrika">📖 पूरी पत्रिका पढ़ें / PDF</Link></p>
      <EditorNote user={user} ed={ed}/>
    </main>
  );
}

const PAGE=10;
function Category(){
  const{name}=useParams();
  const[list,setL]=useState([]),[q,setQ]=useState(''),[n,setN]=useState(PAGE),[more,setMore]=useState(false);
  const load=useCallback(async()=>{
    let r=sb.from('posts').select('*').eq('category',name).eq('published',true).order('created_at',{ascending:false}).range(0,n);
    if(q.trim()){
      const s=q.trim().replace(/[%,]/g,'');
      r=r.or(`title.ilike.%${s}%,author_name.ilike.%${s}%`);
    }
    const{data}=await r;
    setMore((data||[]).length>n);
    setL((data||[]).slice(0,n));
  },[name,q,n]);
  useEffect(()=>{load();},[load]);
  return(
    <main>
      <Head title={name} desc={name+' की रचनाएँ'}/>
      <h2>{name}</h2>
      <div className="row">
        <input placeholder="शीर्षक या लेखक से खोजें" value={q} onChange={e=>setQ(e.target.value)}/>
        <Link className="btn" to={'/likhein?shreni='+encodeURIComponent(name)}>नई रचना लिखें</Link>
      </div>
      {!list.length&&<p className="note">इस श्रेणी में अभी कोई रचना नहीं है। पहली रचना आप लिखें।</p>}
      {list.map(p=>(
        <Link key={p.id} to={'/post/'+p.slug} className="item"><h3>{p.title}</h3><small>{p.author_name} · {fmt(p.created_at)}</small></Link>
      ))}
      {more&&<p className="center"><button onClick={()=>setN(n+PAGE)}>और रचनाएँ देखें</button></p>}
    </main>
  );
}

function Editor({user,ed,post}){
  const nav=useNavigate();
  const sp=new URLSearchParams(location.search);
  const[t,setT]=useState(post?.title||''),[a,setA]=useState(post?.author_name||''),[c,setC]=useState(post?.category||sp.get('shreni')||'साहित्य'),[b,setB]=useState(post?.body||''),[bio,setBio]=useState(post?.bio||''),[img,setImg]=useState(post?.image_url||''),[pv,setPv]=useState(false),[msg,setM]=useState('');
  if(!user)return<main><p className="note">रचना प्रकाशित करने के लिए पहले प्रवेश करें।</p><Auth/></main>;
  const up=async e=>{
    const f=e.target.files[0];
    if(!f)return;
    const p=user.id+'/'+Date.now()+'-'+f.name.replace(/[^\w.]/g,'');
    const{error}=await sb.storage.from('images').upload(p,f);
    if(error)return setM(error.message);
    setImg(sb.storage.from('images').getPublicUrl(p).data.publicUrl);
  };
  const save=async()=>{
    if(!t.trim()||!a.trim()||!b.trim())return setM('नाम, शीर्षक और रचना भरना आवश्यक है।');
    const v={title:t,author_name:a,category:c,body:b,bio:bio||null,image_url:img||null};
    if(post){
      const{error}=await sb.from('posts').update(v).eq('id',post.id);
      if(error)return setM(error.message);
      nav('/post/'+post.slug);
    } else {
      const slug=mkSlug(t);
      const{error}=await sb.from('posts').insert({...v,slug,author_id:user.id});
      if(error)return setM(error.message);
      await syncSeen('post');
      nav('/post/'+slug);
    }
  };
  return(
    <main className="box">
      <h2>{post?'रचना संपादित करें':'अपनी रचना प्रकाशित करें'}</h2>
      <input placeholder="लेखक का नाम" value={a} onChange={e=>setA(e.target.value)}/>
      <input placeholder="रचना का शीर्षक" value={t} onChange={e=>setT(e.target.value)}/>
      <select value={c} onChange={e=>setC(e.target.value)}>
        {CATS.filter(x=>x[0]!=='संपादकीय'||ed).map(x=><option key={x[0]}>{x[0]}</option>)}
      </select>
      <textarea rows="14" placeholder="अपनी कहानी, कविता, लेख या संस्मरण यहाँ लिखें…" value={b} onChange={e=>setB(e.target.value)}/>
      <label>फोटो (वैकल्पिक)<input type="file" accept="image/*" onChange={up}/></label>
      {img&&<img className="pic" src={img} alt=""/>}
      <textarea rows="3" placeholder="लेखक परिचय (वैकल्पिक)" value={bio} onChange={e=>setBio(e.target.value)}/>
      <div className="row">
        <button className="alt" onClick={()=>setPv(!pv)}>पूर्वावलोकन</button>
        <button onClick={save}>{post?'परिवर्तन सुरक्षित करें':'रचना प्रकाशित करें'}</button>
      </div>
      <p className="note">{msg}</p>
      {pv&&<article className="read"><h2>{t}</h2><p className="body">{b}</p></article>}
    </main>
  );
}

function EditPost({user,ed}){
  const{slug}=useParams();
  const[p,setP]=useState();
  useEffect(()=>{sb.from('posts').select('*').eq('slug',slug).single().then(({data})=>setP(data));},[slug]);
  return p?<Editor user={user} ed={ed} post={p}/>:<main/>;
}

function Post({user,ed}){
  const{slug}=useParams();
  const[p,setP]=useState(),[cm,setCm]=useState([]),[lk,setLk]=useState({n:0,me:false}),[rel,setRel]=useState([]),[nm,setNm]=useState(''),[tx,setTx]=useState(''),[hp,setHp]=useState(''),[copied,setCo]=useState(false);
  const load=useCallback(async()=>{
    const{data}=await sb.from('posts').select('*').eq('slug',slug).single();
    setP(data);
    if(!data)return;
    const[c,l,r]=await Promise.all([
      sb.from('comments').select('*').eq('post_id',data.id).order('created_at'),
      sb.from('likes').select('user_id').eq('post_id',data.id),
      sb.from('posts').select('slug,title').eq('category',data.category).eq('published',true).neq('id',data.id).limit(4)
    ]);
    setCm(c.data||[]);
    setLk({n:(l.data||[]).length,me:!!user&&(l.data||[]).some(x=>x.user_id===user.id)});
    setRel(r.data||[]);
  },[slug,user]);
  useEffect(()=>{load();},[load]);
  if(!p)return<main><p className="note">रचना नहीं मिली।</p></main>;

  const url=location.href;
  const txt=p.title+' — '+p.author_name+'\n\nपूरी पत्रिका पढ़ें: '+location.origin;
  const own=user&&(user.id===p.author_id||ed);

  const like=async()=>{
    if(!user)return alert('पसंद करने के लिए प्रवेश करें।');
    lk.me?await sb.from('likes').delete().match({post_id:p.id,user_id:user.id}):await sb.from('likes').insert({post_id:p.id,user_id:user.id});
    load();
  };
  const comment=async()=>{
    if(hp)return;
    if(!nm.trim()||!tx.trim())return;
    const{error}=await sb.from('comments').insert({post_id:p.id,name:nm,body:tx});
    if(!error){setTx('');await syncSeen('comment');load();}
  };
  const wrap=(x,text,maxW,maxLines)=>{
    const words=text.replace(/\s+/g,' ').trim().split(' ');
    const lines=[];let cur='',i=0;
    for(;i<words.length;i++){
      const t=cur?cur+' '+words[i]:words[i];
      if(x.measureText(t).width>maxW&&cur){
        lines.push(cur);cur=words[i];
        if(lines.length===maxLines){cur='';break;}
      } else cur=t;
    }
    if(cur&&lines.length<maxLines)lines.push(cur);
    const used=lines.join(' ').split(' ').length;
    if(used<words.length&&lines.length)lines[lines.length-1]=lines[lines.length-1].replace(/[\s,.;:।]+$/,'')+'…';
    return lines;
  };
  const makeCard=async()=>{
    await Promise.all([
      document.fonts.load("60px 'Rozha One'",p.title+'वाक्-ऋचा'),
      document.fonts.load("600 36px 'Martel'",p.body.slice(0,600)+p.author_name+p.category)
    ]);
    const W=1080,H=1080,c=document.createElement('canvas');
    c.width=W;c.height=H;
    const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#10192f');g.addColorStop(1,'#1d2c52');
    x.fillStyle=g;x.fillRect(0,0,W,H);
    x.strokeStyle='#d9a93e';x.lineWidth=6;x.strokeRect(24,24,W-48,H-48);
    x.lineWidth=2;x.strokeRect(40,40,W-80,H-80);
    x.textBaseline='alphabetic';x.textAlign='center';
    x.fillStyle='#e8c060';x.font="72px 'Rozha One',serif";
    x.fillText('वाक्-ऋचा',W/2,130);
    let y=170,hasImg=false;
    if(p.image_url){
      try{
        const ib=await createImageBitmap(await(await fetch(p.image_url)).blob());
        const bw=W-160,bh=340,r=Math.max(bw/ib.width,bh/ib.height),sw=bw/r,sh=bh/r;
        x.drawImage(ib,(ib.width-sw)/2,(ib.height-sh)/2,sw,sh,80,y,bw,bh);
        y+=bh+30;hasImg=true;
      }catch(e){}
    }
    x.textAlign='left';
    x.fillStyle='#fff2cc';x.font="60px 'Rozha One',serif";
    y+=70;
    wrap(x,p.title,W-160,hasImg?2:3).forEach(l=>{x.fillText(l,80,y);y+=78;});
    x.fillStyle='#f6ead2';x.font="600 36px 'Martel',serif";
    y-=20;
    wrap(x,p.body,W-160,hasImg?2:7).forEach(l=>{y+=56;x.fillText(l,80,y);});
    x.fillStyle='#d9a93e';x.fillRect(80,935,W-160,2);
    x.font="600 32px 'Martel',serif";
    x.fillText(p.author_name+' · '+p.category,80,985);
    x.fillStyle='#bfae80';x.font="26px 'Noto Sans Devanagari',sans-serif";
    x.fillText(location.host,80,1022);
    return new Promise(res=>c.toBlob(res,'image/png'));
  };
  const sharePhoto=async()=>{
    try{
      if(navigator.canShare){
        const blob=await makeCard();
        const f=new File([blob],'rachna.png',{type:'image/png'});
        if(navigator.canShare({files:[f]})){
          await navigator.share({files:[f],title:p.title,text:url+'\n\n'+txt});
          return;
        }
      }
      if(navigator.share){
        await navigator.share({title:p.title,text:txt,url});
        return;
      }
    }catch(e){
      if(e.name==='AbortError')return;
    }
    await navigator.clipboard.writeText(url);
    setCo(true);
  };

  const shareWA=async()=>{
    const msg=url+'\n\n'+txt;
    try{
      if(navigator.canShare){
        const b=await(await fetch('/og-default.jpg')).blob();
        const f=new File([b],'vaak-richa.jpg',{type:'image/jpeg'});
        if(navigator.canShare({files:[f]})){
          await navigator.share({files:[f],title:p.title,text:msg});
          return;
        }
      }
    }catch(e){
      if(e.name==='AbortError')return;
    }
    window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank','noopener');
  };
  return(
    <main>
      <Head title={p.title} desc={p.body.slice(0,150)} img={p.image_url}/>
      <article className="read">
        <h2>{p.title}</h2>
        <small>{p.author_name} · {p.category} · {fmt(p.created_at)}{p.updated_at!==p.created_at&&' (संपादित: '+fmt(p.updated_at)+')'}</small>
        {p.image_url&&<img className="pic" src={p.image_url} alt=""/>}
        <p className="body">{p.body}</p>
        {p.bio&&<p className="bio">लेखक परिचय: {p.bio}</p>}
        {own&&<Link className="btn" to={'/sampadit/'+p.slug}>संपादित करें</Link>}
      </article>

      {user?(
        <div className="row share">
          <button onClick={like}>{lk.me?'♥':'♡'} पसंद ({lk.n})</button>
          <a className="btn" target="_blank" rel="noreferrer" href={'https://www.facebook.com/dialog/share?app_id='+FB_APP_ID+'&display=page&href='+encodeURIComponent(url)+'&redirect_uri='+encodeURIComponent(location.origin+'/')}>Facebook पर साझा करें</a>
          <a className="btn" target="_blank" rel="noreferrer" href={'https://twitter.com/intent/tweet?text='+encodeURIComponent(txt)+'&url='+encodeURIComponent(url)}>X पर साझा करें</a>
          <button className="btn" onClick={shareWA}>WhatsApp पर साझा करें</button>
          <button className="alt" onClick={async()=>{await navigator.clipboard.writeText(url);setCo(true);}}>{copied?'लिंक कॉपी हो गया':'लिंक कॉपी करें'}</button>
          <button className="alt" onClick={sharePhoto}>पोस्ट का चित्र साझा करें</button>
        </div>
      ):(
        <div className="row share">
          <button onClick={like}>♡ पसंद ({lk.n})</button>
          <p className="note">साझा करने की सुविधा केवल सदस्यों के लिए है। <Link to="/login" style={{textDecoration:'underline'}}>प्रवेश करें या खाता बनाएँ</Link></p>
        </div>
      )}

      <section className="box">
        <h3>टिप्पणियाँ ({cm.length})</h3>
        {cm.map(c=>(
          <div key={c.id} className="cm">
            <b>{c.name}</b> <small>{fmt(c.created_at)}</small>
            <p>{c.body}</p>
            {ed&&<button className="alt" onClick={async()=>{if(confirm('यह टिप्पणी हटाएँ?')){await sb.from('comments').delete().eq('id',c.id);load();}}}>हटाएँ</button>}
          </div>
        ))}
        <input placeholder="आपका नाम" maxLength="60" value={nm} onChange={e=>setNm(e.target.value)}/>
        <input className="hp" tabIndex="-1" autoComplete="off" value={hp} onChange={e=>setHp(e.target.value)}/>
        <textarea rows="3" maxLength="1000" placeholder="अपनी टिप्पणी लिखें" value={tx} onChange={e=>setTx(e.target.value)}/>
        <button onClick={comment}>टिप्पणी प्रकाशित करें</button>
      </section>

      <p className="center"><Link className="btn" to="/">पूरी पत्रिका पढ़ें</Link></p>
      {rel.length>0&&(
        <section>
          <h3>संबंधित रचनाएँ</h3>
          {rel.map(r=><Link key={r.slug} className="item" to={'/post/'+r.slug}>{r.title}</Link>)}
        </section>
      )}
    </main>
  );
}

function Mine({user,admin}){
  const[l,setL]=useState([]);
  const load=useCallback(async()=>{
    if(!user)return;
    let r=sb.from('posts').select('*').order('created_at',{ascending:false});
    if(!admin)r=r.eq('author_id',user.id);
    const{data}=await r;
    setL(data||[]);
  },[user,admin]);
  useEffect(()=>{load();},[load]);
  if(!user)return<main><Auth/></main>;
  const tog=async(p,k)=>{await sb.from('posts').update({[k]:!p[k]}).eq('id',p.id);load();};
  return(
    <main>
      <h2>{admin?'संपादक पैनल — सभी रचनाएँ':'मेरी रचनाएँ'}</h2>
      {admin&&<p><Link className="btn" to="/likhein?shreni=संपादकीय">नया संपादकीय लिखें</Link></p>}
      {!l.length&&<p className="note">अभी कोई रचना नहीं है।</p>}
      {l.map(p=>(
        <div key={p.id} className="item">
          <Link to={'/post/'+p.slug}><h3>{p.title}</h3></Link>
          <small>{p.author_name} · {p.category} · {p.published?'प्रकाशित':'अप्रकाशित'}</small>
          <div className="row">
            <Link className="btn" to={'/sampadit/'+p.slug}>संपादित करें</Link>
            {admin&&(
              <>
                <button className="alt" onClick={()=>tog(p,'published')}>{p.published?'अप्रकाशित करें':'फिर प्रकाशित करें'}</button>
                {p.category==='संपादकीय'&&<button className="alt" onClick={()=>tog(p,'featured')}>{p.featured?'मुख्य पृष्ठ से हटाएँ':'मुख्य पृष्ठ पर दिखाएँ'}</button>}
                <button className="danger" onClick={async()=>{if(confirm('क्या आप सच में इस रचना को हमेशा के लिए हटाना चाहते हैं?')){await sb.from('posts').delete().eq('id',p.id);load();}}}>हटाएँ</button>
              </>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}

function PwChange(){
  const[p,setP]=useState(''),[m,setM]=useState('');
  const go=async()=>{
    if(p.length<6)return setM('पासवर्ड कम से कम 6 अक्षर का रखें।');
    const{error}=await sb.auth.updateUser({password:p});
    setM(error?error.message:'पासवर्ड बदल गया है।');
    if(!error)setP('');
  };
  return(
    <main className="box">
      <h2>पासवर्ड बदलें</h2>
      <input type="password" placeholder="नया पासवर्ड" value={p} onChange={e=>setP(e.target.value)}/>
      <button onClick={go}>पासवर्ड सुरक्षित करें</button>
      <p className="note">{m}</p>
    </main>
  );
}

function Members(){
  const[l,setL]=useState([]),[m,setM]=useState('');
  useEffect(()=>{
    sb.rpc('member_list').then(({data,error})=>{
      if(error)setM(error.message);else setL(data||[]);
    });
  },[]);
  return(
    <main>
      <h2>सभी सदस्य ({l.length})</h2>
      <p className="note">{m}</p>
      {l.map(x=>(
        <div key={x.m_email} className="item">
          <b>{x.m_email}</b><br/>
          <small>{x.m_name} · जुड़े: {fmt(x.m_joined)}{x.m_editor?' · संपादक':''}</small>
        </div>
      ))}
    </main>
  );
}

/* ---------- नई रचना / नई टिप्पणी की सूचना ---------- */
const SEEN_KEY={post:'vr_seen_post',comment:'vr_seen_comment'};
const getSeen=k=>{try{return localStorage.getItem(SEEN_KEY[k]);}catch{return null;}};
const setSeen=(k,v)=>{try{localStorage.setItem(SEEN_KEY[k],v);}catch{}};
const ts=d=>Date.parse(d);

async function latestPost(){
  const{data}=await sb.from('posts').select('slug,title,created_at').eq('published',true).order('created_at',{ascending:false}).limit(1);
  return data?.[0]||null;
}
async function latestComment(){
  const{data}=await sb.from('comments').select('post_id,name,created_at').order('created_at',{ascending:false}).limit(1);
  return data?.[0]||null;
}
// अपनी ही रचना/टिप्पणी की सूचना खुद को न दिखे, इसलिए प्रकाशित करने के बाद "देखा" मान लेते हैं
async function syncSeen(kind){
  try{
    const x=kind==='post'?await latestPost():await latestComment();
    if(x)setSeen(kind,x.created_at);
  }catch(e){}
}

function NewActivityNotice(){
  const[n,setN]=useState(null);
  useEffect(()=>{
    let alive=true;
    const check=async()=>{
      if(document.hidden)return;
      try{
        const[p,c]=await Promise.all([latestPost(),latestComment()]);
        if(!alive)return;
        // पहली बार आने वाले पाठक को सूचना नहीं दिखती, बस आज तक की स्थिति याद कर ली जाती है
        if(p&&!getSeen('post'))setSeen('post',p.created_at);
        if(c&&!getSeen('comment'))setSeen('comment',c.created_at);
        const sp=getSeen('post'),sc=getSeen('comment');
        if(p&&sp&&ts(p.created_at)>ts(sp)){
          setN({kind:'post',at:p.created_at,to:'/post/'+p.slug,title:p.title});
          return;
        }
        if(c&&sc&&ts(c.created_at)>ts(sc)){
          const{data}=await sb.from('posts').select('slug,title').eq('id',c.post_id).maybeSingle();
          if(!alive)return;
          setN({kind:'comment',at:c.created_at,to:data?'/post/'+data.slug:'/',title:data?.title||''});
        }
      }catch(e){}
    };
    check();
    const id=setInterval(check,60000);
    document.addEventListener('visibilitychange',check);
    return()=>{alive=false;clearInterval(id);document.removeEventListener('visibilitychange',check);};
  },[]);
  if(!n)return null;
  const done=()=>{setSeen(n.kind,n.at);setN(null);};
  const t=n.title.length>40?n.title.slice(0,40)+'…':n.title;
  return(
    <div role="status" style={{position:'fixed',left:'50%',bottom:16,transform:'translateX(-50%)',zIndex:1000,maxWidth:'92vw',display:'flex',gap:12,alignItems:'center',background:'#1d2c52',color:'#fff2cc',border:'1px solid #d9a93e',borderRadius:24,padding:'10px 16px',boxShadow:'0 4px 16px rgba(0,0,0,.35)'}}>
      <Link to={n.to} onClick={done} style={{color:'inherit'}}>
        {n.kind==='post'?'🔔 नई रचना आई है':'💬 नई टिप्पणी आई है'}{t&&': '+t}
      </Link>
      <button className="alt" aria-label="बंद करें" onClick={done}>✕</button>
    </div>
  );
}

export default function App(){
  const[user,ed]=useUser();
  return(
    <Layout user={user} ed={ed}>
      <NewActivityNotice/>
      <Routes>
        <Route path="/" element={<Home user={user} ed={ed}/>}/>
        <Route path="/patrika" element={<Patrika/>}/>
        <Route path="/shreni/:name" element={<Category/>}/>
        <Route path="/post/:slug" element={<Post user={user} ed={ed}/>}/>
        <Route path="/likhein" element={<Editor user={user} ed={ed}/>}/>
        <Route path="/sampadit/:slug" element={<EditPost user={user} ed={ed}/>}/>
        <Route path="/meri" element={<Mine user={user}/>}/>
        <Route path="/admin" element={ed?<Mine user={user} admin/>:<main><p className="note">यह पृष्ठ केवल संपादक के लिए है।</p></main>}/>
        <Route path="/sadasya" element={ed?<Members/>:<main><p className="note">यह पृष्ठ केवल संपादक के लिए है।</p></main>}/>
        <Route path="/naya-password" element={<PwChange/>}/>
        <Route path="/login" element={<main><Auth/></main>}/>
      </Routes>
    </Layout>
  );
}

/* ---------- पत्रिका का मुखपृष्ठ (तस्वीर फ़ाइल में ही जुड़ी है) ---------- */
const COVER='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wgARCALRA+gDASIAAhEBAxEB/8QAGwABAAIDAQEAAAAAAAAAAAAAAAQFAQMGAgf/xAAaAQEAAwEBAQAAAAAAAAAAAAAAAQIDBAUG/9oADAMBAAIQAxAAAAH50OjMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAz6rPnO31S2lIVmOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCOkCNiR4tGl78XqFoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxnGT1Oh2PLrOxVxOPo6Bz6XQOeHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueHQueyX+znLGEWPNh9vP4MdOWQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYzjMNtlXWXHvDgzYKcDpxAAAAAAAAAAAAAAAAAAAAAAAGTAh7s6u05tsQp0KY1YzjswyJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYzjMN1lWWfF0Q4M6DeGcZ6sFpV+87Xyilcm1nsrpFJuYn07geTWnlct9D6c66t+q/GMrWOKLPXneIcGs9W7P1wbfOVTad2PpTeLw1HbzybjntmGt6ro+GlzO5P6njbnqv6r8NpN6gW2tdGabXrW8QFZnoGo6jR9J5rg14/dzXW9uW2D9R+Xc2lRX+vPscjz6xeubOss+TdCmwoasZx2YZEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMZxmG2zrLPi6IcKbCvGM4z14PPrzDp/ofNe/mfUg0PP2Pqcv1/hL3lPN6eY+gcB1/q8n0D459F+b8W/j6pw3YSncJq53Sn2CTzu3zOrTf/Heg7sO/+UfSeQKHPnPucGO14rdy6/X/AB8y7jwu/wCe/Qap1Z9n8Z+k8bV9K+f9TV4a1PNXVH7XD2PbcxL8TugcjBz7HF9t5zdS+N28P1fK3/u8H1D5l1/EeV11HrGfoPOYziWbOss+PdCmwqzqxnHbz5EgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMZxmG2zrLPi6IcKbCvGM4z14PHvxDvvHi8+X9j5PYWM32fPuOb7fkfM7OX6bmex9TksuC+ofMePa36Pj/oWOnz6p77mvQ5eizb6PH7vmVtA7P2uCbznafPfN67S54fb1ZWVDv09/L46vnr3l2tHG9rw9O7h/pXy69eivfnncGri/q/yrbPvfHm983q+Ue7z17vndHVdRSeJ6PC3NN0Hued0fI/QeE8vsp84z7/msZwZs6yz490KbCrOrGcdvPkSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxnGYbbOss+LohwpsK8YzjPXg8+sGzquP8AHHv3MDlZfPp9g4fZRce1P3nB33pcv0z5B1XIcm2jo+e8+hz9/U8t55dvrmeS3eZ0097wmfW5Ogoce+jLzn03zx7xiJ6LnXnDTX9O+adNz6fQflfQ8Vza9LfcJ61r13DbPPTju6zjcRPfUXPMdPtXO1lf53RzfUcvae1w/Vfm9pzfmdUHOM+7wMZwZs6yz490KbCrOrGcdvPkSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxnGYbbOssuLoiQpsK8YzjPVgBjHrB5x7xE+M+g8+8HnOcjGUx5x7xE+PrfyXt/P6KCo+88TV899ec+nzZABgGPPvET4z6GHoYyTDGR5x7xE+M+gx6wec5HpjMwwGbOss+TdCmQoa8Zx2YZEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMZwhssayby7eYfTuTfmHTr15h045h045h045h045h045h045h045h045fPTomni9Ezvy+ena58w6ccw6ccw6ccw6ccw6ccw6ccw6ccw6ccw6ccw6ccw6ccw6ccw6ccw6ccxZWnqlqWJuj9mGMHTjkSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwB684paR6isNJiIrMtEEtEEtEvIVyfCifKzQrEuJIiLRLRBLRBLRBLRLaERZxazGbrAqVjpIjfW2iWiJS0QS0SceFtFpMN6hWiWiJS0QS0QS0QS8RRJ8aFq+/OM75heMgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYyMAwyh5eh5eh5ehnruQ+i4acztuKrO0in7DmyTA7nnqzSaepptKVlp0zO/zeZtuujOt37rrG9BKuM0nkLmwqrFD2UaY5vodMsh0Pce6zzdV3XlHzfpOc+i7V5z109JlaqmwO2OOg9X7lT0ve+KzznM/R/nO1PL03z8vQ8vQwyAkyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGGRhkYZGGQ6vlFZ6HTSInrIFEh0miiHUU0BMW+2jGyyqVou53LKW6tyiHR6KNLp49AJu6sWjrKmpVns6WmGNutpXrYFCztYeq1aL1RInsufrUOr5PK0YZWjDIwyMMgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASiKu6SB0VYQBIASiK6GniYwmC11QrxIAlxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADqLvmM5X6qNSWFUfNLm8d3Q6qmtraZyttNb3NB5hiNY0OjttnMMrdfU6KZXq6OPFs6iRzW2J2XXJ7pjpZfH7K26Gro9tqVY1gAAAAAAAAAAAAAAAAAAAAAAAAlK2ipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipSEVKSipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQipQ7ofM+6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxnwZxzMT1/O7Fxy9exccOxccT2LjiOxccOxccOxccOxccOxccOxccT2LjiOxzx1hlfo8eYHndVgocdXBfqAX6gF+oBfqAX6gF+oBfqAX6gF+oBfqAX6gF/nn73Hp9+tfvPsMrzhknDIwyRhkYZJwyMMjDIwyRhkYZJxjHnKu3Nhv6fOqFstSpWwqVsKlbCpWwqVsTUrYipWwqVsKlbCpWwqVtri1Vnx74/SAAAAAAAatuqY52usa76rwQ2zAABIAIAAAAA2zoM7m36CDOg/P+jB8e/Ho+GEwAAAAAAAAABsuaa54/S9btO7H1/I00AAAAAAAAAAevPpGrGfPPlb79G/0fAwL5AAAAAkEAAAANezXXSn26tvlfQBEgAAAAANW3VMc7XWNd9V4MnPY5znjFv258xlzbpFfL37MNIXJ9zye1aodeIADZt7al6Or7dlf5y6Dn98ts6DO59eggzoPz/pQfXm19HxEbqNWW3KZ6/ExxI1wAAAAAvcVfX79PPTbXk6dEMZ+dsuaa54/S9btO7D18bPN9qo17lShXooVzsTzwbAAACPashWSdqSlXZVn168+sb6vPrzz5W+/Rv8AR8D1mwFesia3zaeiqzYbCowXyBAAA9Qxu96eedY6Ya9muulPt1bfK+gCJAAAAAAatuqY52usa76rwemcyR0U/jhMt+cWjpd/Jqz2HOQkg1oAA6bmerz08e/fvHSlqLin6cNs6DO59eggzoPz/pQZkPx6Ph9Jr59W9zmlTAWoAAAABa9BQ3HnezqibtUW58el4my5prnj9L1u07sPX82tU1taRYpFrspiLL1VkguAAAqrWu6MYPvTP9Xjh29LfYabPXn15Pbq8+vPPlb79G/0fAmeIq1Z/mEhO0x0pO6AAmgAAGZ0Dzzzpl659UfTnHSa9muL0+3Vt8r6AIkAAAAABq26pjna6xrvqvB6TFfHh0Co81no+Ksa7Soa0AAAAmdByatuscmh0HPlo2zoM7n26CDOg/P+jBs6yV6HiTJlJui9lYcxIiYsb34vkEwAAABm9oWe3Q0WtEhrhsuaa54/S9btO7D19kiHu1mw8wsTSzjxvJHEbAAAAKm2a0p1w6MqebLUs9efXLrq8+vPPlb79G/0fAmedfiYmIyJm1e/RaoTQAAABr2E59eEAmGvZrrpT7dW3yvoAiQAAAAAGrbqmOdrrGu+q8ENswAAAAAAAAANs6DO5t+ggzoPz/owfHvx6PhhMAAAAAAAAAAbLmmueP0vW7Tuw9fyNdAAAAAAAAAAHrz6Rq8+vPPlb79G/wBHwMC+QAAAAAAAAADXs110p9urb5X0ARIAAAAADVt8nORuk1et51Av14oF+KBfigX4oF+KBfigX4oF+KBfigX4oF+KGbZbcr7Ic/T5/TVp2OrghJpMJNEJNEJNEJNIhJpMJNEJNEJNEJNEJNIg2+mRj1Y36Y1OqwVq6yVoslaLJWiyVoslaLJWiyVoslaLJWiyVoslbkl+fOzJaSOc1dPn9Q5davUOXHUOXHUOXHUOXHUOXHUOXHUOXHUOXHUOXHUOXHUaed2Vtv2efXH6IAAAAAADGfB7bs99NDelobxobxobxobxobxobxobxobxobxobxoSNVGv3psuGY2L9nWgX4oF+KBfigX4oF+KBfigX4oF+KBfigX4oF+KHT0nNXnPhW9/FYq52cdirhYq4WKuFirhYq4WKuFirhYq4WKuFirhYq4WmYu/y/W948Yz6tjWTsaxsaxsaxsaxsaxsaxsaxsaxsaxsaxszq9I958e4zAAAAAAAatuqYl4zj2KBcAAAAAAAAAB61bdWTRZVtl4822M45agAAAAAAAAAAZ5jp+Y3nzAnQfb8nWPU8gAAAAAAAAAB78e4St2nd8/9Nnz6883p4C4AABnAAAAAAA2a9k1xt1bY5QiQAAAAAGrbqmJeM49fORKm4rmp7bUQFrqmd1J0HOAa6AAAM+5DRo3+I6IyVFnl9aturKuiyrbLx5tpEeZjlnPnbvSF5l5ytF8z45FGOgAADGcIbNEjfx9aitd/ZkDjrnmOn5jW/iDOg+35OJEfq+/zOcz0/rHfk1/GvTMe9zjryvjroWlOWwdXKAA9+LK1d8vQ3549XeQ8ta73495ayt2nd8/9Nnz6883p7d27pdMKimvtERV+LzUtT7pmyLT+c6aHbGms5G9PPxLCvz6QXCaM2eJtWCstmvYrjbq2uUIkAAAAABq26piXjOPYzsFemLCF4TNrEjYiLOsJkJkAADfthz46pUD16nVB36HJ61bdWWeiyrbLx5tt2nHNTfmOtEpFErXpAUsAAAxnExqkQI3seLGsa+b6nXP9a9nzm+eY6fmKdXiDOg+35Pm8oXo+VazOeVtYRdK9b3TUK26KurgGmYAC0q52lJjd6159GmXVVvE9+PfP0St2nd8/wDTZ8+vPN6c6TTpi00QhaQ45M3ZXCz81xG+dVEyYxFgSw9b+dZTuW6HrxgxLGu4vQbNezLXG3VtcoRIAAAAADVt1TEvGcexna+YmtW1xXIi1o9+i1gtYAAABv0Jtu9xk29eSufrVt1ZNFlW2Xjzbb9Hrnz3bInq8SNsD1aMeM4xuESAAAAEoWyS7+bx7OLfPMdPzGl/EGdB9vyfNlV7vS8q/wDNLjLW0o5MbTML0AAAAZwJsqoaUlRSlnvx7rMrdp3fP/TZ8+vPN6dvqi67UuVSmt5zciPFwrqAAAB626FueV40NOeRHM92zXsrvjbq2uUIkAAAAABq26piXjOPYoFwAAAAAAAAAHrVt05NNlW2XjzbYzjlqAAAAAAAAAABnmOn5jefEGfA9vydY9TyAAAAAAAAAAHvx7hK3ad3z/02fPrzz+ngRcAAAAAAAAABs17FcbdW1yhEgAAAAANezybvdfr7c7RVpi0VYtFWTaKsi0VYtFWLRVi0VYtFWLRVk2irItNMHbWfdhC1clukctilOqcql1TlR1TlUOqcqOqcqOqcqOqcqOqcql1TlR1TlUOqcqOr53RvtbzDnaOvl0tjp5dbYNbYNbYNbYNbYNbYNbYNbYNbYNbYNeNuTO7Gzg9LxnVrrtJRhJRhJRhJRhJRhJRhJRhJRhJRhJRhJRhJxH2G3Z59UgAAAAAABjOsz51eN9JCOTIRxIRxIRxIRxIRxIRxIRxIRxIRxIRxI9RsxWVo2UsZTnLY7M+qcqOqcqOqcqOqcqOqcqOqcqOqcqOqcqOqcqOqcqOqcqOrm8P2mFtkTfyjbo3OOi3RucHRucHRucHRucHRucHRucHRucHRucHRucHRucHR55vJ1eyrseHPx4gaPR822VC9bdUC3VAt1QLdUC3VAt1QLdUC3VAt1QLdUC390u+s3OdezyfTAAAAAAAatuqY1ad2np6AmwAAAAAAAAAHvOMxTfSXdJXlpdW3V6eYSAPXkAAAAAAAA3djx3Y8VnLdTy09Os2du2sAAAAAAAAADZr2RF1Y11j5XPWRJcT2/DwNcgAAAAAAAAAEyHMz0tNurb877gRIAAAAADVt1TGrTu09PRNxfaZwqXQRygtsWUxVxL7XDnvc6YvUyLmKzp4MuI6QWG9E6Hbb8M+ZSou2vvOMqb6S7pK8tLv0X/pZQs9Xszzqd9hFqrud6bde3PeOs1Q4UbXAAAT89llNTM2cxlaFHOmm7seO7Hjs5bqeWnp9fQ/nn0joy4Pz3tTWaCJ20GXO1vecFfUL6gAAASpMW69LxKiHLicXqNmvZjtdWNdY+Vz1kSXE9vw98noJGbkvfXajmI/Z00q2u7HjtKhpQAAAXFbeKy+jVtUJ0G1UyHMra026tvzvuBEgAAAAANW3VMatO7T09FlFjpWniuIzZ1vlM5BEvXoJ6ipjRmVnWDUErSF0OefnGYVHqk26ttPecZU30l3SV5aWTG1enlf559EdDppNiZcqnwT5dKkEyAAB2F/z+Oa9t883x9qheN3Y8d2PFZy3U8tPTrmwnbrcaqxFbutje4WtOTITYAAAbZpYWsST73x+jnu15Hz/AG9GzXs8/wBe6sa6x8rnrIkuJ7fhzZ9EtSxxXpdfzeY1Jsqo0qEwAABItavpebor4thisx6Xpea0piZDmXrabdW3533AiQAAAAAGrbqmNWndp6ei+8VfiadF4oPSvQczu0tAXAAAAS4iG73GAS95xmKb6S7pK8tLcU+/0sri24r3EdZZ/PtsQibNd7hIAAB68jbqIBIDd2PHdjxWct1PLT0yrKg39dut8cnitO0q6LJGGm4AAADbqTWdmA35rSHHVu2a9mG91Y11j5XPWRJcT2/D6WPVa1erxy2az1nGSY14DSgAAACTGRPQ459za5wdWKZDmZ6Wm3Vt+d9wIkAAAAABq26pjVp3aenoCbAAAAAAAAAAe84zFN9Jd0leWl1bdfp54ZSwyMMjDIwyMMjDIwyMMjDIwyNvY8d2PFZy3VcrPTrHbsAAAAAAAAAA2a9kRdWNdY+VzVkSXF9vxPLLXLDIwyMMjDIwyMMjDIwyMMjDIxMiS8tLTbq2/Pe4ESAAAAAA17PJGxs8bMMpYZGGScMkYZGGRhkYZGGScMjDJGPWNkPdVb6615fPROnPnXRDnXRDnXRDnXRDnXRDnXRDnXRDnXRDnXRDnXRDnXRDnOn87sba+e6XTOlCvGqjXgo14KNeCjXgo14KNeCjXgo14KNeCjXgo14NE175Yq9Vn47OOvWC1a9YCvWAr1gK9YCvWAr1gK9YCvWAr1gK9YCv2TPdbbNnn1wdoAAAAAADGdZjzp1/QeBKRWlJSKJSKJSKJSKJSKJSKJSKJSKJSKJSKJXuJ6x2mecaPI9vYjY9SZSKJSKJSKJSKJSKJSKJSKJSKJSKJSKJSKJe2BL442aPdbrzTkF6PPOQROQROQROQROQROQROQROQROQROQROQcll7iSPC7o2qshdWF+59eOgc+Ogc+Ogc+Ogc+Ogc+Ogc+Ogc+Ogc+Ogc+Ogc+Oh2c1MpPTZ17PN6wAAAAAAGrbqmI+jfo+w+TDbEAejyejyAAAAAAD378e+Tqk6N+j576fV59efduEjOAAAAAAAAAD3KiyvMqrrGu6OHwPa5AAAAAAAAAAHvx7JW/Rv+T9Sgr7Cv7+XyNIAAAMZAAAAAAFjXWOc9Dt1bfF7wiQAAAAAGrbqmI+jfo+v+Tsl3jn2psW0lFBdYxS+2FK2UtzueqaU4jzJjd/GFoAk3ebPm7KtaM9KOj7fiOjm9+/HvG0nRv0fPfUat2m19tiH11ZhnD2TcViLU9BHtMKF3XNkOu6jl9bhroABtm1l5flzC0e5iIM+v3KiyvMqrrGu6OLFjA6r0uSHAvJXLainpFZ5nx1nP8ATWpHXUAAAD3u1qxu8ad5G9+Pdplb9G/5P1KCvsK/v5bW3mb868xjoPUuex0ns4y4usxNBMstqOW0dPDmeQG4ABP9XHTyY5foeey1WNdY8+/Q7dW3xfQCAAAAAADVt1TEfRv0fX/Jz8169J8HC0T0BWdkqCtE9AQC9QAOi36JHF6O+wgTqaR+H7nhunj9+/HvNJ0b9Hz31GrGfPu2laPAnIO6sSdcXErGuJmdBAJkADVdU9lp5fvV7xeIAw9X3KiyvMqrrGu6OLxZVr2OOwrwn+oHus2EKOkF4AAAZxtNniTErEnzq8Hj3492mVv0b/k/UoK+wr+/lstlPm0YtKxK0mVEWFhKpRKk1iUmRXAJAJmei1w80GqNeoc/Ssa6xznodurb4voBAAAAAABq26piPo36PsPk7aTRIjqfHMes7+cHXzgAAAASJFei1gr0TOgk19+/Hvl6ZOjfo+e+n1XFPn25uZvL5pXopfI+oj3p9edtAmQAAAG/QtlvxpAV19yosrzKq6xrujik2FH79Xk6nxzGMp66spvUtQ6agAAAAZwAD349krfo3/J+pQV9hX9/L0uKDXMdy4X1V23C79FgXAAAAS9eggEgLGusc56Hbq2+L6AQAAAAAAatuqYj6N+r6/5Py9t8fD2PD2PD2PD2PD2PD2PD2PD2PD2PD2HvGeTqk6N+j576fV52efdt5ekz5eh5eh5eh5eh5eh5eh5eh5eh5eh5ehmVGk+ZVXWNf0cOt7e1yeHseHseHseHseHseHseHseHseHseHsePb1CRv0b/lPUoK+whd/LqbGka2wa2wa2wa2wa2wa2wa2wa2wa2wa2wa7GFNznodurb4veESAAAAAA17MEPXK8+n5sdvTGhvGhvGhvGhvGhvGhvGhvGhvGhvGhvGjb790v60yPHH3xG9110Nw0tw0tw0t2TQ3DS3DS3ZNDcNLcNLcNLdk0yfO3CfEGx1XzhJmOnKIliIliImYIiWIiWIiZgiJYiJYiJYiJYiJeTzuz68/opInReNs6BfLRQr7KKBfChXxNCvslAvhQr4UK+FCviKFfChXxNDJtvUPezGePoAAAAAAAAwEAAAAAAAAAAAAnOABAAAAAAAAAAADIlgAQAAAAAAAAAAEmSJwAEAAAAAAAAAAAZCQAAAP/8QANxAAAQMDAwIEBQQBAwUBAQAAAAECAwQSEwURFCIxITIzQBAVIDBCBiM0YCQWNUMlJkFQgHA2/9oACAEBAAEFAv8A4d2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2Njb+j7GxaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpabG39EQpmI+Z3CjddRF9EX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0ZfRl9GX0RfRF1EXURE2jmfI3Z/9CQpfXqfX3Li4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLjcovXm9Rf6EhS+tVev/7VCh9eb1F/oSFL61V6/wD7VCh9ebzr/QkKX1qr1/opaKOpZ8qhPlUJ8qhI9FZK/wD0tMTaBxz5TCQ/p7kJ/paYdo8TXfKoT5VCfKoT5VCM/TMkjH/pmSNvyqE+VQnyqE+VQkrEjlKeFJ5flUJ8qhPlUJ8qhIv046dn+lpT5VCfKoT5VCfKoT5TCfKoT5VCfKoT5TCf6WmJv046BnymEh0JKh3+lpiXRGwPq6RlN9ND683nX+hIUvrVXr/Q16tMziGOpqCWlrYE0aZXanufqeRWvzuP0y+6n3K2ZUrM6iSvcqUtcqSPlidpjt9P1FdqCFKipd8s1LaR0sTsym+6iLauZRkVXIkjpYlzuNBddprl6VndvSwVVYrtF1FqSrLC9JXKvHrTj1px603mhl3P1C+3Ts7j9NyK6t3P1BIrdSc9XfTQ+vN51/oSFL61V6/06PprKgSRGpV65Ik2ny361mP1K+55+m320+YrfGshidPJQUkFAys1FKWPUtTkrIdNl2oKn9+nTVYqJtLqDaqOtghropoXU8vx06KkoGRVrJ21LIquOtpHUc+hSW6a6bphiz1EOOni1KulSsrJeXpjVtdQy1VbJDtCmo60/JLUOqJ8xr8l2nn6cdbWZjXnXaj9ND683nX+hIUvrVXr/QpTOSKnmqLYlW5dNW2uzGtvvcaK+yHMVXjU6MiZ8xrE6vnKKXakqJ9oFe5y6PUK2bMayiLN8VmUoa10MqT7pqcSVVPpUllEs3hTUckFTmK2mjrUr3NiiNPRKelmqLYnOuVnnzGryXUZozrajMast1Z9ND683nX+hIUvrVXr/Qoxu7J41WEoP5dhqybKaSm8VhUevpPithqbbaopWf41Uz/HNMbdV2GreC6Xth2aaptv8NOmytmkbClOuWJWeC1S70dWjksKyjzxETd4qmNVpxvnsNTbtSmlJvPYakm1V9ND683nX+hIUvrVXr/Qppc7ZocZV6RPHJp2nPhkxmuttcaG26DGVX8nTpsFQjEVNS051S2LSap74o246xm1I2KR6aVp74Gq1GpqM+eojlsTkqPkyfCGnkqXpi09s1Q6RdIZvQrH4JC96NcrF0qfkMVmyP8ANpU6Sw4yr0meKSk02Rr8ZrDNqI0RN6nGaum1b9ND683nX+hIUvrVXr/TDMsTodYkRH6y7ajq3VOp4z9Rps8/Trd6fGVn8vsUepvhT5ym1Xqr5G6e26h1Bn+DQahJTM+cu2q9SkmO/wBDURXT1ccMb3q/4aGzfTnM6aGo48z9Mp6hdOpafTm6jqjVjIZlidDrD0RdZKnUHzvxmvN208/Tyb1eM11NtQ+mh9ebzr/QkKX1qr1/sUcy09T89nNRrX1qmnahJRx/Pagmesk3w3X4Uurzxw12pVTWfYVd/jQ6pLS0665Pt/5SZyHIUc5XfRuo3wd89nK/U5aunNPq30c3z2crqh1VUfTQ+vN51/oSFL61V6/2Njb7XZeNBrFBX6VUUC/b2+1t9uh9ebzr/QkKX1qr1/afp/UEiPByatTaZDH7+h9eb1F/oSFJ69V6/s9hqq1UrJER8iv/APQUPrzeov8AQ6Z9k2SBS6A3gN4DeA3gN4DeA3gN4DeA3gN4DeA3gN4DeA3gN4DeA3gN4DenN4DeA3gN4DeA3gN4DeA3gN4DeA3gN4DeA3gN4DeA3gN4DeA3gN4DeA3gN4DeA3gN4DeA3gN4C6ASWFqyru/+houxkcZHGRTKplUyqZVMqmVTKplUyqZVMqmVTKplUyqZVMqmVTKplUyqZVMqmVTKplUyqZVMqmVTKplUyqZVMqmVTKplUyqZVMqmVTKplUyqZVMqmVTKplUyqZHGRxv/AEfc3Nzc3Nzci0qaWN+k1TSpp3Uys0iZ7HaPUoLplWhUwrTybm5ubm5ubm5uU2ny1MbtHqUHUE0cVLRSVZ8mmF0irQXTKtCSilhg3Nzc3NzcpaWSrcujTjtLq2lTTupl3Nzc3Nzc3Nzc3N/6g23eqoWOoqV8kjtUoUpH6hp7EghueU7aqabUaRlLUUNDFXzVVNDSTrTNayTSGR0L7CmhgnkrdOZQzV+lR6e2XSY4qGn09ldp8CuVZKKWWg06hj1CmXDG5sqIOgnbRVVE51BHTsmINHbNSupUja63eDSGT0VDpMdfDpdLFWolIqVLW1LanU6RtLPxW2VeipStkhjiWfSI4KP+r1Kf9s0a0NTpmq6Q6hi1VP8AoMmnVWmNraaNuqa3Dm1fXXfL49FYlXqbXK79RUr1d+oNUhbBqGiadDVLqdYysq/1Qn7Ncn/bmhp/0f8AT6PZp9HpcdfT/pZOnQ6KKprIHrXavrla+mSuarf04z/H/Tmkuf8AJf0+99XROREdo3+Ro2gU8kNF+l0/y66eWDUI6qnrY9ZYx+sfqSSWN36ilkgpNZbk0XUk/wC3/wCry6vFJo79TSo06r1HLR1urw1Om/M8j/nL5tR1TUW1tZW6pBqcMVTxajUK6Ovk0/Um6cSyOmk03UHadUajVU9XVazq0WpR1GrwzaTp2rw0dBpmr8OF1dbDo2qxaamnaqtBVVckUlQup1jm1OsRz6VS6pVUccGvNbQrq9YtOMkfGul6zHRQaNqEemzz1LZK2lq1jrtX1BmoVC63Wuj1HXm1LazUamuKvV4qjS//AJZpmwOkrKCOljHafSU7ayjfRv8Appad1XULR6er6inkpZfhRQUtQVlM2ld9HHXjf2TSdkhmw0zXQPZDJU0lK3VKtZaDTnI2jqUlnjqq18mjaH4ry2/LamaCKtrXcOj1tyfMNKmWDUMlz6qsZa1IWV7am/T6pz9Pptflyaix7I4dRZNTP1mRpo8E00Ds8en7tbqtNnqNM1pVjj/sOnatPQKlXBHBFr1VElPq8Dm1NSyampdQkpY5NYjfUyVTZKClq5aN8+qpU6fPqUS6hVaotZRy8aumppEhqfmbo5dQ1BK2Kl122oWqZ8tnrYquDUahlXW0+rywtn1NiyV9SyqdRVjGRc5PltJqTm1/OqOLW1Taln/5dxZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWc4s5xZziznFnOLOcWf/AOA9zc3Nzc3Nzc3Nzc3Nzc3Ljc3Nzc3Ljc3Nzf32zjZxs42cbONnGzjZxs42cbONnGzjZxs42cbONnGzjZxs42cbONnGzjt8LXKWPLHljyx5Y8seWPLHljyx5Y8seWPLHljyx5Y8seWPLHljyx5Y8seWvT2KlUl1Va0taWtLWlrS1pa0taWtLWlrS1pa0taWtLWlrS1pa0taWtLWlrRGNVdP8xU+S1DZps02abNNmmzTZps02abNNmmzTZps02abNNmmzTZps02abNNmipsb+KL1bGyGyGyGyGyGyGyGyGyGyGyGyGyGyGyGyGyGyGyGyGyGyGyGw4Uh8YvcS+EaewcT/wAv28fqUHmKjyO9wvZO/wCfuE7PFKf0vcTem32Dib+X7eP1KDuT+R3uF7J3/P3Cdni9qf0fcTem32Dif+Wcac4s5xpzjTnGnIadWpqOkNgWRtDG9tLpl8zFa/62RukdFpPRUUctP8YvUoPMT+Rw2KR5RxsY6akfG/BMceb7tFTU8xW0KQOo6PkLWUlND8V7J3/MRFUxSGKQxSGKQxSGJ5jensE7PF7U/oljixxY4scWOLVLHFjvt7DGXJ8ZvTb7BxP/ACzTEdplLpC/9GoYHskoqfiVMemvdQ6iv/b+tr/g67E6oq6OCGi1jVP9x+qnax8sccMLbmiqxTUaeCNpF6lB5ifyONNp5pp6llNWN1D/AC2cGmdXTp8xpPuRSrGqXTU7G4Y6iRyu+C9k7/mMar3T/t0dWi8NU20vUPR1JrnyQQpJFqC/4v2ZpcTW1L1JJrI21L1GrcgnZ4van9EpUVgyNtm/+FJ/E2xU7N4Up0xkS7w/Z2VEdssTZen4zem32Dif+WUepxM0+i1GCloY9WKPXGtmbVzshqtRim0rUdShq6av1hk1V81pfmlZM2oq/rnany2sam1U1ErNVREriL1KDzE/kcUVW6inlr6fJXaiycq9Q5MiagkdH9zTo0fNNOyIhqmympR7t+C9k7/n8KiqZUxTVTX08tTJKyqqmTxz1yOl5itjqapk0H2ay7dpLksaQb4xOzxe1P6JBOkbWTLELO1YHzNdTrO18OZ1qTvRGVCNi+z4OhfIqOhjS2RGJ8ZvTb7BxP8Ay/ZSJvptWnTVJ/lat/PIvUoPMT+R3stNktlq4XTNpqd0D9RftH8F7J3/AD9lVSM2Z4rPIzGzxVioqCdni9qf0fZPmVjYoxIW/RN6bfYOJ/5ZPQQsp4NNhkp3aRC0XSYGpWQ0/D+3SzMgl+cRbfOIj5xEVeoxVMJF6lB5ifyOKSCJ8UVCj6pumQPE06JWwUsFOVDWsn+2iq1YtS8H6iwke6R3wXsnf8yFmWWaJiJwmHDYNpI2yViMVPtywSOkSCQdBKokEhCx7fgnZ4van9ESJtscTXM47TjtLWY/uK3dzekVyr9E3pt9g4n/AJY/UJZIEqXpA/UqmSNtfM1vMc6l9jF6lB5ifyOKeqfToypkZNDXTQK2qlYNr5UmeqOf7Feyd/zGuVjpZllOQ/d9RJIOqXuJZcvsk7PF7U/omZ1qPVG5n2pM5BJVt9lN6bfYOJ/5ft4vUoPMT+R3uF7J3/P3Cdni9qf0fcTem32Dif8Al+3j9Sg8xUeR3uF7J3/P3CdnilP6PuJvTb7BxUMkz2SlkpZKWSlkpZKWSlkpZKWSlkpZKWSlkpZKWSlkpZKWSlkpZKWSlkpbMhRRuYpM1XNtkLZC2QtkLZC2QtkLZC2QtkLZC2QtkLZC2QtkLZC2QtkLZC2QtkLZC2QskUTv+ezkOo6jqOo6jqOo6jqOo6jqOo6jqOo6jqOo6jqOo6jZw9PFSD0fcTek32CisMRiMRiMRiMRiMRiMRiMRiMRiMRiMRiMRiMRjGs2+Dm7mMxGIxGIxGIxGIxGIxGIxGIxGIxGIxGIxGIxCRiIKgsZiMRiMRiMRiMRiMRiMRiMRiMRiMRiMRiMRiMY1u3wczcxGIxGIxGIxGIxGIxGIxGIxGIxGIxGIxGIxGIazYT2NjjG4xuMbjG4xuMbjG4xuMbjG4xuMbjG4xuMbjG4xuMbjG4xuMbjG4xuMbi1U+DY3SHHlOPKceU48px5TjynHlOPKceU48px5TjynHlOPKceU48px5TjynHlOPKceU48px5TjynHlO3vdlNlNlNlNlNlNlNlNlNlNlNlNlNlNlNlNlNlNlNlNlNlNlNlLVNl9ioningeB4HgeB4HgeB4HgeB4HgeB4HgeB4HgeB4HgeBsg/0yh905f3N+pEQ6TpOk6TpOk6TpOk6TpOk6TpOk6TpOk6TpOk6TpNk2j8inc6TpOk6TpOk6TpOk6TpOk6TpOk6TpOk6TpOk6TpOk7K32Dhnb27e8nplB7pfU/JO3t07M8q9k9yvdvsHDO3t295PTKD3S+p+Sdvbp2Z5V7J7le7fYOGdjjyqlPEVTM0eJ4lPKokEriJr20jvN9rCg9lvxb3k9MoPhEhuiljN3ot9jjG8Vqt+2zrbaL4L9C+p+SdmtV6pSzOVaWdqto6h5x5TjylNS2y1tC6CobR1Dzjy/Ya1Xujpokdip3D6Vr0+CdmeVeyCmGQjppHOipW1FPhkONMiYJFJIZIiKF91rHRrBIitppnFLA10tTBgl+pU2+he7fYOGdimalLDTIiUTP9r4SNbLvTvo4kjbSvy/aY25VY1o1yuPOPjREG95PTKD4UvnYjt72ulsvnkVpL69T6v2V7QekVXrwL+18V9T8k7MZkfx4aOvSmjqNY0590jI4qvTJ6BtIyv/3SWnjqNX09yLVwRxVlD9cTkp4nVCRwvqEbFJUWtrGpuJ2Z5V7J8IYXxEMSQ1WnelHFHHptR46a6kSkqNV/lUbZcEM7KjUIKeN72qkNGsDIdSr/AOZ9CKiO9eWoi8PivdvsHDOxFVWwxVKRwtqUSlvcNr3XpPJG6Gsxt+zE7ZXu2KZIXtVyDnIjRveT0yg+EUmNzJbH5GpIk20mRMb5rnyvyO+yvaD0ip9eFf2k7fBfU/JOzVVqv1JslRJXv5kOrKwWtl4+V6lRqKT1U+oOfVwau5j+dLg+u+NIJpIrJHxYXPiSnqVTjCdmeVeyfBlW5qQ6i5k1NWJA2Krkijnrc1M2ZySVdRyZaOsWlWCqjp546x0UiPaj+e5aqolzzfRCiSSJURNMjUSojRnxXu32Dhnb2VibKiuNnK6VNnDe8nplB7JfFHRWMS8dHerOlrPL8F9T8k7exgc1yI2GRqsikY5sMpUSJI8Tszyr2T2S9od8qCbYqjbD8F7t9g4Z2JIWJGyGLEtLEhxokJ7cP3GybCyGUVblG95PTKD4RomyRor0jYpjbs1GsHeb7qU6IYhqWp8F9T8k7N23q4oo5eDT3rRQlVSwQx/djqXMOeSTukT4J2Z5V7J8GwxrFDDE6BaOFESiiP20pvtptvcxBHsQfJcJJu34L3b7BwzsLO9WI9yMWaRzUmeiZVx+xb3k9MoPg16tLlRUe5C5UL3br7NfU/JOxJK6U5EpJPJKSVEkqeyTszyr2T4JUSJG2RzEzyWMnkYNnc1vsl7t9g4Z29u3vJ6ZQe6X1PyTt7dOzPKvZPcr3b7Bwzt7dveT0yg90vqfknb26dmeVeye5Xu32Dhq9N5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXknplE5rTNGZozNGZozNGZozNGZozNGZozNGZozNGZozNGZozNGZozNGZozNGZozNGZozLGL5/8Aza9DrP3D9w/cP3D9w/cP3D9w/cP3D9w/cP3D9w/cP3D9w/cP3D9w/cP3DZ6jU2RT/wAbqbqbqbqbqbqbqbqbqbqbqbqbqbqbqbqbqbqbqbqbqbqbqbr8G+wUVhjMZjMZjMZjMZjMZjMZjMZjMZjMZjMZjMZjMY1m3wc3cxmMxmMxmMxmMxmMxmMxmMxmMxmMxmMxmMxmMSMRBUFjMZjMZjMZjMZjMZjMZjMZjMZjMZjMZjMZjMZjEbt8FYYzGYzGYzGYzGYzGYzGYzGYzGYzGYzGYzGYzGIwT2Km6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6fGSVkScuA5cBy4DlwHLgOXAcuA5cBy4DlwHLgOXAcuA5cBy4DlwHLgOXAcuA5cBy4DlwHLgOXAcuD48mE5MJyYTkwnJhOTCcmE5MJyYTkwnJhOTCcmE5MJyYTkwnJhOTCcmE5MJyYTkwnJhOTCcmEY9r0HSNaZYzLGZYzLGZYzLGZYzLGZYzLGZYzLGZYzLGZYzLGZYzLGZYzLGZYzLGZYzLGNkY5fYOF8X9J0nSdJ0nSdJ0nSdJ0nSdJ0nSdJ0nSdJ0nSdJ0iWqrOxqPp9KHQdB0HQdB0HQdB0HQdB0HQdB0HQdB0HQdB0HQdA5EEUUaiHQdB0HQdB0HQdB0HQdB0HQdB0HQdB0HQdB0HQdB0q2j9FSfxl6TpOk6TpOk6TpOk6TpOk6TpOk6TpOk6TpOk6TpOki6Zm+wcfn7dnmb5TUPTf7hezRe6eX27fLR+ivaX1V7+3Z67fYOPz9uzzN8pqHpv+rZU9kvZoonlEje5ntW+Wj9Fe0vqr39uz12+wcfmMo5ZGx0k0w2inc1KOZY8SkUD6eTUKRsVQtDO1ZoHwLFSyTK2hneU0mJtTSup3/TFE3aaFYl+DPM3ymoem8gpZKlfldVnTSap0+l0tRA9dRjkNTp3YeM4XTKlsNTp1RRp9mCkfOkFFA0VkMTJ5c0ovZoonlhYr5WPxSVFE6GZtDM9vymrSZ9JJG5mm1EkSpsv2oGI4bRKrqqNI5Pg3y0for2l9Ve+FR9BPHEylfI6WilgdFQTzmBRaCdIft6cjXTL3+LPXb7Bx+ZStbRUtPE2GGB6zUcX+yz0rYKXUf5NbA2p1GSdX1urfzNIi2lolYrKbp0uoyL9MTbnNQ6XJPAsLhnmb5TUPTeaLQtrKhlVHWa/S//ANPo/wDvWkokdHVUU09FqMEFHWaxMtJB+qO/2KOn5EtnS+N7WVlVm+K9miieWByMmq4ZH6zFK6XWqSmmugr2V2sx6eyur6Ff+j/bguuYspVXZvg3y0for2l9Ve8P+PolTPJBpVZExK+ppWVer6U3FUUtCyWhqF30D7UFPE6kopY2PRaepmrI2RT/AAZ67fYOPzIK10ULZ3xEdfIyFtYraQnr3TyVVW6qlbWTI+qqFqpWSPQ01LBKp0cNTV8mP6IGbNRvwnkakQzzN8pqHpvKOrkoZ/mn/UI9XfHqNJrD6WrpNUkpmy1KPSv1JdQOdVWalqbtR+zpke1OibFZVJSwfFezRRPKUtU6lnn1SplloK+XT5YtSSCtnnWeem1J1NR/bp2WtjK+G6P4N8tH6K9pfVXvBW1FM2XVpZYedM6prKt1XPpipRUc0eJX17n0P2YYlmkul2hhxVUUb4opYpJviz12+wcfn9NrkT6UqZmt+mFW3MYiDpW7QySyyybJIM8zfKah6b/paxz/ALtLVQ0kFTq0SslnknX4r2aKJ5fpcxzF+3Ey9zRomzkmiwyDfLR+ivaX1V7/AERy1MLFcq/bgndTyJqsVrJpaqop651O2fVen4M9dvsHH5k0UaQxx0/HfSQtTj06JUubxvuJUuSOOV0TpKiST4s8zfKah6bzSljWajpY5K6noqGpRlJSKyBsVMtUrFqftJ4LI9ZZPpXs0UTy0MbZqytbHZwqPLJRUzRtNRwz6vIj2/bjkxqlU5Dlv258iLPMs7xvlo/RXtL6q92QxLT0sVPxHUdM1jaOm3V8aUX3IJWxP+bqP1VJG/Fnrt9g4/MWaRY0e5G5H2pLIiJK5sfsWeZvlNQ9N5BVz0yNke2RtRKyRsr2K2qmbM96yP8AYr2aKJ5UVWrNUS1CrNIrXyvkH1EsiS1EkzPYt8tH6K9pfVXulRKkTJHxiSyI1k0kaRzvjT2TPXb7Bx+ft2eZvlNQ9N/uF7NFE8vt2+Wj9Fe0vqr39uz12+wcfn7dnmb5TUPTf7hezRe6dvbt8tH6K9pfVXv7dnrt9g4U3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3NzcTsVkTpWcedDBUGCoMFQYKgwVBgqDBUGCoMFQYKgwVBgqDBUGCoMFQYKgwVBgqDBUGCoMFQYKgwVBxJnK0ccaVphmMMxhmMMxhmMMxhmMMxhmMMxhmMMxhmMMxhmMMxhmMMxhmMMxhmMMxhmMEylMxWRqSxq51shbIWyFshbIWyFshbIWyFshbIWyFshbIWyFshbIWyFshbIWyFshbIWyEUao9vsVaYzGYzGYzGYzGYzGYzGYzGYzGYzGYzGYzGYzGI34K0xmMxmMxmMxmMxmMxmMxmMxmMxmMxmMxmMxmMRgiCoKwxmMxmMxmMxmMxmMxmMxmMxmMxmMxmMxmMxmMRPgrTGYzGYzGYzGYzGYzGYzGYzGYzGYzGYzGYzGYxGiexVyIXtL2l7S9pe0vaXtL2l7S9pe0vaXtL2l7S9pe0vaXtL2l7S9pe0vaIqL8FVEL2l7S9pe0vaXtL2l7S9pe0vaXtL2l7S9pe0vaXtL2l7S9pe0vaXtL2/HKwyMMjDIwyMMjDIwyMMjDIwyMMjDIwyMMjDIwyMMjDIwyMMjDIwyMMjDKwRUVCSpjidzYTmwnNhObCc2E5sJzYTmwnNhObCc2E5sJzYTmwnNhObCc2E5sJzYTmwnNhObCc2E5sIyqikd7Bw7xk3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3QTZVj7D/L4IboboboboboboboboboboboboboboboboboboboboboboboKfl+SbG6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6G6HgqR+RSr8ahVbvu03abtN2m7Tdpu03abtN2m7Tdpu03abtN2m7Tdpu03abtN2m7SnS2qb7Bx/wAnt2ednlHeV3ufy/JO3t07R+Ve1T/JXv7eH+W32Dj/AJPqRrl+Fq2/eZ5meUd5XfQib+1/L8k7e3TtH5V7VP8AJXv9jdPvw/y2+wcf8hDQvnbHQvliSge6CKhfMzgvwLJU09O2eaWCsY51PHSOldJSOhe5Nl+mCB1RJ8oPlB8pJ9NxRjPMzyjvK4ihzL8tlzOgsdTQTRNqafNGsclTRpDuRafLMmNo6heyD6443SufQSxtpoqVUnSJn0fl+SdmpurqB7YamOTgx0D5Ykp5aSDVqePaKmzSVFOtM/7TU3XGha0k7Cdo/Kvap/kr3pdNfWLpUE7BmlSvpnaXI2mm0uSCGl0yStXjoqsoZmUcM80c2t0EEFTJpMsbK3T5KB3100F7q2jiwfCH+W32Dj/kKVGUlFRW/Lov9jpGNpqJ23ySo/2ip3pKWqaiUc+T5lHLIuq1KNbUfTpXo9R1HUVf8MZ5meUd5XGmw5JmPY7V4oIZpoXXaQv+xqnC0+np5KV8bUbPBBCtBUrvo/1xKqPTnSRtgkkdJSyxfR+X5J2jRqvrraOkrrfl0S01GV/+z6kzK137Gqar/P8AtR93+ZO8nYTtH5V7VP8AJXvo8UdPS6I9kppjkn0atYsf6d1Nt+lajFNTzaTE6Chjkmi/Tup/u6drEUM2pV6z8j9TfzvqhpHPa1pVVSQN+EP8tvsHH/IQVskEcda+KJtZI2l3XbmScV9ZJJTJI9qS1kk0EddURrJXTvf9WmuVlPyZiCokdKvet/iDPMzyjvK4RVQpql9LJI9ZHsrJGU3MkWljrZGQMqpY1grpoPg+skfTfXF4VElXLIyKd8JJI+R3x/L8k7D6+SWCWtkmgJa2SamqK6WoauoyulnndUS/ZRNxjNlcm72ohN4fBO0flXtU/wAle9FqM9CU2py0ij9QlfRVGozVNPHrdS1VrJW1Hzeq40lVNM+u1CXUHNqJWlbXS18v0ww3kM6U6VE98vxh/lt9g4/5PY6a1X0/FmIKeRsqou9Yn+IM8zPKO8rvpZDJIdvuQ/yNjYVPD4/l+SdvoRquWSJ8S/bYNciI5eq8c674J2j8q9qn+Svf6ONNj+3SQciepjjiillyL9EP8tvsHH/IPVHafFhSlkhhY2yG37kU8kJz6g59Qc+oHVs72DPMzyjvK4oUXFDHEtbBHBMMbCrWWMfMqLN9tvS7M4zOMrl+j8vyTtRta6qrfLjp8kscLFVtPFJqLt0+5v8ASnaPyr2qf5K94klTTaJIOC6CmSGOClcLLHwftwVD6ZZZ5Jl+mH+W32Dj/kN123VE3Xa53s2eZnlHeVw17mG/jcu+6oI9yOc5XL7L8vyTsOe567qqbqornKOkc5vsU7R+Ve1T/JXvmltRytEVURHuaMmfF7OH+W32Dj/k9uzzM8o7yu9z+X5J29unaPyr2qf5K9/bw/y2+wcf8lri1xa4tcWuLXFri1xa4tcWuLXFri1xa4tcWuLXFri1xa4tcWuGtW5nlHeVUVS1xa4tcWuLXFri1xa4tcWuLXFri1xa4tcWuLXFri1xa4tcWuLXCn5fk3xS1xa4tcWuLXFri1xa4tcWuLXFri1xa4tcWuLXFri1xa4tcWuLXGyo2Pyr2qf5CsfvY8seWPLHljyx5Y8seWPLHljyx5Y8seWPLHljyx5Y8seWPLHmN5D/AC2+wcORFPA8DwPA8DwPA8DwPA8DwPA8DwPA8DwPA8DwPA8DwGoiIO7bIeB4HgeB4HgeB4HgeB4HgeB4HgeB4HgeB4HgeB4CIh/5XvYWoWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlgxNkUqKdZH8RxxXHFccVxxHHFccVxxXHFccVxxHHFccVxxXHFccVxxXHFccVxxXHFccVxxXHEcQUyxyN9irTGYzGYzGYzGYzGYzGYzGYzGYzGYzGYzGYzGYxG/BWlhjMZjMZjMZjMZjMZjMZjMZjMZjMZjMZjMZjLBEFQsMZjMZjMZjMZjMZjMZjMZjMZjMZjMZjMZjMZYInwVpjMZjMZjMZjMZjMZjMZjMZjMZjMZjMZjMZjMYjP/wAH/8QAMhEAAgEDAgUDAwQBBQEBAAAAAAECAxESE1EEFCEwMRAVMiAzYQUiQVBxI0BCYJFS0f/aAAgBAwEBPwH/AKfYxMTExMTExMTExMTExMTExMTExMTExMTExMTExLf0UF1MkZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmYpE11/oUQJlzIuXLly5cuXLlzIuXLly5cuXLly5kXIE/P9CiBP0ha/U/0y0L2JUoRVyEacnZE6cI+T/TLQ2NGFriUNj/TGQwt+4tTIRhJ2ROEI+RQi/CP9MtDYtAdGCVyKpydidKEVdkrX6ekCf8AQogVPWnBRiamUkV1+w4b5nFeEcPT6ZFar/xF8SnWu7HE0+mXpSai7shJTRCnjUK8G2icXb9pV+RBdLsnVcnYqfFlH5o4n4esCfn+hRAqeq/dEhSkpnEfA4b5nF+EcM/2FWlLM/4lGDcjiH+wp1oqNirLKV0cPdO/8EKuUrI4mTVrFGtl0ZxUVdMX7oipSysVPgyh80cV8PWBPz/QogVPWnWcTXbaK804HDu0ziZJpFOo4eB8S2aixI8Q4qxOo5efWdTI4eVpFep1TRGpTTyKtXNlOs4j4hsqVFiyk7TRxE04+sCfn+hRAn2qD/hk6G3+wgT/AKKHkdK5oGgaBoGgaBoGgaAqI4Sf8mgaBoGgaBoGgaBoGgaBoGgaBoipWJvr/RJmZmZmZky7LsuzMzMzMyZdl2XZkzMzMy7MmZmZmZmZmN/08P5P+NyX8WJKyY1boYot1sNLqJeBISukL+TG7QoppEFeVmW8C8tEo+RxRLol/WJ2MmZszY5NmTvcv/JmzJmTMn4LmTM36ZMuOT8jm2N3/srfRb0t/bRYmP8AguhMbJeRvyNlxNWE+pkX/wB1hLYwlsYS2MJbGEtjCWxhLYwlsYS2MJbGEtjCWxhLYwlsYS2MJbGEtjCWxhLYwlsYS2MJbGEtjCWxhLYwlsYS2MJbGEtjCWxhLYwlsYS2MJbGEtjCWxhLYwlsYS2MJbGEtjCWxhLYwlsYS2MJbGEtjCWxhLYwlsYS2MJbGEtjCWxhLYwlsYS2MJbGEtjCWxhLYwlsYS2/6JLjWnaxzz2Oeexzz2Oeexzz2Oeexzz2Oeexzz2Oeexzz2KfGOUkrFappwyPcJbHuD2PcHse4PY9wex7g9j3B7HuD2PcHse4PY9wex7g9jhuJdVu6F1MTExMTExMTExMTEx9J8a02rHPvY597HPvY597HPvY597HPvY597HPvY597HPvYjxzbtbssqfJ9yh80cZ9p939P8sj3WVvm+5T+SF2GVPkxQuRhcxLLySXT6FG5ihqxQ+aOM+0y12OFkaP18H1k4yjdFGhCjF1K/8A56fp/lkSU7Oxq9BVb2NX91vpbsrsVaLIVFLx6Mq/Nip3NM0xU+xT+SF2GVPkxTYptGTM2OTf0Q9H5KHzRxn2mXsx1GzN3v8AXwfSl0OJ60Xl6fp/lkRxv1FBI0ommr3+mt8SCVn1OG8+jKvzZmzNmbFN9in8kLsMqfJl0XiSd/qTMn6UPmjjPtMVr9ROIpRH9VKvOn8SrxE6ny9P0/yyI07mM9xRle7+qcFPyctEjQjF39GVfmy8S8STv47NP5IXYZU+T7lD5o4z7TH3P0/yyPdZW+b7lP5IXZlwd3e5yX5OS/JyX5OS/JyX5OS/JyX5OS/JyX5OS/JyX5KfCYyvcrU844nIfk5D8nIfk5D8nIfk5D8nIfk5D8nIfk5D8nIfk5D8nD8PpF7GbM2ZszZmzNmbM2ZszZmzN+k+Du73OR/JyP5OR/JyP5OR/JyP5OR/JyP5OR/JyP5OR/JHgrO9+1cuXLly5cuXLly5cbMjIyMjIyMjIyMjIyEzjOLlRasj3Sex7pPY90nsj3Sex7pPY90nsj3Sex7pPY90nsj3Sex7pPY90nsUKmcFJihdGkaRpGkaRpGkaRpGkaQ6duy+8+6j9U+Ue7wf2YkPHcl4F2H6ORGVuhk7XIfz9MKbkSodOhKLXn0ZLwMyFK/0vwc5U3KjjSoxqTfkjJSV0I/VPlEhDLqcusrDo/yOkrOJoJ/RJ2HkQk/59OD+zEh4Kla3gjUcW0Kt0HUeGRCbhe5Kq30IO8Vf0nNQV2XXh+fSXgXYfpiiwooSt9PDy/hkIWk22VHd+jLXMUYoUV9L8HI1D9XqxfC04J9V/wDhwn2Y/wCBH6p8oim10RrTvcc2x1ZM1Zb/AETXpDq/Tg/sxIeB0os04ihFKxgscTSiOmmJW6enFOarQaXQ4irNQcoeThq2rTUiXgXYfpZmLIq31KTXg1JerGWZi+xytPYjFRVkI/VPlETVjUhsTab6fW4JiVvTg/sxIeDCW5pz3KcHH6qvDqo7tv8A9H+m0n0bf/pw/DQoK0CXgXYfefdR+qfKPd4P7MSHjuS8C7NmdTqdTqdTqdTqdTqdSw0WZYsWLFixYsWLFmJHE8KqzTbPbFue2Lc9sW57Ytz2xbnti3PbFue2Lc9sW57Ytz2xbnti3KVPCCiajRqs1War2NVmqzVZqs1War2NVmqzUb7SgaZpmmaZpmmaZpmmaZpjhZEmZszZmzNmbMmZszZmzNmbM2RlcirmBgYGBgYGBgYGBgYDJ8XNSaOcmc5M5yZzkznJnOTOcmc5M5yZzkznJkeLm3bssj47k/BLx3YFPuvyyr8n3KfyQuwyPg1masiVTLoRqysh1GoZDqN9GR8ejdkQb9J+CXgbshzY/LExSd/pSL29IFM4jyazFWl/yKc273+rja9WlVagzhr6Ub+j8sq/JigrGBh0JK30xjc8pIas7FP5IXYZHwYI04jimYRtYxVrCpdW2Rioqy9JiET8EvHpiixYt9T9IFMaT6MwVrCikKKX0zmoxyZxFV1JuTP0niMo6T/j0fllX5MyaLl+li/00oRa6uwoRuVYxT6Mp/JC7DI+DTdvJpS3IQx+u3pPwS8DLGPagUxxd7mnLcVNp3+qUVJWZyND/wCSnwtKm7wXo/LKvyZkZIk7/UnbqOtN+lP5IXYZHx3J+CXjuwKfdfllX5PuU/khdnORqSNSRqSNSRqSNSRqSNSRqSNSRqSM2xoxMTExMTExMTExMTEjEu14M5GpI1JGpI1JGpI1JGcjUkakjUkakvSXCJu5yaOTRyaOTRyaOTRyaOTRyaOTRyaI8Ik79qp+oVVJo9yrHuVY9yrHuVY9yrHuVY9yrHuVY9yrHuVY9yrFDj6s6ii+/XquL6HMzOZmczM5mZzMzmZnMzOZmczM5mZzMzmZlOV43HVlc1pGtI1pGtI1pGtI1pGtI1pGtI1pCqy7LK/zf+e5wn3Y95nFeV3aPwRLz3F57LK/zf8AkjRj0uRoxbRGCj42H1VnscvHwSVnb1pUouN2aMNivFRfQ4T7sfSTshVH/Jk7ilZEalyDb8/RKpK/mwkr9ZejOK8oSLFi3Zo/BEvPr/C9F9Nevj+2JRTx6i89llf5v/IqkkOTZqSFJozlv9FH4L04nycJ92PrYxRihISt9FR/uFLr6M4ryvov2aPwRLz2azlb9pRpWV5ei89llf5v/IqnW5rLb61OS8M1Jbjbfk4T7sfRq6HA0xfU6UH/AAaMNvRnFeV6XL9qj8ES89xeeyyt83/nucJ92PeZxXld2j8ES89xeRdmX6dTbue20z22me20z22me20z22me20z22me20z22me20ynwFOEsl6dTqdTqdTqdTqdTqdTr6VKSn5OWRyyOWRyyOWRyyOWRyyOWRyyOWRyyIxxVh0jRNE0TRNE0TRNE0TRNEVH/ov//EADARAAIBAQYEBgIDAAMBAAAAAAABAgMEERITFFEVITAxBRAgMjNhIkEjUHFAYIFS/9oACAECAQE/Af8Ap7Y5mYZhmGYZhmGYZhmGYZhmGYZhmGYZhmGYZhmGYZhmGYZgpif9Cys+Qqd/7Ml7mS9zJe5kvcyXuZL3Ml7mS9zJe5kvcyXuZL3Ml7mS9zJe5kvcyXuZL3Ml7mS9zJe5kvcyXuZL3Ml7mS9x02v2Upcv6FlYpowGAwGAwGAwGEwmAwGEwGAwGAwGEwmEwGAwGAwGAqIo9hf0DKxS8quK78B5y7yHOthclIoWytUnhvK9SvShivLNaa1ZtJl1fcTqvtI11bHhvHOouTkJV3+yPbmVVVv/AAZfWfLEWirXpRxNlmtFatfcyVWcXc5l1fveYqv/ANF9X/6KdurSko3lWVeEXK8s9rrVZYUyniw/l5Vij2F/QMrFLyZaakq1QVmVKnK7YsMf5keIL+E8MV0meI1ZOWWuxY7IklUZKP8AJy3LRYboY/2eHVWpYH2Ly005VFhiytQlRkV62bZ1f3LFNU4yLO4qd9Qsy/D6K/5Twx7FGyxpxvLPH+VFs+GR4dG6r51ih2F/QMrFLyZO+E+ZVtNN0m0ywv8AmRb/AITw13yZb1hq3lmtMMpXvsKd9T/0tdWMabLAnKreVrJOU3JFng4U1FltwyWH9lahlU8TLAoyvxFss+D8l2PDqjknEm3Tqcx2mngxXlnl/LEtfws8Pf8AL51ih2F/QMrFLzrWWNTmzRRhF3Fis841U2W6DnSuR4dRlCTxFahGouZDw+EXeaaeb/6VLFCbxFGhGmuXkylZ1Dn+zxCm507olis7wyjIqWetNYG+RZrOqUbitZI1ObIWGEOZQs1RVU2WqLlSaR4fQnCre/OsUOwv6BlYpF5f0LbF3Kcf0ULbf+M15X9W8qlHsL+gZWXIjaLv0ar6NX9Gr+jV/Rq/o1f0av6NX9Gr+h2lP9CqQXO41X0av6NX9Gr+jV/Rq/o1f0av6NX9Gr+jV/Rq/o1f0av6NV9Eq9/6KK5C/oZRvHSRlIykZSHCK7ijFl0BRi+xlIykZSMpDppdy6A1FF0BU0+xlIykOmkXQFTTMpGUjKRlIykKkhL+kuLi4rcrhNY7uxTaa5kJ3yRGTax/ozG+3+jksGIUpfjf+xzeFv7HJXv6HLDKV/YlzaSQqly/9Mxpy+itJqF6HL3/AESvSTIT5RW5Cq7leUW3feXFxd/UygpdzKiKlFCpRTTRGmlyMtXYRxTVxlR5fRkxuuMqN946UXf9mFCpRSuFRh5ZUef2YFdcKnFK4jSjHsRgo9v7FO8xL0KSflfzu/tpRd44sw8uRGBOLvIxfIj2uMDvRhd5GPPmOLvHF4BxfMUef/KzI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7mZHczI7/APRIeGxlFO84XHc4XHc4XHc4XHc4XHc4XHc4XHc4XHc4XHc4XHc4XHcreHqEHK8pwxSuNKtzSrc0q3NKtzSrc0q3NKtzSrc0q3NKtzSrc0q3K1HAQheZSMpGUjKRlIykZSMpGUjKRlIyhq5kbMmrzSrc0q3NKtzSrc0q3NKtzSrc0q3NKtzSrc0q3HZkl36KKPsj/nUtfxSKHv6tp7Ip9Wfch7V1J9mPoIo+xf4StDV5UtGAlW7JEZt3KX2UZfnd6JTuFUYneWv4pFD3+SnzMz11Z0cGJu4lVozjdT8rV2RT6MYuTuRKzTjcipQnT93lPuQ9qMRiMY5+lszJTj+PlPsx9BFD2R/wdCLv+x0IMdKLFQiQpKLvXoqeUexa/ikUPf5YEYV66yTrfn2IqKrfx9vK1dkU+jZvkRVbvVyLbfg7eU+5T9qMJhRhRhXprwbaaKlRL8byKuRPsx9BFH2L/DDO7uYKu5Si49/U4pmBCVxa/ikUPefouZc/XOlGfcp0Yw7eVq7Ip9GlVdN3o11Qna5zjhflPuU+yOZcxL14V5T7MfQRR9i/zqWv4pFD39W1din1Z9yHZdSfZj6CIeI3RSuOJfRxL6OJfRxL6OJfRxL6OJfRxL6OJfRxL6OJfRVt+ODjcU54Xeak1JqTUmpNSak1JqTUmpNSVauMhK4xoxoxoxoxoxoxoxoxoxoxoxjfMjXuRqDUGoNQag1BqDUGoNQagdo5D6MbKmrzSRNJE0kTSRNJE0kTSRNJE0kTSRNJEnZko3j5K8zTNM0zTNM0zTNM0zTNM0jLEWWzKqnecOhucOhucOhucOhucOhucOhucOhucOhucOhucOhucOhucOhuVqeCbiv+MiHZdSr7WT9r6tI8O7PqMtXyvrPoIh2RKZF3cjHyvId36r/Kr7WT9rKfuF9mX+ydNJP1OlzHYZuN8OZKLi7mUjw7sypUwjtDuvFW53Cqu9SM938/RFXn4k4r9DLV8r8lEuMPMS5jV4l5pXmF+SH0EQ7IwouMKErvU3f5VfayftYnc7zGzMY5t+lFONOfaRY6bUuZbfnl/pSPDuzJQUu46MWrhRSFSihUo+insXE+SGWr5X5YmXl/7Ly8v86V1zKdOGJY+xWSU3cIfQRDsi5mFkVd6k7jE/Kr7WT9rIu58xSjsKcdh+pO44naNyc3OWJlI8O7Mad5lz3IJpc/Wqshu/uMtXyvyvRiQ3f6lK4zpEpOXcQ+giHZdSr7WT9r6tI8O7PqMtXyvrPoIVp5GqNUao1RqjVGqNUao1RqidovVx35GUtzKjuZUdzKjuZUdzKjuZUdzKjuZUdzKjuZUdzKjuKKj2LPaco4g9jiD2OIPY4g9jiD2OIPY4g9jiD2OIPY4g9jiD2OIPYq1McsRyLkXIuRci5FyLkXIuRci5HIfRUEZaMtGWjLRloy0ZaMtGWjLRlocClDFK5mliaWJpYmliaWJpYmliaWJpYmliaWJpYleiodihRU+5pImkiaSJpImkiaSJpImkiaSJpImkiaSJUhhlcU7FBxTNDA0MDQwNDA0MDQQNBA0MDQwNDA0MCdigot9FC6kuxZ/f1bV2RZOz6tb3so+xdSr7WPoIXoQufpx8xO8kWf3l9yMbG/2yLu5Cm36Z1LuRhxvytXZFk7Mq/oVR3GN/sjK9+qzU6c4fkitdjd3lW97KPsQ6rv5CrmbzKcnK+/0ylhLrm5EXeryr7WPoIXRnL9EVcJEiz+/wAsKMKMKLl6cLbIRw+Vq7IsnZ+WFGFF3pSvdxQhhjcW6lc8a8q3vZR9iHCLMCIw/JsSS7emtOpF/jG8dWWHl3KMpyX5q4q+1j6CF0bi5eUiz+8/Q4swPpWrsiydmNczC9xR5+pO53oVqqr9k685q6T8q3vZR9iMDMuW5CGH1SV6uYrFRTvu8qvtY+ghdRln9/VtXZFk7PqMre9lH2LqVfax9FTMZjMZjMZjMZjMZjMY5lOeF3mqZqmapmqZqmapmqZqmapmqZqmaplWtjKVbAapmqZqmapmqZqmapmqZqmapmqZqmTnid5G2ySuNdI10jXSNdI10jXSNdI10jXSNdI10iVtk1d0qXh1KUUzhdE4XROF0ThdE4XROF0ThdE4XROF0ThdE4XRLR4fShTckWempzUWaGmaCmaCmaCmaCmaGmaCmaCmaCmaCmaCmaGmWuzxppYSwWSFZPGcLonC6JwuicLonC6JwuicLonC6JwuicLonC6JwuiWmmoVXFELNBxTNJA0kDSQNJA0kDSQNJA0kDSQNJA0kCVlgl0UUPZH/OpbPikWP5ULqeIdkeE9pdRlt+eRS9q6lT2sfQRQ9kf8JWiXNolaJpP/AEdRzuxb3EXc01uaqff6Iu9X+dSo07kZsilJtcy2fFIsfyok7o3ka0v2Y3iv+yM7ryFZvuUpOV9/oSVx/wCeXiHZHhHaRWqOMoxj+yNaSh+Iqjcoye7KVeU5pfq7oMtvzyKXtROXcxu+4xslNmLmiM22vRRo4vykVGr+RU9rH0EUPZH/AAdKL/QoJdjKjsOEXzMqF993oq+7yodi2fFIsfyo/RhV95gj3MCFFLsJJdvRBO4ufl4h2R4R2kSin3IwUexlwvI04x5r0vyQy2/PIpe1DimXGFGFFyLl50lHF+RVqXv8fKp7WPoIs/sj/g6PK680739dyMKLri2fFIsfyolG+Nw6V/7HR+xepSaMb8vEOyPCO0iVO+WI0z3I0LpKXRZbfnkUvajCYCMbujU9rH0EUPZH/OpbPikWP5ULqeIdkeE9pdRlt+eRS9q6lT2sfQRHxKpFXHE6hxOocTqHE6hxOocTqHE6hxOocTqHE6hxOoVPEKk4uLKdRwliRrpmuma6Zrpmuma6Zrpmuma6Zrpmuma6ZWtEqncs9rlR9pxSocUqHFKhxSocUqHFKhxSocUqHFKhxSocUqHFKpVqOcsTI2mSVxq5GrkauRq5GrkauRq5GrkauRq5GrkO1Sau/wCi/wD/xABGEAABAgIGBgYHBgYCAgIDAAABAAIDERIhMTIzkQQQQXGBoRMiQFGSoiAwQmFysdEUIzVS4fAFNGBigsFQk0NwJIBzkLL/2gAIAQEABj8C/wD0Ksa6wlUSx8wrr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1derr1deqIY9OHv/oRm9O4fL/l+CfvP9CM3p3D5f8AL8E7f/QjN6dw+X/L8E7f/QjN6dw+XolztKhwa5ScCvxGB4HL8RgeBy/EYHgcgxmnwS42Ci5fzMLwlDpdNgtn/aV+IwfC5EwtNguA/tK/mYXhKLXfxCCCP7XL8Rg+Fy/EYHgcvxGB4HL8RgeByD26XCLTYaJRe7S4QArPVK/EYHgcvxGB4HL8RgeBy/EYHhcnMDg8A3ht1BjojYQPtFfiMDwuX4jA8Dl+IwPA5fiMDwOVOHpkJze+iV/NQvCV+IwPA5fiMDwOX4jA8Dl+IwPA5fiMHwuX4jA8Dl+IwPA5fiMDwOX4jA8Dl/NQvCVTiaZCa34SvxGB4XKjC06C4/CV/NQvCVQiafBa7uolNo6QyNP8oIl6PBO3/wBCM3p3D5elsX3UBz9wU4mjPA75KAKrf9atHl3FWBRvj1RxVfKsCkGzK/lIvhVGJDLD3OElo/wBaR8BVGDCLz7gv5U5hUYkOg7uIVgU9U1sVJmjRHDvDCqMSGWHucJKwJh95R3KwL7iDSladgU+jhO9weiyIyg4bCpATK/lI3/WV/KRv+sr+Ujf9ZTGxYRYSRU4S1T/ALwrAn/BqcP7R6XBO3/0IzencPl6XTxxOGLG/mUhIAIiE4NaOaZEqE3E1btUDcdUX49Uf4ymw2XnVKTAC/a/aVO1xsCoPDLaqrFo4/sCiQpyptlNdBo0EUG7e9UhUdoXRxRudtCdCfa30GxtIk6M6sC2iqTHTRhxmhw+SMM1j2T3hMHvKO5NhfmdJNhQxRa1PD3OqNShxn1vY+hS7wge5SbHiBotcpBznHvcZoshPoNG0bVDc5xdZbqI/uGp/wAGon+0elwTt/8AQjN6dw+XpQ2DYE8+5TKhHVC3HVE+LVF+Ip8T8o1UZ2DVBH9oUQ/2qc0WE2jUx/ePQEl+61MFf3srCYN+pkUuhyaZ3tVfVeLHJmjMnRZXXt1MbtNZT3dwUym79RH9w1P+HUT/AGj0uCdv/oRm9O4fL0mn3J/wnVD1Q+Op/wAWqJ8RUQbtR3DVC+EKJ8OobjqhjenTIvK81Q5EbddA2qu3uVPVZzVFx1T9ttmpm5RPh1N36jvGp3w6uA9Lgnb/AOhGb07h8vSDDeGomCwxGGyWxCLH6psa3VB3HVE+LVF+IoE2G1TFiDod9vNSfDMNu1zk2hdlUo3wFTbDe7cEYkUSc7Z3BTNQCmLBYpKw566ENsz8kQw04u1+wblbxTN5RUR7Wzay8phFn5dTt6EM3hqJhML2bJbF0ukN6OG2uvbqPxDU/wCHUfhHpcE7f/QjN6dw+Xp10XqqG0KDSdSr1QNx1Rfj1RvjKmpCsflKwa96o1NHcFAPewKP8BVBrqu4rCapF3AKfoAGya6HRhQh83a2byjuTqph1RB2qlo2kthz9iJsTnP0ljnu7kWQbNp19YNeqoXNNBO2waj8Q1P+DUfhHpcE7f8A0IzencPl6lkVspt71/48kwvo9Xu1OayjWZ1r/wAeSe82uM9dp1QoLKFQDRUoujxmtaSJES9TXrEJtCQ7wv8Ax5au9WKv0LSgfev/AB5Lo30JTnUNReyUyJVr/wAeS6R0py2elwTt/wDQjN6dw+XZJqG6IOtKpwtaV1xSh7Hiz/geCdv/AKEZvTuHy7KYEUyabD3FWTBTj0YEbYGH/gOCdv8A6EZvTuHy7LNSpv8A+B4J+8/0Ix3cq4TTvl9FgsyH0WCzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WEzIfRYTMh9FhMyH0WCzIfRYLMh9FMQmjdL6J2/+hbSrVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarVarT/AEeH0mtnXIqpoduKYHVFwnLuQJexs9hVVB3FYU9xVA9093qukDmtbsntVVF3FRHxGFtHmiWkNaNpVUSGVYzNYU+KMSI0srlXt9MhkgBaSuq9jlhz3FMDqi5s5d39N9acvcmaeY0UdRtgQZBj6bKcp0QZc010fSYsVz9tEfVN050WJ1g2YAX3L9OdL8rZ/wC02F02nMntcyoKjGjxojyKU6I+q6JkWK0ynW0fVPguiRSW7Q0fVUyzSw3vMMS+aGl9LELSAaNCv5rqF5+IJkN0WIwuqnREp5psOI+KaVhDR9Uxz40R1Oqpg+qGlmNELSAZUBP5qmIsQCCXS6q+4iaafhbP/aMeNpekUW1mG5taiQWxIgDXB1bQi3pdIEqqgPqptjaZl+q+1s07SXMlOVEAhN0uNpcaIyohtEbeK+7bpT5flhg/7T4/SxGUJza5ldXFU3s0tre8w11Zy96OlCM8NE6qHdxTorI0RoaZVsH1UbR2vigFodWAn6NBfpT3sPsAfVQ9GfpGmQnPspAfVAR9IjRXOE50R9VToaXQ/N0dSYacaKX2BkOtSiDSWH+5gH+03SjGiFrpVUBOvj/TDPgZ81C0fSqUGRqdYHHemxWRulgWD3KF/goGl0m1uFTbQtBjNaA9zyDLbUoEKymGjmoOj6KOhaQZltpTTG68gXdbaosN1bTCoyK0pk+rQlLJR4bKmh1S6bpHOfCM+ilKfFDpBGh9GaNCiKua0f4j8lD+Fij73fJR3xJCBXZesrUaJBMaCW/nMw5aRvatIiRWh3RmoHenQo8eKxkyGhjqPBH+HsZRh0R1iZlwTJiRosVPR6nUJkjmosQkl3XMyozdIJiMnKbq96IFk1FgsriCkJb1GEVhYaVjtyi//j/2tJ6KI5n3k6loMSKaOkU+qJZ8FojYlwgTzUCGwubDOwbSoPRvLJutG5QosYfe9XNQtzP6YboQhxKYAFKqVShaHFpsEPawA0lD0KE1whQ9rrXJmithxA5tGsylUoT9JY+MYUpNpybkoOlRx1IRqYxM0iCHMogXu9MGkQ4jIzPaZIgpkXRgQWbXe0um6Ew4hEj1qk57IFKKRKk51WSdEeZucZldIBSaRJze9faITYrSZTa4BQmw4cRtAk9ZN0MQ4geA0TqlUomjvhxC506xKSfo0aH0kF/daE6DD0rTOilIMMlFERj3U5XVEiUKUOJa1OiwOkAc6lJ2xBro7nSsnIyTdEoROkk2bjYjDhPFA+y5s1EgxmPdEdORaAGhdBTa1lnUYBqmx7mH+0yUVkZsWI95nPgnxIjHuDm0eqomkCGCHOpBr1D0mNSfRdMpkWG17KLZdZCG6I1wG0sE81C6CG5roZn940EIdPEmBYAJBM0RsOIHto1mUqv/AKtf/IiPYyVrWzKpjSWvpSMNtG807dUMaVpbmRYjQ+TYcw0HvQDi1zHCbHtscPShwGSBeZVromaeREsm+HJhKMKK2ThroRtIdCiOMmdWY4prOlD3y64lcPd6I0inDkXUaM+t/UsU9DOI4gQ3ug9I34V/EOj0bRXdAWUaUMGRNoQJZ/DzGMh0bdFBok2TKjNifYIsdok1rNFqDt60KcKAKbCerDlLrbO5dLG+xw4LXUA5+j9I5xWiu0dn8PiUofV6SGJu+EJlKDo4nFfDqhyo1bO5OMSFortGZ1or4rRML7SNE0Kl0/R4AsUeE4aBo7IcpUtGpEqDE+z6A90SJIPbBFFzZVKLCbChQ2wzIUGSUAtDTN4b1hPatJixW6BBgw4phzOjUnErQp/ZKD2O+8do09tUgmaK/wCwRXV0mN0WjKqdqbFbomg9K6P0WCJWIfaNF/h40kxZNDYQu96iNoMFHa1siatqgu0j7Ax0UAsZ9kpEj3laQ6Fo38NdDhG70YL2t7yoDGwYEOcJsQ0IcqymxH6Joj4FBwB6MF5IQiRP4borNIdGENodo4Ewm6I7Q9Dl0NI/ci9RT9IZ/DdGfFpgMlo4rG1aPCdo0CC58Om+jCDTOf8AUQaHEwCetD71p0FnSERi3oy73HaqmwTEo0ekLOsQtKDtHgwIkaGZxKyCdy0SE2c4LC1096dCoQosNxnQiNmJrRNJMGk+BDlK6KXu9yZAr6QRnRD3VouhEViTg4TDh703R3Max7YtICGyi0BRdKbo7YtKVDpfZPfJQmRS50VsUvJlVJfxDTXlwYK4YnIlxUKI6xjw4y3rSKLIcSDFeX0IrZrRpNoPhNIIa2Qt2IRI8CFOUnxWs65qX2brU+m6T3SkmOjNd9qZIUx7bfeoseHOi6ye5QmuhwInRXXPZNzQtPdChmelGQcdjVBLJ9SE1hn3hP0XSaRgOrBbax3eF9nLohi9N0gd7pL7VpTnxDQLZ7bF9l6Q9FOlJaMG0pwoVB0++f8A6vwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmSwYmX/06ulXSrpV0q6VdKulXSrpV0q6VdKulXSrpV0q6VdKulXSrpV0q6VdKulVjVMNceCuOyVx2SuOyVx2SuOyVx2SuOyVx2SuOyVx2SuOyVx2SuOyVx2SuOyVx2SuOyVx2SuOyVx2SuOyVx2SuOyVx2Sra7LsUu+Sv8lf5K/yV/kr/JX+Sv8AJX+Sv8lf5K/yV/kr/JX+Sv8AJX+Sv8lf5K/yV/kr/JX+Sv8AJSp8k/dq4qt3JXuSvcle5K9yV7kr3JXuSvcle5K9yV7kr3JXuSvcle5K9yV7kr3JXuSvcle5K9yV7khtRTd+q1Wq1Wq1Wq1Wq1Wq1Wq1Wq1Wq1Wq1Wq1Wq1Wpupm5Wq1Wq1Wq1Wq1Wq1Wq1Wq1Wq1Wq1Wq1Wq1Wq1P3diHDtDd6duGrihu7Q1FN3o9oKbqZ2mJu7EOHaG707cNX+SG7tDEU3ej2gpupnaYm7sQ4asCL4CsCL4CsCL4CsCL4CsCL4Ci6LoseJ3NAIUCJAEXo4tolMtToL/wCE6RJtQe2ZJ96bEaNObKuh0RM+SM4boYJqDhL1FFjS4r7x3W7gpkTb3jW3enbhq/yQ3KbYb3bgnDStFivaRKYaeqpQ2vezYaBWFE8JWDE8J9aOknX711Jy2IUp1qiylS2mlZrYim70VUCVcfksN+SuPyWG/JYb8lcfkrjsuwFN1M1XTkrrslddkrrslddkpyKunJXXZesJ7h6ETd2IcNUXSNKdODFHVa00qS0232v/AOVAOk6NSgRzIOdNaZCaGhtFrhLivth6R7a+qx0pDvWi0aUpi071oFf7kFocFhkXiSZo8Om5wYSXud/paR8Z9NrYhIaVJlABXmqtzc1TbIOOwam707cNX+SG5NfDMmw3AuM7FpGm9dwh9WQMpr+HtbNvSVfJHQ6BkIdKlSNKajvNT9HcQyXd62pUYwkdnenCFW896LTMd89bEU3eig0WlNgPc3pPebFo7RWalIvFtvFQK1Ba2ZJCih0MNiw1A/ez1XvVjUHd6sagdRTdTNXSOMmSUSKa+4T1Q+CLHkTNlanEMhKUp2rpnGTFGI7/AFU0O8ItHoRN3Yhw1RNC0lryx10t2LSdGIiOMSdEy9ygdMx7+gutDpNn3rSY2ktcTFAAobE6A2K4QnWtUDRGh9OHaTYtGhMa8GFbNaNHgNd9zsdtTdOlFuyc2Q7t6ixWzovdMT9RBO2a0eSgyFUgngVCr5am707cNX+SG5CK2vYR3p8WA7SYRfeYJSK0YwQ5roPehGY18KLKRLXJ+jwmOBiXnudP1tI+yqzX3INNUTuTI226dbEU3ejqaHBwiNUJjaQcxBjiKI2AKE1od1O9Q4kMHqjantaDSfa5xUNjQ6be/wBU38uplIdXZqr4aim6manMcJtKIbW0966OUjyTYdcwgx05jaqJk4e9SqLe6Scwi3u9VLuUhX/pWrq64m7sQ4djgb1AUHcFE4fLU3enbhq/yQ3diLTtTQ2VtqdSkRKopsPbOetiKbvR7FQrJ9yrQbI+5VqrUU3UzsdEbdqqVbvQibuxDhqfRp9LDY15M6jNNjPiRmUpSqEjuR+8jucHBtFoaTNCnE0hpLXOkWjYnsAI6JrTS6MVz9ZTeymO5S6BywHLBci3oTS2OOzU3enbhq/yQ3J0SKHEUwwAHvUWATE6htaEJRnyJog9VF09IDQKUy0Vpw60SZa2tg2p7WmYB9ZMWqURuS6jST70XOt1sRTd6KazvKY5lIBxkpU3g2yqQkYrqp1AK+4ydKsJj21T2S9YSArFYrOaNLUU3UzVtpFtJUiXBXnITLxMysUvdOcvWzNiqqVvoRN3Yhw1dCQywNLpVkBGDUWzmJ+yfcqDnzrDp7UG9UyDhWPzWowIgp2UHG1vYm707cNX+SG5EANcDXJw2rpgesbfevuyAJzoyqRrnMFsjsmukMpGQc3YUSBIE2diYim70UHC0ITAAGwJpn1m1TQmdkqlsFc6k2Y6wtPf2IpupmqjV3TRbsKozXGaLTWPl2OJu7EOHaG707cNX+SG7tDEU3ej2gpupnaYm7sQ4dobvTtw1f5Ibu0NRTd6PaCm6mdpibuxUmscbNiwfIsHyLB8iwfIsHyLB8iwfIsHyLB8iwfIsHyLB8iwfIsHyLB8iwfIsHyLB8iwfIsHyLB8iwfIsHyLB8idSaRVt1VAmtYflWH5Vh+VYflWH5Vh+VYflWH5Vh+VYflWH5Vh+VYflWH5Vh+VYflWH5Vh+VYflWH5Vh+VYflWH5Vh+VDqHJFN3qxXeSu8ld5K7yV3krvJXeSu8ld5K7yV3krvJXeSu8ld5K7yV3krvJXeSu8ld5K7yV3krvJN1M7S/d/6PsVisVisVisVisVisVisVisVisVisVisVisVisVY1dVs1cKwysMrDKwysMrDKwysMrDKwysMrDKwysMrDKwysMrDKwysMrDKwysMq4ddozVozVozVozVozVozVozVozVozVozVozVozVozVozVozVozVozVozVozVozVozVozVozVozVoz9D9V+q/Vfqv1X6r9V+q/Vfqv1X6r9V+q/Vfqv1X6r9V+q/Vfqv1X69jbuC2ratq2ratq2ratq2ratq2ratq2ratq2ratq2rbqPDU/h2p28ob0VaclaclaclaclaclaclaclaclaclaclaclaclaclaclaclaclaclaclaclaclaclaclackZTTdTdy2ratq2ratq2ratq2ratq2ratq2ratq2ratq2ratqduPYmbh2gI8NUTh2p/xFDendocm6mdpdx7EzcO0BHhqicO1P+Iob07tDk3UztLuPYmbhqnQMk7pYDnt7xsQe1pmNsldVUMlVMJRENn3gPWntRql7vV1le7WEeGqJw1E0aSrgLDiAq7KexWK6VWJerDtVvov+Iob05SaJlSEMkqToZB966sJxl3K5zCuKHDjaJOleLk5sNpLNla6sJztyuc/UUW2qi77x23uCH3bK7ETAJmLWG3W5N1M1XVhuI2yUScEQ4jbJFXVPo3S71UxddhbvTXGEXtnZ3p0AQojQa6BFYV1dWGTuQhvgVSrcTXNObsnV6dfoO49iZuGp0RxBD7JKNIg7k5QzIOpy2roNGZaK9s19pcbk+qAtJfKU/VzCP9tq9ymNQR4aonDUdyfRAkbUwDYnDNNa01NUNcPVFN1OTfQf8RQ3pyDO8yWjQmMBcay82qL0gDg0AyK0v7tjQKpNElFiGDDY+HORaJKFELREDpV0pVrRf3tUogBAZOXetJAhsYG1SaJK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7777777777776JbQAEEEAAEEEEEAAEEEEAAEEEEAALyZL777777777777777777777777777777qyuUAwwwwwwwwwwwwwwwwwwwwwwwwgmYzb77777777777777777777777777776r+F4Uw00000000004w0000000800gsPv8AW+++++++++++++++++++++++++++++q9IUOTvfyf5TGAJ6LckcWP1NQfb1ibFpXW+++++++++++++++++++++++++++++q9oA8KX+OxqUlCm+NjpeXgCDP2EaWoBqXW+++++++++++++++++++++++++++++q9oA8Bs/TUV2dPmCA1Hde12nd8VAUoBqXW+++++++++++++++++++++++++++++q9oA8sk/0dByIr9ptW9ok83zqZJhcoBqXW+++++++++++++++++++++++++++++q5iAxz1mUWSdqGttzj9y0CFNmEGWbpJtXW+++++++++++++++++++++++++++++qv5LF//ALzzz/7y8Lf/AP8APPf9/vPPP+JpgfW+++++++++++++++++++++++++++++u+QGGOONAHGOOOOLHOLHOuMFHOOOOabB+e++++++++++++++++++++++++++++++asP7zzMSqRhK4x6aYB6/9zLkKazz3Pcm++++++++++++++++++++++++++++++++O6yyyBgQyBjhBSjijCBiQCwBwyyy2O+++++++++++++++++++++++++++++++++++++++++y2z96y20yzy6yy+++++++++++++++++++++++++++++++++++++++++++++++++I9/wCIKVHshuykl/vvvvvvvvvvvvvvvvvvvvvvvvsMMMMMMMMMMMMMMMMMMMMMMMMMMMMMUcsMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTfffeizTTDTTTTTTDTRdPPPPPPPPPPPMb8cMMccMMMMccHIjTTTTTDTTTTSdvfffffffYv/8A/wC+/wD/AP8A/wD1IPvfffffffffeV1Aggggggggggg5o/8A/wD/AP8A7/8A/wD/AP3n33333331KDoPIj//AP0i9VA4as999999AKpXWiAL2CCCCDAKDWrnEYse/wD/AP8A6/8AaffffffffQ3jxrjv/wD8Dt1UD16n333333D6ldZLJKIIIIJVwkNaux/xz/8A/wDz6dPaffffffffQzJFv/8A/wD/ALn31ALzi3vfffffHKV1utEQgggggsog1qz3tf8A/wD/AP7jP/affffffffQv/8A/wD/AP8A/wD/AP8A9QD7333333333219YIIIIIIIIIIINav/AP8A/wD/AP8A/wD/AP8A/afffffffel/PPPPPPPPPPIp9/vvvv8A77777+Ld/wD/AP8A/wD/AP8A/wD/ALzNcdMMdccccMMflvffffffesMMMMMMMMMMMM70cccccccccccVQ/PPPPPPPPPPPHjjjjjjjjjjjji9vffffffffPffffffffffaIlvvvvvvvvvvvuCPvvvvvvvvvvv1Y/vvvtvvvvvvlKfffffffff9H95/fffYPNKAg9Ozfvvvuv+vaKCevhtfPvvs6v1Q6bk6gqH/vuvlqffffffffffXJXPfffbutKAhvTjfvvvrL09aKP/AO5w3777/N/9UN6u664574Lz5an333333331XHX33333zx2gIck1X77777y/2iimH7777764979UPpM3777775T9an33333333z33333333332wJb77777777776iD777777777z79UnLLLLLLLLLLJan33333326QEEAEEEEEEAFmzLDDLLLLLDDLJS8EEEEEEEEEEFGg0MMMMMMMMMMNl733333335DLLLLLLLLLLL/jsMMNMMNMMMNd2j/wD/AP8A/wD/AP8A/wD/AKyussssssssssspfvfffffffa//AP8A/wD+/wD/AP8A/wBVdf33X33333331fwQIIIIIIIIIIP7z/8A/wD/AP8A/wD/AP8A/wDKffffffffe9zGVPYXf+RP1Vwl21BvfffYe/1/PS3+AggggkgA/PFhNvP/AP8A/wDW/vKffffffffaT3X7rNfP/FdFVxXWF/ffffSZPV/AAW4wgggh+yg/PLrKvf8A/wD/AE26vKffffffffacm3v/AP8A/wD33P1Vx/dVvfffbf8A31fy0OcIIIIJIEEPzyVfb/8A/wD/AO2z3yn33333332//wD/AP8A/wD/AP8A/wD/AHV28ccccccccccV9Djjjjjjjjjjj/8AjPPHPPPPPPPPan33333327/HHDHHHHHDDG0znHHHHHHHHHGEPDPPPPPPPPPPOdf3HHHHHHHHHHH5733333327PHPPPPHHPPPOEbzzzzzzzzzzzwU200000000001mif3zz33333zz15733333332j77337777776pOoIAIIIIIIIIIBX/wDz/wD/AP8A/wD/AP8A92B+8++8++++++rp99999999+QdrRh/++wDWrDpEKLRLCCCeXCAUtvmV/wD/AP8A/DD9WBWxD65j+++6dro99999999qmcuc9+++Sl2rDrwShAACCC3QCAUrP9+//wD/APyMH1YEpKT7x777uX6uj33333332iNtz777753/AOqD6SMjCCCCCRyCAU+0Q/8A/wD/AP8A/v8A1YGApb77775/76uj333333327HHHHHHHHHHGoe8wwwwwwwwwwwBXHHHHHHHHHHHN4XzzzzzzzzzzyOn3333332rn77777777777QwE000k00k000l3zTzzTzzTzzzzzVLzn3zjzzz33zVb3333332EMMMMMMMMMMMMJwMMMMMMMMMMMMIAMMMMMMMMMMMGIIMMMMMMMMMMN933333//EACoRAAIBAgUFAAICAwEAAAAAAAABETFhIVFxkaEQIDBB8FCBscFAYNHh/9oACAEDAQE/EP8AT1IX+WDBhhmHD8CjCDU6LYjktiOS2I5LYjktiOS2I5LYjktiOS2I5LYjktiOS2I5LYjktiOS2I5LYjktiOS2I5LYjktiOS2I5LYjktiOS2I5LYjktiOS2EtrBbEDD/AVC4jQ2PpTJkyZMmTJkyfRMmTJkyZMmTJk+hFpaKw6/gKisrfTRRJsEmJ6MniPDIgQK00JyjTi2PUDSlMONUyEuBrgaMWmR4I+Ailhlhl1yZqZOCEBFUgQYz1EVorY6/gKisqfRFFYjdZ5mNKAm8KxqsxWiEUJyEYPAQ4qohjYnod7kqNCFSw6WdrHX+xiWqZKSJtdAnLrWisOv4CorKn0VR0iMhQTVGVSjocoS0WRMQpkaiNhTcYIWmWYlNUQ0mJL9Z0JvIQRqx1g+0UIcTov5OtaKw6/gKisqfRCOPQl71I2JMShsjYaSFUI4P8AXSBzIkTxxG4FghTm8hK9ARIoYyT0I49GHoZUshTDIis+taKw6/gKiorY0QQzExMSCGKREukyCW5BBBBDMTEhkPri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c92+ZbQ+jGvM8uUsI2jDRTjDckuajdVpcw44cFGBzrCW9yvoLd1w5vwuE9r8GZX4GdNnyIZfj+yzbc2ZPhtn3sPyfHuXzPbPn8mxsenw4zJsuue7fP4/Ce1+DMr8DOm35EprJ9JTo+kp0fSU6PpKdH0lOj6SnR9JTo+kp0fSU6PpKdH0lOj6SnR9JTo+kp0fSU6PpKdH0lOj6SnR9JTo+kp0fSU6PpKdH0gcpy8JtubMvy8PmvCvK5TmPSW1ektq9JbV6S2r0ltXpLavSW1ek5j0ltXpLavSW1ektq9JbV6TmPSW1ektq9JbV6S2r0ltXpLavSW1ek5j0hS8qR718z2j5hWsuBzHpOwTsE7BOwTsE7BOwTsE5j0nYJ2CdgnYJ2Ccx6TsE7BOwTsE7BOwTsECWj/j8OM6bPrjZbm4c5bR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9JbR9IrR9J7X4MyvwBajCvDkIh5Tvud9zvud9zvud9zvud9zvud9zvud9zvud9zvud9zvud9zvud9zvud9zvuW4e5guJdS5wWJIzYtrFWM/3B2GQoB5E79nfs79nfs79nfs79nfs79nfs79nfs79nfs79nfs79nfs79nfs79nfs79gZNWNyr5w4oyVgpXAA+8ShuC2q/U7qndU7qndU7qndU7qndU7qndU7qndU7qndU7qndU7qndU7qndU7qndU7qnLUlh6MvUosJS2YyyTbWaARfuP+gncE7gncE7gncE7gncE7gncE7gncE7gncE7gncE7gncE7gncE7gncE7gnfEfi61tFK+ZUPwK0Fx0JypypypypypypypypypypypypypypypypypypypypypyoBwgSYYEoXIldCV0JXQldCV0JXQldCV0JXQldCV0JXQldCV0JXQldCV0JXQldCV0JXQldCV0iGUrZStlAUrpK6SukrpK6SukrpK6SukrpK6SukrpK6SukrpK6SukrpK6SukrpK6QByIM2lQcc5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5UppDeUpfgVQI0Cl2CWZE2D0myek2T0myek2T0myek2T0myek2T0myek2T0myek2T0myek2T0myek2T0myek2T0myek2T0myek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';
