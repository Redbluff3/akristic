import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Scale,
  Shield,
  Users,
  ArrowRight,
  CheckCircle,
  X,
  Menu,
  Briefcase,
  FileText,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  FileCheck,
  Loader2,
  Globe,
  CreditCard,
  Coins,
  Calculator,
  Info,
  MapPin,
  Building,
  Landmark,
  Car,
  ShoppingCart,
  Zap,
  Plane,
  Activity,
  Flag,
  ChevronDown,
  Mail,
  Phone,
  Map,
  Plus,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";

// --- ASSETS & CONFIG ---
const MAP_BG_URL =
  "https://maps.googleapis.com/maps/api/staticmap?center=Belgrade,Serbia&zoom=14&size=1200x600&style=feature:all|element:all|saturation:-100|visibility:simplified&style=feature:landscape.man_made|element:geometry|color:0x000000&style=feature:road.local|element:geometry.fill|color:0x404040&key=YOUR_API_KEY_HERE";

// --- GEMINI API UTILS ---
const callGemini = async (
  prompt: string,
  systemInstruction: string,
  attachment: { data: string; mimeType: string } | null
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

    // Construct parts
    const parts: any[] = [];
    if (attachment) {
      parts.push({
        inlineData: { mimeType: attachment.mimeType, data: attachment.data },
      });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-09-2025",
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    return response.text || "{}";
  } catch (error) {
    console.error("Gemini Error:", error);
    return JSON.stringify({
      plain_english:
        "Service currently unavailable due to connectivity or API limits.",
      risk_level: "Unknown",
      key_risk: "API Connection Error",
      engineer_note: "Please try again later.",
    });
  }
};

// --- DATA TYPES ---
interface FeeStructure {
  podnesak: number;
  rociste: number;
  zalba: number;
}

interface CriminalOption {
  id: string;
  label: string;
  fees: FeeStructure;
}

interface NonAssessableOption {
  id: string;
  label: string;
  base: number;
}

interface ClientData {
  name: string;
  categoryKey: string;
  logo: string;
}

// --- DATA (LOCALIZED) ---
const CRIMINAL_DATA_EN: CriminalOption[] = [
  {
    id: "opt1",
    label: "Fine or imprisonment up to 3 years",
    fees: { podnesak: 30000, rociste: 35000, zalba: 60000 },
  },
  {
    id: "opt2",
    label: "Imprisonment over 3 to 5 years",
    fees: { podnesak: 37500, rociste: 42500, zalba: 75000 },
  },
  {
    id: "opt3",
    label: "Imprisonment over 5 to 10 years",
    fees: { podnesak: 50000, rociste: 55000, zalba: 100000 },
  },
  {
    id: "opt4",
    label: "Imprisonment over 10 to 15 years",
    fees: { podnesak: 75000, rociste: 80000, zalba: 150000 },
  },
  {
    id: "opt5",
    label: "Imprisonment over 15 years",
    fees: { podnesak: 100000, rociste: 105000, zalba: 200000 },
  },
  {
    id: "opt6",
    label: "30-40 years / Life Imprisonment",
    fees: { podnesak: 125000, rociste: 130000, zalba: 250000 },
  },
];

const CRIMINAL_DATA_SR: CriminalOption[] = [
  {
    id: "opt1",
    label: "Novčana kazna ili zatvor do 3 godine",
    fees: { podnesak: 30000, rociste: 35000, zalba: 60000 },
  },
  {
    id: "opt2",
    label: "Zatvor preko 3 do 5 godina",
    fees: { podnesak: 37500, rociste: 42500, zalba: 75000 },
  },
  {
    id: "opt3",
    label: "Zatvor preko 5 do 10 godina",
    fees: { podnesak: 50000, rociste: 55000, zalba: 100000 },
  },
  {
    id: "opt4",
    label: "Zatvor preko 10 do 15 godina",
    fees: { podnesak: 75000, rociste: 80000, zalba: 150000 },
  },
  {
    id: "opt5",
    label: "Zatvor preko 15 godina",
    fees: { podnesak: 100000, rociste: 105000, zalba: 200000 },
  },
  {
    id: "opt6",
    label: "30-40 godina / Doživotni zatvor",
    fees: { podnesak: 125000, rociste: 130000, zalba: 250000 },
  },
];

const NON_ASSESSABLE_DATA_EN: NonAssessableOption[] = [
  {
    id: "vanparnicni_licna",
    label: "Non-contentious - Personal Status",
    base: 27500,
  },
  {
    id: "vanparnicni_porodicni",
    label: "Non-contentious - Family Relations",
    base: 27500,
  },
  {
    id: "vanparnicni_imovinski",
    label: "Non-contentious - Property Relations",
    base: 50000,
  },
  { id: "katastar", label: "Real Estate Cadastre Registration", base: 27500 },
  { id: "stecaj", label: "Bankruptcy and Liquidation", base: 42500 },
  {
    id: "upravni_poreski",
    label: "Administrative - Tax, Customs, Interior",
    base: 50000,
  },
];

const NON_ASSESSABLE_DATA_SR: NonAssessableOption[] = [
  { id: "vanparnicni_licna", label: "Vanparnični - Lična stanja", base: 27500 },
  {
    id: "vanparnicni_porodicni",
    label: "Vanparnični - Porodični odnosi",
    base: 27500,
  },
  {
    id: "vanparnicni_imovinski",
    label: "Vanparnični - Imovinski odnosi",
    base: 50000,
  },
  { id: "katastar", label: "Upis u Katastar nepokretnosti", base: 27500 },
  { id: "stecaj", label: "Stečajni i likvidacioni postupak", base: 42500 },
  {
    id: "upravni_poreski",
    label: "Upravni - Poreski, Carinski, MUP",
    base: 50000,
  },
];

const CLIENTS_LIST: ClientData[] = [
  { name: "Porsche SCG", categoryKey: "automotive", logo: "Porsche.png" },
  { name: "IKEA", categoryKey: "retail", logo: "Ikea.png" },
  {
    name: "Ministarstvo Finansija",
    categoryKey: "government",
    logo: "Ministarstvo_Finansija.jpg",
  },
  {
    name: "Skijališta Srbije",
    categoryKey: "publicEnt",
    logo: "Skijalista_Srbije.jpg",
  },
  {
    name: "Komercijalna Banka",
    categoryKey: "banking",
    logo: "Komercijalna_Banka.png",
  },
  {
    name: "Teniski Savez Srbije",
    categoryKey: "sports",
    logo: "Teniski_Savez_Srbije.jpg",
  },
  { name: "Whirlpool", categoryKey: "manufacturing", logo: "Whirlpool.png" },
  {
    name: "Hypo Alpe Adria",
    categoryKey: "banking",
    logo: "Hypo_Alpe_Adria_Bank.png",
  },
  {
    name: "Air Serbia / Aerokarte",
    categoryKey: "transport",
    logo: "Air_Serbia.png",
  },
  {
    name: "Elektromreže Srbije",
    categoryKey: "energy",
    logo: "Elektro_Mreze_Srbije.png",
  },
  {
    name: "Olimpijski Komitet",
    categoryKey: "arbitration",
    logo: "Olimpijski_Komitet_Srbije.jpg",
  },
  {
    name: "Agencija za Privatizaciju",
    categoryKey: "government",
    logo: "Agencija_Za_Privatizaciju.jpg",
  },
];

const FULL_CLIENTS_LIST = [
  "Ministarstvo finansija i privrede",
  "Ministarstvo ekonomije i regionalnog razvoja",
  "Ministarstvo životne sredine, rudarstva i prostornog planiranja",
  "Ministarstvo zdravlja",
  "Ministarstvo omladine i sporta RS",
  "Republički Fond za penzijsko i invalidsko osiguranje RS",
  "Javno preduzeće Skijališta Srbije",
  "Javno preduzeće Stara Planina",
  "Javno preduzeće Elektromreže Srbije",
  "Republički zavod za sport",
  "Turistička organizacija Srbije",
  "Agencija za privatizaciju RS",
  "Imeprial osiguranje a.d. u stečaju",
  "Evropa osiguranje a.d. u likvidaciji",
  "Merkur osiguranje",
  "Astra banka a.d. u likvidaciji",
  "Hypo Alpe Adria Banka ad",
  "Prva preduzetnička banka ad",
  "Komercijalna banka ad",
  "Expres Interfracht - Austrija",
  "Trans Cargo Logistic, Wien – Austrija",
  "Iller Textil Gmbh – Nemačka",
  "SM Druckhaus gmbh, Nemačka",
  "CFE - Belgija",
  "CFE - Mađarska",
  "Profipartner Gmbh – Nemačka",
  "X- Fitness d.o.o. – Beograd",
  "EWE comp d.o.o. – Beograd",
  "Kontiki travel – Beograd",
  "Knjaz Miloš a.d. - Aranđelovac",
  "Dimon International AG – Švajcarska",
  "Life system d.o.o. – Beograd",
  "NT company d.o.o. – Beograd",
  "Alfa d.o.o. – Beograd",
  "Agencija za razvoj malih i srednjih preduzeća – Beograd",
  "Agencija za strana ulaganja – Beograd",
  "Eschbach Gmbh – Nemačka",
  "Beoicla d.o.o. – Beograd",
  "Inter Gecom d.o.o. – Beograd",
  "Tenfore d.o.o. – Beograd",
  "IKEA - Češka",
  "Carbo concept d.o.o. – Pančevo",
  "Belit d.o.o. – Beograd",
  "Whirlpool d.o.o. Beograd",
  "Termag d.o.o. Rogatica",
  "Trans Cargo Logistic d.o.o. Beograd",
  "Radna žena ad Beograd",
  "Eki investment d.o.o. Beograd",
  "BS Gradnja d.o.o. Beograd",
  "Mr Građevinar d.o.o. Beograd",
  "Daniel Sat TV d.o.o. Beograd",
  "Jugoexport “Avala” international a.d. Beograd",
  "Viva Agency d.o.o. Beograd",
  "Viva Travel d.o.o. Beograd",
  "TT Cargo, Beograd",
  "Sportska knjiga a.d. Beograd",
  "Vitavet export-import d.o.o. Beograd",
  "Dataexport d.o.o. Beograd",
  "Allure d.o.o. Beograd",
  "Encode d.o.o. Beograd",
  "Zorka Opeka d.o.o. Novi Sad",
  "Fabrika elektroda PIVA, Plužine, CG",
  "MSC Medical doo, Beograd",
  "BIGZ Beograd",
  "Centar S – Toyota, Beograd",
  "Dexin film doo, Beograd",
  "International construction doo, Beograd",
  "European real estate doo, Beograd",
  "Belking doo, Beograd",
  "Klariden doo, Beograd",
  "Monterosa doo, Beograd",
  "Global park doo, Beograd",
  "Teniski savez Srbije",
  "Savez za skokove u vodu Srbije",
  "Skijaški savez Srbije",
  "Tržište novca ad, Beograd",
  "Kompanija Novi Dom, Beograd",
  "Rudnap doo, Beograd",
  "City media doo, Beograd",
  "Atlas ambasador doo, Beograd",
  "DUP Bor, Bor",
  "Bibis doo, Beograd",
  "Penns doo, Beograd",
  "Tami trade doo, Niš",
  "Inter casa ambient doo, Niš",
  "Aerokarte doo, Niš",
  "PET Reciklaža doo, Niš",
  "Nelo energy doo, Beograd",
  "ZA media doo, Zaječar",
  "MD solution doo, Beograd",
  "Engeneers doo Beograd",
  "PORSCHE SCG doo Beograd",
  "PORSCHE INTER AUTO S doo Beograd",
  "Bureau veritas doo Beograd",
  "JP Vodovod Zaječar",
  "ENEL PS doo",
  "JUBMES BANKA ad",
  "Ivatex d.o.o. – Garinello",
  "Grad Zaječar",
  "Grad Bor",
  "Opština Knjaževac",
];

// --- TRANSLATIONS ---
const translations = {
  en: {
    nav: {
      about: "About Us",
      legalAid: "Schedule Consultation",
      clients: "Our Clients",
      calculator: "Tariff Calculator",
      analyst: "AI Legal Analyst",
      contact: "Contact",
    },
    hero: {
      badge: "Ristic Law Office 2.0 • Expertise in Complex Litigation",
      titleLine1: "We create victories",
      titleLine2: "for our clients.",
      desc: "We provide comprehensive legal protection and strategic counseling. Our approach combines deep legislative knowledge with proactive legal problem solving.",
      button: "Schedule Consultation",
    },
    about: {
      title: "About Us",
      subtitle: "Tradition and Expertise since 1992.",
      p1: "Law Office 'RISTIĆ' has been providing services domestically and internationally since its establishment in 1992, predominantly in corporate and commercial law.",
      p2: "Our expert team consists of lawyers, trainees, and a network of external associates – fellow lawyers and former judges of proven professional quality.",
      p3: "We possess significant experience representing clients in international arbitration proceedings (ICC Paris) as well as before the Permanent Sports Arbitration at the Olympic Committee of Serbia.",
      keyFacts: {
        title: "Key Facts",
        f1: "Established in 1992",
        f2: "Expertise in international arbitration (ICC Paris)",
        f3: "Representation of state institutions and public enterprises",
      },
    },
    services: {
      tag: "// LEGAL AREAS",
      title: "Dedication to legal excellence.",
      desc: "We represent individuals and legal entities with a focus on efficiency, discretion, and achieving the best possible outcome in every proceeding.",
      cards: [
        {
          title: "Corporate Law",
          desc: "Company formation, status changes, commercial contracts, and business compliance with regulations.",
        },
        {
          title: "Legal Consulting",
          desc: "Strategic management consulting, legal risk analysis, and support in key business decision-making.",
        },
        {
          title: "Dispute Resolution",
          desc: "Representation in litigation, non-contentious, and enforcement proceedings before all courts of general and special jurisdiction in Serbia.",
        },
      ],
    },
    fee: {
      tag: "// TARIFF & FEES",
      title: "Fee Transparency",
      consultations: {
        title: "Legal Consultations",
        price: "€100",
        unit: "/ hour",
        desc: "If you engage us for further representation regarding the consultation topic, the consultation fee is deducted from the final attorney award.",
        creditTitle: "Fee Crediting",
        creditDesc:
          "100% of consultation fee is credited towards future services.",
      },
      calculator: {
        title: "Official Tariff Calculator",
        selectType: "Select Procedure Type",
        criminal: "Criminal Proceedings (By Penalty)",
        assessable: "Assessable Disputes",
        nonAssessable: "Non-Assessable / Other",
        details: "Details / Threatened Penalty",
        valueLabel: "Value of Dispute",
        placeholder: "-- Select Procedure Type --",
        results: {
          podnesak: "Submission",
          rociste: "Hearing",
          zalba: "Appeal",
        },
        disclaimer:
          "Shown fee for submissions in assessable disputes refers to reasoned submissions (lawsuit, response, appeal). For other submissions, the fee is 50%.\n\nFor non-assessable cases, the hearing fee is increased by a lump sum (usually 4,500 RSD), while the fee for legal remedies (appeals) is increased by 100%.\n\nThe award amount may vary depending on the number of represented parties, number of actions, and case complexity.\n\nThe party that fully loses the dispute is obliged to reimburse procedural costs to the opposing party according to the Tariff.\n\nThis calculator serves solely for informational estimation. For a precise cost calculation, it is necessary to consult an attorney.\n\n* Calculation is based on the valid Attorney Tariff (Official Gazette of RS). VAT is not included in the shown amounts.",
      },
    },
    ai: {
      tag: "POWERED BY GEMINI AI",
      title: "AI Legal Act Analysis",
      subtitle:
        "Enter contract text or legal clauses for instant analysis and clarification of legal terms.",
      placeholder: "Ask Ristic Law AI a question or paste legal text here...",
      button: "Analyze",
      analyzing: "Thinking...",
      awaiting: "Awaiting text input",
      results: {
        explanation: "Simplified Explanation",
        risk: "Risk Level",
        keyConcern: "Key Concern",
        note: "Engineer Note",
      },
    },
    categories: {
      automotive: "AUTO INDUSTRIJA",
      retail: "MALOPRODAJA",
      government: "DRŽAVNE INSTITUCIJE",
      publicEnt: "JAVNA PREDUZEĆA",
      banking: "BANKARSTVO",
      sports: "SPORT",
      manufacturing: "PROIZVODNJA",
      transport: "TRANSPORT",
      energy: "ENERGETIKA",
      arbitration: "SPORTSKA ARBITRAŽA",
    },
    clients: {
      title: "Naši Klijenti",
      subtitle:
        "Poverenje nam poklanjaju vodeće kompanije, državne institucije i međunarodne organizacije.",
      buttonLabel: "Reference",
    },
    contact: {
      title: "Zakažite Konsultacije",
      subtitle:
        "Kontaktirajte nas telefonom, e-mailom ili putem forme ispod. Garantujemo potpunu diskreciju.",
      form: {
        name: "IME I PREZIME",
        phone: "BROJ TELEFONA",
        email: "E-MAIL ADRESA",
        address: "ADRESA (OPCIONO)",
        summary: "OPIS PREDMETA",
        button: "Pošaljite Upit",
      },
      footer: {
        services: "Usluge",
        office: "Kancelarija",
        contact: "Kontakt",
      },
    },
    contactModal: {
      title: "Kontakt Informacije",
      address: "Adresa",
      phone: "Telefon",
      mobile: "Mobilni",
      email: "Email",
    },
  },
  sr: {
    nav: {
      about: "O nama",
      legalAid: "Zakažite Konsultacije",
      clients: "Naši Klijenti",
      calculator: "Kalkulator Advokatske Tarife",
      analyst: "AI Analitičar",
      contact: "Kontakt",
    },
    hero: {
      badge:
        "Ristić Advokatska Kancelarija 2.0 • Ekspertiza u složenim sporovima",
      titleLine1: "Mi stvaramo pobede",
      titleLine2: "za naše klijente.",
      desc: "Pružamo sveobuhvatnu pravnu zaštitu i strateško savetovanje. Naš pristup kombinuje duboko poznavanje zakonodavstva sa proaktivnim rešavanjem pravnih izazova.",
      button: "Zakažite Konsultacije",
    },
    about: {
      title: "O Nama",
      subtitle: "Tradicija i Ekspertiza od 1992.",
      p1: "Advokatska kancelarija “RISTIĆ” od svog osnivanja 1992. godine do danas pruža usluge na domaćem i međunarodnom prostoru, pretežno u oblasti korporativnog i privrednog prava.",
      p2: "Naš stručni tim čine advokati, pripravnici i mreža spoljnih saradnika – kolega advokata i bivših sudija dokazanih profesionalnih kvaliteta.",
      p3: "Posedujemo značajno iskustvo u zastupanju klijenata u međunarodnim arbitražnim postupcima (ICC Pariz) kao i pred Stalnom sportskom arbitražom pri Olimpijskom komitetu Srbije.",
      keyFacts: {
        title: "Ključne Činjenice",
        f1: "Osnovana 1992. godine",
        f2: "Ekspertiza u međunarodnoj arbitraži (ICC Pariz)",
        f3: "Zastupanje državnih institucija i javnih preduzeća",
      },
    },
    services: {
      tag: "// PRAVNE OBLASTI",
      title: "Posvećenost pravnoj izvrsnosti.",
      desc: "Zastupamo fizička i pravna lica sa fokusom na efikasnost, diskreciju i postizanje najboljeg mogućeg ishoda u svakom postupku.",
      cards: [
        {
          title: "Korporativno Pravo",
          desc: "Osnivanje privrednih društava, statusne promene, ugovori u privredi i usklađivanje poslovanja sa zakonskom regulativom.",
        },
        {
          title: "Pravni Konsalting",
          desc: "Strateško savetovanje menadžmenta, pravna analiza rizika i podrška u donošenju ključnih poslovnih odluka.",
        },
        {
          title: "Rešavanje Sporova",
          desc: "Zastupanje u parničnim, vanparničnim i izvršnim postupcima pred svim sudovima opšte i posebne nadležnosti u Srbiji.",
        },
      ],
    },
    fee: {
      tag: "// TARIFNIK I NAKNADE",
      title: "Transparentnost Troškova",
      consultations: {
        title: "Pravne Konsultacije",
        price: "€100",
        unit: "/ sat",
        desc: "Ukoliko nas angažujete za dalje zastupanje u predmetu povodom kojeg je obavljena konsultacija, iznos konsultacije se odbija od konačne advokatske nagrade.",
        creditTitle: "Uračunavanje Naknade",
        creditDesc: "100% iznosa konsultacija se računa u buduće usluge.",
      },
      calculator: {
        title: "Zvanični Kalkulator Tarife",
        selectType: "Izaberite Vrstu Postupka",
        criminal: "Krivični Postupak (Po Kazni)",
        assessable: "Imovinski Sporovi",
        nonAssessable: "Ostali Postupci",
        details: "Detalji / Zaprećena Kazna",
        valueLabel: "Vrednost Spora (RSD)",
        placeholder: "-- Izaberite Vrstu --",
        results: { podnesak: "Podnesak", rociste: "Ročište", zalba: "Žalba" },
        disclaimer:
          "Prikazana naknada za podneske u procenjivim sporovima odnosi se na obrazložene podneske (tužba, odgovor na tužbu, žalba). Za ostale podneske naknada iznosi 50%.\n\nKod neprocenjivih predmeta, naknada za ročište se uvećava za paušal (obično 4.500 RSD), dok se naknada za pravne lekove (žalbe) uvećava za 100%.\n\nIznos nagrade može varirati u zavisnosti od broja zastupanih lica, broja radnji i složenosti predmeta.\n\nStranka koja u potpunosti izgubi spor dužna je da protivnoj strani naknadi troškove postupka prema Tarifi.\n\nOvaj kalkulator služi isključivo za informativnu procenu. Za precizan obračun troškova neophodno je konsultovati advokata.\n\n* Obračun je zasnovan na važećoj Advokatskoj tarifi (Sl. glasnik RS). PDV nije uračunat u prikazane iznose.",
      },
    },
    ai: {
      tag: "POKREĆE GEMINI AI",
      title: "AI Analiza Pravnih Akata",
      subtitle:
        "Unesite tekst ugovora ili pravne klauzule za instant analizu i pojašnjenje pravnih termina.",
      placeholder: "Pitaj Ristic Law AI ili unesi tekst ovde...",
      button: "Analiziraj",
      analyzing: "Razmišljam...",
      awaiting: "Čekam unos teksta",
      results: {
        explanation: "Pojednostavljeno Objašnjenje",
        risk: "Nivo Rizika",
        keyConcern: "Ključna Zabrinutost",
        note: "Napomena Inženjera",
      },
    },
    categories: {
      automotive: "AUTO INDUSTRIJA",
      retail: "MALOPRODAJA",
      government: "DRŽAVNE INSTITUCIJE",
      publicEnt: "JAVNA PREDUZEĆA",
      banking: "BANKARSTVO",
      sports: "SPORT",
      manufacturing: "PROIZVODNJA",
      transport: "TRANSPORT",
      energy: "ENERGETIKA",
      arbitration: "SPORTSKA ARBITRAŽA",
    },
    clients: {
      title: "Naši Klijenti",
      subtitle:
        "Poverenje nam poklanjaju vodeće kompanije, državne institucije i međunarodne organizacije.",
      buttonLabel: "Reference",
    },
    contact: {
      title: "Zakažite Konsultacije",
      subtitle:
        "Kontaktirajte nas telefonom, e-mailom ili putem forme ispod. Garantujemo potpunu diskreciju.",
      form: {
        name: "IME I PREZIME",
        phone: "BROJ TELEFONA",
        email: "E-MAIL ADRESA",
        address: "ADRESA (OPCIONO)",
        summary: "OPIS PREDMETA",
        button: "Pošaljite Upit",
      },
      footer: {
        services: "Usluge",
        office: "Kancelarija",
        contact: "Kontakt",
      },
    },
    contactModal: {
      title: "Kontakt Informacije",
      address: "Adresa",
      phone: "Telefon",
      mobile: "Mobilni",
      email: "Email",
    },
  },
};

// --- LOGIC ---
const calculateAssessable = (value: number): FeeStructure => {
  let podnesak = 0;
  if (value <= 0) podnesak = 0;
  else if (value <= 25000) podnesak = 9000;
  else if (value <= 50000) podnesak = 13500;
  else if (value <= 100000) podnesak = 22500;
  else if (value <= 200000) podnesak = 30000;
  else if (value <= 500000) podnesak = 45000;
  else if (value <= 1000000) podnesak = 60000;
  else podnesak = 60000 + Math.ceil((value - 1000000) / 500000) * 3000;
  return { podnesak, rociste: podnesak + 7500, zalba: podnesak * 2 };
};

// Reusable Glow Card Component
const GlowCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={`relative bg-[#0f1522] border border-white/5 rounded-xl overflow-hidden group hover:bg-[#131b2c] transition-all duration-300 flex flex-col ${className}`}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`,
        }}
      />
      <div className="relative z-10 flex flex-col h-full">{children}</div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<"en" | "sr">("en");
  // Fallback to 'en' if the selected language is unavailable to prevent crashes
  const t = translations[lang] || translations.en;

  useEffect(() => {
    if (lang === "sr") {
      document.title =
        "Advokatska Kancelarija Ristić | Privredno Pravo i Rešavanje Sporova";
      document.documentElement.lang = "sr";
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute(
          "content",
          "Vrhunske pravne usluge u Beogradu od 1992. Specijalizovani za privredno pravo, međunarodnu arbitražu i složene sudske sporove."
        );
      document
        .querySelector('meta[property="og:title"]')
        ?.setAttribute(
          "content",
          "Advokatska Kancelarija Ristić | Privredno Pravo i Rešavanje Sporova"
        );
      document
        .querySelector('meta[property="og:description"]')
        ?.setAttribute(
          "content",
          "Vrhunske pravne usluge u Beogradu od 1992. Specijalizovani za privredno pravo, međunarodnu arbitražu i složene sudske sporove."
        );
    } else {
      document.title = "Ristic Law Office | Corporate Law & Dispute Resolution";
      document.documentElement.lang = "en";
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute(
          "content",
          "Premium legal services in Belgrade, Serbia since 1992. Specializing in corporate law, international arbitration, and complex litigation."
        );
      document
        .querySelector('meta[property="og:title"]')
        ?.setAttribute(
          "content",
          "Ristic Law Office | Corporate Law & Dispute Resolution"
        );
      document
        .querySelector('meta[property="og:description"]')
        ?.setAttribute(
          "content",
          "Premium legal services in Belgrade, Serbia since 1992. Specializing in corporate law, international arbitration, and complex litigation."
        );
    }
  }, [lang]);

  const [activeTab, setActiveTab] = useState<
    "criminal" | "assessable" | "nonAssessable"
  >("criminal");
  const [showAllClients, setShowAllClients] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    summary: "",
  });

  // Data selection based on language
  const criminalData = lang === "en" ? CRIMINAL_DATA_EN : CRIMINAL_DATA_SR;
  const nonAssessableData =
    lang === "en" ? NON_ASSESSABLE_DATA_EN : NON_ASSESSABLE_DATA_SR;

  // Calculator State
  const [assessableValue, setAssessableValue] = useState<number>(0);
  const [selectedCriminal, setSelectedCriminal] = useState<string>("");
  const [selectedNonAssessable, setSelectedNonAssessable] =
    useState<string>("");
  const [calcResult, setCalcResult] = useState<FeeStructure | null>(null);

  // Decoder State
  const [decoderInput, setDecoderInput] = useState("");
  const [decoderResult, setDecoderResult] = useState<any>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [attachment, setAttachment] = useState<{
    name: string;
    data: string;
    mimeType: string;
  } | null>(null);

  // References for inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Scroll State
  const { scrollY } = useScroll();
  const navBackground = useTransform(
    scrollY,
    [0, 50],
    ["rgba(11, 17, 32, 0)", "rgba(11, 17, 32, 0.8)"]
  );
  const navBackdrop = useTransform(
    scrollY,
    [0, 50],
    ["blur(0px)", "blur(12px)"]
  );

  const handleCalculate = () => {
    let result: FeeStructure = { podnesak: 0, rociste: 0, zalba: 0 };
    if (activeTab === "criminal") {
      const opt = criminalData.find((o) => o.id === selectedCriminal);
      if (opt) result = opt.fees;
    } else if (activeTab === "nonAssessable") {
      const opt = nonAssessableData.find((o) => o.id === selectedNonAssessable);
      if (opt)
        result = {
          podnesak: opt.base,
          rociste: opt.base + 4500,
          zalba: opt.base * 2,
        };
    } else {
      result = calculateAssessable(assessableValue);
    }
    setCalcResult(result);
  };

  useEffect(() => {
    handleCalculate();
  }, [
    activeTab,
    selectedCriminal,
    selectedNonAssessable,
    assessableValue,
    lang,
  ]);

  // --- FILE HANDLING ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Data = (event.target.result as string).split(",")[1];
          setAttachment({
            name: file.name,
            mimeType: file.type,
            data: base64Data,
          });
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input value so same file can be selected again
    e.target.value = "";
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const getRiskLabel = (risk: string) => {
    if (lang === "en") return risk;
    if (risk === "High") return "Visok";
    if (risk === "Medium") return "Srednji";
    if (risk === "Low") return "Nizak";
    return risk;
  };

  const handleDecode = async () => {
    if (!decoderInput.trim() && !attachment) return;
    setIsDecoding(true);
    setDecoderResult(null);

    let instruction = "";
    if (lang === "en") {
      instruction =
        "You are an experienced attorney. Analyze the provided text or document. Your task is to provide a clear explanation in English.\nThe response must be in JSON format with the following keys:\n- plain_english: A detailed but simple explanation in English.\n- risk_level: Strictly one of the following values: 'High', 'Medium', 'Low'.\n- key_risk: A short description of the main legal risk in English.\n- engineer_note: A brief additional note in English.";
    } else {
      instruction =
        "Ti si iskusni advokat. Analiziraj priloženi tekst ili dokument. Tvoj zadatak je da pružiš jasno objašnjenje na srpskom jeziku.\nOdgovor mora biti u JSON formatu sa sledećim ključevima:\n- plain_english: Detaljno ali jednostavno objašnjenje na srpskom jeziku.\n- risk_level: Isključivo jedna od sledećih vrednosti: 'High', 'Medium', 'Low' (zadrži ove engleske termine).\n- key_risk: Kratak opis glavnog pravnog rizika na srpskom jeziku.\n- engineer_note: Kratka dodatna napomena na srpskom jeziku.";
    }

    const resultStr = await callGemini(decoderInput, instruction, attachment);
    try {
      const jsonStr = resultStr
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      setDecoderResult(JSON.parse(jsonStr));
    } catch (e) {
      setDecoderResult({
        plain_english: resultStr,
        risk_level: "Info",
        key_risk: "Analysis",
        engineer_note: "Raw output.",
      });
    }
    setIsDecoding(false);
  };

  const handleContactChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      `Novi Upit sa Sajta: ${contactForm.name}`
    );
    const body = encodeURIComponent(
      `Ime i Prezime: ${contactForm.name}\n` +
        `Telefon: ${contactForm.phone}\n` +
        `Email: ${contactForm.email}\n` +
        `Adresa: ${contactForm.address}\n\n` +
        `Opis Predmeta:\n${contactForm.summary}`
    );
    window.location.href = `mailto:office@akristic.rs?subject=${subject}&body=${body}`;
  };

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    id: string,
    block: "start" | "center" | "end" | "nearest" = "start"
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block });
    }
    setIsMenuOpen(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const contactDetails = [
    {
      id: "addr",
      label: t.contactModal.address,
      value:
        lang === "en"
          ? "Desanke Maksimović 17, Belgrade"
          : "Desanke Maksimović 17, Beograd",
      icon: MapPin,
    },
    {
      id: "phone",
      label: t.contactModal.phone,
      value: "011/3239-088",
      icon: Phone,
    },
    {
      id: "mob",
      label: t.contactModal.mobile,
      value: "060/605-8144",
      icon: Phone,
    },
    {
      id: "mail",
      label: t.contactModal.email,
      value: "office@akristic.rs",
      icon: Mail,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Navbar */}
      <motion.nav
        style={{ backgroundColor: navBackground, backdropFilter: navBackdrop }}
        className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg flex items-center justify-center">
              <img
                src="Ristic_Grb.png"
                alt="Ristic Law Office"
                className="h-8 w-auto object-contain"
              />
            </div>
            {/* Text is usually part of the logo image provided, but we can keep brand name if preferred or hide it. 
                 Given the vertical logo provided, keeping text next to it might look better if the logo is just the icon. 
                 However, the prompt image has text. I will assume the image contains text and use it, 
                 but for navbar a horizontal layout is better. I'll use the image as icon and keep text for now unless it looks bad.
                 The user asked to replace the stock one. The stock one was Icon + Text. 
                 I'll replace the Icon with the Logo Image and keep the text for clarity unless the logo has it big enough. 
                 The provided logo is vertical, so text in it will be small in navbar. I'll keep the text "Ristic Law". */}
            <span className="font-bold text-lg tracking-tight text-white">
              Ristic Law
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a
              href="#about"
              onClick={(e) => scrollToSection(e, "about")}
              className="hover:text-white transition-colors"
            >
              {t.nav.about}
            </a>
            <a
              href="#contact"
              onClick={(e) => scrollToSection(e, "contact")}
              className="hover:text-white transition-colors"
            >
              {t.nav.legalAid}
            </a>
            <a
              href="#clients"
              onClick={(e) => scrollToSection(e, "clients")}
              className="hover:text-white transition-colors"
            >
              {t.nav.clients}
            </a>
            <a
              href="#calculator"
              onClick={(e) => scrollToSection(e, "calculator", "center")}
              className="hover:text-white transition-colors"
            >
              {t.nav.calculator}
            </a>
            <a
              href="#ai"
              onClick={(e) => scrollToSection(e, "ai")}
              className="hover:text-white transition-colors"
            >
              {t.nav.analyst}
            </a>
          </div>

          <div className="flex items-center gap-4 relative z-[60]">
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="hidden md:block hover:text-white text-sm font-medium text-slate-400 transition-colors"
            >
              {t.nav.contact}
            </button>
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "sr" : "en")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
            >
              <Globe className="w-3 h-3" />
              <span>{lang === "en" ? "EN" : "SR"}</span>
            </button>
            <button
              className="md:hidden text-slate-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-20 left-0 right-0 z-40 bg-[#0B1120] border-b border-white/10 overflow-hidden"
          >
            <div className="flex flex-col p-6 space-y-4">
              <a
                href="#about"
                onClick={(e) => scrollToSection(e, "about")}
                className="text-slate-300 hover:text-white py-2"
              >
                {t.nav.about}
              </a>
              <a
                href="#contact"
                onClick={(e) => scrollToSection(e, "contact")}
                className="text-slate-300 hover:text-white py-2"
              >
                {t.nav.legalAid}
              </a>
              <a
                href="#clients"
                onClick={(e) => scrollToSection(e, "clients")}
                className="text-slate-300 hover:text-white py-2"
              >
                {t.nav.clients}
              </a>
              <a
                href="#calculator"
                onClick={(e) => scrollToSection(e, "calculator")}
                className="text-slate-300 hover:text-white py-2"
              >
                {t.nav.calculator}
              </a>
              <a
                href="#ai"
                onClick={(e) => scrollToSection(e, "ai")}
                className="text-slate-300 hover:text-white py-2"
              >
                {t.nav.analyst}
              </a>
              <button
                onClick={() => {
                  setIsContactModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="text-left text-slate-300 hover:text-white py-2"
              >
                {t.nav.contact}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl md:text-9xl font-bold text-white tracking-tighter leading-[0.9] mb-8"
          >
            {t.hero.titleLine1} <br />
            <span className="text-blue-500/50">{t.hero.titleLine2}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-xl md:text-2xl text-slate-400 max-w-2xl font-light leading-relaxed mb-10"
          >
            {t.hero.desc}
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            onClick={(e) => scrollToSection(e, "contact")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-slate-200 transition-colors"
          >
            {t.hero.button}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      </section>

      {/* About Us */}
      <section id="about" className="py-24 px-6 bg-[#0B1120] scroll-mt-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.about.title}
            </h2>
            <p className="text-blue-500 font-medium text-lg mb-8">
              {t.about.subtitle}
            </p>
            <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
              <p>{t.about.p1}</p>
              <p>{t.about.p2}</p>
              <p>{t.about.p3}</p>
            </div>
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-2xl p-8 relative overflow-hidden group hover:border-blue-500/20 transition-colors duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] group-hover:bg-blue-500/10 transition-colors" />
            <h3 className="text-white font-bold text-xl mb-8 relative z-10">
              {t.about.keyFacts.title}
            </h3>
            <div className="space-y-6 relative z-10">
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <span className="text-slate-300">{t.about.keyFacts.f1}</span>
              </div>
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <span className="text-slate-300">{t.about.keyFacts.f2}</span>
              </div>
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <span className="text-slate-300">{t.about.keyFacts.f3}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-6 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-blue-500 font-mono text-xs uppercase tracking-wider">
              {t.services.tag}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
              {t.services.title}
            </h2>
            <p className="text-slate-400 max-w-2xl text-lg">
              {t.services.desc}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {t.services.cards.map((card, i) => (
              <GlowCard key={i} className="p-8">
                <div className="w-12 h-12 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-300 mb-8 group-hover:scale-105 transition-transform">
                  {i === 0 ? (
                    <Shield className="w-6 h-6" />
                  ) : i === 1 ? (
                    <Briefcase className="w-6 h-6" />
                  ) : (
                    <Scale className="w-6 h-6" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {card.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {card.desc}
                </p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* Fee Transparency */}
      <section id="fee" className="py-24 px-6 bg-[#0B1120] scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="text-blue-500 font-mono text-xs uppercase tracking-wider">
              {t.fee.tag}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4">
              {t.fee.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Consultation Card */}
            <div className="lg:col-span-1 bg-[#111827] border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/20 transition-colors duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] group-hover:bg-blue-500/10 transition-colors" />
              <div className="relative z-10">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-6">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t.fee.consultations.title}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">
                    {t.fee.consultations.price}
                  </span>
                  <span className="text-slate-500">
                    {t.fee.consultations.unit}
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed mb-6 text-sm">
                  {t.fee.consultations.desc}
                </p>
              </div>
              <div className="bg-[#1a2236] border border-blue-500/10 rounded-xl p-4 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-white font-medium text-sm">
                    {t.fee.consultations.creditTitle}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">
                  {t.fee.consultations.creditDesc}
                </p>
              </div>
            </div>

            {/* Calculator Card */}
            <div
              id="calculator"
              className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-2xl p-8 scroll-mt-32"
            >
              <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-wide mb-8">
                <Calculator className="w-4 h-4" />
                {t.fee.calculator.title}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                    {t.fee.calculator.selectType}
                  </label>
                  <div className="relative">
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value as any)}
                      className="w-full bg-[#0B1120] border border-white/10 rounded-lg py-3 px-4 text-white appearance-none focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                    >
                      <option value="criminal">
                        {t.fee.calculator.criminal}
                      </option>
                      <option value="assessable">
                        {t.fee.calculator.assessable}
                      </option>
                      <option value="nonAssessable">
                        {t.fee.calculator.nonAssessable}
                      </option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                    {activeTab === "assessable"
                      ? t.fee.calculator.valueLabel
                      : t.fee.calculator.details}
                  </label>
                  <div className="relative">
                    {activeTab === "criminal" ? (
                      <select
                        value={selectedCriminal}
                        onChange={(e) => setSelectedCriminal(e.target.value)}
                        className="w-full bg-[#0B1120] border border-white/10 rounded-lg py-3 px-4 text-white appearance-none focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                      >
                        <option value="" disabled>
                          {t.fee.calculator.placeholder}
                        </option>
                        {criminalData.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : activeTab === "nonAssessable" ? (
                      <select
                        value={selectedNonAssessable}
                        onChange={(e) =>
                          setSelectedNonAssessable(e.target.value)
                        }
                        className="w-full bg-[#0B1120] border border-white/10 rounded-lg py-3 px-4 text-white appearance-none focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                      >
                        <option value="" disabled>
                          {t.fee.calculator.placeholder}
                        </option>
                        {nonAssessableData.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type="number"
                          value={assessableValue}
                          onChange={(e) =>
                            setAssessableValue(Number(e.target.value))
                          }
                          placeholder="0"
                          className="w-full bg-[#0B1120] border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                          RSD
                        </span>
                      </div>
                    )}
                    {activeTab !== "assessable" && (
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-white text-slate-900 rounded-lg p-6">
                {calcResult ? (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        {t.fee.calculator.results.podnesak}
                      </div>
                      <div className="font-mono font-bold text-lg">
                        {calcResult.podnesak.toLocaleString()}
                      </div>
                    </div>
                    <div className="border-l border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        {t.fee.calculator.results.rociste}
                      </div>
                      <div className="font-mono font-bold text-lg">
                        {calcResult.rociste.toLocaleString()}
                      </div>
                    </div>
                    <div className="border-l border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        {t.fee.calculator.results.zalba}
                      </div>
                      <div className="font-mono font-bold text-lg">
                        {calcResult.zalba.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-slate-400 text-sm flex items-center justify-center gap-2">
                    <Calculator className="w-4 h-4" />
                    {t.fee.calculator.placeholder}
                  </div>
                )}
              </div>

              <p className="mt-6 text-[10px] text-slate-600 leading-relaxed whitespace-pre-line">
                {t.fee.calculator.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Analysis (Gemini Style) */}
      <section id="ai" className="py-32 px-6 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles className="w-4 h-4" />
              {t.ai.tag}
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">{t.ai.title}</h2>
            <p className="text-slate-400 text-lg">{t.ai.subtitle}</p>
          </div>

          {/* Main Input Container (Gemini Style) */}
          <div className="bg-[#1e1f20] rounded-[32px] p-4 flex flex-col gap-2 relative group focus-within:bg-[#28292a] transition-colors shadow-2xl">
            {/* Attachment Preview */}
            {attachment && (
              <div className="mx-2 mt-2 inline-flex items-center gap-3 bg-[#3c4043] rounded-xl px-4 py-2 self-start animate-in fade-in zoom-in duration-200">
                <div className="bg-red-500/20 p-2 rounded-lg">
                  {attachment.mimeType.startsWith("image/") ? (
                    <ImageIcon className="w-4 h-4 text-red-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white max-w-[200px] truncate">
                    {attachment.name}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase">
                    {attachment.mimeType.split("/")[1]}
                  </span>
                </div>
                <button
                  onClick={removeAttachment}
                  className="ml-2 hover:bg-white/10 p-1 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}

            <textarea
              value={decoderInput}
              onChange={(e) => setDecoderInput(e.target.value)}
              placeholder={t.ai.placeholder}
              className="w-full min-h-[120px] bg-transparent text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none font-sans text-lg p-2"
            />

            <div className="flex justify-between items-center px-2 pb-1">
              <div className="flex gap-2 text-slate-400">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileSelect}
                />
                <input
                  type="file"
                  ref={imageInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-slate-700/50 rounded-full transition-colors"
                  title="Upload Document"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 hover:bg-slate-700/50 rounded-full transition-colors"
                  title="Upload Image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={handleDecode}
                disabled={isDecoding || (!decoderInput && !attachment)}
                className={`p-3 rounded-full transition-all flex items-center gap-2 ${
                  decoderInput || attachment
                    ? "bg-white text-black hover:bg-slate-200"
                    : "bg-[#3c4043] text-slate-500 cursor-not-allowed"
                }`}
              >
                {isDecoding ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
                {isDecoding && (
                  <span className="text-xs font-bold pr-2">
                    {t.ai.analyzing}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Results Display */}
          <AnimatePresence>
            {decoderResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-12 bg-[#1e1f20] rounded-[24px] p-8 border border-white/5"
              >
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 space-y-6">
                    <div>
                      <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                        {t.ai.results.explanation}
                      </h4>
                      <p className="text-slate-200 leading-relaxed text-lg">
                        {decoderResult.plain_english}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                      <div>
                        <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                          {t.ai.results.risk}
                        </h4>
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            decoderResult.risk_level === "High"
                              ? "bg-red-500/20 text-red-400"
                              : decoderResult.risk_level === "Medium"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {getRiskLabel(decoderResult.risk_level)}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                          {t.ai.results.keyConcern}
                        </h4>
                        <p className="text-slate-300 text-sm">
                          {decoderResult.key_risk}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <p className="text-xs text-slate-600 italic">
                        {t.ai.results.note}: {decoderResult.engineer_note}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Clients */}
      <section id="clients" className="py-24 px-6 bg-[#0B1120] scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              {t.clients.title}
            </h2>
            <p className="text-slate-500 mb-12">{t.clients.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {CLIENTS_LIST.map((client, i) => (
              <GlowCard key={i} className="p-8 min-h-[200px]">
                <div className="flex flex-col items-center justify-center gap-6 text-center h-full w-full">
                  <div className="w-full h-24 flex items-center justify-center mb-4">
                    <img
                      src={client.logo}
                      alt={client.name}
                      className="max-w-[80%] max-h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1">
                      {client.name}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      {
                        t.categories[
                          client.categoryKey as keyof typeof t.categories
                        ]
                      }
                    </p>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowAllClients(true)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-[#1e1f20] border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
            >
              {t.clients.buttonLabel}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Contact Form & Footer */}
      <section
        id="contact"
        className="bg-[#000000] text-white pt-24 pb-12 relative scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 mb-24">
            <div>
              <h2 className="text-5xl font-bold mb-6">{t.contact.title}</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-md">
                {t.contact.subtitle}
              </p>
              <div className="flex gap-6 text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> Encrypted
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> Attorney Privilege
                </div>
              </div>
            </div>

            <form
              onSubmit={handleContactSubmit}
              className="bg-[#111827] border border-white/10 rounded-2xl p-8 space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                    {t.contact.form.name}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    className="w-full bg-[#0B1120] border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                    {t.contact.form.phone}
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactChange}
                    className="w-full bg-[#0B1120] border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                    {t.contact.form.email}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    className="w-full bg-[#0B1120] border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                    {t.contact.form.address}
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={contactForm.address}
                    onChange={handleContactChange}
                    className="w-full bg-[#0B1120] border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                  {t.contact.form.summary}
                </label>
                <textarea
                  name="summary"
                  value={contactForm.summary}
                  onChange={handleContactChange}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors h-32 resize-none"
                  placeholder="Please briefly describe your legal issue..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-slate-200 transition-colors flex justify-center items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {t.contact.form.button}
              </button>
            </form>
          </div>

          {/* Google Maps Embed */}
          <div className="w-full h-[400px] mb-24 rounded-2xl overflow-hidden border border-white/10">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2830.686566895368!2d20.4668133!3d44.8063783!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x475a7aa6cb00f20b%3A0x5a1cf44c68e25128!2sAdvokatska%20kancelarija%20Risti%C4%87!5e0!3m2!1sen!2srs!4v1710000000000!5m2!1sen!2srs"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ristic Law Office Location"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-t border-white/10 pt-12 pb-8">
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg">
                  <img
                    src="Ristic_Grb.png"
                    alt="Ristic Law"
                    className="h-6 w-auto"
                  />
                </div>
                <span className="font-bold text-white">Ristic Law</span>
              </div>
              <p className="text-slate-500 text-sm">
                Legal security and integrity since 1992.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">
                {t.contact.footer.services}
              </h4>
              <ul className="space-y-4 text-sm text-slate-500">
                {t.services.cards.map((card, index) => (
                  <li key={index}>
                    <a
                      href="#services"
                      onClick={(e) => scrollToSection(e, "services")}
                      className="hover:text-white transition-colors"
                    >
                      {card.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">
                {t.contact.footer.office}
              </h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li>
                  <a
                    href="#about"
                    onClick={(e) => scrollToSection(e, "about")}
                    className="hover:text-white transition-colors"
                  >
                    {t.nav.about}
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    onClick={(e) => scrollToSection(e, "contact")}
                    className="hover:text-white transition-colors"
                  >
                    {t.nav.legalAid}
                  </a>
                </li>
                <li>
                  <a
                    href="#calculator"
                    onClick={(e) => scrollToSection(e, "calculator", "center")}
                    className="hover:text-white transition-colors"
                  >
                    {t.nav.calculator}
                  </a>
                </li>
                <li>
                  <a
                    href="#ai"
                    onClick={(e) => scrollToSection(e, "ai")}
                    className="hover:text-white transition-colors"
                  >
                    {t.nav.analyst}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">
                {t.contact.footer.contact}
              </h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li>Desanke Maksimović 17</li>
                <li>
                  11000 {lang === "en" ? "Belgrade, Serbia" : "Beograd, Srbija"}
                </li>
                <li className="pt-4">Tel: 011/3239-088</li>
                <li>Mob: 060/605-8144</li>
                <li>
                  <a
                    href="mailto:office@akristic.rs"
                    className="text-blue-500 hover:underline"
                  >
                    office@akristic.rs
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Client Modal */}
      <AnimatePresence>
        {showAllClients && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowAllClients(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  Client Reference List
                </h3>
                <button
                  onClick={() => setShowAllClients(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                {FULL_CLIENTS_LIST.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                    <span className="text-sm font-medium">{c}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Info Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setIsContactModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0B1120]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {t.contactModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsContactModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {contactDetails.map((item) => (
                  <div
                    key={item.id}
                    className="group p-4 rounded-xl bg-[#0B1120] border border-white/5 hover:border-blue-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <item.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">
                            {item.label}
                          </p>
                          <p className="text-white font-medium">{item.value}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopy(item.value, item.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copyFeedback === item.id ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 pt-2">
                <button
                  onClick={(e) => {
                    scrollToSection(e, "contact");
                    setIsContactModalOpen(false);
                  }}
                  className="w-full py-3 bg-white text-black rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors flex justify-center items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {t.nav.legalAid}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
