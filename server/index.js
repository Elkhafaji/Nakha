import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRemoteJWKSet, jwtVerify, SignJWT, importPKCS8 } from "jose";
import { DatabaseSync } from "node:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, "nakha.db"));

// Full-stack restaurant database. Admin and customers use the same users table;
// the role column controls access to the private admin area.
db.exec(`
CREATE TABLE IF NOT EXISTS users(
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE,
 phone TEXT DEFAULT '',
 password_hash TEXT DEFAULT '',
 auth_provider TEXT DEFAULT 'local',
 provider_id TEXT DEFAULT '',
 role TEXT DEFAULT 'customer',
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS orders(
 id TEXT PRIMARY KEY,
 user_email TEXT NOT NULL,
 restaurant TEXT NOT NULL,
 image TEXT NOT NULL,
 items_json TEXT NOT NULL,
 total REAL NOT NULL,
 status TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS messages(
 id TEXT PRIMARY KEY,
 name TEXT,
 email TEXT,
 phone TEXT,
 type TEXT,
 message TEXT,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions(
 token TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products(
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 description TEXT DEFAULT '',
 price REAL NOT NULL,
 old_price REAL,
 image TEXT DEFAULT '',
 image_key TEXT DEFAULT '',
 category TEXT NOT NULL,
 badge TEXT DEFAULT '',
 active INTEGER DEFAULT 1,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);`);

// Migrations for databases made by older versions.
const userCols = db.prepare("PRAGMA table_info(users)").all().map(x => x.name);
if (!userCols.includes("auth_provider")) db.exec("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'");
if (!userCols.includes("provider_id")) db.exec("ALTER TABLE users ADD COLUMN provider_id TEXT DEFAULT ''");
if (!userCols.includes("password_hash")) db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT ''");
if (!userCols.includes("role")) db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer'");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:5173";
const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:5174";
const makeId = () => `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
const randomToken = () => crypto.randomBytes(32).toString("hex");
const redirectUrl = (provider) => `${API_ORIGIN}/api/auth/oauth/${provider}/callback`;
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};
const verifyPassword = (password, stored) => {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return actual.length === hash.length && crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(hash, "hex"));
};
const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, phone: u.phone || "",
  provider: u.auth_provider || "local", role: u.role || "customer"
});

function createSession(userId, days = 7) {
  const token = randomToken();
  const expires = new Date(Date.now() + days * 86400000).toISOString();
  db.prepare("INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)").run(token, userId, expires);
  return token;
}

function bearerUser(req) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const s = db.prepare("SELECT * FROM sessions WHERE token=?").get(token);
  if (!s || new Date(s.expires_at).getTime() < Date.now()) {
    if (s) db.prepare("DELETE FROM sessions WHERE token=?").run(token);
    return null;
  }
  const u = db.prepare("SELECT * FROM users WHERE id=?").get(s.user_id);
  return u ? { user: u, token } : null;
}

function requireAuth(req, res, next) {
  const auth = bearerUser(req);
  if (!auth) return res.status(401).json({ message: "يجب تسجيل الدخول أولًا" });
  req.auth = auth;
  next();
}
function requireAdmin(req, res, next) {
  const auth = bearerUser(req);
  if (!auth) return res.status(401).json({ message: "جلسة الإدارة غير صالحة" });
  if (auth.user.role !== "admin") return res.status(403).json({ message: "ليس لديك صلاحية دخول لوحة الإدارة" });
  req.auth = auth;
  next();
}

const oauthStates = new Map();
const rememberState = (state, provider, redirect) => oauthStates.set(state, { provider, redirect: redirect || "/", expires: Date.now() + 10 * 60 * 1000 });
const consumeState = (state, provider) => {
  const item = oauthStates.get(state); oauthStates.delete(state);
  if (!item || item.provider !== provider || item.expires < Date.now()) return null;
  return item;
};
const frontendError = (res, message) => res.redirect(`${APP_ORIGIN}/account?oauthError=${encodeURIComponent(message)}`);

function getProviderConfig(provider) {
  if (provider === "google") return process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET } : null;
  if (provider === "facebook") return process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET ? { id: process.env.FACEBOOK_APP_ID, secret: process.env.FACEBOOK_APP_SECRET, version: process.env.FACEBOOK_GRAPH_VERSION || "v24.0" } : null;
  if (provider === "apple") return process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY ? { id: process.env.APPLE_CLIENT_ID, team: process.env.APPLE_TEAM_ID, key: process.env.APPLE_KEY_ID, privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n") } : null;
  return null;
}
async function appleClientSecret() {
  const cfg = getProviderConfig("apple");
  if (!cfg) throw new Error("Apple OAuth غير مُعد بعد");
  const key = await importPKCS8(cfg.privateKey, "ES256");
  return new SignJWT({}).setProtectedHeader({ alg: "ES256", kid: cfg.key }).setIssuer(cfg.team).setSubject(cfg.id).setAudience("https://appleid.apple.com").setIssuedAt().setExpirationTime("180d").sign(key);
}

async function upsertOAuthUser({ provider, providerId, email, name }) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error("مزود تسجيل الدخول لم يُرجع بريدًا إلكترونيًا");
  let user = db.prepare("SELECT * FROM users WHERE email=?").get(normalized);
  if (!user) {
    user = { id: makeId(), name: name || "مستخدم نكهة", email: normalized, phone: "", password_hash: "", auth_provider: provider, provider_id: String(providerId || ""), role: "customer", created_at: new Date().toISOString() };
    db.prepare("INSERT INTO users(id,name,email,phone,password_hash,auth_provider,provider_id,role,created_at) VALUES(?,?,?,?,?,?,?,?,?)").run(user.id,user.name,user.email,user.phone,user.password_hash,user.auth_provider,user.provider_id,user.role,user.created_at);
  } else {
    db.prepare("UPDATE users SET name=?, auth_provider=?, provider_id=? WHERE id=?").run(name || user.name, provider, String(providerId || ""), user.id);
    user = db.prepare("SELECT * FROM users WHERE id=?").get(user.id);
  }
  return { token: createSession(user.id, 7), user };
}

// Seed a private admin account. It uses the same public login form as customers,
// but the role is stored server-side and only the role-aware redirect exposes the dashboard.
const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || "admin@nakha.local");
const adminPassword = process.env.ADMIN_PASSWORD || "NakhaAdmin@2026";
const adminName = process.env.ADMIN_NAME || "صاحب مطعم نكهة";
let admin = db.prepare("SELECT * FROM users WHERE email=?").get(adminEmail);
if (!admin) {
  const now = new Date().toISOString();
  db.prepare("INSERT INTO users(id,name,email,phone,password_hash,auth_provider,provider_id,role,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
    .run(makeId(), adminName, adminEmail, "", hashPassword(adminPassword), "local", "", "admin", now);
} else if (admin.role !== "admin") {
  db.prepare("UPDATE users SET role='admin' WHERE email=?").run(adminEmail);
}

// Initial catalog. After the first run, all product changes are stored in SQLite and
// can be made from the admin dashboard without editing source code.
const seedProducts = [
  ["p1","بيتزا مارغريتا","جبن فاخر • صلصة طماطم",75,null,"pizzaMargherita","pizzaMargherita","pizza","",1],
  ["p2","بيتزا بيبروني","بيبروني • جبن موزاريلا",85,null,"pizzaPepperoni","pizzaPepperoni","pizza","",1],
  ["p3","بيتزا خضار","خضروات طازجة • جبن",75,null,"pizzaSupreme","pizzaSupreme","pizza","",1],
  ["p4","بيتزا دجاج","دجاج مشوي • جبن",95,null,"pizza","pizza","pizza","",1],
  ["p5","برجر كلاسيك","لحم بقري مشوي • صلصة مميزة",89,null,"burgerClassic","burgerClassic","burger","",1],
  ["p6","برجر مشروم","لحم بقري • مشروم • جبن",95,null,"burgerMushroom","burgerMushroom","burger","",1],
  ["p7","برجر تشيز","لحم بقري • جبن شيدر",82,null,"burgerCheese","burgerCheese","burger","",1],
  ["p8","برجر باربكيو","لحم مشوي • صوص باربكيو",90,null,"burger","burger","burger","",1],
  ["p9","سلمون مشوي","سلمون • خضار مشوية",110,null,"grilledSalmon","grilledSalmon","seafood","",1],
  ["p10","جمبري مشوي","جمبري طازج • ليمون",125,null,"seafoodPlatter","seafoodPlatter","seafood","",1],
  ["p11","مكرونة ألفريدو","كريمة • جبن بارميزان",80,null,"pastaAlfredo","pastaAlfredo","pasta","",1],
  ["p12","سباجيتي بولونيز","لحم مفروم • صلصة طماطم",90,null,"pastaBolognese","pastaBolognese","pasta","",1],
  ["p13","سيزر سالاد","خس • دجاج • صوص سيزر",65,null,"caesarSalad","caesarSalad","salad","",1],
  ["p14","سلطة يونانية","جبن فيتا • خضروات طازجة",60,null,"greekSalad","greekSalad","salad","",1],
  ["p15","موزاريلا ستيكس","جبن موزاريلا مقرمش",56,null,"mozzarellaSticks","mozzarellaSticks","appetizers","",1],
  ["p16","مقبلات مقلية","تشكيلة مقبلات مميزة",65,null,"friedAppetizers","friedAppetizers","appetizers","",1],
  ["p17","عصير مانجو","طازج ومنعش",30,null,"mangoJuice","mangoJuice","drinks","",1],
  ["p18","عصير برتقال طبيعي","طازج ومنعش",25,null,"orangeJuice","orangeJuice","drinks","",1],
  ["p19","تشيز كيك","تشيز كيك بصوص التوت",50,null,"cheesecake","cheesecake","dessert","",1],
  ["p20","شوكولاتة لافا","شوكولاتة دافئة • آيس كريم",63,null,"chocolateCake","chocolateCake","dessert","",1]
];
if (Number(db.prepare("SELECT COUNT(*) AS c FROM products").get().c) === 0) {
  const now = new Date().toISOString();
  const stmt = db.prepare("INSERT INTO products(id,name,description,price,old_price,image,image_key,category,badge,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)");
  for (const p of seedProducts) stmt.run(...p,now,now);
}

const productPublic = (p) => ({ id:p.id,name:p.name,description:p.description,price:Number(p.price),oldPrice:p.old_price == null ? undefined : Number(p.old_price),image:p.image || p.image_key || "",imageKey:p.image_key || "",category:p.category,badge:p.badge || "",active:Boolean(p.active) });

app.get("/api/health", (_, res) => res.json({ ok:true, service:"nakha-api", database:"sqlite" }));

app.post("/api/auth/register", (req,res) => {
  const {name,email,phone,password} = req.body || {};
  if (!name || !email || !password) return res.status(400).json({message:"الاسم والبريد وكلمة المرور مطلوبة"});
  const normalized = normalizeEmail(email);
  if (db.prepare("SELECT id FROM users WHERE email=?").get(normalized)) return res.status(409).json({message:"البريد الإلكتروني مستخدم بالفعل"});
  const user = {id:makeId(),name:String(name).trim(),email:normalized,phone:phone||"",password_hash:hashPassword(String(password)),auth_provider:"local",provider_id:"",role:"customer",created_at:new Date().toISOString()};
  db.prepare("INSERT INTO users(id,name,email,phone,password_hash,auth_provider,provider_id,role,created_at) VALUES(?,?,?,?,?,?,?,?,?)").run(user.id,user.name,user.email,user.phone,user.password_hash,user.auth_provider,user.provider_id,user.role,user.created_at);
  res.status(201).json({user:publicUser(user),token:createSession(user.id)});
});

app.post("/api/auth/login", (req,res) => {
  const {email,password} = req.body || {};
  if (!email || !password) return res.status(400).json({message:"البريد الإلكتروني وكلمة المرور مطلوبان"});
  const u = db.prepare("SELECT * FROM users WHERE email=?").get(normalizeEmail(email));
  if (!u || !verifyPassword(String(password),u.password_hash)) return res.status(401).json({message:"بيانات الدخول غير صحيحة"});
  res.json({user:publicUser(u),token:createSession(u.id)});
});

app.post("/api/auth/logout", requireAuth, (req,res) => { db.prepare("DELETE FROM sessions WHERE token=?").run(req.auth.token); res.json({ok:true}); });
app.get("/api/auth/me", requireAuth, (req,res) => res.json({user:publicUser(req.auth.user)}));
app.get("/api/auth/session", (req,res) => {
  const token = String(req.query.token || "");
  const s = db.prepare("SELECT * FROM sessions WHERE token=?").get(token);
  if (!s || new Date(s.expires_at).getTime() < Date.now()) return res.status(401).json({message:"جلسة تسجيل الدخول غير صالحة"});
  const u = db.prepare("SELECT * FROM users WHERE id=?").get(s.user_id);
  if (!u) return res.status(404).json({message:"الحساب غير موجود"});
  res.json({user:publicUser(u),token});
});

// OAuth start/callbacks.
app.get("/api/auth/oauth/:provider", async (req,res) => {
  const provider=String(req.params.provider).toLowerCase();
  if (!["google","facebook","apple"].includes(provider)) return res.status(404).send("Unknown provider");
  const cfg=getProviderConfig(provider);
  if (!cfg) return frontendError(res,`تسجيل الدخول عبر ${provider} غير مُعد. أضف مفاتيح المزود في ملف .env أولًا.`);
  const state=randomToken(); const redirect=typeof req.query.redirect==="string"&&req.query.redirect.startsWith("/")?req.query.redirect:"/";
  rememberState(state,provider,redirect);
  const callback=redirectUrl(provider);
  const u=new URL(provider==="google"?"https://accounts.google.com/o/oauth2/v2/auth":provider==="facebook"?`https://www.facebook.com/${cfg.version}/dialog/oauth`:"https://appleid.apple.com/auth/authorize");
  u.searchParams.set("client_id",cfg.id);u.searchParams.set("redirect_uri",callback);u.searchParams.set("response_type","code");u.searchParams.set("state",state);
  if(provider==="google"){u.searchParams.set("scope","openid email profile");u.searchParams.set("access_type","online");}
  if(provider==="facebook")u.searchParams.set("scope","email,public_profile");
  if(provider==="apple"){u.searchParams.set("response_mode","form_post");u.searchParams.set("scope","name email");}
  res.redirect(u.toString());
});

async function finishOAuth(req,res,provider,payload){
  try{
    const stateData=consumeState(payload.state,provider); if(!stateData) return frontendError(res,"انتهت جلسة تسجيل الدخول أو أن طلب OAuth غير صالح.");
    const code=payload.code; if(!code) return frontendError(res,"لم يتم استلام رمز تسجيل الدخول.");
    const cfg=getProviderConfig(provider); let profile;
    if(provider==="google"){
      const tr=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:cfg.id,client_secret:cfg.secret,redirect_uri:redirectUrl(provider),grant_type:"authorization_code"})});
      const tokens=await tr.json(); if(!tr.ok) throw new Error(tokens.error_description||"Google token exchange failed");
      const r=await fetch("https://openidconnect.googleapis.com/v1/userinfo",{headers:{Authorization:`Bearer ${tokens.access_token}`}}); const p=await r.json(); if(!r.ok) throw new Error("Google user info failed"); profile={id:p.sub,email:p.email,name:p.name};
    } else if(provider==="facebook"){
      const tokenUrl=new URL(`https://graph.facebook.com/${cfg.version}/oauth/access_token`); tokenUrl.searchParams.set("client_id",cfg.id);tokenUrl.searchParams.set("client_secret",cfg.secret);tokenUrl.searchParams.set("redirect_uri",redirectUrl(provider));tokenUrl.searchParams.set("code",code);
      const tr=await fetch(tokenUrl);const tokens=await tr.json();if(!tr.ok)throw new Error(tokens.error?.message||"Facebook token exchange failed");
      const meUrl=new URL(`https://graph.facebook.com/${cfg.version}/me`);meUrl.searchParams.set("fields","id,name,email");meUrl.searchParams.set("access_token",tokens.access_token);const mr=await fetch(meUrl);const me=await mr.json();if(!mr.ok)throw new Error(me.error?.message||"Facebook user info failed");profile={id:me.id,email:me.email,name:me.name};
    } else {
      const clientSecret=await appleClientSecret();const tr=await fetch("https://appleid.apple.com/auth/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:cfg.id,client_secret:clientSecret,code,grant_type:"authorization_code",redirect_uri:redirectUrl(provider)})});const tokens=await tr.json();if(!tr.ok)throw new Error(tokens.error_description||"Apple token exchange failed");
      const verified=await jwtVerify(tokens.id_token,createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys")),{issuer:"https://appleid.apple.com",audience:cfg.id});const c=verified.payload;profile={id:c.sub,email:c.email,name:""};
    }
    const {token}=await upsertOAuthUser({provider,providerId:profile.id,email:profile.email,name:profile.name});
    res.redirect(`${APP_ORIGIN}/account?oauthToken=${encodeURIComponent(token)}&redirect=${encodeURIComponent(stateData.redirect)}`);
  }catch(err){console.error(`${provider} OAuth error`,err);return frontendError(res,"تعذر إكمال تسجيل الدخول من المزود. راجع إعدادات OAuth في ملف .env.");}
}
app.get("/api/auth/oauth/:provider/callback",async(req,res)=>{const provider=String(req.params.provider).toLowerCase();if(provider==="apple")return frontendError(res,"Apple يستخدم POST callback");return finishOAuth(req,res,provider,req.query);});
app.post("/api/auth/oauth/apple/callback",async(req,res)=>finishOAuth(req,res,"apple",req.body));

// Public catalog used by the customer website.
app.get("/api/products", (req,res)=>{
  const rows=db.prepare("SELECT * FROM products WHERE active=1 ORDER BY created_at ASC").all();
  res.json({products:rows.map(productPublic)});
});

// Admin dashboard.
app.get("/api/admin/summary", requireAdmin, (req,res)=>{
  const customers=Number(db.prepare("SELECT COUNT(*) c FROM users WHERE role='customer'").get().c);
  const orders=Number(db.prepare("SELECT COUNT(*) c FROM orders").get().c);
  const completed=Number(db.prepare("SELECT COUNT(*) c FROM orders WHERE status='تم التسليم'").get().c);
  const revenue=Number(db.prepare("SELECT COALESCE(SUM(total),0) v FROM orders WHERE status!='تم الإلغاء'").get().v);
  const products=Number(db.prepare("SELECT COUNT(*) c FROM products WHERE active=1").get().c);
  const messages=Number(db.prepare("SELECT COUNT(*) c FROM messages").get().c);
  const recent=db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 8").all().map(o=>({...o,userEmail:o.user_email,createdAt:o.created_at,items:JSON.parse(o.items_json)}));
  const top=db.prepare("SELECT items_json FROM orders WHERE status!='تم الإلغاء'").all();
  const counts=new Map(); for(const row of top){for(const item of JSON.parse(row.items_json||"[]")){const key=item.name||item.id;counts.set(key,(counts.get(key)||0)+Number(item.quantity||1));}}
  const topProducts=[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count}));
  res.json({stats:{customers,orders,completed,revenue,products,messages},recentOrders:recent,topProducts});
});
app.get("/api/admin/products", requireAdmin, (req,res)=>res.json({products:db.prepare("SELECT * FROM products ORDER BY created_at DESC").all().map(productPublic)}));
app.post("/api/admin/products", requireAdmin, (req,res)=>{
  const {name,description,price,oldPrice,image,imageKey,category,badge,active=true}=req.body||{};
  if(!name||price===undefined||!category) return res.status(400).json({message:"اسم الطبق والسعر والتصنيف مطلوبة"});
  const now=new Date().toISOString(); const id=makeId();
  db.prepare("INSERT INTO products(id,name,description,price,old_price,image,image_key,category,badge,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").run(id,String(name).trim(),String(description||""),Number(price),oldPrice===""||oldPrice==null?null:Number(oldPrice),String(image||""),String(imageKey||""),String(category),String(badge||""),active?1:0,now,now);
  res.status(201).json({product:productPublic(db.prepare("SELECT * FROM products WHERE id=?").get(id))});
});
app.put("/api/admin/products/:id", requireAdmin, (req,res)=>{
  const old=db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id); if(!old)return res.status(404).json({message:"الطبق غير موجود"});
  const {name,description,price,oldPrice,image,imageKey,category,badge,active}=req.body||{};
  const now=new Date().toISOString();
  db.prepare("UPDATE products SET name=?,description=?,price=?,old_price=?,image=?,image_key=?,category=?,badge=?,active=?,updated_at=? WHERE id=?").run(String(name??old.name),String(description??old.description),Number(price??old.price),oldPrice===""||oldPrice==null?null:Number(oldPrice??old.old_price),String(image ?? old.image ?? ""),String(imageKey ?? old.image_key ?? ""),String(category??old.category),String(badge ?? old.badge ?? ""),active===undefined?old.active:(active?1:0),now,req.params.id);
  res.json({product:productPublic(db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id))});
});
app.delete("/api/admin/products/:id", requireAdmin, (req,res)=>{const r=db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);if(!r.changes)return res.status(404).json({message:"الطبق غير موجود"});res.json({ok:true});});
app.patch("/api/admin/products/:id/toggle", requireAdmin, (req,res)=>{const p=db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id);if(!p)return res.status(404).json({message:"الطبق غير موجود"});db.prepare("UPDATE products SET active=?,updated_at=? WHERE id=?").run(p.active?0:1,new Date().toISOString(),p.id);res.json({product:productPublic(db.prepare("SELECT * FROM products WHERE id=?").get(p.id))});});

app.get("/api/admin/orders", requireAdmin, (req,res)=>res.json({orders:db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all().map(o=>({...o,userEmail:o.user_email,createdAt:o.created_at,items:JSON.parse(o.items_json)}))}));
app.patch("/api/admin/orders/:id/status", requireAdmin, (req,res)=>{
  const allowed=["جديد","قيد التحضير","جاهز","جاري التوصيل","تم التسليم","تم الإلغاء"];
  if(!allowed.includes(req.body?.status)) return res.status(400).json({message:"حالة الطلب غير صالحة"});
  const r=db.prepare("UPDATE orders SET status=? WHERE id=?").run(req.body.status,req.params.id);if(!r.changes)return res.status(404).json({message:"الطلب غير موجود"});
  const o=db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);res.json({order:{...o,userEmail:o.user_email,createdAt:o.created_at,items:JSON.parse(o.items_json)}});
});
app.get("/api/admin/users", requireAdmin, (_,res)=>res.json({users:db.prepare("SELECT id,name,email,phone,role,auth_provider,created_at FROM users ORDER BY created_at DESC").all()}));
app.get("/api/admin/messages", requireAdmin, (_,res)=>res.json({messages:db.prepare("SELECT * FROM messages ORDER BY created_at DESC").all()}));

// Customer orders. The API uses the authenticated session so customers can only see/create their own orders.
app.get("/api/orders", requireAuth, (req,res)=>{
  const email=req.auth.user.email;
  const rows=db.prepare("SELECT * FROM orders WHERE user_email=? ORDER BY created_at DESC").all(email);
  res.json({orders:rows.map(o=>({...o,userEmail:o.user_email,createdAt:o.created_at,items:JSON.parse(o.items_json)}))});
});
app.post("/api/orders", requireAuth, (req,res)=>{
  const {items,total}=req.body||{};
  if(!Array.isArray(items)||!items.length)return res.status(400).json({message:"بيانات الطلب غير مكتملة"});
  const id="#"+Math.floor(10000+Math.random()*89999);const first=items[0];const now=new Date().toISOString();
  const order={id,user_email:req.auth.user.email,restaurant:"مطعم نكهة الرئيسي",image:first.imageKey||first.image||"burgerClassic",items_json:JSON.stringify(items),total:Number(total)||0,status:"جديد",created_at:now};
  db.prepare("INSERT INTO orders(id,user_email,restaurant,image,items_json,total,status,created_at) VALUES(?,?,?,?,?,?,?,?)").run(order.id,order.user_email,order.restaurant,order.image,order.items_json,order.total,order.status,order.created_at);
  res.status(201).json({order:{...order,userEmail:order.user_email,createdAt:order.created_at,items}});
});
app.post("/api/contact",(req,res)=>{const {name,email,phone,type,message}=req.body||{};const id=makeId();db.prepare("INSERT INTO messages(id,name,email,phone,type,message,created_at) VALUES(?,?,?,?,?,?,?)").run(id,name||"",email||"",phone||"",type||"",message||"",new Date().toISOString());res.status(201).json({ok:true,id});});

app.use((err,_req,res,_next)=>{console.error("API error",err);if(res.headersSent)return;res.status(500).json({message:"حدث خطأ داخل الخادم. راجع Terminal الخاص بالـBackend."});});
const port=process.env.PORT||5174;
app.listen(port,()=>console.log(`Nakha API: http://localhost:${port}`));
