import React from 'react';
import { CreditCard, Check, Sparkles, AlertTriangle } from 'lucide-react';

const Subscription = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Assinatura</h2>
        <p className="text-slate-500">Gerencie seu plano e método de pagamento do Movicobrança.</p>
      </div>

      <div className="bg-gradient-to-r from-brand-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">Plano Atual</span>
                    <span className="text-brand-100 text-sm">Renova em 15/11/2024</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">Empresa PRO</h3>
                <p className="text-brand-100">Acesso total à IA Financeira e API ilimitada.</p>
            </div>
            <div className="text-right">
                <p className="text-sm opacity-80 mb-1">Valor Mensal</p>
                <h4 className="text-4xl font-bold">R$ 297<span className="text-xl font-normal opacity-80">,90</span></h4>
            </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  Método de Pagamento
              </h3>
              <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50">
                  <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center text-white font-bold text-xs">VISA</div>
                  <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">•••• •••• •••• 4242</p>
                      <p className="text-xs text-slate-500">Expira em 12/28</p>
                  </div>
                  <button className="text-sm text-brand-600 font-medium hover:underline">Alterar</button>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Consumo do Plano
              </h3>
              <div className="space-y-4">
                  <div>
                      <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Mensagens enviadas</span>
                          <span className="font-medium text-slate-900">4.520 / 10.000</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-brand-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Contatos Sincronizados</span>
                          <span className="font-medium text-slate-900">1.240 / Ilimitado</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
          <h3 className="font-bold text-slate-900 mb-4">Histórico de Faturas</h3>
          <table className="w-full text-sm text-left">
              <thead className="text-slate-500 bg-slate-50 uppercase text-xs">
                  <tr>
                      <th className="px-4 py-3 rounded-l-lg">Data</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 rounded-r-lg text-right">PDF</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  <tr>
                      <td className="px-4 py-3">15 Out 2024</td>
                      <td className="px-4 py-3">R$ 297,90</td>
                      <td className="px-4 py-3"><span className="text-emerald-600 font-medium">Pago</span></td>
                      <td className="px-4 py-3 text-right"><button className="text-brand-600 hover:underline">Baixar</button></td>
                  </tr>
                  <tr>
                      <td className="px-4 py-3">15 Set 2024</td>
                      <td className="px-4 py-3">R$ 297,90</td>
                      <td className="px-4 py-3"><span className="text-emerald-600 font-medium">Pago</span></td>
                      <td className="px-4 py-3 text-right"><button className="text-brand-600 hover:underline">Baixar</button></td>
                  </tr>
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default Subscription;