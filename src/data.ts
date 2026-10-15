import { asset } from "./lib/assets";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  badge?: string;
  imageKey?: string;
  active?: boolean;
};

export const categories = [
  { id: "all", name: "الكل", icon: "✦" },
  { id: "pizza", name: "البيتزا", icon: "◉" },
  { id: "burger", name: "البرجر", icon: "●" },
  { id: "seafood", name: "المأكولات البحرية", icon: "♨" },
  { id: "pasta", name: "المكرونات", icon: "◎" },
  { id: "salad", name: "السلطات", icon: "♧" },
  { id: "appetizers", name: "المقبلات", icon: "◇" },
  { id: "drinks", name: "المشروبات", icon: "◌" },
  { id: "dessert", name: "الحلويات", icon: "◇" },
];

export const products: Product[] = [
  { id:"p1", name:"بيتزا مارغريتا", description:"جبن فاخر • صلصة طماطم", price:75, image:asset("pizzaMargherita"), imageKey:"pizzaMargherita", category:"pizza" },
  { id:"p2", name:"بيتزا بيبروني", description:"بيبروني • جبن موزاريلا", price:85, image:asset("pizzaPepperoni"), imageKey:"pizzaPepperoni", category:"pizza" },
  { id:"p3", name:"بيتزا خضار", description:"خضروات طازجة • جبن", price:75, image:asset("pizzaSupreme"), imageKey:"pizzaSupreme", category:"pizza" },
  { id:"p4", name:"بيتزا دجاج", description:"دجاج مشوي • جبن", price:95, image:asset("pizza"), imageKey:"pizza", category:"pizza" },
  { id:"p5", name:"برجر كلاسيك", description:"لحم بقري مشوي • صلصة مميزة", price:89, image:asset("burgerClassic"), imageKey:"burgerClassic", category:"burger" },
  { id:"p6", name:"برجر مشروم", description:"لحم بقري • مشروم • جبن", price:95, image:asset("burgerMushroom"), imageKey:"burgerMushroom", category:"burger" },
  { id:"p7", name:"برجر تشيز", description:"لحم بقري • جبن شيدر", price:82, image:asset("burgerCheese"), imageKey:"burgerCheese", category:"burger" },
  { id:"p8", name:"برجر باربكيو", description:"لحم مشوي • صوص باربكيو", price:90, image:asset("burger"), imageKey:"burger", category:"burger" },
  { id:"p9", name:"سلمون مشوي", description:"سلمون • خضار مشوية", price:110, image:asset("grilledSalmon"), imageKey:"grilledSalmon", category:"seafood" },
  { id:"p10", name:"جمبري مشوي", description:"جمبري طازج • ليمون", price:125, image:asset("seafoodPlatter"), imageKey:"seafoodPlatter", category:"seafood" },
  { id:"p11", name:"مكرونة ألفريدو", description:"كريمة • جبن بارميزان", price:80, image:asset("pastaAlfredo"), imageKey:"pastaAlfredo", category:"pasta" },
  { id:"p12", name:"سباجيتي بولونيز", description:"لحم مفروم • صلصة طماطم", price:90, image:asset("pastaBolognese"), imageKey:"pastaBolognese", category:"pasta" },
  { id:"p13", name:"سيزر سالاد", description:"خس • دجاج • صوص سيزر", price:65, image:asset("caesarSalad"), imageKey:"caesarSalad", category:"salad" },
  { id:"p14", name:"سلطة يونانية", description:"جبن فيتا • خضروات طازجة", price:60, image:asset("greekSalad"), imageKey:"greekSalad", category:"salad" },
  { id:"p15", name:"موزاريلا ستيكس", description:"جبن موزاريلا مقرمش", price:56, image:asset("mozzarellaSticks"), imageKey:"mozzarellaSticks", category:"appetizers" },
  { id:"p16", name:"مقبلات مقلية", description:"تشكيلة مقبلات مميزة", price:65, image:asset("friedAppetizers"), imageKey:"friedAppetizers", category:"appetizers" },
  { id:"p17", name:"عصير مانجو", description:"طازج ومنعش", price:30, image:asset("mangoJuice"), imageKey:"mangoJuice", category:"drinks" },
  { id:"p18", name:"عصير برتقال طبيعي", description:"طازج ومنعش", price:25, image:asset("orangeJuice"), imageKey:"orangeJuice", category:"drinks" },
  { id:"p19", name:"تشيز كيك", description:"تشيز كيك بصوص التوت", price:50, image:asset("cheesecake"), imageKey:"cheesecake", category:"dessert" },
  { id:"p20", name:"شوكولاتة لافا", description:"شوكولاتة دافئة • آيس كريم", price:63, image:asset("chocolateCake"), imageKey:"chocolateCake", category:"dessert" },
];

export const offerProducts: Product[] = [
  { ...products[0], oldPrice:150, price:90, badge:"خصم 40%" },
  { ...products[4], oldPrice:120, price:78, badge:"خصم 35%" },
  { ...products[9], oldPrice:180, price:126, badge:"خصم 30%" },
  { ...products[10], oldPrice:100, price:75, badge:"خصم 25%" },
  { ...products[13], oldPrice:70, price:56, badge:"خصم 20%" },
  { ...products[14], oldPrice:80, price:56, badge:"خصم 30%" },
  { ...products[17], oldPrice:40, price:20, badge:"خصم 50%" },
  { ...products[19], oldPrice:90, price:63, badge:"خصم 30%" },
  { ...products[4], oldPrice:170, price:93, badge:"خصم 45%" },
];
