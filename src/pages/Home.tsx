import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import { products as fallbackProducts } from "../data";
import type { Product } from "../data";
import { asset } from "../lib/assets";

const cats = [
  ["pasta","المكرونات","pastaAlfredo"], ["pizza","البيتزا","pizzaMargherita"], ["burger","البرجر","burgerClassic"],
  ["drinks","المشروبات","mangoJuice"], ["dessert","الحلويات","chocolateCake"], ["appetizers","المقبلات","friedAppetizers"]
];

export default function Home() {
  const [products,setProducts]=useState<Product[]>(fallbackProducts);
  useEffect(()=>{fetch("/api/products").then(r=>r.json()).then(d=>Array.isArray(d.products)&&d.products.length&&setProducts(d.products)).catch(()=>{})},[]);
  return <div className="home-page">
    <Hero />
    <section className="home-section categories-section">
      <div className="section-heading"><div><span>أقسام القائمة</span><h2>اختر ما يلهمك</h2><p>من البرجر الكلاسيكي إلى البيتزا الشهية، ستجد دائمًا ما يناسب ذوقك.</p></div><Link to="/menu">عرض الكل <ArrowLeft size={16}/></Link></div>
      <div className="category-grid">{cats.map(([id,name,img]) => <Link to={`/menu?category=${id}`} className="category-card" key={id}><img src={asset(img)} alt=""/><div><h3>{name}</h3><span>اكتشف الآن <ArrowLeft size={13}/></span></div></Link>)}</div>
    </section>
    <section className="home-promo">
      <img src={asset("burgerClassic")} alt=""/><div className="promo-copy"><span>عرض خاص</span><h2>خصم 20%<br/>على جميع الوجبات</h2><p>لفترة محدودة فقط</p><Link className="btn primary" to="/offers">اطلب الآن</Link></div>
    </section>
    <section className="home-section featured-section">
      <div className="section-heading"><div><span>الأكثر طلبًا</span><h2>أطباقك المفضلة</h2></div><Link to="/menu">عرض الكل <ArrowLeft size={16}/></Link></div>
      <div className="product-grid home-featured-grid">{products.slice(0,3).map(p => <ProductCard key={p.id} product={p}/>)}</div>
    </section>
  </div>;
}
