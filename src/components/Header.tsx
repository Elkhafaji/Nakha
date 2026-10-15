import { Link, NavLink, useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { Search, ShoppingCart, UserRound, Menu as MenuIcon } from "lucide-react";
import { useCart } from "../lib/cart";
import Logo from "./Logo";

const links = [
  ["/", "الرئيسية"], ["/menu", "المنيو"], ["/offers", "العروض"], ["/restaurants", "المطاعم"],
  ["/purchases", "مشترياتي"], ["/about", "من نحن"], ["/contact", "تواصل معنا"],
];
export default function Header() {
  const { count } = useCart(); const nav = useNavigate();
  const getAccountPath = () => { try { const u = JSON.parse(localStorage.getItem("nakha_user") || "null"); return u ? (u.role === "admin" ? "/admin" : "/account") : "/account"; } catch { return "/account"; } };
  const submitSearch = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const q = new FormData(e.currentTarget).get("q")?.toString().trim(); nav(q ? `/menu?search=${encodeURIComponent(q)}` : "/menu"); };
  return <header className="site-header" dir="ltr">
    <Link to="/" className="header-logo"><Logo /></Link>
    <nav className="desktop-nav" dir="rtl">{links.map(([to,label]) => <NavLink key={to} to={to} end={to==="/"} className={({isActive}) => isActive ? "active" : ""}>{label}</NavLink>)}</nav>
    <div className="header-actions" dir="rtl">
      <form className="search" onSubmit={submitSearch}><Search size={17}/><input name="q" placeholder="ابحث عن أي طبق أو صنف أو مطعم..." aria-label="بحث" /></form>
      <Link to="/cart" className="icon-btn cart-btn" aria-label="عربة التسوق"><ShoppingCart size={21}/>{count > 0 && <b>{count}</b>}</Link>
      <button type="button" onClick={() => nav(getAccountPath())} className="icon-btn" aria-label="الحساب"><UserRound size={21}/></button>
      <button className="icon-btn mobile-menu" onClick={() => nav("/menu")} aria-label="القائمة"><MenuIcon size={23}/></button>
    </div>
  </header>;
}
