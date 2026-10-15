import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Offers from "./pages/Offers";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Restaurants from "./pages/Restaurants";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import { CartProvider } from "./lib/cart";

export default function App() {
  return <CartProvider><Routes>
    <Route element={<Layout/>}>
      <Route path="/" element={<Home/>}/>
      <Route path="/menu" element={<Menu/>}/>
      <Route path="/offers" element={<Offers/>}/>
      <Route path="/about" element={<About/>}/>
      <Route path="/contact" element={<Contact/>}/>
      <Route path="/restaurants" element={<Restaurants/>}/>
      <Route path="/cart" element={<Cart/>}/>
      <Route path="/orders" element={<Orders/>}/>
      <Route path="/purchases" element={<Orders/>}/>
    </Route>
    <Route path="/account" element={<Auth/>}/>
    <Route path="/admin" element={<Admin/>}/>
  </Routes></CartProvider>;
}