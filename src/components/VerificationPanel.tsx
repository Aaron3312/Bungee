import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const VerificationPanel = () => (
  <Card className="mb-6 border-l-4 border-green-500">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-green-700">
        <span>✓</span>
        Verificación de Alturas
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="text-center">
          <div className="font-semibold">Centro (0,0)</div>
          <div className="text-green-600 font-bold">8.0 m</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">Bordes ancho (±8,0)</div>
          <div className="text-blue-600 font-bold">3.0 m</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">Bordes largo (0,±25)</div>
          <div className="text-purple-600 font-bold">12.0 m</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">Esquinas (±8,±25)</div>
          <div className="text-orange-600 font-bold">7.0 m</div>
        </div>
      </div>
    </CardContent>
  </Card>
);