import React from 'react';
import { Button } from '@/components/ui/button';

interface ControlsProps {
  autoRotate: boolean;
  onToggleRotate: () => void;
  onReset: () => void;
  showSupports: boolean;
  onToggleSupports: () => void;
  showWireframe: boolean;
  onToggleWireframe: () => void;
  showChurch: boolean;
  onToggleChurch: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
  autoRotate, 
  onToggleRotate, 
  onReset,
  showSupports,
  onToggleSupports,
  showWireframe,
  onToggleWireframe,
  showChurch,
  onToggleChurch
}) => (
  <div className="flex justify-center gap-3 mb-6 flex-wrap">
    <Button 
      onClick={onToggleRotate}
      variant={autoRotate ? "destructive" : "default"}
      className="transform hover:scale-105"
    >
      {autoRotate ? '⏸️ Pausar' : '▶️ Rotar'}
    </Button>
    <Button 
      onClick={onToggleSupports}
      variant={showSupports ? "default" : "outline"}
      className="transform hover:scale-105"
    >
      {showSupports ? '🏗️ Ocultar Polines' : '🏗️ Mostrar Polines'}
    </Button>
    <Button 
      onClick={onToggleWireframe}
      variant={showWireframe ? "default" : "outline"}
      className="transform hover:scale-105"
    >
      {showWireframe ? '🎨 Sólido' : '📐 Wireframe'}
    </Button>
    <Button 
      onClick={onToggleChurch}
      variant={showChurch ? "default" : "outline"}
      className="transform hover:scale-105"
    >
      {showChurch ? '⛪ Ocultar Iglesia' : '⛪ Mostrar Iglesia'}
    </Button>
    <Button 
      onClick={onReset}
      variant="outline"
      className="transform hover:scale-105"
    >
      🔄 Reset
    </Button>
  </div>
);