import { ArrowLeft, Heart, Leaf, Star, Users, UtensilsCrossed, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { asset } from "../lib/assets";

const reasons: [LucideIcon,string,string][]=[[Leaf,"مكونات طازجة عالية الجودة","نختار الأفضل دائمًا لصحتك وراحتك"],[UtensilsCrossed,"فريق عمل محترف","شغفنا في كل طبق نقدمه"],[Star,"تجربة طعام فريدة","أجواء مميزة وذكريات لا تُنسى"],[Sparkles,"أسعار مناسبة","جودة عالية بقيمة تستحقها"]];
export default function About(){return <section className="page about-page">
  <div className="about-hero"><img src={asset("restaurantInterior")} alt=""/><div><span>قصة نكهة ... بدأت من شغف</span><h1>من نحن</h1><p>نحن في نكهة أكثر من مجرد مطعم، نحن تجربة فريدة تجمع بين المذاق الأصيل والجودة العالية والأجواء المريحة.</p></div></div>
  <div className="about-main-grid">
    <article className="about-story-panel"><img src={asset("chef")} alt=""/><div><span>قصتنا</span><h2>من حلم بسيط إلى وجهة مفضلة لمحبي الطعام</h2><p>بدأت فكرة نكهة من حبنا للطعام ورغبتنا في تقديم تجربة مختلفة. منذ اليوم الأول كان هدفنا أن نخلق مكانًا يجمع بين جودة المذاق، تنوع الأطباق، وراحة الضيوف.</p><p>نؤمن بأن الطعام ليس مجرد وجبة، بل لحظات تجمع الناس وتبقى في الذاكرة، لذلك نحرص على اختيار أفضل المكونات الطازجة واستخدام وصفات مبتكرة تجمع بين الأصالة والحداثة.</p><Link className="btn primary" to="/menu">اكتشف قائمتنا <ArrowLeft size={16}/></Link></div></article>
    <article className="why-panel"><span>لماذا</span><h2>لماذا نكهة؟</h2>{reasons.map(([I,t,d])=><div className="reason" key={t}><I/><span><b>{t}</b><small>{d}</small></span></div>)}</article>
  </div>
  <div className="about-stats"><div className="stats-image"><img src={asset("restaurantInterior")} alt=""/></div><div className="stats-title"><span>أكثر من مجرد مطعم</span><h2>إنه مكان يجمع الناس</h2><p>نكهة تصنع لحظات تستحق أن تتذكرها.</p></div>{[[Users,"+5000","عميل سعيد"],[UtensilsCrossed,"4","فروع في أنحاء المدينة"],[Star,"10+","سنوات من الخبرة"],[Heart,"50+","صنف مختلف في قائمتنا"]].map(([I,n,t])=>{const Icon=I as LucideIcon;return <div className="stat" key={n as string}><Icon/><strong>{n as string}</strong><small>{t as string}</small></div>})}</div>
  <div className="about-lower"><article className="values-panel"><span>قيمنا</span><h2>ما نؤمن به</h2><div>{[[Heart,"الاهتمام بالتفاصيل","نقدم كل طبق بعناية"],[Leaf,"أفضل المكونات","نختار الطازج دائمًا"],[Star,"تجربة استثنائية","نهتم بكل لحظة"],[Sparkles,"روح الفريق","نعمل بشغف"]].map(([I,t,d])=><div className="value" key={t as string}><I/><b>{t as string}</b><small>{d as string}</small></div>)}</div></article>
    <article className="chef-feature"><img src={asset("chef")} alt=""/><div><span>شيفنا</span><h2>شغفنا هو ما يجعل كل طبق قصة تستحق أن تُروى</h2><p>نضم فريقًا من أمهر الطهاة المحترفين الذين يجمعون بين الخبرة والإبداع.</p><Link className="btn primary" to="/contact">تعرّف على فريقنا <ArrowLeft size={16}/></Link></div></article>
  </div>
  <div className="about-strip"><div><span>نكهة في كل لقمة</span><h2>من المطبخ إلى قلبك.. نعدك بتجربة لا تُنسى</h2><Link className="btn primary" to="/menu">اكتشف منيو الطعام</Link></div><img src={asset("pizzaMargherita")} alt=""/><img src={asset("burgerClassic")} alt=""/><img src={asset("seafoodPlatter")} alt=""/><img src={asset("chocolateCake")} alt=""/><img src={asset("orangeJuice")} alt=""/></div>
</section>}
