"use client";
import React from 'react';
import BungeeSimulation from '@/components/BungeeSimulation';

const BungeeAnalysisApp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-teal-500 to-green-600 p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        <BungeeSimulation />
        
        {/* Información del estudiante */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                📋 Análisis de Ecuaciones Diferenciales
              </h2>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Estudiante:</strong> Aaron Hernandez Jimenez - A01642529</p>
                <p><strong>Fecha:</strong> 22 de Julio, 2025</p>
                <p><strong>Materia:</strong> Análisis Matemático Completo</p>
                <p><strong>Grupo:</strong> 573</p>
                <p><strong>Tema:</strong> Bungee Jumping - Centro de Aventura Ibó</p>
                <p><strong>Ubicación:</strong> Santiago, Nuevo León</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BungeeAnalysisApp;