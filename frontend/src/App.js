import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StopCircle, RotateCcw, Zap, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://192.168.29.191:3000/api/sarm';
const SERVO_LABELS = ['Rotate', 'Link 1', 'Link 2', 'Holder', 'Gripper'];
const ARM_ANGLE_COUNT = SERVO_LABELS.length;
const RESET_ANGLE = 90;
const INITIAL_ANGLES = SERVO_LABELS.map(() => RESET_ANGLE);
const MIN_ANGLE = 0;
const MAX_ANGLE = 180;
const DEBOUNCE_TIME_MS = 0; // Keeping the user's requested 0ms debounce (sends immediately)

// =================================================================
// 1. STYLING (DARK, FUTURISTIC THEME & 75/25 LANDSCAPE LAYOUT)
// =================================================================

const DarkThemeCss = `
  /* Global Variables */
  :root {
      --color-dark-bg: #0d0c1d; /* Deep Space Blue */
      --color-card-bg: #1a1835; /* Slightly lighter card base */
      --color-primary: #8a2be2; /* Electric Violet */
      --color-secondary: #00bcd4; /* Aqua Cyan */
      --color-accent: #ffeb3b; /* Yellow for Active States */
      --color-text-light: #e0e0e0;
      --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.5);
      --shadow-sm: 0 4px 10px rgba(0, 0, 0, 0.3);
      --border-radius-xl: 20px;
  }

  body {
      background-color: var(--color-dark-bg);
      font-family: 'Inter', 'Arial', sans-serif;
      color: var(--color-text-light);
      margin: 0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
  }

  /* Main Container */
  .game-controller {
      width: 95vw;
      height: 95vh;
      max-width: 1200px;
      padding: 1rem;
      position: relative;
      overflow: hidden;
  }
  
  /* Sparkle BG Effect (Visual Flair) */
  .sparkle-bg {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at 100% 100%, #1a183533, transparent 50%),
                  radial-gradient(circle at 0% 0%, #8a2be233, transparent 60%);
      opacity: 0.5;
      pointer-events: none;
  }

  /* Status Toast */
  .status-toast {
      position: absolute;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      padding: 10px 20px;
      border-radius: var(--border-radius-xl);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: var(--shadow-lg);
      animation: fadeInOut 3s forwards;
  }
  .status-toast.success { background-color: #008080; border: 1px solid #7fffd4; }
  .status-toast.error { background-color: #8b0000; border: 1px solid #ff4500; }
  @keyframes fadeInOut { 0%, 100% { opacity: 0; } 10%, 90% { opacity: 1; } }


  /* Default Layout (Mobile Portrait - Stacked) */
  .controller-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      height: 100%;
      overflow-y: auto;
      padding: 0 0.5rem;
  }

  .movement-section, .arm-section {
      background-color: var(--color-card-bg);
      border-radius: var(--border-radius-xl);
      padding: 1.5rem;
      box-shadow: var(--shadow-lg);
  }

  .section-header {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      color: var(--color-secondary);
      font-size: 1.25rem;
      border-bottom: 2px solid rgba(138, 43, 226, 0.3);
      padding-bottom: 0.5rem;
  }
  .header-icon { margin-right: 10px; font-size: 1.5rem; }
  .section-header h2 { font-weight: 700; margin: 0; letter-spacing: 1px; }

  /* D-Pad Styling */
  .dpad-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 10px;
      width: 250px;
      height: 250px;
      margin: 0 auto;
      aspect-ratio: 1 / 1;
  }
  .dpad-btn {
      background-color: rgba(138, 43, 226, 0.5); 
      border: 2px solid var(--color-primary);
      color: var(--color-text-light);
      border-radius: 12px;
      transition: background-color 0.15s, transform 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
  }
  .dpad-btn:hover { background-color: var(--color-primary); }
  .dpad-btn.active { 
      background-color: var(--color-accent) !important; 
      color: var(--color-dark-bg);
      border-color: var(--color-accent);
      box-shadow: 0 0 15px var(--color-accent);
      transform: scale(0.98);
  }
  .dpad-center { grid-area: 2 / 2 / 3 / 3; background-color: #dc3545; border-color: #ff6347; }
  .dpad-center:hover { background-color: #bd2130; }
  .dpad-up { grid-area: 1 / 2 / 2 / 3; }
  .dpad-down { grid-area: 3 / 2 / 4 / 3; }
  .dpad-left { grid-area: 2 / 1 / 3 / 2; }
  .dpad-right { grid-area: 2 / 3 / 3 / 4; }
  .dpad-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Movement Status */
  .status-display { text-align: center; margin-top: 1.5rem; }
  .status-label { font-size: 0.8rem; color: var(--color-secondary); font-weight: 500; }
  .status-value { font-size: 1.5rem; font-weight: 800; color: var(--color-text-light); letter-spacing: 1px; transition: color 0.3s; }
  .status-value.moving { color: var(--color-accent); }

  /* Servo Grid */
  .servo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
      overflow-y: auto;
      max-height: 400px; /* Limit height in portrait */
  }

  /* Arc Slider Component Styles */
  .arc-control {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
      background-color: #24224a; /* Inner servo card background */
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
      position: relative;
  }
  .arc-label { font-size: 0.85rem; font-weight: 600; color: var(--color-secondary); margin-bottom: 0.5rem; }
  .arc-svg-container {
      width: 100px;
      height: 60px;
      position: relative;
      cursor: grab;
      touch-action: none; /* Crucial for touch dragging */
  }
  .arc-svg-container:active { cursor: grabbing; }
  .arc-track { 
      fill: none; 
      stroke: rgba(255, 255, 255, 0.1); 
      stroke-width: 14; 
  }
  .arc-progress { 
      fill: none; 
      stroke: var(--color-primary); 
      stroke-width: 14; 
      transform: rotate(180deg);
      transform-origin: center;
  }
  .arc-thumb {
      fill: var(--color-accent);
      stroke: var(--color-dark-bg);
      stroke-width: 3;
      cursor: pointer;
  }
  .arc-value { font-size: 1.2rem; font-weight: 800; margin: 0.5rem 0; color: var(--color-text-light); }
  .arc-reset {
      background-color: rgba(255, 255, 255, 0.1);
      color: var(--color-text-light);
      border: 1px solid var(--color-primary);
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: background-color 0.15s;
      margin-top: 0.5rem;
  }
  .arc-reset:hover { background-color: rgba(138, 43, 226, 0.3); }
  .arc-reset:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Arm Status Output */
  .arm-status {
      margin-top: 1.5rem;
      padding: 10px;
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      font-size: 0.8rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 5px;
  }
  .arm-status-label { font-weight: 600; color: var(--color-secondary); }
  .arm-status-value { flex-grow: 1; font-family: monospace; color: var(--color-text-medium); word-break: break-all; }
  .sending-indicator { 
      color: var(--color-accent); 
      animation: pulsate 1s infinite alternate; 
      font-size: 1.5rem;
      line-height: 0;
  }
  @keyframes pulsate { 0% { opacity: 0.5; } 100% { opacity: 1; } }


  /* -------------------------------------
     LANDSCAPE MOBILE LAYOUT (CRITICAL)
     75% Servos (Left) | 25% Movement (Right)
     ------------------------------------- */
  @media (orientation: landscape) and (max-height: 900px) and (min-width: 600px) {
      .game-controller {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 98vw;
          height: 98vh;
          max-width: none;
          padding: 0.5rem;
      }

      .controller-layout {
          flex-direction: row;
          gap: 1rem;
          height: 100%;
          width: 100%;
          overflow: hidden;
          padding: 0;
      }

      /* Arm Servos (Left) - 75% */
      .arm-section {
          flex: 3; /* 75% width */
          height: 100%;
          overflow: hidden;
          padding: 1rem 1.5rem;
          display: flex;
          flex-direction: column;
      }

      /* Movement Controls (Right) - 25% */
      .movement-section {
          flex: 1; /* 25% width */
          height: 100%;
          overflow: hidden;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
      }
      
      .servo-grid {
          flex-grow: 1;
          max-height: none; /* Full height in landscape */
          overflow-y: auto;
          /* Ensure good spacing for 5 controls */
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          padding-bottom: 1rem;
      }

      .dpad-container {
          width: 100%;
          max-width: 250px; /* Keep D-pad manageable in 25% column */
      }
  }
`;

const StyleInjector = () => (
    <style dangerouslySetInnerHTML={{ __html: DarkThemeCss }} />
);

// =================================================================
// 2. ARC SLIDER COMPONENT (JS VERSION)
// =================================================================

const ArcSlider = React.memo(({ index, value, onUpdate, min, max, resetValue, label }) => {
    const svgRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [center, setCenter] = useState({ x: 0, y: 0 });
    const [radius, setRadius] = useState(0);

    const size = 100;
    const strokeWidth = 14;
    const arcRadius = size / 2 - strokeWidth / 2;
    const arcCenter = size / 2;

    const updateGeometry = useCallback(() => {
        // Use requestAnimationFrame for safer DOM measurement updates
        requestAnimationFrame(() => {
            if (svgRef.current) {
                const rect = svgRef.current.getBoundingClientRect();
                setCenter({ x: rect.left + arcCenter, y: rect.top + arcCenter });
                setRadius(arcRadius);
            }
        });
    }, [arcCenter, arcRadius]);

    useEffect(() => {
        updateGeometry();
        window.addEventListener('resize', updateGeometry);
        // Initial measurement delay to ensure container is rendered
        const initialMeasure = setTimeout(updateGeometry, 100); 

        return () => {
            window.removeEventListener('resize', updateGeometry);
            clearTimeout(initialMeasure);
        };
    }, [updateGeometry]);

    const degToRad = (deg) => (deg - 180) * (Math.PI / 180);

    const calculateAngle = useCallback((clientX, clientY) => {
        const dx = clientX - center.x;
        const dy = clientY - center.y;
        
        let angleRad = Math.atan2(dy, dx);
        let angleDeg = angleRad * (180 / Math.PI) + 180; 

        // Clamp angle to 0-180 degrees (bottom half circle)
        angleDeg = Math.min(180, Math.max(0, angleDeg)); 
        
        // Map the SVG angle (0 at right, 180 at left) to the Servo angle (0 at left, 180 at right)
        const servoAngle = 180 - angleDeg; 
        
        // Normalize and round to integer value within min/max bounds
        const normalizedAngle = Math.round((servoAngle / 180) * (max - min) + min);
        return normalizedAngle;
    }, [center, min, max]);

    const getThumbPosition = useMemo(() => {
        // Convert servo value back to SVG display angle (0-180)
        const normalizedValue = ((value - min) / (max - min)) * 180;
        const svgAngle = 180 - normalizedValue;
        
        const angleRad = degToRad(svgAngle);
        return {
            x: arcCenter + radius * Math.cos(angleRad),
            y: arcCenter + radius * Math.sin(angleRad),
        };
    }, [value, min, max, arcCenter, radius]);

    // Path for the half-circle arc from 180 to 0 degrees (left to right)
    const d = `M ${arcCenter - radius}, ${arcCenter} A ${radius}, ${radius} 0 1 1 ${arcCenter + radius}, ${arcCenter}`.trim();
    const circumference = Math.PI * radius;
    // Offset calculation for the progress bar (must be relative to 180 degrees)
    const offset = circumference - ((value - min) / (max - min)) * circumference;

    const handleStart = (e) => {
        e.preventDefault();
        setIsDragging(true);
        updateGeometry();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        onUpdate(index, calculateAngle(clientX, clientY));
    };

    const handleMove = useCallback((e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        onUpdate(index, calculateAngle(clientX, clientY));
    }, [isDragging, onUpdate, index, calculateAngle]);

    const handleEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Effect to attach/detach global drag listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('touchend', handleEnd);
            window.addEventListener('touchcancel', handleEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('touchcancel', handleEnd);
        };
    }, [isDragging, handleMove, handleEnd]);

    return (
        <div className="arc-control">
            <div className="arc-label">{label}</div>
            <div
                className="arc-svg-container"
                ref={svgRef}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
            >
                <svg viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="xMidYMin meet">
                    {/* Background Arc */}
                    <path d={d} className="arc-track" strokeLinecap="round" />
                    {/* Progress Arc */}
                    <path
                        d={d}
                        className="arc-progress"
                        strokeLinecap="round"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset,
                        }}
                    />
                    {/* Thumb */}
                    <circle
                        cx={getThumbPosition.x}
                        cy={getThumbPosition.y}
                        r={strokeWidth / 2 + 5}
                        className="arc-thumb"
                        // Re-attach start listeners for the thumb itself
                        onMouseDown={handleStart}
                        onTouchStart={handleStart}
                    />
                </svg>
            </div>
            <div className="arc-value">{value}°</div>
            <button
                onClick={() => onUpdate(index, resetValue)}
                disabled={value === resetValue}
                className="arc-reset"
                title={`Reset to ${resetValue}°`}
            >
                <RotateCcw size={14} />
                RESET
            </button>
        </div>
    );
});


// =================================================================
// 3. MAIN APP COMPONENT (JS VERSION)
// =================================================================

function App() {
    const [movementCommand, setMovementCommand] = useState('STOP');
    const [movementOutput, setMovementOutput] = useState('STOP');
    const [isMovementSending, setIsMovementSending] = useState(false);
    const [currentArmAngles, setCurrentArmAngles] = useState(INITIAL_ANGLES);
    const [stableArmAngles, setStableArmAngles] = useState(INITIAL_ANGLES);
    const [armOutput, setArmOutput] = useState(JSON.stringify(INITIAL_ANGLES));
    const [isArmSending, setIsArmSending] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '', visible: false });
    const currentCommandRef = useRef('STOP');

    const showStatus = useCallback((message, type) => {
        setStatus({ message, type, visible: true });
        setTimeout(() => {
            setStatus((prev) => ({ ...prev, visible: false }));
        }, 3000);
    }, []);

    // --- Movement Logic ---
    const sendCommand = useCallback(
        async (direction) => {
            const endpoint = `${API_BASE_URL}/move`;
            setMovementOutput(direction);
            setIsMovementSending(true);

            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ direction: direction }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(
                            `HTTP error! Status: ${response.status}. Server response: ${errorText.substring(0, 100)}`
                        );
                    }

                    showStatus(`Movement '${direction}' sent!`, 'success');
                    setIsMovementSending(false);
                    return;
                } catch (error) {
                    if (attempt === 2) {
                        console.error('Error sending movement command after 3 attempts:', error);
                        showStatus(`Failed: ${error.message}`, 'error');
                    }
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
            setIsMovementSending(false);
        },
        [showStatus]
    );

    const handleMovementToggle = useCallback(
        (direction) => {
            let newCommand;
            // If the same direction button is pressed, toggle to STOP
            if (currentCommandRef.current === direction && direction !== 'STOP') {
                newCommand = 'STOP';
            } else {
                newCommand = direction;
            }
            setMovementCommand(newCommand);
            currentCommandRef.current = newCommand;
            sendCommand(newCommand);
        },
        [sendCommand]
    );

    // --- Arm Logic ---
    const updateArmAngle = useCallback((index, newValue) => {
        const safeValue = Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, parseInt(newValue.toString(), 10)));
        setCurrentArmAngles((prevAngles) => {
            const newAngles = [...prevAngles];
            newAngles[index] = safeValue;
            return newAngles;
        });
    }, []);

    const sendArmCommand = useCallback(
        async (anglesToSend) => {
            const endpoint = `${API_BASE_URL}/arm`;
            const jsonArrayString = JSON.stringify(anglesToSend);
            setArmOutput(jsonArrayString);
            setIsArmSending(true);

            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ angles: anglesToSend }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(
                            `HTTP error! Status: ${response.status}. Server response: ${errorText.substring(0, 100)}`
                        );
                    }

                    setStableArmAngles(anglesToSend);
                    showStatus('Arm updated!', 'success');
                    setIsArmSending(false);
                    return;
                } catch (error) {
                    if (attempt === 2) {
                        console.error('Error sending arm command after 3 attempts:', error);
                        showStatus(`Failed: ${error.message}`, 'error');
                    }
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
            setIsArmSending(false);
        },
        [showStatus]
    );

    // Debounce effect for arm angle changes
    useEffect(() => {
        if (JSON.stringify(currentArmAngles) === JSON.stringify(stableArmAngles)) {
            return;
        }
        const handler = setTimeout(() => {
            if (currentArmAngles.length === ARM_ANGLE_COUNT) {
                sendArmCommand(currentArmAngles);
            }
        }, DEBOUNCE_TIME_MS);
        return () => {
            clearTimeout(handler);
        };
    }, [currentArmAngles, stableArmAngles, sendArmCommand]);

    return (
        <>
            <StyleInjector />
            <div className="game-controller">
                <div className="sparkle-bg"></div>

                {status.visible && (
                    <div className={`status-toast ${status.type}`}>
                        <Zap size={16} />
                        {status.message}
                    </div>
                )}

                <div className="controller-layout">
                    {/* 1. ARM SERVOS (75% WIDTH IN LANDSCAPE) */}
                    <div className="arm-section">
                        <div className="section-header">
                            <div className="header-icon">🦾</div>
                            <h2>ARM SERVOS</h2>
                        </div>

                        <div className="servo-grid">
                            {currentArmAngles.map((angle, index) => (
                                <ArcSlider
                                    key={index}
                                    index={index}
                                    value={angle}
                                    onUpdate={updateArmAngle}
                                    min={MIN_ANGLE}
                                    max={MAX_ANGLE}
                                    resetValue={RESET_ANGLE}
                                    label={SERVO_LABELS[index]}
                                />
                            ))}
                        </div>

                        <div className="arm-status">
                            <span className="arm-status-label">Last Sent:</span>
                            <span className="arm-status-value">{armOutput}</span>
                            {isArmSending && <span className="sending-indicator">●</span>}
                        </div>
                    </div>

                    {/* 2. BASE CONTROL (25% WIDTH IN LANDSCAPE) */}
                    <div className="movement-section">
                        <div className="section-header">
                            <div className="header-icon">🎮</div>
                            <h2>BASE CONTROL</h2>
                        </div>

                        <div className="dpad-container">
                            <button
                                className={`dpad-btn dpad-up ${movementCommand === 'FRONT' ? 'active' : ''}`}
                                onClick={() => handleMovementToggle('FRONT')}
                                disabled={isMovementSending}
                                title="Move Forward"
                            >
                                <ChevronUp size={24} />
                            </button>
                            <button
                                className={`dpad-btn dpad-left ${movementCommand === 'LEFT' ? 'active' : ''}`}
                                onClick={() => handleMovementToggle('LEFT')}
                                disabled={isMovementSending}
                                title="Turn Left"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                className={`dpad-btn dpad-center ${movementCommand === 'STOP' ? 'active' : ''}`}
                                onClick={() => handleMovementToggle('STOP')}
                                disabled={isMovementSending}
                                title="Stop All Movement"
                            >
                                <StopCircle size={32} />
                            </button>
                            <button
                                className={`dpad-btn dpad-right ${movementCommand === 'RIGHT' ? 'active' : ''}`}
                                onClick={() => handleMovementToggle('RIGHT')}
                                disabled={isMovementSending}
                                title="Turn Right"
                            >
                                <ChevronRight size={24} />
                            </button>
                            <button
                                className={`dpad-btn dpad-down ${movementCommand === 'BACK' ? 'active' : ''}`}
                                onClick={() => handleMovementToggle('BACK')}
                                disabled={isMovementSending}
                                title="Move Backward"
                            >
                                <ChevronDown size={24} />
                            </button>
                        </div>

                        <div className="status-display">
                            <div className="status-label">STATUS</div>
                            <div className={`status-value ${movementOutput !== 'STOP' ? 'moving' : ''}`}>
                                {movementOutput}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default App;