import {useEffect,useState,useCallback} from 'react';
import {Routes,Route,Link,useParams,useNavigate} from 'react-router-dom';
import {createClient} from '@supabase/supabase-js';

const sb=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const FB_APP_ID='2266978280870421';
const CATS=[['राजनीति','#1c2a5a','🏛️'],['खेल','#2f5a3a','🏅'],['समाज','#c0644a','👥'],['स्वास्थ्य','#8fb08f','🌿'],['सौन्दर्य','#b8707c','🌸'],['शिक्षा','#e0b040','📚'],['तकनीक','#2b6c78','🌐'],['जीवन शैली','#c25a22','🏡'],['स्थानीय मुद्दे','#b44a30','📣'],['साहित्य','#4a0e17','🪶'],['फैशन','#7a0a28','👗'],['संपादकीय','#43232b','🖋️']];
const fmt=d=>new Date(d).toLocaleString('hi-IN',{dateStyle:'long',timeStyle:'short'});
const mkSlug=t=>(t.trim().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,60)||'rachna')+'-'+Math.random().toString(36).slice(2,7);

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

function Home(){
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
        <Route path="/" element={<Home/>}/>
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
