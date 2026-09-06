"use client";

import {
  Sparkles,
  Zap,
  RotateCw,
  Compass,
  Building2,
  NotebookPen,
  Lightbulb,
  Activity,
  ArrowRight,
  UserCog,
  MapPin,
  CalendarClock,
  Languages,
  Share2,
  BookOpen,
} from "lucide-react";
import type { EcopilotTab } from "@/lib/ecopilot/types";

interface GuideViewProps {
  isFinnish: boolean;
  onNavigateTab: (tab: EcopilotTab) => void;
}

interface FeatureGuide {
  tab: EcopilotTab;
  icon: typeof Sparkles;
  iconClass: string;
  titleEn: string;
  titleFi: string;
  blurbEn: string;
  blurbFi: string;
  pointsEn: string[];
  pointsFi: string[];
}

/** Walkthrough content for every eCopilot tab, in sidebar order (minus this one). */
const FEATURES: FeatureGuide[] = [
  {
    tab: "chat",
    icon: Sparkles,
    iconClass: "text-emerald-600",
    titleEn: "eCopilot Chat",
    titleFi: "eCopilot-chatti",
    blurbEn:
      "Your AI climate assistant, tuned to Finnish daily life and the Carbon-Neutral Espoo 2030 roadmap. Ask anything in plain language.",
    blurbFi:
      "Tekoälypohjainen ilmastoapuri, joka tuntee suomalaisen arjen ja Hiilineutraali Espoo 2030 -tiekartan. Kysy mitä vain omin sanoin.",
    pointsEn: [
      "Ask about sauna timing, HSY sorting, HSL trips or housing-company energy retrofits",
      "“Today's Best Action” gives one high-impact suggestion from your profile, weather and recent log — tap “Log it” to record it",
      "Shortcut buttons jump straight to the Energy, Recycling, Transit and Roadmap tools",
    ],
    pointsFi: [
      "Kysy saunan ajoituksesta, HSY-lajittelusta, HSL-matkoista tai taloyhtiön energiaremonteista",
      "”Päivän parhain teko” antaa yhden vaikuttavan ehdotuksen profiilisi, sään ja kirjaustesi pohjalta — paina ”Kirjaa”",
      "Pikavalinnat viévät suoraan Pörssisähkö-, Lajittelu-, Matkat- ja Tiekartta-työkaluihin",
    ],
  },
  {
    tab: "energy",
    icon: Zap,
    iconClass: "text-amber-500",
    titleEn: "Nord Pool & Energy",
    titleFi: "Pörssisähkö & Sauna",
    blurbEn:
      "Today's 24-hour spot-price and grid-CO2 curve for Finland, with the cheapest and cleanest windows to run heavy loads.",
    blurbFi:
      "Tämän päivän 24 tunnin pörssisähkö- ja verkon CO2-käyrä Suomelle sekä edullisimmat ja puhtaimmat tunnit isoille kuormille.",
    pointsEn: [
      "Scrub any hour to see price, CO2 intensity and a recommendation",
      "Get an AI daily plan: sauna, laundry, EV charging and ventilation windows",
      "Live prices are merged onto the curve when the feed is reachable",
    ],
    pointsFi: [
      "Selaa mitä tahansa tuntia: hinta, CO2-intensiteetti ja suositus",
      "Tekoälyn päiväsuunnitelma: sauna, pyykki, sähköauton lataus ja ilmanvaihto",
      "Live-hinnat yhdistetään käyrään, kun syöte on saatavilla",
    ],
  },
  {
    tab: "recycling",
    icon: RotateCw,
    iconClass: "text-teal-600",
    titleEn: "HSY Recycling",
    titleFi: "HSY-Lajittelu",
    blurbEn:
      "Describe or search any item and get the right HSY bin, cleaning and sorting instructions, and the nearest Espoo Sortti station.",
    blurbFi:
      "Kuvaile tai hae mikä tahansa esine ja saat oikean HSY-astian, puhdistus- ja lajitteluohjeet sekä lähimmän Sortti-aseman.",
    pointsEn: [
      "Quick samples for tricky items (greasy pizza boxes, milk cartons, PET)",
      "Each result shows bin colour, whether rinsing is needed and why it matters",
      "Directory of Espoo Sortti stations and Rinki eco-points with hours",
    ],
    pointsFi: [
      "Pikanäytteet hankalille esineille (rasvaiset pizzalaatikot, maitotölkit, PET)",
      "Tulos näyttää astian värin, huuhtelutarpeen ja miksi sillä on merkitystä",
      "Espoon Sortti-asemien ja Rinki-ekopisteiden hakemisto aukioloineen",
    ],
  },
  {
    tab: "transit",
    icon: Compass,
    iconClass: "text-blue-600",
    titleEn: "HSL Transit",
    titleFi: "HSL & Matkat",
    blurbEn:
      "Compare a commute across metro/tram, bike, EV and car for CO2, cost and time — plus what switching to transit saves per year.",
    blurbFi:
      "Vertaa työmatkaa metron/ratikan, pyörän, sähköauton ja auton välillä: CO2, hinta ja aika — sekä vuosisäästö joukkoliikenteeseen.",
    pointsEn: [
      "Enter an origin and destination in the Espoo / HSL area",
      "Side-by-side modes with duration, CO2 grams, euro cost and a convenience score",
      "Yearly projection in CO2, euros and tree-equivalents if you switch",
    ],
    pointsFi: [
      "Syötä lähtö- ja määränpaikka Espoon / HSL-alueella",
      "Kulkutavat rinnakkain: kesto, CO2-grammat, hinta ja mukavuuspisteet",
      "Vuosiennuste CO2:na, euroina ja puina jos vaihdat",
    ],
  },
  {
    tab: "roadmap",
    icon: Building2,
    iconClass: "text-indigo-600",
    titleEn: "Espoo 2030 Watch",
    titleFi: "Ilmastovahti 2030",
    blurbEn:
      "Track the city's carbon-neutrality measures by sector — district heating, mobility, energy, circular economy and carbon sinks.",
    blurbFi:
      "Seuraa kaupungin hiilineutraaliustoimia sektoreittain: kaukolämpö, liikkuminen, energia, kiertotalous ja hiilinielut.",
    pointsEn: [
      "Each measure shows status, current vs. target reduction and the lead partner",
      "District highlights explain what's happening where you live",
      "Deep links to the official Ilmastovahti dashboard",
    ],
    pointsFi: [
      "Jokainen toimi näyttää tilan, nykyisen ja tavoitevähennyksen sekä vetovastuun",
      "Aluekohtaiset nostot kertovat mitä omalla asuinalueellasi tapahtuu",
      "Suorat linkit viralliseen Ilmastovahti-palveluun",
    ],
  },
  {
    tab: "activityLog",
    icon: NotebookPen,
    iconClass: "text-fuchsia-600",
    titleEn: "Activity Log & Receipts",
    titleFi: "Päiväkirja & Kuitit",
    blurbEn:
      "One page, two ways to log: type any activity in plain language — “drove to Turku”, “beef burger for lunch” — or snap a grocery receipt. AI does the CO2 math either way.",
    blurbFi:
      "Yksi sivu, kaksi tapaa kirjata: kirjoita mikä tahansa toiminto omin sanoin — ”ajoin Turkuun”, ”naudanlihapihvi lounaaksi” — tai kuvaa ruokakuitti. Tekoäly laskee CO2:n kummallakin tavalla.",
    pointsEn: [
      "Trips get a country-aware emission factor; meals, home energy, heating and waste get a lifecycle estimate",
      "Receipt mode: Gemini Vision reads each line item, estimates a per-item footprint and suggests lower-carbon swaps",
      "Review the estimate before saving — everything you keep lands in your shared CO2 ledger and the recent-entries list below",
    ],
    pointsFi: [
      "Matkoille lasketaan maakohtainen päästökerroin; aterioille, kodin energialle, lämmitykselle ja jätteelle elinkaariarvio",
      "Kuittitila: Gemini Vision lukee jokaisen rivin, arvioi tuotekohtaisen jalanjäljen ja ehdottaa vähähiilisempiä vaihtoja",
      "Tarkista arvio ennen tallennusta — kaikki tallentamasi menee yhteiseen CO2-kirjanpitoon ja alla olevaan merkintälistaan",
    ],
  },
  {
    tab: "whatIf",
    icon: Lightbulb,
    iconClass: "text-cyan-600",
    titleEn: "What If?",
    titleFi: "Entä jos...?",
    blurbEn:
      "Ask a hypothetical — “what if I biked 3x a week?” — and get a projected yearly CO2 and euro saving you can add to an action plan.",
    blurbFi:
      "Kysy hypoteettinen — ”entä jos pyöräilisin 3x viikossa?” — ja saat vuosittaisen CO2- ja eurosäästöennusteen toimintasuunnitelmaan.",
    pointsEn: [
      "Projections state their assumptions and a confidence level",
      "Stack several scenarios into one plan",
      "Commit a scenario to your CO2 ledger when you act on it",
    ],
    pointsFi: [
      "Ennusteet kertovat oletuksensa ja luotettavuustason",
      "Kokoa useita skenaarioita yhdeksi suunnitelmaksi",
      "Kirjaa skenaario CO2-kirjanpitoon kun toteutat sen",
    ],
  },
  {
    tab: "trackerRewards",
    icon: Activity,
    iconClass: "text-rose-600",
    titleEn: "Tracker & Rewards",
    titleFi: "Seuranta & Palkinnot",
    blurbEn:
      "Your CO2 ledger over the last 30 days — net saved by category, streaks, and the reward tiers you've unlocked.",
    blurbFi:
      "CO2-kirjanpitosi viimeiseltä 30 päivältä: nettosäästö kategorioittain, putket ja avatut palkintotasot.",
    pointsEn: [
      "Every entry from Chat, the Activity Log (trips and receipts) and What If lands here",
      "Trend chart, category breakdown and current streak",
      "Redeem reward tiers as your total saved grows (prototype rewards)",
    ],
    pointsFi: [
      "Kaikki merkinnät chatista, päiväkirjasta (matkat ja kuitit) ja ”entä jos” näkyvät täällä",
      "Trendikäyrä, kategoriajako ja nykyinen putki",
      "Lunasta palkintotasoja kun säästösi kasvaa (prototyyppipalkinnot)",
    ],
  },
];

interface StartStep {
  icon: typeof Sparkles;
  titleEn: string;
  titleFi: string;
  bodyEn: string;
  bodyFi: string;
}

const START_STEPS: StartStep[] = [
  {
    icon: UserCog,
    titleEn: "Set up your climate profile",
    titleFi: "Luo ilmastoprofiilisi",
    bodyEn:
      "Open it from your name at the foot of the left sidebar. It has two parts — Housing (district, home address, heating, sauna, waste) and Commuting (transport and car). Every recommendation in the app personalizes from this, and your saved home address becomes the starting point for quick trip logging.",
    bodyFi:
      "Avaa se nimestäsi vasemman palkin alalaidasta. Siinä on kaksi osaa — Asuminen (alue, kotiosoite, lämmitys, sauna, jäte) ja Liikkuminen (kulkutavat ja auto). Suositukset räätälöityvät näiden pohjalta, ja tallennettu kotiosoite toimii lähtöpisteenä matkojen nopeaan kirjaamiseen.",
  },
  {
    icon: MapPin,
    titleEn: "Add your frequent places",
    titleFi: "Lisää usein käydyt paikat",
    bodyEn:
      "Under Commuting in the profile, list the places you travel to often — work, the grocery store, a child's day care, a hobby class. Give each a quick-select icon, look up its address (Finland), and optionally how you usually get there. These will power fast trip logging in a later update.",
    bodyFi:
      "Lisää profiilin Liikkuminen-osiossa paikat joihin matkustat usein — työ, ruokakauppa, lapsen päiväkoti, harrastus. Anna jokaiselle kuvake, hae osoite (Suomi) ja halutessasi tavallisin kulkutapa. Näitä käytetään myöhemmin matkojen nopeaan kirjaamiseen.",
  },
  {
    icon: CalendarClock,
    titleEn: "Set the scene",
    titleFi: "Aseta konteksti",
    bodyEn:
      "The top bar shows the live Espoo temperature and a season switcher. Switching season lets you explore plans for another time of year; the language toggle flips the whole app between English and Finnish.",
    bodyFi:
      "Yläpalkki näyttää Espoon live-lämpötilan ja vuodenaikavalitsimen. Vaihtamalla vuodenaikaa voit tutkia toisen ajankohdan suunnitelmia; kielivalinta vaihtaa koko sovelluksen kieltä.",
  },
  {
    icon: Sparkles,
    titleEn: "Start in the Chat",
    titleFi: "Aloita chatista",
    bodyEn:
      "Ask a real question, or open “Today's Best Action” for one high-impact suggestion. Use “Log it” to drop it into your CO2 ledger, and the shortcut buttons to reach the other tools.",
    bodyFi:
      "Kysy oikea kysymys tai avaa ”Päivän parhain teko” saadaksesi yhden vaikuttavan ehdotuksen. ”Kirjaa” vie sen CO2-kirjanpitoon, ja pikavalinnat vievät muihin työkaluihin.",
  },
  {
    icon: Activity,
    titleEn: "Log actions and track progress",
    titleFi: "Kirjaa tekoja ja seuraa edistymistä",
    bodyEn:
      "Add entries through the Activity Log (log a trip or scan a grocery receipt) or What If, then watch Tracker & Rewards for your 30-day trend, streaks and reward tiers.",
    bodyFi:
      "Lisää merkintöjä päiväkirjan (kirjaa matka tai skannaa ruokakuitti) tai ”entä jos” kautta, ja seuraa Seuranta & Palkinnot -välilehdeltä 30 päivän trendiä, putkia ja palkintotasoja.",
  },
];

interface TopBarTip {
  icon: typeof Sparkles;
  labelEn: string;
  labelFi: string;
  bodyEn: string;
  bodyFi: string;
}

const TOP_BAR_TIPS: TopBarTip[] = [
  {
    icon: CalendarClock,
    labelEn: "Season switcher",
    labelFi: "Vuodenaikavalitsin",
    bodyEn: "Explore energy and action plans for winter, spring, summer or autumn.",
    bodyFi: "Tutki energia- ja toimintasuunnitelmia talvelle, keväälle, kesälle ja syksylle.",
  },
  {
    icon: Languages,
    labelEn: "EN / FI toggle",
    labelFi: "EN / FI -vaihto",
    bodyEn: "Switch the entire interface and AI responses between English and Finnish.",
    bodyFi: "Vaihda koko käyttöliittymä ja tekoälyn vastaukset englannin ja suomen välillä.",
  },
  {
    icon: UserCog,
    labelEn: "Your account",
    labelFi: "Tili",
    bodyEn: "Your name at the foot of the sidebar opens the profile editor; the chevron beside it has log out.",
    bodyFi: "Nimesi vasemman palkin alalaidassa avaa profiilieditorin; vieressä oleva nuoli sisältää uloskirjautumisen.",
  },
  {
    icon: Share2,
    labelEn: "Share pledge",
    labelFi: "Jaa lupaus",
    bodyEn: "Export your climate commitment from the share icon in the top bar.",
    bodyFi: "Vie ilmastolupauksesi yläpalkin jakokuvakkeesta.",
  },
];

export function GuideView({ isFinnish, onNavigateTab }: GuideViewProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      {/* Intro */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black">
              {isFinnish ? "Tervetuloa eCopilotiin" : "Welcome to eCopilot"}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed mt-1 max-w-3xl">
              {isFinnish
                ? "eCopilot kääntää suomalaisen arjen valinnat konkreettisiksi ilmastoteoiksi ja liittää ne Hiilineutraali Espoo 2030 -tiekarttaan. Tämä sivu käy läpi jokaisen työkalun ja miten pääset alkuun."
                : "eCopilot turns everyday Finnish choices into concrete climate action and ties them to the Carbon-Neutral Espoo 2030 roadmap. This page walks through every tool and how to get started."}
            </p>
          </div>
        </div>
      </div>

      {/* Getting started */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
            {isFinnish ? "Näin pääset alkuun" : "Getting started"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFinnish ? "Muutama askel ensimmäiseen ilmastotekoosi." : "A few steps to your first logged climate action."}
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {START_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <li
                key={step.titleEn}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex gap-4"
              >
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900">
                    {isFinnish ? step.titleFi : step.titleEn}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {isFinnish ? step.bodyFi : step.bodyEn}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Feature walkthrough */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
            {isFinnish ? "Jokainen työkalu" : "Every feature, explained"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFinnish
              ? "Valitse vasemmalta — tai avaa mikä tahansa alta."
              : "Pick one from the left nav — or open any of them from here."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.tab}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${f.iconClass}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      {isFinnish ? f.titleFi : f.titleEn}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      {isFinnish ? f.blurbFi : f.blurbEn}
                    </p>
                  </div>
                </div>

                <ul className="mt-3 space-y-1.5 flex-1">
                  {(isFinnish ? f.pointsFi : f.pointsEn).map((point, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onNavigateTab(f.tab)}
                  className="mt-4 self-start px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>{isFinnish ? "Avaa" : "Open"}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top-bar controls */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
            {isFinnish ? "Aina käytettävissä olevat säätimet" : "Always-on controls"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFinnish ? "Aina käsillä, joka välilehdellä." : "Always available, on every tab."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOP_BAR_TIPS.map((tip) => {
            const Icon = tip.icon;
            return (
              <div
                key={tip.labelEn}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2"
              >
                <Icon className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold text-slate-900">
                  {isFinnish ? tip.labelFi : tip.labelEn}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isFinnish ? tip.bodyFi : tip.bodyEn}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-emerald-900 font-medium">
          {isFinnish
            ? "Valmis aloittamaan? Kysy eCopilotilta ensimmäinen kysymyksesi."
            : "Ready to start? Ask eCopilot your first question."}
        </p>
        <button
          onClick={() => onNavigateTab("chat")}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isFinnish ? "Avaa eCopilot-chatti" : "Open eCopilot Chat"}</span>
        </button>
      </div>
    </div>
  );
}
