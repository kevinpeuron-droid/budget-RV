import React, { useMemo } from 'react';
import { AppData, Transaction } from '../types';
import { formatCurrency } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DashboardTabProps {
  data: AppData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const DashboardTab: React.FC<DashboardTabProps> = ({ data }) => {
  
  const stats = useMemo(() => {
    const totalRecettes = data.realized.filter(t => t.type === 'RECETTE').reduce((acc, curr) => acc + curr.amount, 0);
    const totalDepenses = data.realized.filter(t => t.type === 'DEPENSE').reduce((acc, curr) => acc + curr.amount, 0);
    const solde = totalRecettes - totalDepenses;
    
    // Group by category for pie charts
    const recettesByCategory = data.realized.filter(t => t.type === 'RECETTE').reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const depensesByCategory = data.realized.filter(t => t.type === 'DEPENSE').reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return { totalRecettes, totalDepenses, solde, recettesByCategory, depensesByCategory };
  }, [data.realized]);

  const pieDataRecettes = Object.keys(stats.recettesByCategory).map(key => ({ name: key, value: stats.recettesByCategory[key] }));
  const pieDataDepenses = Object.keys(stats.depensesByCategory).map(key => ({ name: key, value: stats.depensesByCategory[key] }));

  const barData = [
    { name: 'Global', Recettes: stats.totalRecettes, Dépenses: stats.totalDepenses }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium">Total Recettes</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRecettes)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm font-medium">Total Dépenses</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalDepenses)}</p>
        </div>
        <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${stats.solde >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
          <h3 className="text-gray-500 text-sm font-medium">Solde (Résultat)</h3>
          <p className={`text-2xl font-bold ${stats.solde >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatCurrency(stats.solde)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-lg font-semibold mb-4 text-center">Répartition Recettes</h4>
          <div className="h-64">
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
          <h4 className="text-lg font-semibold mb-4 text-center">Répartition Dépenses</h4>
          <div className="h-64">
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
         <h4 className="text-lg font-semibold mb-4 text-center">Balance</h4>
         <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={barData}>
               <XAxis dataKey="name" />
               <YAxis />
               <Tooltip formatter={(value: number) => formatCurrency(value)} />
               <Legend />
               <Bar dataKey="Recettes" fill="#10B981" />
               <Bar dataKey="Dépenses" fill="#EF4444" />
             </BarChart>
           </ResponsiveContainer>
         </div>
       </div>
    </div>
  );
};