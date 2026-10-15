import { asset } from "../lib/assets";
import { Link } from "react-router-dom";
import { MapPin, Star, Phone, Clock } from "lucide-react";

const restaurants = [
  ["مطعم بيتزا كورنر","pizzaMargherita","بيتزا • باستا • مقبلات","4.9","(3.1k)"],
  ["مطعم برجر زون","burgerClassic","برجر • وجبات سريعة","4.6","(1.2k)"],
  ["مطعم سي بايتس","seafoodPlatter","مأكولات بحرية","4.7","(1.8k)"],
  ["مطعم نكهة الرئيسي","restaurantInterior","بيتزا • برجر • مشويات • مأكولات بحرية","4.8","(2.5k)"],
  ["مطعم تشيكن هاوس","grilledChicken","دجاج • وجبات سريعة","4.4","(900)"],
  ["مطعم سويت كورنر","cheesecake","حلويات • مشروبات • مقبلات","4.5","(980)"],
  ["مطعم البيت اللبناني","mezze","مأكولات لبنانية","4.6","(1.3k)"],
  ["مطعم جريل ماسترز","grilledMeat","مشويات • أطباق شرقية","4.7","(1.5k)"],
];

export default function Restaurants() {
  return <section className="page restaurants-page">
    <div className="page-banner restaurants-banner"><img src={asset("restaurantInterior")} alt=""/><div><h1>مطاعمنا</h1><p>استمتع بتجربة طعام استثنائية في أفضل مطاعمنا</p></div></div>
    <div className="restaurants-layout"><div className="restaurant-grid">{restaurants.map(([name,img,desc,rating,reviews])=><article className="restaurant-card" key={name}><div className="restaurant-img"><img src={asset(img)} alt=""/><span>● مفتوح الآن</span></div><div className="restaurant-body"><h3>{name}</h3><p>{desc}</p><div className="rating"><Star size={15}/> {rating} <small>{reviews} تقييم</small></div><p><MapPin size={14}/> المنصورة - شارع الجامعة</p><div className="card-actions"><Link className="card-action-btn" to="/menu">عرض المطعم</Link><Link className="card-action-btn" to="/contact"><Phone size={14}/> اعرف كيف تصل</Link></div></div></article>)}</div><aside className="restaurant-side"><h2>مطعم نكهة الرئيسي</h2><img src={asset("restaurantInterior")} alt=""/><h3>موقع المطعم</h3><div className="side-map">📍 مطعم نكهة</div><h3>كيف تصل إلى المطعم؟</h3><Link className="btn primary" to="/contact">عرض الاتجاهات</Link><div className="side-contact"><Clock/> من 10 صباحًا إلى 2 صباحًا<br/><Phone/> +20 123 456 7890</div></aside></div>
  </section>;
}