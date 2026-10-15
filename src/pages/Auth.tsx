import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { UserRound, Mail, Phone, Lock, Send, Facebook, Apple, Home, Chrome, ShoppingBag, LayoutDashboard, LogOut } from "lucide-react";
import { asset } from "../lib/assets";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

async function readApiResponse(response: Response){
  const raw = await response.text();
  if (!raw.trim()) {
    throw new Error("الخادم لم يُرجع ردًا. شغّل الـBackend بالأمر npm run dev:full ثم جرّب مرة أخرى.");
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("تعذر قراءة رد الخادم. تأكد أن الـBackend يعمل على المنفذ 5174.");
  }
}

export default function Auth(){
  const [params]=useSearchParams();
  const [storedUser,setStoredUser]=useState<any>(()=>{try{return JSON.parse(localStorage.getItem("nakha_user")||"null")}catch{return null}});
  const nav=useNavigate();
  const [mode,setMode]=useState<"register"|"login">("register");
  const [form,setForm]=useState({name:"",email:"",phone:"",password:"",confirm:""});
  const [busy,setBusy]=useState(false);
  const [oauthBusy,setOauthBusy]=useState<string | null>(null);

  useEffect(()=>{
    const token=params.get("oauthToken");
    const oauthError=params.get("oauthError");
    if(token){
      fetch(`/api/auth/session?token=${encodeURIComponent(token)}`).then(readApiResponse).then(d=>{
        if(!d.user) throw new Error(d.message || "تعذر استكمال تسجيل الدخول");
        localStorage.setItem("nakha_user",JSON.stringify(d.user));
        setStoredUser(d.user);
        if(d.token) localStorage.setItem("nakha_token",d.token);
        nav(d.user?.role === "admin" ? "/admin" : (params.get("redirect") || "/"), {replace:true});
      }).catch(e=>alert(e.message || "تعذر تسجيل الدخول")).finally(()=>setOauthBusy(null));
    } else if(oauthError){
      alert(oauthError);
      setOauthBusy(null);
    }
  },[params,nav]);

  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    if(mode==="register"&&form.password!==form.confirm){alert("كلمتا المرور غير متطابقتين");return}
    setBusy(true);
    try{
      const r=await fetch(`/api/auth/${mode}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const d=await readApiResponse(r);
      if(!r.ok)throw new Error(d.message || "تعذر إتمام العملية");
      localStorage.setItem("nakha_user",JSON.stringify(d.user));
      setStoredUser(d.user);
      if(d.token) localStorage.setItem("nakha_token",d.token);
      nav(d.user?.role === "admin" ? "/admin" : (params.get("redirect")||"/"));
    }catch(e:any){alert(e.message||"تعذر إتمام العملية")}finally{setBusy(false)}
  };

  const social=(provider:"google"|"apple"|"facebook")=>{
    setOauthBusy(provider);
    const redirect=params.get("redirect")||"/";
    window.location.href=`/api/auth/oauth/${provider}?redirect=${encodeURIComponent(redirect)}`;
  };

  const logout=async()=>{
    const token=localStorage.getItem("nakha_token");
    try{if(token) await fetch("/api/auth/logout",{method:"POST",headers:{Authorization:`Bearer ${token}`}})}catch{}
    localStorage.removeItem("nakha_token");
    localStorage.removeItem("nakha_user");
    setStoredUser(null);
    setMode("login");
  };

  if(storedUser){
    return <section className="auth-page account-logged-page" dir="rtl">
      <div className="account-logged-backdrop"><img src={asset("restaurantInterior")} alt=""/><div><img src={asset("logo")} alt=""/><span>مرحبًا بك من جديد</span><h1>{storedUser.name}</h1><p>{storedUser.email}</p></div></div>
      <div className="logged-account-card">
        <Link className="auth-home-icon" to="/" aria-label="الرئيسية"><Home size={18}/></Link>
        <div className="logged-avatar"><UserRound size={28}/></div>
        <span className="account-kicker">حسابك</span>
        <h2>{storedUser.role==="admin"?"حساب صاحب المطعم":"حسابي"}</h2>
        <p>أنت مسجل الدخول بالفعل. اختر ما تريد الوصول إليه.</p>
        <div className="account-actions">
          {storedUser.role==="admin"&&<Link className="btn primary full" to="/admin"><LayoutDashboard size={17}/> لوحة تحكم المطعم</Link>}
          <Link className="btn outline full" to="/purchases"><ShoppingBag size={17}/> مشترياتي</Link>
          <Link className="btn outline full" to="/cart">عربة التسوق</Link>
          <button className="btn danger full" type="button" onClick={logout}><LogOut size={17}/> تسجيل الخروج</button>
        </div>
      </div>
    </section>
  }

  return <section className="auth-page">
    <div className="auth-backdrop"><img src={asset("restaurantInterior")} alt=""/><div className="auth-backdrop-copy"><img src={asset("logo")} alt=""/><span>انضم إلى عائلتنا</span><h1>إنشاء حساب جديد</h1><p>استمتع بتجربة طعام مميزة واحتفظ بطلباتك في مكان واحد.</p></div></div>
    <form className="auth-form" onSubmit={submit}>
      <Link className="auth-home-icon" to="/" aria-label="الرئيسية"><Home size={18}/></Link>
      <img className="auth-mobile-logo" src={asset("logo")} alt=""/>
      <h2>{mode==="register"?"إنشاء حساب جديد":"تسجيل الدخول"}</h2>
      <p className="auth-intro">{mode==="register"?"انضم إلى عائلتنا واستمتع بتجربة طعام مميزة":"مرحبًا بعودتك، أدخل بياناتك للمتابعة"}</p>
      <div className="account-switch"><button type="button" className={mode==="register"?"selected":""} onClick={()=>setMode("register")}>مستخدم عادي <UserRound size={15}/></button><button type="button" className={mode==="login"?"selected":""} onClick={()=>setMode("login")}>لدي حساب</button></div>
      {mode==="register"&&<label>الاسم الكامل<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="أدخل اسمك بالكامل"/><UserRound/></label>}
      <label>البريد الإلكتروني<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="example@domain.com"/><Mail/></label>
      {mode==="register"&&<label>رقم الهاتف<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+20 123 456 7890"/><Phone/></label>}
      <label>كلمة المرور<input required type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="أدخل كلمة المرور"/><Lock/></label>
      {mode==="register"&&<label>تأكيد كلمة المرور<input required type="password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} placeholder="أعد إدخال كلمة المرور"/><Lock/></label>}
      <button disabled={busy} className="btn primary full" type="submit">{mode==="register"?"إنشاء حساب":"تسجيل الدخول"}<Send size={15}/></button>
      <div className="or"><span>أو التسجيل باستخدام</span></div>
      <div className="social-auth">
        <button type="button" onClick={()=>social("google")} disabled={!!oauthBusy}><Chrome size={16}/> {oauthBusy==="google"?"جاري التحويل...":"Google"}</button>
        <button type="button" onClick={()=>social("apple")} disabled={!!oauthBusy}><Apple size={16}/> {oauthBusy==="apple"?"جاري التحويل...":"Apple"}</button>
        <button type="button" onClick={()=>social("facebook")} disabled={!!oauthBusy}><Facebook size={16}/> {oauthBusy==="facebook"?"جاري التحويل...":"Facebook"}</button>
      </div>
      <p className="terms">بإنشاء حساب، فإنك توافق على <b>شروط الاستخدام</b> و <b>سياسة الخصوصية</b></p>
      <p className="login-link">{mode==="register"?"لديك حساب بالفعل؟":"ليس لديك حساب؟"} <button type="button" className="text-link" onClick={()=>setMode(mode==="register"?"login":"register")}>{mode==="register"?"تسجيل الدخول":"إنشاء حساب"}</button></p>
    </form>
  </section>
}
