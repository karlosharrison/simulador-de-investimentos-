
import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';
import { Stock, SimulationParams, ComparisonResult, CustomBenchmark } from './types';
import { simulateStockData } from './services/geminiService';
import { 
  PlusIcon, TrashIcon, CalculatorIcon, ArrowTrendingUpIcon, 
  BanknotesIcon, CalendarDaysIcon, ChartBarIcon, InfoCircledIcon,
  AdjustmentsHorizontalIcon,
  ArrowsRightLeftIcon
} from './components/Icons';

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    stocks: [
      { ticker: 'PETR4', name: 'Petrobras', type: 'BR' },
      { ticker: 'VALE3', name: 'Vale', type: 'BR' }
    ],
    startDate: '2015-01-01',
    endDate: new Date().toISOString().split('T')[0],
    initialInvestment: 10000,
    monthlyInvestment: 500,
    reinvestDividends: true,
    customBenchmarks: [
      { id: '1', name: 'IBOV', value: 120, color: '#94a3b8' },
      { id: '2', name: 'CDI', value: 95, color: '#cbd5e1' },
      { id: '3', name: 'Poupança', value: 55, color: '#e2e8f0' }
    ]
  });

  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [tickerType, setTickerType] = useState<'BR' | 'US'>('BR');
  
  const [newBenchName, setNewBenchName] = useState('');
  const [newBenchValue, setNewBenchValue] = useState<string>('');

  const handleSimulate = async () => {
    if (params.stocks.length === 0) return;
    setLoading(true);
    try {
      const data = await simulateStockData(params);
      setResults(data);
    } catch (err) {
      alert("Erro ao simular dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const addStock = () => {
    if (!newTicker) return;
    if (params.stocks.some(s => s.ticker === newTicker.toUpperCase())) return;
    setParams(prev => ({
      ...prev,
      stocks: [...prev.stocks, { ticker: newTicker.toUpperCase(), name: newTicker.toUpperCase(), type: tickerType }]
    }));
    setNewTicker('');
  };

  const removeStock = (ticker: string) => {
    setParams(prev => ({
      ...prev,
      stocks: prev.stocks.filter(s => s.ticker !== ticker)
    }));
  };

  const addBenchmark = () => {
    if (!newBenchName || newBenchValue === '') return;
    const colors = ['#94a3b8', '#cbd5e1', '#e2e8f0', '#64748b', '#475569'];
    const newBench: CustomBenchmark = {
      id: Math.random().toString(36).substr(2, 9),
      name: newBenchName,
      value: parseFloat(newBenchValue),
      color: colors[params.customBenchmarks.length % colors.length]
    };
    setParams(prev => ({
      ...prev,
      customBenchmarks: [...prev.customBenchmarks, newBench]
    }));
    setNewBenchName('');
    setNewBenchValue('');
  };

  const removeBenchmark = (id: string) => {
    setParams(prev => ({
      ...prev,
      customBenchmarks: prev.customBenchmarks.filter(b => b.id !== id)
    }));
  };

  const mergedChartData = useMemo(() => {
    if (results.length === 0) return [];
    const dates = Array.from(new Set(results.flatMap(r => r.history.map(h => h.date)))).sort();
    return dates.map(date => {
      const point: any = { date };
      results.forEach(res => {
        const h = res.history.find(item => item.date === date);
        if (h) {
          point[res.ticker] = h.totalValue;
        }
      });
      return point;
    });
  }, [results]);

  const reinvestmentComparisonData = useMemo(() => {
    if (results.length === 0) return [];
    const dates = Array.from(new Set(results.flatMap(r => r.history.map(h => h.date)))).sort();
    
    return dates.map(date => {
      let totalWith = 0;
      let totalWithout = 0;
      results.forEach(res => {
        const hWith = res.history.find(item => item.date === date);
        const hWithout = res.historyNoReinvest.find(item => item.date === date);
        if (hWith) totalWith += hWith.totalValue;
        if (hWithout) totalWithout += hWithout.totalValue;
      });
      return {
        date,
        'Com Reinvestimento': totalWith,
        'Sem Reinvestimento': totalWithout
      };
    });
  }, [results]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const barChartData = useMemo(() => {
    const stockData = results.map(r => ({ name: r.ticker, val: r.profitability, type: 'stock' }));
    const benchData = params.customBenchmarks.map(b => ({ name: b.name, val: b.value, type: 'benchmark', color: b.color }));
    return [...stockData, ...benchData];
  }, [results, params.customBenchmarks]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalculatorIcon className="w-8 h-8 text-emerald-600" />
            <h1 className="text-xl font-bold tracking-tight">InvestSim <span className="text-slate-400 font-normal">v1.2</span></h1>
          </div>
          <button 
            onClick={handleSimulate}
            disabled={loading || params.stocks.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-sm"
          >
            {loading ? 'Simulando...' : 'Simular Performance'}
            <ArrowTrendingUpIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
              <PlusIcon className="w-5 h-5 text-emerald-600" /> Ativos
            </h2>
            <div className="space-y-3 mb-6">
              {params.stocks.map((stock) => (
                <div key={stock.ticker} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${stock.type === 'BR' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {stock.type}
                    </span>
                    <span className="font-medium text-slate-700">{stock.ticker}</span>
                  </div>
                  <button onClick={() => removeStock(stock.ticker)} className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ex: PETR4"
                value={newTicker}
                onChange={e => setNewTicker(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <select 
                value={tickerType}
                onChange={e => setTickerType(e.target.value as 'BR' | 'US')}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="BR">BR</option>
                <option value="US">US</option>
              </select>
              <button onClick={addStock} className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-slate-500" /> Benchmarks
            </h2>
            <div className="space-y-2 mb-6">
              {params.customBenchmarks.map((bench) => (
                <div key={bench.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 group">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bench.color }} />
                    <span className="text-sm font-medium text-slate-600">{bench.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">{bench.value}%</span>
                    <button onClick={() => removeBenchmark(bench.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nome (Ex: CDI)"
                  value={newBenchName}
                  onChange={e => setNewBenchName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input 
                  type="number" 
                  placeholder="Rent. %"
                  value={newBenchValue}
                  onChange={e => setNewBenchValue(e.target.value)}
                  className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button onClick={addBenchmark} className="bg-slate-200 text-slate-700 p-2 rounded-lg hover:bg-slate-300 transition-colors">
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
              <CalendarDaysIcon className="w-5 h-5 text-emerald-600" /> Período
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">DATA INICIAL</label>
                <input 
                  type="date" 
                  value={params.startDate}
                  onChange={e => setParams(p => ({...p, startDate: e.target.value}))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">DATA FINAL</label>
                <input 
                  type="date" 
                  value={params.endDate}
                  onChange={e => setParams(p => ({...p, endDate: e.target.value}))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
              <BanknotesIcon className="w-5 h-5 text-emerald-600" /> Aportes
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">INVESTIMENTO INICIAL</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                <input 
                  type="number" 
                  value={params.initialInvestment}
                  onChange={e => setParams(p => ({...p, initialInvestment: Number(e.target.value)}))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">APORTE MENSAL</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                <input 
                  type="number" 
                  value={params.monthlyInvestment}
                  onChange={e => setParams(p => ({...p, monthlyInvestment: Number(e.target.value)}))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </section>
        </aside>

        <div className="lg:col-span-8 space-y-8">
          {results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {results.map((res, i) => (
                  <div key={res.ticker} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                        {res.ticker[0]}
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        +{res.profitability.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm mb-1">{res.ticker}</p>
                    <h3 className="text-2xl font-bold text-slate-800">R$ {res.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400 uppercase tracking-tighter font-semibold text-[10px]">Total Investido</p>
                        <p className="font-semibold text-slate-700">R$ {res.totalInvested.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase tracking-tighter font-semibold text-[10px]">Dividendos</p>
                        <p className="font-semibold text-emerald-600">R$ {res.totalDividends.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-700">
                  <ChartBarIcon className="w-6 h-6 text-emerald-600" /> Evolução do Patrimônio
                </h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mergedChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.split('-')[0]} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      {results.map((res, i) => (
                        <Line key={res.ticker} type="monotone" dataKey={res.ticker} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* NEW REINVESTMENT COMPARISON CHART */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-700">
                      <ArrowsRightLeftIcon className="w-6 h-6 text-indigo-600" /> Impacto do Reinvestimento
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Comparativo do patrimônio total com e sem o reinvestimento dos dividendos.</p>
                  </div>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reinvestmentComparisonData}>
                      <defs>
                        <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorWithout" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.split('-')[0]} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
                      />
                      <Legend verticalAlign="top" height={36} iconType="plainline" />
                      <Area 
                        type="monotone" 
                        dataKey="Com Reinvestimento" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorWith)" 
                        strokeWidth={3}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Sem Reinvestimento" 
                        stroke="#64748b" 
                        fillOpacity={1} 
                        fill="url(#colorWithout)" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold mb-6 text-slate-700">Rentabilidade vs Benchmarks</h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" />
                      <YAxis fontSize={12} stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(v) => [`${v}%`, 'Rentabilidade']} 
                      />
                      <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                        {barChartData.map((entry, index) => {
                          const color = entry.type === 'stock' ? COLORS[index % COLORS.length] : (entry.color || '#94a3b8');
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-slate-700">
                    <InfoCircledIcon className="w-6 h-6 text-emerald-600" /> Detalhamento Acumulado (Com Reinv.)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="px-6 py-4">Ação</th>
                        <th className="px-6 py-4">Ações Acumuladas</th>
                        <th className="px-6 py-4">Total Investido</th>
                        <th className="px-6 py-4">Dividendos Totais</th>
                        <th className="px-6 py-4">Valor Final</th>
                        <th className="px-6 py-4">Rentabilidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                      {results.map((res) => (
                        <tr key={res.ticker} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{res.ticker}</td>
                          <td className="px-6 py-4">{res.sharesAccumulated.toFixed(2)}</td>
                          <td className="px-6 py-4">R$ {res.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-emerald-600 font-medium">R$ {res.totalDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">R$ {res.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-bold">
                              {res.profitability.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[600px] bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <div className="bg-slate-50 p-6 rounded-full mb-6">
                <CalculatorIcon className="w-20 h-20 text-slate-200" />
              </div>
              <h3 className="text-2xl font-bold text-slate-600 mb-2">Simulador de Patrimônio</h3>
              <p className="max-w-md text-slate-400 leading-relaxed">
                Configure seus ativos, defina os aportes e compare o impacto dos dividendos reinvestidos vs não reinvestidos ao longo do tempo.
              </p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 mt-12 text-center text-slate-400 text-xs tracking-wide">
        <p>© 2024 InvestSim • Simulador inteligente de ativos financeiros.</p>
        <p className="mt-1">Dados simulados por IA com base em tendências históricas reais.</p>
      </footer>
    </div>
  );
};

export default App;
