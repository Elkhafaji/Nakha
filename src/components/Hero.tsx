import { ArrowLeft, BadgeCheck, Bike, CreditCard, Leaf } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { asset } from "../lib/assets";

const features = [[Leaf,"مكونات طازجة"],[Bike,"توصيل سريع"],[CreditCard,"دفع آمن"],[BadgeCheck,"جودة عالية"]] as const;

export default function Hero(){
  const nav=useNavigate();
  const order=()=>localStorage.getItem("nakha_user") ? nav("/menu") : nav("/account?redirect=/menu");
  return <section className="hero-home">
    <img src={asset("burgerClassic")} alt="" className="hero-bg"/>
    <div className="hero-shade"/>
    <div className="hero-copy">
      <span>كل يوم طعم جديد</span>
      <h1>تجربة طعام<br/>مميزة بانتظارك</h1>
      <p>استمتع بأشهى الأطباق من مطبخنا، بمكونات طازجة ونكهات لا تُقاوم.</p>
      <div className="hero-buttons"><button className="btn primary" onClick={order}>اطلب الآن <ArrowLeft size={17}/></button><Link className="btn ghost" to="/menu">تصفح القائمة</Link></div>
    </div>
    <div className="hero-features">{features.map(([I,t])=><div key={t}><I/><span>{t}</span></div>)}</div>
  </section>;
}
