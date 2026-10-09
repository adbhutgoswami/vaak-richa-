import {useEffect,useState,useCallback} from 'react';
import {Routes,Route,Link,useParams,useNavigate} from 'react-router-dom';
import {createClient} from '@supabase/supabase-js';
const sb=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const CATS=[['राजनीति','#1c2a5a','🏛️'],['खेल','#2f5a3a','🏅'],['समाज','#c0644a','👥'],['स्वास्थ्य','#8fb08f','🌿'],['सौन्दर्य','#b8707c','🌸'],['शिक्षा','#e0b040','📚'],['तकनीक','#2b6c78','🌐'],['जीवन शैली','#c25a22','🏡'],['स्थानीय मुद्दे','#b44a30','📣'],['साहित्य','#4a0e17','🪶'],['फैशन','#7a0a28','👗'],['संपादकीय','#43232b','🖋️']];
const fmt=d=>new Date(d).toLocaleString('hi-IN',{dateStyle:'long',timeStyle:'short'});
const mkSlug=t=>(t.trim().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,60)||'rachna')+'-'+Math.random().toString(36).slice(2,7);
const useUser=()=>{const[u,setU]=useState(null),[ed,setEd]=useState(false);
 useEffect(()=>{const f=async s=>{setU(s?.user||null);if(s?.user){const{data}=await sb.from('profiles').select('is_editor').eq('id',s.user.id).single();setEd(!!data?.is_editor)}else setEd(false)};
 sb.auth.getSession().then(({data})=>f(data.session));const{data:l}=sb.auth.onAuthStateChange((_,s)=>f(s));return()=>l.subscription.unsubscribe()},[]);return[u,ed]};
function Head({title,desc,img}){useEffect(()=>{document.title=title+' | वाक्-ऋचा';const m=(k,v,a='property')=>{let e=document.querySelector(`meta[${a}="${k}"]`);if(!e){e=document.createElement('meta');e.setAttribute(a,k);document.head.appendChild(e)}e.content=v};
 m('description',desc||'',"name");m('og:title',title);m('og:description',desc||'');m('og:url',location.href);if(img)m('og:image',img);
 let c=document.querySelector('link[rel=canonical]');if(!c){c=document.createElement('link');c.rel='canonical';document.head.appendChild(c)}c.href=location.href},[title,desc,img]);return null}
function Auth({onDone}){const[email,setE]=useState(''),[pw,setP]=useState(''),[msg,setM]=useState('');
 const go=async up=>{const r=up?await sb.auth.signUp({email,password:pw}):await sb.auth.signInWithPassword({email,password:pw});setM(r.error?r.error.message:up?'खाता बन गया। यदि ईमेल पुष्टि माँगे तो पुष्टि करके प्रवेश करें।':'');if(!r.error&&!up)onDone?.()};
 return<div className="box"><h2>प्रवेश करें</h2><input placeholder="ईमेल" value={email} onChange={e=>setE(e.target.value)}/><input type="password" placeholder="पासवर्ड (कम से कम 6 अक्षर)" value={pw} onChange={e=>setP(e.target.value)}/>
 <div className="row"><button onClick={()=>go(false)}>प्रवेश करें</button><button className="alt" onClick={()=>go(true)}>नया खाता बनाएँ</button></div><p className="note">{msg}</p></div>}
function Layout({user,ed,children}){return<><header className="top"><nav><Link to="/">मुख्य पृष्ठ</Link>{user&&<Link to="/meri">मेरी रचनाएँ</Link>}{ed&&<Link to="/admin">संपादक पैनल</Link>}</nav>
 <div className="auth">{user?<button className="alt" onClick={()=>sb.auth.signOut()}>बाहर निकलें</button>:<Link to="/login">प्रवेश करें</Link>}</div></header>
 <div className="hero"><Link to="/"><h1 className="logo">वाक्-ऋचा</h1></Link><p className="t1">डिजिटल साहित्यिक पत्रिका</p><p className="t2">शब्दों की यात्रा, विचारों का संगम</p></div>{children}<footer>© वाक्-ऋचा</footer></>}
function Home(){const[f,setF]=useState([]);useEffect(()=>{sb.from('posts').select('*').eq('featured',true).eq('published',true).order('created_at',{ascending:false}).limit(1).then(({data})=>setF(data||[]))},[]);
 return<main><Head title="मुख्य पृष्ठ" desc="शब्दों की यात्रा, विचारों का संगम"/>
 {f[0]&&<Link to={'/post/'+f[0].slug} className="feat"><span>संपादकीय</span><h2>{f[0].title}</h2><p>{f[0].body.slice(0,160)}…</p></Link>}
 <div className="grid">{CATS.map(([n,c,i])=><Link key={n} to={'/shreni/'+encodeURIComponent(n)} className="card" style={{background:c}}><b>{n}</b><i>{i}</i></Link>)}</div>
 <p className="center"><Link className="btn" to="/likhein">अपनी रचना प्रकाशित करें</Link></p></main>}
const PAGE=10;
function Category(){const{name}=useParams();const[list,setL]=useState([]),[q,setQ]=useState(''),[n,setN]=useState(PAGE),[more,setMore]=useState(false);
 const load=useCallback(async()=>{let r=sb.from('posts').select('*').eq('category',name).eq('published',true).order('created_at',{ascending:false}).range(0,n);
 if(q.trim()){const s=q.trim().replace(/[%,]/g,'');r=r.or(`title.ilike.%${s}%,author_name.ilike.%${s}%`)}const{data}=await r;setMore((data||[]).length>n);setL((data||[]).slice(0,n))},[name,q,n]);useEffect(()=>{load()},[load]);
 return<main><Head title={name} desc={name+' की रचनाएँ'}/><h2>{name}</h2><div className="row"><input placeholder="शीर्षक या लेखक से खोजें" value={q} onChange={e=>setQ(e.target.value)}/><Link className="btn" to={'/likhein?shreni='+encodeURIComponent(name)}>नई रचना लिखें</Link></div>
 {!list.length&&<p className="note">इस श्रेणी में अभी कोई रचना नहीं है। पहली रचना आप लिखें।</p>}
 {list.map(p=><Link key={p.id} to={'/post/'+p.slug} className="item"><h3>{p.title}</h3><small>{p.author_name} · {fmt(p.created_at)}</small></Link>)}
 {more&&<p className="center"><button onClick={()=>setN(n+PAGE)}>और रचनाएँ देखें</button></p>}</main>}
function Editor({user,ed,post}){const nav=useNavigate();const sp=new URLSearchParams(location.search);
 const[t,setT]=useState(post?.title||''),[a,setA]=useState(post?.author_name||''),[c,setC]=useState(post?.category||sp.get('shreni')||'साहित्य'),[b,setB]=useState(post?.body||''),[bio,setBio]=useState(post?.bio||''),[img,setImg]=useState(post?.image_url||''),[pv,setPv]=useState(false),[msg,setM]=useState('');
 if(!user)return<main><p className="note">रचना प्रकाशित करने के लिए पहले प्रवेश करें।</p><Auth/></main>;
 const up=async e=>{const f=e.target.files[0];if(!f)return;const p=user.id+'/'+Date.now()+'-'+f.name.replace(/[^\w.]/g,'');const{error}=await sb.storage.from('images').upload(p,f);if(error)return setM(error.message);setImg(sb.storage.from('images').getPublicUrl(p).data.publicUrl)};
 const save=async()=>{if(!t.trim()||!a.trim()||!b.trim())return setM('नाम, शीर्षक और रचना भरना आवश्यक है।');
 const v={title:t,author_name:a,category:c,body:b,bio:bio||null,image_url:img||null};
 if(post){const{error}=await sb.from('posts').update(v).eq('id',post.id);if(error)return setM(error.message);nav('/post/'+post.slug)}
 else{const slug=mkSlug(t);const{error}=await sb.from('posts').insert({...v,slug,author_id:user.id});if(error)return setM(error.message);nav('/post/'+slug)}};
 return<main className="box"><h2>{post?'रचना संपादित करें':'अपनी रचना प्रकाशित करें'}</h2><input placeholder="लेखक का नाम" value={a} onChange={e=>setA(e.target.value)}/><input placeholder="रचना का शीर्षक" value={t} onChange={e=>setT(e.target.value)}/>
 <select value={c} onChange={e=>setC(e.target.value)}>{CATS.filter(x=>x[0]!=='संपादकीय'||ed).map(x=><option key={x[0]}>{x[0]}</option>)}</select>
 <textarea rows="14" placeholder="अपनी कहानी, कविता, लेख या संस्मरण यहाँ लिखें…" value={b} onChange={e=>setB(e.target.value)}/>
 <label>फोटो (वैकल्पिक)<input type="file" accept="image/*" onChange={up}/></label>{img&&<img className="pic" src={img}/>}
 <textarea rows="3" placeholder="लेखक परिचय (वैकल्पिक)" value={bio} onChange={e=>setBio(e.target.value)}/>
 <div className="row"><button className="alt" onClick={()=>setPv(!pv)}>पूर्वावलोकन</button><button onClick={save}>{post?'परिवर्तन सुरक्षित करें':'रचना प्रकाशित करें'}</button></div><p className="note">{msg}</p>
 {pv&&<article className="read"><h2>{t}</h2><p className="body">{b}</p></article>}</main>}
function EditPost({user,ed}){const{slug}=useParams();const[p,setP]=useState();useEffect(()=>{sb.from('posts').select('*').eq('slug',slug).single().then(({data})=>setP(data))},[slug]);return p?<Editor user={user} ed={ed} post={p}/>:<main/>}
function Post({user,ed}){const{slug}=useParams();const[p,setP]=useState(),[cm,setCm]=useState([]),[lk,setLk]=useState({n:0,me:false}),[rel,setRel]=useState([]),[nm,setNm]=useState(''),[tx,setTx]=useState(''),[hp,setHp]=useState(''),[copied,setCo]=useState(false);
 const load=useCallback(async()=>{const{data}=await sb.from('posts').select('*').eq('slug',slug).single();setP(data);if(!data)return;
 const[c,l,r]=await Promise.all([sb.from('comments').select('*').eq('post_id',data.id).order('created_at'),sb.from('likes').select('user_id').eq('post_id',data.id),sb.from('posts').select('slug,title').eq('category',data.category).eq('published',true).neq('id',data.id).limit(4)]);
 setCm(c.data||[]);setLk({n:(l.data||[]).length,me:!!user&&(l.data||[]).some(x=>x.user_id===user.id)});setRel(r.data||[])},[slug,user]);useEffect(()=>{load()},[load]);
 if(!p)return<main><p className="note">रचना नहीं मिली।</p></main>;
 const url=location.href,txt=p.title+' — '+p.author_name,own=user&&(user.id===p.author_id||ed);
 const like=async()=>{if(!user)return alert('पसंद करने के लिए प्रवेश करें।');lk.me?await sb.from('likes').delete().match({post_id:p.id,user_id:user.id}):await sb.from('likes').insert({post_id:p.id,user_id:user.id});load()};
 const comment=async()=>{if(hp)return;if(!nm.trim()||!tx.trim())return;const{error}=await sb.from('comments').insert({post_id:p.id,name:nm,body:tx});if(!error){setTx('');load()}};
 const share=async()=>{if(navigator.share)navigator.share({title:p.title,text:txt,url});else{await navigator.clipboard.writeText(url);setCo(true)}};
 return<main><Head title={p.title} desc={p.body.slice(0,150)} img={p.image_url}/><article className="read"><h2>{p.title}</h2><small>{p.author_name} · {p.category} · {fmt(p.created_at)}{p.updated_at!==p.created_at&&' (संपादित: '+fmt(p.updated_at)+')'}</small>
 {p.image_url&&<img className="pic" src={p.image_url} alt=""/>}<p className="body">{p.body}</p>{p.bio&&<p className="bio">लेखक परिचय: {p.bio}</p>}{own&&<Link className="btn" to={'/sampadit/'+p.slug}>संपादित करें</Link>}</article>
 <div className="row share"><button onClick={like}>{lk.me?'♥':'♡'} पसंद ({lk.n})</button>
 <a className="btn" target="_blank" rel="noreferrer" href={'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)}>Facebook पर साझा करें</a>
 <a className="btn" target="_blank" rel="noreferrer" href={'https://twitter.com/intent/tweet?text='+encodeURIComponent(txt)+'&url='+encodeURIComponent(url)}>X पर साझा करें</a>
 <a className="btn" target="_blank" rel="noreferrer" href={'https://wa.me/?text='+encodeURIComponent(txt+' '+url)}>WhatsApp पर साझा करें</a>
 <button className="alt" onClick={async()=>{await navigator.clipboard.writeText(url);setCo(true)}}>{copied?'लिंक कॉपी हो गया':'लिंक कॉपी करें'}</button><button className="alt" onClick={share}>अन्य विकल्प</button></div>
 <section className="box"><h3>टिप्पणियाँ ({cm.length})</h3>{cm.map(c=><div key={c.id} className="cm"><b>{c.name}</b> <small>{fmt(c.created_at)}</small><p>{c.body}</p>{ed&&<button className="alt" onClick={async()=>{if(confirm('यह टिप्पणी हटाएँ?')){await sb.from('comments').delete().eq('id',c.id);load()}}}>हटाएँ</button>}</div>)}
 <input placeholder="आपका नाम" maxLength="60" value={nm} onChange={e=>setNm(e.target.value)}/><input className="hp" tabIndex="-1" autoComplete="off" value={hp} onChange={e=>setHp(e.target.value)}/><textarea rows="3" maxLength="1000" placeholder="अपनी टिप्पणी लिखें" value={tx} onChange={e=>setTx(e.target.value)}/><button onClick={comment}>टिप्पणी प्रकाशित करें</button></section>
 {rel.length>0&&<section><h3>संबंधित रचनाएँ</h3>{rel.map(r=><Link key={r.slug} className="item" to={'/post/'+r.slug}>{r.title}</Link>)}</section>}</main>}
function Mine({user,admin}){const[l,setL]=useState([]);const load=useCallback(async()=>{if(!user)return;let r=sb.from('posts').select('*').order('created_at',{ascending:false});if(!admin)r=r.eq('author_id',user.id);const{data}=await r;setL(data||[])},[user,admin]);useEffect(()=>{load()},[load]);
 if(!user)return<main><Auth/></main>;
 const tog=async(p,k)=>{await sb.from('posts').update({[k]:!p[k]}).eq('id',p.id);load()};
 return<main><h2>{admin?'संपादक पैनल — सभी रचनाएँ':'मेरी रचनाएँ'}</h2>{admin&&<p><Link className="btn" to="/likhein?shreni=संपादकीय">नया संपादकीय लिखें</Link></p>}
 {!l.length&&<p className="note">अभी कोई रचना नहीं है।</p>}
 {l.map(p=><div key={p.id} className="item"><Link to={'/post/'+p.slug}><h3>{p.title}</h3></Link><small>{p.author_name} · {p.category} · {p.published?'प्रकाशित':'अप्रकाशित'}</small>
 <div className="row"><Link className="btn" to={'/sampadit/'+p.slug}>संपादित करें</Link>
 {admin&&<><button className="alt" onClick={()=>tog(p,'published')}>{p.published?'अप्रकाशित करें':'फिर प्रकाशित करें'}</button>{p.category==='संपादकीय'&&<button className="alt" onClick={()=>tog(p,'featured')}>{p.featured?'मुख्य पृष्ठ से हटाएँ':'मुख्य पृष्ठ पर दिखाएँ'}</button>}
 <button className="danger" onClick={async()=>{if(confirm('क्या आप सच में इस रचना को हमेशा के लिए हटाना चाहते हैं?')){await sb.from('posts').delete().eq('id',p.id);load()}}}>हटाएँ</button></>}</div></div>)}</main>}
export default function App(){const[user,ed]=useUser();
 return<Layout user={user} ed={ed}><Routes><Route path="/" element={<Home/>}/><Route path="/shreni/:name" element={<Category/>}/><Route path="/post/:slug" element={<Post user={user} ed={ed}/>}/>
 <Route path="/likhein" element={<Editor user={user} ed={ed}/>}/><Route path="/sampadit/:slug" element={<EditPost user={user} ed={ed}/>}/><Route path="/meri" element={<Mine user={user}/>}/>
 <Route path="/admin" element={ed?<Mine user={user} admin/>:<main><p className="note">यह पृष्ठ केवल संपादक के लिए है।</p></main>}/><Route path="/login" element={<main><Auth/></main>}/></Routes></Layout>}
