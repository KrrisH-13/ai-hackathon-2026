import React, { useState, useEffect } from 'react';
import {
  Zap,
  Flame,
  Thermometer,
  RotateCw,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingDown,
  Info,
  Layers,
  Wind,
} from 'lucide-react';
import { UserProfile, Season, DailyEnergyPlan } from '../types/climate';
import { MOCK_HOURLY_SPOT_PRICES, SEASONAL_PRESETS } from '../data/espooData';
import { optimizeDailyEnergyAPI } from '../services/aiClient';

interface NordPoolEnergyOptimizerViewProps {
  userProfile: UserProfile;
  currentSeason: Season;
  isFinnish: boolean;
}

export const NordPoolEnergyOptimizerView: React.FC<NordPoolEnergyOptimizerViewProps> = ({
  userProfile,
  currentSeason,
  isFinnish,
}) => {
  const [selectedSaunaHour, setSelectedSaunaHour] = useState<number>(21); // 21:00
  const [saunaTempTarget, setSaunaTempTarget] = useState<number>(75); // 75°C vs 90°C
  const [aiEnergyPlan, setAiEnergyPlan] = useState<DailyEnergyPlan | null>(null);
  const [isComputingPlan, setIsComputingPlan] = useState<boolean>(false);

  const seasonInfo = SEASONAL_PRESETS[currentSeason];

  const fetchDailyPlan = async () => {
    setIsComputingPlan(true);
    try {
      const plan = await optimizeDailyEnergyAPI(
        userProfile,
        currentSeason,
        seasonInfo.typicalTemp,
        MOCK_HOURLY_SPOT_PRICES
      );
      setAiEnergyPlan(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComputingPlan(false);
    }
  };

  useEffect(() => {
    fetchDailyPlan();
  }, [userProfile.id, currentSeason]);

  // Sauna energy calculation (assuming 7 kW kiuas, 1.5h session = 10.5 kWh)
  const kiuasKwh = 10.5;
  const eveningPeakPrice = 16.5; // c/kWh at 18:00
  const chosenHourPoint = MOCK_HOURLY_SPOT_PRICES[selectedSaunaHour] || MOCK_HOURLY_SPOT_PRICES[21];
  const chosenPrice = chosenHourPoint.priceCentsKwh;

  const tempFactor = saunaTempTarget === 75 ? 0.75 : saunaTempTarget === 80 ? 0.85 : 1.0;
  const actualKwhUsed = kiuasKwh * tempFactor;

  const peakCostEur = (kiuasKwh * eveningPeakPrice) / 100;
  const optimizedCostEur = (actualKwhUsed * chosenPrice) / 100;
  const costSavingsEur = Math.max(0, peakCostEur - optimizedCostEur);

  const peakCo2Grams = kiuasKwh * 135; // 135 g/kWh
  const optimizedCo2Grams = actualKwhUsed * chosenHourPoint.gridCo2IntensityGramsKwh;
  const co2SavingsKg = Math.max(0, (peakCo2Grams - optimizedCo2Grams) / 1000);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/60 border border-amber-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
              ⚡ {isFinnish ? 'Nord Pool Pörssisähkö & Lämpö' : 'Nord Pool Spot Electricity & Heat'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {isFinnish ? `Espoo: ${seasonInfo.nameFi}` : `Espoo: ${seasonInfo.nameEn}`}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isFinnish ? 'Älykäs Sähkön ja Lämmityksen Arkioptimoija' : 'Smart Energy & Heating Daily Optimizer'}
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            {isFinnish
              ? 'Yhdistää kantaverkon tuntihinnat, puhtaimmat tuulivoimatunnit ja suomalaisen asunnon lämmitysjärjestelmän optimaaliseen arkeen.'
              : 'Syncs hourly Nord Pool spot rates, Finnish clean grid wind production, and heating system curves for peak savings.'}
          </p>
        </div>

        <button
          onClick={fetchDailyPlan}
          disabled={isComputingPlan}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition shadow-sm shrink-0"
        >
          {isComputingPlan ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>{isFinnish ? 'Lasketaan...' : 'Computing...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isFinnish ? 'Päivitä AI-Suositukset' : 'Refresh AI Plan'}</span>
            </>
          )}
        </button>
      </div>

      {/* Grid: 24h Spot Electricity Curve + Dynamic Sauna Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 24-hour Spot Price Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>{isFinnish ? 'Vuorokauden Pörssisähkökäyrä (snt/kWh)' : '24h Spot Price Curve (c/kWh)'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {isFinnish ? 'Vihreä = Erittäin halpa & puhdas tuuli, Punainen = Iltahuippu' : 'Green = Cheap & clean wind, Red = Peak demand window'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                &lt; 5 c
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                5-10 c
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                &gt; 10 c
              </span>
            </div>
          </div>

          {/* Bar Visualization */}
          <div className="space-y-2">
            <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-4 pb-2 px-1 border-b border-slate-100">
              {MOCK_HOURLY_SPOT_PRICES.map((p) => {
                const heightPercent = Math.min(100, Math.max(12, (p.priceCentsKwh / 20) * 100));
                const isSelected = selectedSaunaHour === p.hour;

                const barBg =
                  p.priceCentsKwh < 5
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : p.priceCentsKwh < 10
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-rose-500 hover:bg-rose-600';

                return (
                  <div
                    key={p.hour}
                    onClick={() => setSelectedSaunaHour(p.hour)}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-lg">
                      {p.timeLabel}: {p.priceCentsKwh} c/kWh ({p.gridCo2IntensityGramsKwh}g CO2)
                    </div>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-md transition-all ${barBg} ${
                        isSelected ? 'ring-2 ring-slate-900 ring-offset-1 scale-105' : 'opacity-85'
                      }`}
                    />
                    <span className="text-[9px] text-slate-400 font-mono mt-1 hidden sm:block">
                      {p.hour}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected Hour Details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-900">{chosenHourPoint.timeLabel}</span>
                <span className="text-slate-500">• {chosenHourPoint.recommendation}</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-slate-900">{chosenHourPoint.priceCentsKwh} c/kWh</span>
                <span className="text-[10px] text-slate-500 ml-1.5">({chosenHourPoint.gridCo2IntensityGramsKwh} g CO2/kWh)</span>
              </div>
            </div>
          </div>

          {/* Quick appliance timing shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs space-y-1">
              <div className="font-bold text-emerald-950 flex items-center gap-1">
                <span>🧺 Pyykinpesu & Tiskari</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                {aiEnergyPlan?.laundryWindow || '13:00 - 15:00 (Aurinkotuotannon huippu)'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs space-y-1">
              <div className="font-bold text-blue-950 flex items-center gap-1">
                <span>🚗 Sähköauton Lataus</span>
              </div>
              <p className="text-[11px] text-blue-800">
                {aiEnergyPlan?.evChargingWindow || '01:00 - 05:00 (Hinta vain 1.2 c/kWh)'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs space-y-1">
              <div className="font-bold text-indigo-950 flex items-center gap-1">
                <span>💨 LTO-Ilmanvaihto</span>
              </div>
              <p className="text-[11px] text-indigo-800">
                {aiEnergyPlan?.ventilationAdjustment || 'Sulje kesäohitus pakkasella'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Interactive Sauna & Heating Simulator */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  🔥
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {isFinnish ? 'Saunan Älylaskuri' : 'Sauna Energy Calculator'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {userProfile.saunaType === 'wood' ? 'Puukiuas (Puulämmitys)' : 'Sähkökiuas (7 kW teho)'}
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                {userProfile.saunaTimesPerWeek} {isFinnish ? 'krt / vko' : 'times / wk'}
              </span>
            </div>

            {/* Controls */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isFinnish ? 'Valitse saunomisen alkamisaika:' : 'Select Sauna Heating Time:'}
                </label>
                <select
                  value={selectedSaunaHour}
                  onChange={(e) => setSelectedSaunaHour(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  {MOCK_HOURLY_SPOT_PRICES.map((p) => (
                    <option key={p.hour} value={p.hour}>
                      {isFinnish ? `klo ${p.timeLabel}` : p.timeLabel} — {p.priceCentsKwh} c/kWh ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isFinnish ? 'Tavoitelämpötila (Löylyt):' : 'Sauna Temperature Target:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[70, 80, 90].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSaunaTempTarget(t)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        saunaTempTarget === t
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t}°C {t === 70 ? '(Eco ✨)' : t === 90 ? '(Hot 🔥)' : ''}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isFinnish
                    ? '70-75°C riittää pehmeisiin löylyihin ja säästää jopa 25-30% sähköä 90°C verrattuna.'
                    : '70-75°C provides gentle soft steam while consuming 25-30% less energy than 90°C.'}
                </p>
              </div>
            </div>

            {/* Calculated Savings Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-200/80 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                {isFinnish ? 'Säästö verrattuna kello 18:00 iltahuippuun:' : 'Savings vs 18:00 Peak Heating:'}
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white border border-amber-200 shadow-2xs text-center">
                  <div className="text-xl font-black text-emerald-700">
                    +{costSavingsEur.toFixed(2)} €
                  </div>
                  <div className="text-[10px] text-slate-600 font-bold">
                    {isFinnish ? 'Säästö / saunakerta' : 'Savings per session'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-amber-200 shadow-2xs text-center">
                  <div className="text-xl font-black text-emerald-700">
                    -{co2SavingsKg.toFixed(2)} kg
                  </div>
                  <div className="text-[10px] text-slate-600 font-bold">
                    {isFinnish ? 'CO2-päästövähennys' : 'CO2 emissions cut'}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-amber-950 italic leading-relaxed">
                "{aiEnergyPlan?.peakSaunaWindow.reason || (isFinnish ? 'Klo 21:00 jälkeen kantaverkon sähkö on 70% halvempaa ja huomattavasti puhtaampaa.' : 'After 21:00, grid electricity is ~70% cheaper and significantly cleaner with strong wind output.')}"
              </p>
            </div>
          </div>

          {/* AI Action Tip */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isFinnish ? 'Lämmityksen AI-Vinkki:' : 'Heating System AI Advice:'}</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {aiEnergyPlan?.heatPumpTip || seasonInfo.heatPumpSetting}
            </p>
          </div>
        </div>
      </div>

      {/* Espoo Clean Heating Transition & Fortum Clean Heat Info */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Fortum Espoo Clean Heat
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Microsoft Datacenter Heat Reuse in Hepokorpi & Kolabacka
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">
              {isFinnish ? 'Miten Espoon Kaukolämpö Muuttuu Hiilineutraaliksi 2030?' : 'How Espoo District Heating Achieves Net-Zero by 2030'}
            </h3>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-center shrink-0">
            <div className="text-xl font-black text-emerald-800">-85%</div>
            <div className="text-[10px] text-emerald-900 font-bold">
              {isFinnish ? 'Kaukolämmön päästöt 2030' : 'District Heat Emissions 2030'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{isFinnish ? '🖥️ Microsoft Datakeskusten Hukkalämpö' : '🖥️ Microsoft Data Center Waste Heat'}</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {isFinnish
                ? 'Espoon Hepokorven ja Kolabackan konesalien tuottama lämpö ohjataan suoraan kaukolämpöverkkoon, kattaen jopa 40% Espoon, Kauniaisten ja Kirkkonummen lämmitystarpeesta.'
                : 'Excess heat from Microsoft’s mega data centers in Hepokorpi & Kolabacka is fed directly into Fortum’s district network, covering up to 40% of the entire metropolitan heating demand.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{isFinnish ? '🌡️ Suomenojan ja Otaniemen Lämpöpumput' : '🌡️ Suomenoja & Otaniemi Heat Pumps'}</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {isFinnish
                ? 'Suomenojan jätevedenpuhdistamon ja meriveden lämmöntalteenotto hyödyntää teollisuusmittakaavan lämpöpumppuja korvaten kivihiilen lopullisesti.'
                : 'Industrial seawater and wastewater heat pumps at Suomenoja and Otaniemi capture low-grade thermal energy to fully phase out fossil coal.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{isFinnish ? '📉 Asukkaan 1°C Lämpötilasääntö' : '📉 Resident 1°C Temperature Rule'}</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {isFinnish
                ? 'Huonelämpötilan laskeminen 21°C:sta 20°C:een säästää 5% koko asunnon lämmitysenergiasta, vähentää pölyisyyttä ja parantaa unen laatua.'
                : 'Dropping indoor room temperature from 21°C to 20°C (and bedrooms to 18°C) cuts total heating energy by 5%, reduces dust dryness, and improves sleep quality.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
