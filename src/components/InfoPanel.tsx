import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const InfoPanel = () => (
  <Card className="mb-6 border-l-4 border-purple-500">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <span>⛪</span>
        Especificaciones del Proyecto - Equipo 6
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex flex-col gap-2">
        <Badge variant="outline" className="text-sm">
          <strong>Ecuación:</strong> z = 8 - 0.078125·x² + 0.0064·y²
        </Badge>
        <Badge variant="outline" className="text-sm">
          <strong>Dominio:</strong> -8 ≤ x ≤ 8, -25 ≤ y ≤ 25
        </Badge>
        <Badge variant="outline" className="text-sm">
          <strong>Altura Central:</strong> 8m | <strong>Bordes ancho:</strong> 3m | <strong>Bordes largo:</strong> 12m
        </Badge>
        <Badge variant="outline" className="text-sm">
          <strong>Tipo:</strong> Paraboloide Hiperbólico (superficie de silla)
        </Badge>
        <Badge variant="outline" className="text-sm">
          <strong>Orientación:</strong> Cóncava en X (drenaje), Convexa en Y (elevación al altar)
        </Badge>
      </div>
    </CardContent>
  </Card>
);