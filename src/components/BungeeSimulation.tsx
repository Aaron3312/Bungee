"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SimulationData {
  time: number;
  position: number;
  velocity: number;
  acceleration: number;
  phase: 'free_fall' | 'elastic';
  energy: {
    kinetic: number;
    potential: number;
    elastic: number;
    total: number;
  };
  force: number;
}

const BungeeSimulation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentData, setCurrentData] = useState<SimulationData | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<SimulationData[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState(50); // ms entre frames
  const [simulationDuration, setSimulationDuration] = useState(15); // segundos totales de simulación
  const [dampingLevel, setDampingLevel] = useState(0.1); // Nivel de amortiguamiento
  
  // Parámetros físicos modificables
  const [totalHeight, setTotalHeight] = useState(70); // Altura total (m)
  const [jumperMass, setJumperMass] = useState(70); // Masa del saltador (kg)
  const [ropeLength, setRopeLength] = useState(35); // Longitud natural de la cuerda (m)
  const [springConstant, setSpringConstant] = useState(140); // Constante elástica (N/m)
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Parámetros del sistema (dinámicos)
  const params = {
    get H() { return totalHeight; },        // Altura total (m)
    get m() { return jumperMass; },         // Masa del saltador (kg)
    get L0() { return ropeLength; },        // Longitud natural de la cuerda (m)
    get k() { return springConstant; },     // Constante elástica (N/m)
    g: 9.81,                                // Gravedad (m/s²)
    dt: 0.01,                               // Paso de tiempo (s)
    get damping() { return dampingLevel; }  // Coeficiente de amortiguamiento (s⁻¹)
  };

  // Función para calcular la fase 1 (caída libre)
  const calculatePhase1 = (t: number): SimulationData => {
    const position = 4.905 * t * t;
    const velocity = 9.81 * t;
    const acceleration = 9.81;
    
    const kineticEnergy = 0.5 * params.m * velocity * velocity;
    const potentialEnergy = -params.m * params.g * position;
    
    return {
      time: t,
      position,
      velocity,
      acceleration,
      phase: 'free_fall',
      energy: {
        kinetic: kineticEnergy,
        potential: potentialEnergy,
        elastic: 0,
        total: kineticEnergy + potentialEnergy
      },
      force: params.m * params.g
    };
  };

  // Función para calcular la fase 2 (cuerda elástica con amortiguamiento)
  const calculatePhase2 = (t: number): SimulationData => {
    const omega0 = Math.sqrt(params.k / params.m); // Frecuencia natural = 1.414 rad/s
    const gamma = params.damping; // Coeficiente de amortiguamiento
    
    // Verificar tipo de amortiguamiento
    const discriminant = gamma * gamma - 4 * omega0 * omega0;
    
    // Posición de equilibrio: donde mg = k(y - L0)
    const equilibrium = params.L0 + (params.m * params.g) / params.k;
    
    // Velocidad exacta al final de la fase 1
    const v1 = params.g * Math.sqrt(2 * params.L0 / params.g);
    
    let position, velocity, acceleration;
    
    if (discriminant < 0) {
      // Amortiguamiento subcrítico (caso más común en bungee)
      const omega_d = Math.sqrt(omega0 * omega0 - gamma * gamma / 4); // Frecuencia amortiguada
      const dampingFactor = Math.exp(-gamma * t / 2); // Factor de amortiguamiento exponencial
      
      // Condiciones iniciales: y(0) = L0, v(0) = v1
      const y0 = params.L0 - equilibrium; // Desplazamiento inicial desde equilibrio
      const v0 = v1; // Velocidad inicial
      
      // Constantes para oscilador amortiguado
      const A = y0;
      const B = (v0 + gamma * y0 / 2) / omega_d;
      
      // Solución del oscilador armónico amortiguado
      position = equilibrium + dampingFactor * (A * Math.cos(omega_d * t) + B * Math.sin(omega_d * t));
      velocity = dampingFactor * ((-gamma/2 * A - omega_d * B) * Math.cos(omega_d * t) + 
                                  (omega_d * A - gamma/2 * B) * Math.sin(omega_d * t));
      acceleration = -omega0 * omega0 * (position - equilibrium) - gamma * velocity;
      
    } else {
      // Amortiguamiento crítico o sobrecrítico (casos especiales)
      // Para simplificar, usamos aproximación subcrítica
      const omega_d = omega0 * 0.9; // Aproximación
      const dampingFactor = Math.exp(-gamma * t / 2);
      
      const A = params.L0 - equilibrium;
      const B = v1 / omega_d;
      
      position = equilibrium + dampingFactor * (A * Math.cos(omega_d * t) + B * Math.sin(omega_d * t));
      velocity = dampingFactor * (-A * omega_d * Math.sin(omega_d * t) + B * omega_d * Math.cos(omega_d * t)) - 
                (gamma/2) * dampingFactor * (A * Math.cos(omega_d * t) + B * Math.sin(omega_d * t));
      acceleration = -omega0 * omega0 * (position - equilibrium) - gamma * velocity;
    }
    
    // Debug para el primer punto de la fase 2
    if (t < 0.02) {
      console.log('Phase 2 Debug:', {
        t: t.toFixed(3),
        omega0: omega0.toFixed(3),
        gamma: gamma.toFixed(3),
        equilibrium: equilibrium.toFixed(3),
        dampingFactor: discriminant < 0 ? Math.exp(-gamma * t / 2).toFixed(3) : 'N/A',
        position: position.toFixed(3),
        velocity: velocity.toFixed(3)
      });
    }
    
    const kineticEnergy = 0.5 * params.m * velocity * velocity;
    const potentialEnergy = -params.m * params.g * position;
    const elasticEnergy = 0.5 * params.k * Math.pow(position - params.L0, 2);
    const elasticForce = params.k * (position - params.L0);
    
    return {
      time: t + 2.67, // Añadir tiempo de fase 1
      position,
      velocity,
      acceleration,
      phase: 'elastic',
      energy: {
        kinetic: kineticEnergy,
        potential: potentialEnergy,
        elastic: elasticEnergy,
        total: kineticEnergy + potentialEnergy + elasticEnergy
      },
      force: elasticForce
    };
  };

  // Función de simulación
  const runSimulation = () => {
    const history: SimulationData[] = [];
    
    // Fase 1: Caída libre hasta L0 = 35m
    const t1 = Math.sqrt(2 * params.L0 / params.g); // 2.67 segundos
    let time = 0;
    while (time <= t1) {
      const data = calculatePhase1(time);
      history.push(data);
      time += params.dt;
    }
    
    // Fase 2: Movimiento con cuerda elástica
    time = 0;
    const maxPhase2Time = simulationDuration - t1; // Duración restante después de la fase 1
    console.log(`Fase 2 durará ${maxPhase2Time.toFixed(1)} segundos`);
    while (time <= maxPhase2Time) {
      const data = calculatePhase2(time);
      // Solo verificar que no exceda la altura total del salto
      if (data.position <= params.H) {
        history.push(data);
      } else {
        // Si excede la altura total, terminar simulación por seguridad
        console.log('Simulación terminada: excede altura máxima en', data.position, 'm');
        break;
      }
      time += params.dt;
    }
    
    setSimulationHistory(history);
    console.log(`Simulación generada con ${history.length} puntos`);
    return history;
  };

  // Animación
  const animate = (history: SimulationData[]) => {
    let index = 0;
    let animationRunning = true; // Variable local para controlar la animación
    console.log('Starting animation with', history.length, 'frames');
    
    const step = () => {
      console.log('Animation step:', index, '/', history.length, 'animationRunning:', animationRunning);
      if (index < history.length && animationRunning) {
        const currentPoint = history[index];
        console.log('Drawing point:', currentPoint.time.toFixed(2) + 's', currentPoint.position.toFixed(1) + 'm');
        setCurrentData(currentPoint);
        drawCanvas(currentPoint, history.slice(0, index + 1));
        index++;
        
        // Usar la velocidad seleccionada
        setTimeout(() => {
          if (animationRunning) { // Verificar nuevamente antes de continuar
            animationRef.current = requestAnimationFrame(step);
          }
        }, animationSpeed); // Velocidad configurable
      } else {
        console.log('Animation finished, index:', index, 'animationRunning:', animationRunning);
        setIsRunning(false);
        animationRunning = false;
      }
    };
    
    // Función para detener la animación
    const stopAnimation = () => {
      animationRunning = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
    
    // Guardar la función de parada en una referencia para poder accederla
    animationRef.current = { stop: stopAnimation };
    
    // Comenzar inmediatamente
    step();
    
    // Retornar función de parada
    return stopAnimation;
  };

  // Dibujar en canvas
  const drawCanvas = (currentData: SimulationData, history: SimulationData[]) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not found');
      return;
    }
    
    console.log('Drawing canvas for position:', currentData.position, 'phase:', currentData.phase);
    
    // Establecer tamaño del canvas responsivo
    const container = canvas.parentElement;
    const containerWidth = container ? container.clientWidth : 600;
    const maxWidth = Math.min(containerWidth - 20, 600); // 10px de margen a cada lado
    const aspectRatio = 7 / 6; // Proporción altura/ancho
    
    canvas.width = maxWidth;
    canvas.height = maxWidth / aspectRatio;
    
    // Fondo azul claro
    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Escala y configuración responsiva
    const margin = Math.min(canvas.height * 0.1, 50); // Margen adaptativo
    const scale = (canvas.height - 2 * margin) / params.H; // Escala: pixels por metro
    const centerX = canvas.width / 2;
    console.log('Canvas size:', canvas.width, 'x', canvas.height, 'Scale:', scale, 'centerX:', centerX);
    
    // Dibujar plataforma (adaptativa)
    const platformWidth = Math.min(canvas.width * 0.3, 100);
    const platformHeight = Math.max(canvas.height * 0.03, 10);
    const platformY = margin;
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(centerX - platformWidth/2, platformY, platformWidth, platformHeight);
    ctx.fillStyle = '#000';
    
    // Tamaño de fuente adaptativo
    const fontSize = Math.max(canvas.width * 0.025, 10);
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('Plataforma (0m)', centerX, platformY + platformHeight + fontSize + 5);
    
    // Calcular posición del saltador
    const jumperY = margin + platformHeight + currentData.position * scale;
    console.log('Jumper Y position:', jumperY, '(position:', currentData.position, '* scale:', scale, ')');
    
    // Dibujar cuerda (adaptativa)
    const ropeWidth = Math.max(canvas.width * 0.006, 2);
    ctx.strokeStyle = currentData.phase === 'free_fall' ? '#FF6B6B' : '#4ECDC4';
    ctx.lineWidth = ropeWidth;
    ctx.beginPath();
    ctx.moveTo(centerX, platformY + platformHeight);
    
    if (currentData.phase === 'free_fall') {
      // En caída libre, cuerda floja (línea punteada)
      const dashLength = Math.max(canvas.width * 0.02, 5);
      ctx.setLineDash([dashLength, dashLength]);
      ctx.lineTo(centerX, jumperY);
    } else {
      // En fase elástica, cuerda siempre tensa
      ctx.setLineDash([]);
      ctx.lineTo(centerX, jumperY);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Dibujar saltador (tamaño adaptativo)
    const jumperRadius = Math.max(canvas.width * 0.02, 8);
    ctx.fillStyle = currentData.phase === 'free_fall' ? '#FF3333' : '#33CCCC';
    ctx.beginPath();
    ctx.arc(centerX, jumperY, jumperRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Borde del saltador
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(ropeWidth * 0.5, 1);
    ctx.stroke();
    
    // Marcadores de distancia (adaptativos)
    const markerFontSize = Math.max(canvas.width * 0.02, 8);
    const markerWidth = Math.max(canvas.width * 0.04, 15);
    const markerOffset = Math.max(canvas.width * 0.08, 30);
    
    ctx.fillStyle = '#666';
    ctx.font = `${markerFontSize}px Arial`;
    ctx.textAlign = 'left';
    
    const step = params.H > 100 ? 20 : 10; // Menos marcadores si la altura es muy grande
    for (let i = step; i <= params.H; i += step) {
      const y = margin + platformHeight + i * scale;
      if (y < canvas.height - margin) { // Solo dibujar si está dentro del canvas
        ctx.fillRect(centerX + markerOffset, y, markerWidth, 1);
        ctx.fillText(`${i}m`, centerX + markerOffset + markerWidth + 5, y + markerFontSize/2);
      }
    }
    
    // Marcar L0 (adaptativo)
    const L0Y = margin + platformHeight + params.L0 * scale;
    if (L0Y < canvas.height - margin) {
      const L0FontSize = Math.max(canvas.width * 0.025, 10);
      const L0LineWidth = Math.max(canvas.width * 0.005, 2);
      const L0Length = Math.min(canvas.width * 0.15, 50);
      
      ctx.strokeStyle = '#FF8800';
      ctx.lineWidth = L0LineWidth;
      ctx.setLineDash([canvas.width * 0.02, canvas.width * 0.01]);
      ctx.beginPath();
      ctx.moveTo(centerX - L0Length, L0Y);
      ctx.lineTo(centerX + L0Length, L0Y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#FF8800';
      ctx.font = `${L0FontSize}px Arial`;
      ctx.fontWeight = 'bold';
      ctx.fillText(`L₀ = ${params.L0}m`, centerX + L0Length + 5, L0Y - 5);
    }
    
    // Mostrar información de la fase actual (adaptativa)
    const infoFontSize = Math.max(canvas.width * 0.025, 10);
    const infoMargin = Math.max(canvas.width * 0.02, 8);
    
    ctx.fillStyle = '#000';
    ctx.font = `${infoFontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(`Fase: ${currentData.phase === 'free_fall' ? 'Caída Libre' : 'Cuerda Elástica'}`, infoMargin, infoMargin + infoFontSize);
    ctx.fillText(`Tiempo: ${currentData.time.toFixed(2)}s`, infoMargin, infoMargin + infoFontSize * 2.5);
    ctx.fillText(`Posición: ${currentData.position.toFixed(1)}m`, infoMargin, infoMargin + infoFontSize * 4);
  };

  // Iniciar/parar simulación
  const toggleSimulation = () => {
    console.log('Toggle simulation clicked, isRunning:', isRunning);
    if (!isRunning) {
      setIsRunning(true);
      console.log('Starting simulation...');
      const history = runSimulation();
      console.log('History generated:', history.length, 'points');
      if (history.length > 0) {
        console.log('First point:', history[0]);
        console.log('Last point:', history[history.length - 1]);
        const stopFn = animate(history);
        // Guardar función de parada
        animationRef.current = { stop: stopFn };
      } else {
        console.error('No history generated!');
        setIsRunning(false);
      }
    } else {
      console.log('Stopping simulation...');
      setIsRunning(false);
      if (animationRef.current && animationRef.current.stop) {
        animationRef.current.stop();
      }
    }
  };

  // Reset simulación
  const resetSimulation = () => {
    console.log('Resetting simulation...');
    setIsRunning(false);
    setCurrentData(null);
    setSimulationHistory([]);
    if (animationRef.current && animationRef.current.stop) {
      animationRef.current.stop();
    }
    
    // Reinicializar canvas (responsivo)
    const canvas = canvasRef.current;
    if (canvas) {
      const container = canvas.parentElement;
      const containerWidth = container ? container.clientWidth : 600;
      const maxWidth = Math.min(containerWidth - 20, 600);
      const aspectRatio = 5 / 6;
      
      canvas.width = maxWidth;
      canvas.height = maxWidth / aspectRatio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f0f8ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar elementos estáticos iniciales (adaptativos)
        const margin = Math.min(canvas.height * 0.1, 50);
        const centerX = canvas.width / 2;
        const platformWidth = Math.min(canvas.width * 0.3, 100);
        const platformHeight = Math.max(canvas.height * 0.03, 10);
        const fontSize = Math.max(canvas.width * 0.025, 10);
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(centerX - platformWidth/2, margin, platformWidth, platformHeight);
        ctx.fillStyle = '#000';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Plataforma (0m)', centerX, margin + platformHeight + fontSize + 5);
        
        // Marcar L0
        const scale = (canvas.height - 2 * margin) / params.H;
        const L0Y = margin + platformHeight + params.L0 * scale;
        const L0Length = Math.min(canvas.width * 0.15, 50);
        
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = Math.max(canvas.width * 0.005, 2);
        ctx.setLineDash([canvas.width * 0.02, canvas.width * 0.01]);
        ctx.beginPath();
        ctx.moveTo(centerX - L0Length, L0Y);
        ctx.lineTo(centerX + L0Length, L0Y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#FFA500';
        ctx.fillText(`L₀ = ${params.L0}m`, centerX + L0Length + 5, L0Y - 5);
      }
    }
  };

  // Función de prueba para el canvas
  const testCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        console.log('Canvas funciona correctamente');
        // Dibujar un círculo de prueba
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(300, 250, 20, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  };

  // Función de prueba para la simulación
  const testSimulation = () => {
    console.log('Testing simulation generation...');
    const history = runSimulation();
    console.log('Generated', history.length, 'data points');
    if (history.length > 0) {
      console.log('Sample points:');
      console.log('First:', history[0]);
      console.log('Middle:', history[Math.floor(history.length/2)]);
      console.log('Last:', history[history.length-1]);
      
      // Probar dibujando el primer punto
      if (history[0]) {
        drawCanvas(history[0], [history[0]]);
      }
    }
  };

  // Función de debug para verificar puntos clave
  const debugKeyPoints = () => {
    console.log('=== DEBUG: Puntos Clave de la Simulación ===');
    
    // Punto final de Fase 1
    const t1 = Math.sqrt(2 * params.L0 / params.g);
    const phase1End = calculatePhase1(t1);
    console.log('Final de Fase 1 (t =', t1.toFixed(3), 's):', {
      position: phase1End.position.toFixed(3) + 'm',
      velocity: phase1End.velocity.toFixed(3) + 'm/s',
      expected_pos: '35.000m',
      expected_vel: '26.190m/s'
    });
    
    // Puntos clave de Fase 2
    console.log('\nPuntos clave de Fase 2:');
    for (let i = 0; i <= 20; i++) {
      const t2 = i * 0.2; // cada 0.2 segundos
      const phase2Point = calculatePhase2(t2);
      if (i === 0 || i === 5 || i === 10 || i === 15 || i === 20) {
        console.log(`t=${(phase2Point.time).toFixed(1)}s: pos=${phase2Point.position.toFixed(1)}m, vel=${phase2Point.velocity.toFixed(1)}m/s`);
      }
    }
  };

  // Inicializar canvas
  useEffect(() => {
    const initializeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // Configurar tamaño responsivo
        const container = canvas.parentElement;
        const containerWidth = container ? container.clientWidth : 600;
        const maxWidth = Math.min(containerWidth - 20, 600);
        const aspectRatio = 5 / 6;
        
        canvas.width = maxWidth;
        canvas.height = maxWidth / aspectRatio;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f0f8ff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Dibujar elementos estáticos iniciales (adaptativos)
          const margin = Math.min(canvas.height * 0.1, 50);
          const centerX = canvas.width / 2;
          const platformWidth = Math.min(canvas.width * 0.3, 100);
          const platformHeight = Math.max(canvas.height * 0.03, 10);
          const fontSize = Math.max(canvas.width * 0.025, 10);
          
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(centerX - platformWidth/2, margin, platformWidth, platformHeight);
          ctx.fillStyle = '#000';
          ctx.font = `${fontSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText('Plataforma (0m)', centerX, margin + platformHeight + fontSize + 5);
          
          // Marcar L0
          const scale = (canvas.height - 2 * margin) / params.H;
          const L0Y = margin + platformHeight + params.L0 * scale;
          const L0Length = Math.min(canvas.width * 0.15, 50);
          
          ctx.strokeStyle = '#FFA500';
          ctx.lineWidth = Math.max(canvas.width * 0.005, 2);
          ctx.setLineDash([canvas.width * 0.02, canvas.width * 0.01]);
          ctx.beginPath();
          ctx.moveTo(centerX - L0Length, L0Y);
          ctx.lineTo(centerX + L0Length, L0Y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#FFA500';
          ctx.fillText(`L₀ = ${params.L0}m`, centerX + L0Length + 5, L0Y - 5);
        }
      }
    };

    initializeCanvas();
    
    // Reinicializar cuando la ventana cambie de tamaño
    const handleResize = () => {
      setTimeout(initializeCanvas, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [totalHeight, jumperMass, ropeLength, springConstant]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Título */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-blue-800">
            🪂 Simulación de Bungee Jumping - Centro Ibó
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Parámetros del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parámetros del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            {/* Parámetros modificables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Altura total */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Altura total de salto (m)</label>
                <input
                  type="number"
                  min="50"
                  max="200"
                  step="5"
                  value={totalHeight}
                  onChange={(e) => setTotalHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={isRunning}
                />
                <div className="text-xs text-gray-500">Rango: 50-200m</div>
              </div>

              {/* Masa del saltador */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Masa del saltador (kg)</label>
                <input
                  type="number"
                  min="40"
                  max="150"
                  step="5"
                  value={jumperMass}
                  onChange={(e) => setJumperMass(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={isRunning}
                />
                <div className="text-xs text-gray-500">Rango: 40-150kg</div>
              </div>

              {/* Longitud de la cuerda */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Longitud natural cuerda (m)</label>
                <input
                  type="number"
                  min="10"
                  max={totalHeight * 0.8}
                  step="2.5"
                  value={ropeLength}
                  onChange={(e) => setRopeLength(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={isRunning}
                />
                <div className="text-xs text-gray-500">Máximo: {(totalHeight * 0.8).toFixed(1)}m (80% altura)</div>
              </div>

              {/* Constante elástica */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Constante elástica k (N/m)</label>
                <input
                  type="number"
                  min="50"
                  max="500"
                  step="10"
                  value={springConstant}
                  onChange={(e) => setSpringConstant(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={isRunning}
                />
                <div className="text-xs text-gray-500">Rango: 50-500 N/m</div>
              </div>

            </div>

            {/* Botones de configuración predefinida */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Configuraciones Predefinidas</h4>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setTotalHeight(70);
                    setJumperMass(70);
                    setRopeLength(35);
                    setSpringConstant(140);
                  }}
                  disabled={isRunning}
                  className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Centro Ibó (Original)
                </button>
                <button
                  onClick={() => {
                    setTotalHeight(100);
                    setJumperMass(80);
                    setRopeLength(45);
                    setSpringConstant(160);
                  }}
                  disabled={isRunning}
                  className="px-4 py-2 text-sm bg-green-100 hover:bg-green-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salto Alto
                </button>
                <button
                  onClick={() => {
                    setTotalHeight(50);
                    setJumperMass(60);
                    setRopeLength(20);
                    setSpringConstant(200);
                  }}
                  disabled={isRunning}
                  className="px-4 py-2 text-sm bg-yellow-100 hover:bg-yellow-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salto Suave
                </button>
                <button
                  onClick={() => {
                    setTotalHeight(120);
                    setJumperMass(100);
                    setRopeLength(60);
                    setSpringConstant(120);
                  }}
                  disabled={isRunning}
                  className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salto Extremo
                </button>
              </div>
            </div>

            {/* Resumen actual */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Configuración Actual</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><strong>Altura:</strong> {totalHeight} m</div>
                <div><strong>Masa:</strong> {jumperMass} kg</div>
                <div><strong>Cuerda:</strong> {ropeLength} m</div>
                <div><strong>Elasticidad:</strong> {springConstant} N/m</div>
              </div>
              
              {/* Cálculos automáticos */}
              <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div><strong>Equilibrio teórico:</strong> {(ropeLength + (jumperMass * 9.81) / springConstant).toFixed(1)}m</div>
                  <div><strong>Punto más bajo estimado:</strong> {(ropeLength + (jumperMass * 9.81) / springConstant + Math.sqrt(2 * jumperMass * 9.81 * ropeLength) / Math.sqrt(springConstant / jumperMass)).toFixed(1)}m</div>
                  <div><strong>Margen de seguridad:</strong> {(totalHeight - (ropeLength + (jumperMass * 9.81) / springConstant + Math.sqrt(2 * jumperMass * 9.81 * ropeLength) / Math.sqrt(springConstant / jumperMass))).toFixed(1)}m</div>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Controles de Simulación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Controles de Simulación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            {/* Control de duración */}
            <div className="space-y-3">
              <h4 className="font-medium">Duración de la Simulación</h4>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium min-w-fit">Duración total:</label>
                <div className="flex-1">
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={simulationDuration}
                    onChange={(e) => setSimulationDuration(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isRunning}
                  />
                </div>
                <span className="text-sm text-gray-600 min-w-fit">
                  {simulationDuration} segundos
                </span>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Fase 1: 2.7s • Fase 2: {(simulationDuration - 2.7).toFixed(1)}s • 
                {isRunning ? ' Detén para cambiar' : ' Ajusta antes de iniciar'}
              </div>
              
              {/* Botones de duración predefinida */}
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  onClick={() => setSimulationDuration(10)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Corta (10s)
                </button>
                <button
                  onClick={() => setSimulationDuration(20)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Media (20s)
                </button>
                <button
                  onClick={() => setSimulationDuration(30)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Larga (30s)
                </button>
                <button
                  onClick={() => setSimulationDuration(60)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Muy Larga (60s)
                </button>
              </div>
            </div>

            <hr className="border-gray-200"/>

            {/* Control de amortiguamiento */}
            <div className="space-y-3">
              <h4 className="font-medium">Amortiguamiento (Realismo)</h4>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium min-w-fit">Amortiguamiento:</label>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={dampingLevel}
                    onChange={(e) => setDampingLevel(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isRunning}
                  />
                </div>
                <span className="text-sm text-gray-600 min-w-fit">
                  {dampingLevel === 0 ? 'Sin amortiguamiento' : 
                   dampingLevel <= 0.05 ? 'Muy poco' :
                   dampingLevel <= 0.15 ? 'Realista' :
                   dampingLevel <= 0.3 ? 'Alto' : 'Muy alto'}
                </span>
              </div>
              <div className="text-xs text-gray-500 text-center">
                γ = {dampingLevel.toFixed(2)} s⁻¹ • {dampingLevel === 0 ? 'Oscilación infinita (ideal)' : 'Oscilaciones se amortiguan gradualmente'}
              </div>
              
              {/* Botones de amortiguamiento predefinido */}
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  onClick={() => setDampingLevel(0)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sin Amortiguamiento (0)
                </button>
                <button
                  onClick={() => setDampingLevel(0.05)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Poco (0.05)
                </button>
                <button
                  onClick={() => setDampingLevel(0.1)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Realista (0.1)
                </button>
                <button
                  onClick={() => setDampingLevel(0.2)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Alto (0.2)
                </button>
              </div>
            </div>

            <hr className="border-gray-200"/>

            {/* Control de velocidad */}
            <div className="space-y-3">
              <h4 className="font-medium">Velocidad de Animación</h4>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium min-w-fit">Velocidad:</label>
                <div className="flex-1">
                  <input
                    type="range"
                    min="5"
                    max="200"
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isRunning}
                  />
                </div>
                <span className="text-sm text-gray-600 min-w-fit">
                  {animationSpeed === 5 ? 'Muy rápida' : 
                   animationSpeed <= 20 ? 'Rápida' :
                   animationSpeed <= 50 ? 'Normal' :
                   animationSpeed <= 100 ? 'Lenta' : 'Muy lenta'}
                </span>
              </div>
              <div className="text-xs text-gray-500 text-center">
                {animationSpeed}ms entre frames • {isRunning ? 'Detén la simulación para cambiar' : 'Ajusta antes de iniciar'}
              </div>
              
              {/* Botones de velocidad predefinida */}
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  onClick={() => setAnimationSpeed(5)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Muy Rápida (5ms)
                </button>
                <button
                  onClick={() => setAnimationSpeed(20)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs bg-orange-100 hover:bg-orange-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Rápida (20ms)
                </button>
                <button
                  onClick={() => setAnimationSpeed(50)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Normal (50ms)
                </button>
                <button
                  onClick={() => setAnimationSpeed(100)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lenta (100ms)
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              onClick={toggleSimulation}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? 'Pausar' : 'Iniciar'} Simulación
            </Button>
            <Button 
              onClick={resetSimulation}
              variant="outline"
            >
              Reset
            </Button>

            {/* <Button 
              onClick={debugKeyPoints}
              variant="outline"
              className="bg-purple-50 hover:bg-purple-100"
            >
              Debug Puntos Clave
            </Button> */}
          </div>
        </CardContent>
      </Card>

      {/* Canvas de visualización */}
      <Card>
        <CardHeader>
          <CardTitle>Visualización del Salto</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas 
            ref={canvasRef}
            className="border-2 border-gray-300 rounded-lg w-full mx-auto block bg-blue-50"
            style={{ 
              maxWidth: '600px',
              height: 'auto',
              aspectRatio: '6/5'
            }}
          />
          <div className="mt-2 text-sm text-gray-600 text-center">
            <div className="flex justify-center gap-4">
              <span><span className="inline-block w-3 h-3 bg-red-400 rounded mr-1"></span>Caída libre</span>
              <span><span className="inline-block w-3 h-3 bg-teal-400 rounded mr-1"></span>Cuerda elástica</span>
              <span><span className="inline-block w-3 h-3 bg-orange-400 rounded mr-1"></span>L₀ = 35m</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos en tiempo real */}
      {currentData && (
        <Card>
          <CardHeader>
            <CardTitle>Datos en Tiempo Real</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentData.time.toFixed(2)}s
                </div>
                <div className="text-sm text-gray-600">Tiempo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentData.position.toFixed(1)}m
                </div>
                <div className="text-sm text-gray-600">Posición</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currentData.velocity.toFixed(1)}m/s
                </div>
                <div className="text-sm text-gray-600">Velocidad</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {(currentData.force / params.m / params.g).toFixed(1)}G
                </div>
                <div className="text-sm text-gray-600">Fuerza (G)</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded-lg" style={{
              backgroundColor: currentData.phase === 'free_fall' ? '#fee2e2' : '#e0f2f1'
            }}>
              <div className="text-center font-semibold">
                {currentData.phase === 'free_fall' ? '🔥 FASE 1: Caída Libre' : '🌊 FASE 2: Cuerda Elástica'}
              </div>
            </div>

            {/* Análisis energético */}
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Análisis Energético (Joules)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <strong>Cinética:</strong> {currentData.energy.kinetic.toFixed(0)}J
                </div>
                <div>
                  <strong>Potencial:</strong> {currentData.energy.potential.toFixed(0)}J
                </div>
                <div>
                  <strong>Elástica:</strong> {currentData.energy.elastic.toFixed(0)}J
                </div>
                <div>
                  <strong>Total:</strong> {currentData.energy.total.toFixed(0)}J
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verificación de Resultados Teóricos */}
      <Card className="border-l-4 border-green-500">
        <CardHeader>
          <CardTitle className="text-green-700">✅ Verificación vs Datos Teóricos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">¿Cómo verificar que está funcionando correctamente?</h4>
              <div className="space-y-3 text-sm">
                
                <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                  <h5 className="font-semibold text-blue-800">1. Verificar Fase 1 (Caída Libre)</h5>
                  <ul className="mt-2 space-y-1 text-gray-700">
                    <li>• <strong>Duración:</strong> Debe durar exactamente <strong>2.67 segundos</strong></li>
                    <li>• <strong>Posición final:</strong> Debe llegar a <strong>35.0 metros</strong> (L₀)</li>
                    <li>• <strong>Velocidad final:</strong> Debe alcanzar <strong>26.2 m/s</strong></li>
                    <li>• <strong>Visual:</strong> Círculo rojo, cuerda punteada</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border-l-4 border-teal-500">
                  <h5 className="font-semibold text-teal-800">2. Verificar Fase 2 (Cuerda Elástica)</h5>
                  <ul className="mt-2 space-y-1 text-gray-700">
                    <li>• <strong>Punto más bajo:</strong> Debe alcanzar <strong>~59.1 metros</strong></li>
                    <li>• <strong>Primer rebote:</strong> Debe subir hasta <strong>~25-30 metros</strong></li>
                    <li>• <strong>Periodo de oscilación:</strong> <strong>~4.4 segundos</strong> por ciclo completo</li>
                    <li>• <strong>Visual:</strong> Círculo azul, cuerda sólida</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border-l-4 border-red-500">
                  <h5 className="font-semibold text-red-800">3. Verificar Fuerzas Máximas</h5>
                  <ul className="mt-2 space-y-1 text-gray-700">
                    <li>• <strong>En el punto más bajo:</strong> Fuerza debe ser <strong>~4.9G</strong></li>
                    <li>• <strong>Margen de seguridad:</strong> <strong>10.9 metros</strong> por debajo de los 70m</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border-l-4 border-yellow-500">
                  <h5 className="font-semibold text-yellow-800">4. Verificar Conservación de Energía</h5>
                  <ul className="mt-2 space-y-1 text-gray-700">
                    <li>• <strong>Energía total:</strong> Debe mantenerse constante (~0J con nuestra referencia)</li>
                    <li>• <strong>En caída libre:</strong> Solo energía cinética + potencial</li>
                    <li>• <strong>Con cuerda:</strong> Cinética + potencial + elástica</li>
                  </ul>
                </div>

              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📊 Valores Esperados Clave:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Al final de Fase 1 (t=2.67s):</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• Posición: 35.0m</li>
                    <li>• Velocidad: 26.2 m/s</li>
                    <li>• Energía cinética: ~24,067J</li>
                  </ul>
                </div>
                <div>
                  <strong>En el punto más bajo:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• Posición: ~59.1m</li>
                    <li>• Velocidad: 0 m/s</li>
                    <li>• Fuerza: ~4.9G (3,370N)</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Información matemática */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Matemático</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-blue-800">FASE 1: Caída Libre (0 ≤ t ≤ 2.67s)</h4>
              <div className="ml-4 text-sm space-y-1">
                <p><strong>Ecuación de posición:</strong> y(t) = 4.905t²</p>
                <p><strong>Ecuación de velocidad:</strong> v(t) = 9.81t</p>
                <p><strong>Duración:</strong> t₁ = √(2L₀/g) = 2.67 segundos</p>
                <p><strong>Velocidad final:</strong> v₁ = 26.2 m/s</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-teal-800">FASE 2: Cuerda Elástica (t > 2.67s)</h4>
              <div className="ml-4 text-sm space-y-1">
                <p><strong>Ecuación diferencial:</strong> d²y/dt² + (k/m)y = g + (k/m)L₀</p>
                <p><strong>Frecuencia angular:</strong> ω = √(k/m) = 1.414 rad/s</p>
                <p><strong>Punto más bajo:</strong> y_max = 59.07 m</p>
                <p><strong>Margen de seguridad:</strong> 70 - 59.07 = 10.93 m ✅</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-orange-800">Fuerzas Máximas</h4>
              <div className="ml-4 text-sm space-y-1">
                <p><strong>Fuerza máxima en la cuerda:</strong> 3,370 N</p>
                <p><strong>Factor de seguridad:</strong> 4.9G</p>
                <p><strong>Experiencia del saltador:</strong> Casi 5 veces su peso</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BungeeSimulation;