import { ShoppingCart, Heart, Plus } from "lucide-react";
import { Product } from "../data";
import { asset } from "../lib/assets";
import { useCart } from "../lib/cart";
import { useState } from "react";
export default function ProductCard({ product, offer = false }: { product: Product; offer?: boolean }) {
  const { add } = useCart(); const [liked,setLiked]=useState(false);
  const imageSrc = product.imageKey ? asset(product.imageKey) : product.image;
  return <article className="product-card">
    <div className="product-image"><img src={imageSrc} alt={product.name}/>{offer && product.badge && <span className="discount-badge">{product.badge}</span>}<button className={`heart ${liked?"liked":""}`} onClick={()=>setLiked(!liked)} aria-label="المفضلة"><Heart size={16} fill={liked?"currentColor":"none"}/></button></div>
    <div className="product-info"><div className="product-top"><span className="category-mini">{product.category}</span></div><h3>{product.name}</h3><p>{product.description}</p><div className="price-row"><strong>{product.price} ج.م</strong>{product.oldPrice && <del>{product.oldPrice} ج.م</del>}</div><button className="add-btn" onClick={()=>add(product)}><ShoppingCart size={16}/> اطلب الآن <Plus size={14}/></button></div>
  </article>;
}
