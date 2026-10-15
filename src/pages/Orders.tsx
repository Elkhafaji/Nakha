import { asset } from "../lib/assets";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RotateCcw, Headphones, ShieldCheck, Bike, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

type O={id:string;restaurant:string;image:string;total:number;status:string;createdAt:string;items?:any[]};
const tabs=[
  {key:"all",label:"كل الطلبات"},
  {key:"prep",label:"قيد التحضير"},
  {key:"delivery",label:"قيد التوصيل"},
  {key:"done",label:"تم التوصيل"},
  {key:"cancelled",label:"تم الإلغاء"},
];
const matches=(status:string,key:string)=>{
  if(key==="all") return true;
  if(key==="prep") return status==="قيد التحضير";
  if(key==="delivery") return status==="جاري التوصيل" || status==="قيد التوصيل";
  if(key==="done") return status==="تم التسليم";
  if(key==="cancelled") return status==="تم الإلغاء";
  return false;
};

export default function Orders(){
  const nav=useNavigate();
  const [orders,setOrders]=useState<O[]>([]);
  const [tab,setTab]=useState("all");
  const [selected,setSelected]=useState<O|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    const token=localStorage.getItem("nakha_token");
    const user=JSON.parse(localStorage.getItem("nakha_user")||"null");
    if(!token || !user){ nav("/account?redirect=/purchases",{replace:true}); return; }
    const load=async()=>{
      try{
        const r=await fetch("/api/orders",{headers:{Authorization:`Bearer ${token}`}});
        const d=await r.json();
        if(!r.ok) throw new Error(d.message||"تعذر تحميل الطلبات");
        setOrders(d.orders||[]); setError("");
      }catch(e:any){setError(e.message||"تعذر تحميل الطلبات");}
      finally{setLoading(false)}
    };
    load();
    const timer=window.setInterval(load,5000);
    return()=>window.clearInterval(timer);
  },[nav]);

  const visible=useMemo(()=>orders.filter(o=>matches(o.status,tab)),[orders,tab]);

  return <section className="page orders-page">
    <div className="orders-hero"><img src={asset("deliveryBag")} alt=""/><div><span>كل طلباتك في مكان واحد</span><h1>مشترياتي</h1><p>جميع طلباتك السابقة ومتابعة حالة الطلبات لحظة بلحظة</p></div></div>
    <div className="order-tabs">{tabs.map(t=><button key={t.key} type="button" className={tab===t.key?"selected":""} onClick={()=>setTab(t.key)}>{t.label}</button>)}<button type="button" onClick={()=>window.location.reload()} title="تحديث"><RotateCcw size={13}/> تحديث</button></div>
    {loading?<div className="orders-empty"><h2>جاري تحميل طلباتك...</h2></div>:error?<div className="orders-empty"><h2>{error}</h2><button className="btn primary" onClick={()=>nav("/account?redirect=/purchases")}>تسجيل الدخول</button></div>:<div className="orders-list">{visible.length?visible.map(o=><article className="order-card" key={o.id}><img className="order-main-img" src={asset(o.image)} alt=""/><div className="order-main"><div className="order-title"><h3>{o.restaurant}</h3><span className={`status-pill status-${o.status.replaceAll(" ","-")}`}>● {o.status}</span></div><p>{o.id} <b>•</b> {new Date(o.createdAt).toLocaleDateString("ar-EG")}</p><div className="order-thumbs">{(o.items||[]).slice(0,3).map((it:any,i:number)=><img key={i} src={it.imageKey?asset(it.imageKey):(it.image||asset(o.image))} alt=""/>)}<span>{Math.max(1,o.items?.length||1)} عناصر</span></div></div><div className="order-price"><small>الإجمالي</small><strong>{o.total} ج.م</strong><button type="button" onClick={()=>setSelected(o)}>تفاصيل الطلب <ArrowLeft size={14}/></button></div></article>):<div className="orders-empty"><h2>{tab==="all"?"لا توجد طلبات بعد":"لا توجد طلبات بهذه الحالة"}</h2><p>{tab==="all"?"بعد إتمام أول طلب سيظهر هنا تلقائيًا.":"غيّر الفلتر لرؤية باقي طلباتك."}</p></div>}</div>}
    <div className="service-strip"><div><Bike/><span><b>توصيل سريع</b><small>في الوقت المحدد</small></span></div><div><ShieldCheck/><span><b>دفع آمن</b><small>بياناتك محمية</small></span></div><div><Headphones/><span><b>هل تحتاج إلى مساعدة؟</b><small>تواصل مع خدمة العملاء</small></span></div></div>
    {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><div className="order-details-modal"><button type="button" className="modal-close" onClick={()=>setSelected(null)}><X/></button><span>تفاصيل الطلب</span><h2>{selected.id}</h2><p>{selected.restaurant}</p><div className="detail-status">{selected.status}</div><div className="detail-items">{(selected.items||[]).map((it:any,i:number)=><div key={i}><img src={it.imageKey?asset(it.imageKey):(it.image||asset(selected.image))} alt=""/><div><b>{it.name||"طبق"}</b><small>{it.quantity||1} × {it.price||0} ج.م</small></div></div>)}</div><div className="detail-total"><span>الإجمالي</span><strong>{selected.total} ج.م</strong></div></div></div>}
  </section>
}
