import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface Calculations {
  surfaceArea: number;
  concreteVolume: number;
  supportCount: number;
}

interface CalculationsPanelProps {
  calculations: Calculations;
}

export const CalculationsPanel: React.FC<CalculationsPanelProps> = ({ calculations }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
    <Card className="border-2 border-green-500 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-green-800 text-lg flex items-center gap-2">
          <span>📏</span>
          Área Superficial
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-gray-800">{calculations.surfaceArea.toFixed(1)} m²</p>
        <CardDescription className="mt-1">Superficie del techo</CardDescription>
      </CardContent>
    </Card>
    
    <Card className="border-2 border-blue-500 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-800 text-lg flex items-center gap-2">
          <span>🧱</span>
          Volumen de Concreto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-gray-800">{calculations.concreteVolume.toFixed(1)} m³</p>
        <CardDescription className="mt-1">Espesor: 0.15m</CardDescription>
      </CardContent>
    </Card>
  </div>
);