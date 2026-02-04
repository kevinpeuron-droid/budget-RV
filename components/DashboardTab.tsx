import React, { useMemo } from 'react';
import { AppData, Transaction } from '../types';
import { formatCurrency } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DashboardTabProps {
  data: AppData;
  year: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF6B6B', '#4ECDC4'];

export const DashboardTab: React.FC<DashboardTabProps> = ({ data, year }) => {
  
  const stats = useMemo(() => {
    // Filtrage des transactions pour l'année sélectionnée
    const filteredTransactions = data.realized.filter(t => {
        const tYear = parseInt(t.date.split('-')[0]);
        return tYear === year;
    });

    // 1. Calcul des recettes MANUELLES (Saisie Opérations)
    const recettesRealized = filteredTransactions
      .filter(t => t.type === 'RECETTE' && (t.status === undefined || t.status === 'REALIZED'))
      .reduce((acc, curr) => acc + curr.amount, 0);
      
    const recettesPending = filteredTransactions
      .filter(t => t.type === 'RECETTE' && t.status === 'PENDING')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    // 2. Sponsors - Logique mise à jour pour le multi-année
    // On regarde dans yearlyData pour l'année sélectionnée
    const recettesSponsorsRealized = data.sponsors.reduce((acc, curr) => {
        // Nouvelle structure
        const yearData = curr.yearlyData?.[year.toString()];
        if (yearData) {
            // Si on a des données pour cette année
            if (yearData.datePaid) {
                 return acc + (yearData.amountPaid || 0);
            }
        } else if (!curr.yearlyData) {
             // Fallback ancienne structure (compatibilité) : si pas de yearlyData du tout
             // On suppose que les données "racine" appartiennent à l'année de création/défaut
             // Pour être sûr, on peut filtrer par la date racine si elle existe
             if(curr.datePaid && curr.datePaid.startsWith(year.toString())) {
                return acc + (curr.amountPaid || 0);
             }
        }
        return acc;
    }, 0);

    const recettesSponsorsPending = data.sponsors.reduce((acc, curr) => {
        const yearData = curr.yearlyData?.[year.toString()];
        if (yearData) {
            return acc + Math.max(0, (yearData.amountPromised || 0) - (yearData.amountPaid || 0));
        } else if (!curr.yearlyData) {
             // Fallback
             return acc + Math.max(0, (curr.amountPromised || 0) - (curr.amountPaid || 0));
        }
        return acc;
    }, 0);

    // TOTAUX RECETTES
    const totalRecettesRealized = recettesRealized + recettesSponsorsRealized;
    const totalRecettesPending = recettesPending + recettesSponsorsPending;
    const totalRecettesGlobal = totalRecettesRealized + totalRecettesPending;

    // 3. Dépenses
    const depensesRealized = filteredTransactions
      .filter(t => t.type === 'DEPENSE' && (t.status === undefined || t.status === 'REALIZED'))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const depensesPending = filteredTransactions
      .filter(t => t.type === 'DEPENSE' && t.status === 'PENDING')
      .reduce((acc, curr) => acc + curr.amount, 0);

    // TOTAUX DEPENSES
    const totalDepensesRealized = depensesRealized;
    const totalDepensesPending = depensesPending;
    const totalDepensesGlobal = totalDepensesRealized + totalDepensesPending;
    
    // RÉSULTATS
    const soldeReel = totalRecettesRealized - totalDepensesRealized;
    const soldeProjete = totalRecettesGlobal - totalDepensesGlobal;
    
    // Préparation Pie Chart
    const recettesByCategory = filteredTransactions.filter(t => t.type === 'RECETTE').reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    if (recettesSponsorsRealized + recettesSponsorsPending > 0) {
      const labelSponsor = "Partenaires & Sponsors";
      recettesByCategory[labelSponsor] = (recettesByCategory[labelSponsor] || 0) + (recettesSponsorsRealized + recettesSponsorsPending);
    }

    const depensesByCategory = filteredTransactions.filter(t => t.type === 'DEPENSE').reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return { 
        totalRecettesRealized, totalRecettesPending, totalRecettesGlobal,
        totalDepensesRealized, totalDepensesPending, totalDepensesGlobal,
        soldeReel, soldeProjete,
        recettesByCategory, depensesByCategory, 
        recettesSponsorsRealized 
    };
  }, [data.realized, data.sponsors, year]);

  const pieDataRecettes = Object.keys(stats.recettesByCategory).map(key => ({ name: key, value: stats.recettesByCategory[key] }));
  const pieDataDepenses = Object.keys(stats.depensesByCategory).map(key => ({ name: key, value: stats.depensesByCategory[key] }));

  const barData = [
    { name: 'Réalisé (Caisse)', Recettes: stats.totalRecettesRealized, Dépenses: stats.totalDepensesRealized },
    { name: 'À venir (Engagé)', Recettes: stats.totalRecettesPending, Dépenses: stats.totalDepensesPending },
  ];

  return (
    <div className="space-y-6">
      {/* Synthèse des montants / Trésorerie */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Recettes */}
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Recettes {year}</h3>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalRecettesGlobal)}</p>
          <div className="mt-2 text-xs space-y-1">
             <div className="flex justify-between">
                <span className="text-gray-500">Encaissé:</span>
                <span className="font-medium text-gray-800">{formatCurrency(stats.totalRecettesRealized)}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-orange-500">À venir:</span>
                <span className="font-medium text-orange-600">{formatCurrency(stats.totalRecettesPending)}</span>
             </div>
          </div>
        </div>

        {/* Dépenses */}
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Dépenses {year}</h3>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(stats.totalDepensesGlobal)}</p>
          <div className="mt-2 text-xs space-y-1">
             <div className="flex justify-between">
                <span className="text-gray-500">Payé:</span>
                <span className="font-medium text-gray-800">{formatCurrency(stats.totalDepensesRealized)}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-orange-500">À venir:</span>
                <span className="font-medium text-orange-600">{formatCurrency(stats.totalDepensesPending)}</span>
             </div>
          </div>
        </div>

        {/* Solde Réel */}
        <div className={`bg-white p-4 rounded-lg shadow border-l-4 ${stats.soldeReel >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Trésorerie {year}</h3>
          <p className={`text-2xl font-bold ${stats.soldeReel >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatCurrency(stats.soldeReel)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Ce qui est réellement en banque</p>
        </div>

        {/* Solde Projetté */}
        <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500`}>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Résultat Projeté</h3>
          <p className={`text-2xl font-bold text-indigo-700`}>
            {formatCurrency(stats.soldeProjete)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Une fois tout encaissé et payé</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-lg font-semibold mb-4 text-center">Répartition Recettes (Engagé inclus)</h4>
          {/* AJOUT DE LA CLASSE DE HAUTEUR FIXE POUR RECHARTS */}
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieDataRecettes} cx="50%" cy="50%" innerRadius={40} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                  {pieDataRecettes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-lg font-semibold mb-4 text-center">Répartition Dépenses (Engagé inclus)</h4>
           {/* AJOUT DE LA CLASSE DE HAUTEUR FIXE POUR RECHARTS */}
          <div className="h-[400px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieDataDepenses} cx="50%" cy="50%" innerRadius={40} outerRadius={80} fill="#82ca9d" paddingAngle={5} dataKey="value">
                  {pieDataDepenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

       <div className="bg-white p-4 rounded-lg shadow">
         <h4 className="text-lg font-semibold mb-4 text-center">Balance {year} : Réel vs À Venir</h4>
         {/* AJOUT DE LA CLASSE DE HAUTEUR FIXE POUR RECHARTS */}
         <div className="h-[400px] w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={barData}>
               <XAxis dataKey="name" />
               <YAxis />
               <Tooltip formatter={(value: number) => formatCurrency(value)} />
               <Legend />
               <Bar dataKey="Recettes" fill="#10B981" stackId="a" />
               <Bar dataKey="Dépenses" fill="#EF4444" stackId="a" />
             </BarChart>
           </ResponsiveContainer>
         </div>
       </div>
    </div>
  );
};