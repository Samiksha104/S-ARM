import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const StopCircle = ({ size = 24, className = '' }) => (
    React.createElement('svg', {
        className, xmlns: 'http://www.w3.org/2000/svg', width: size, height: size,
        viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2',
        strokeLinecap: 'round', strokeLinejoin: 'round'
    },
        React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
        React.createElement('rect', { width: '6', height: '6', x: '9', y: '9', fill: 'currentColor' })
    )
);

const RotateCcw = ({ size = 24, className = '' }) => (
    React.createElement('svg', {
        className, xmlns: 'http://www.w3.org/2000/svg', width: size, height: size,
        viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2',
        strokeLinecap: 'round', strokeLinejoin: 'round'
    },
        React.createElement('path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.79 2.91L3 12zm0 0h1v8' })
    )
);

const ChevronUp = ({ size = 24, className = '' }) => (
    React.createElement('svg', {
        className, xmlns: 'http://www.w3.org/2000/svg', width: size, height: size,
        viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2',
        strokeLinecap: 'round', strokeLinejoin: 'round'
    },
        React.createElement('path', { d: 'M18 15l-6-6-6 6' })
    )
);

const ChevronDown = ({ size = 24, className = '' }) => (
    React.createElement('svg', {
        className, xmlns: 'http://www.w3.org/2000/svg', width: size, height: size,
        viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2',
        strokeLinecap: 'round', strokeLinejoin: 'round'
    },
        React.createElement('path', { d: 'M6 9l6 6 6-6' })
    )
);

const ChevronLeft = ({ size = 24, className = '' }) => (
    React.createElement('svg', {
        className, xmlns: 'http://www.w3.org/2000/svg', width: size, height: size,
        viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2',
        strokeLinecap: 'round', strokeLinejoin: 'round'
    },
        React.createElement('path', { d: 'M15 18l-6-6 6-6' })
    )
);

const ChevronRight = ({ size = 24, className = '' }) => (
    React.createElement('svg', {
        className, xmlns: 'http://www.w3.org/2000/svg', width: size, height: size,
        viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2',
        strokeLinecap: 'round', strokeLinejoin: 'round'
    },
        React.createElement('path', { d: 'M9 18l6-6-6-6' })
    )
);

const API_BASE_URL = 'http://192.168.29.191:3000/api/sarm';
const SERVO_LABELS = ['Rotate', 'Link 1', 'Link 2', 'Holder', 'Gripper'];
const RESET_ANGLE = 90;
const INITIAL_ANGLES = SERVO_LABELS.map(() => RESET_ANGLE);
const MIN_ANGLE = 0;
const MAX_ANGLE = 180;
const DEBOUNCE_TIME_MS = 0;

const DarkThemeCss = `
  :root {
      --color-dark-bg: #0d0c1d;
      --color-card-bg: #1a1835;
      --color-primary: #8a2be2;
      --color-secondary: #00bcd4;
      --color-accent: #ffeb3b;
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

  .game-controller {
      width: 95vw;
      height: 95vh;
      max-width: 1200px;
      padding: 1rem;
      position: relative;
      overflow: hidden;
  }

  .sparkle-bg {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at 100% 100%, #1a183533, transparent 50%),
                  radial-gradient(circle at 0% 0%, #8a2be233, transparent 60%);
      opacity: 0.5;
      pointer-events: none;
  }

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

  .status-display { text-align: center; margin-top: 1.5rem; }
  .status-label { font-size: 0.8rem; color: var(--color-secondary); font-weight: 500; }
  .status-value { font-size: 1.5rem; font-weight: 800; color: var(--color-text-light); letter-spacing: 1px; transition: color 0.3s; }
  .status-value.moving { color: var(--color-accent); }

  .servo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-top: 1rem;
      overflow-y: auto;
      max-height: 400px;
  }

  .arc-control {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
      background-color: #24224a;
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
      touch-action: none;
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
  .arm-status-value { flex-grow: 1; font-family: monospace; color: var(--color-text-light); word-break: break-all; }
  .sending-indicator {
      color: var(--color-accent);
      animation: pulsate 1s infinite alternate;
      font-size: 1.5rem;
      line-height: 0;
  }
  @keyframes pulsate { 0% { opacity: 0.5; } 100% { opacity: 1; } }

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

      .arm-section {
          flex: 3;
          height: 100%;
          overflow: hidden;
          padding: 1rem 1.5rem;
          display: flex;
          flex-direction: column;
      }

      .movement-section {
          flex: 1;
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
          max-height: none;
          overflow-y: auto;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          padding-bottom: 1rem;
      }

      .dpad-container {
          width: 100%;
          max-width: 250px;
      }
  }
`;

const StyleInjector = () => React.createElement('style', { dangerouslySetInnerHTML: { __html: DarkThemeCss } });

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

        angleDeg = Math.min(180, Math.max(0, angleDeg));

        const servoAngle = 180 - angleDeg;

        const normalizedAngle = Math.round((servoAngle / 180) * (max - min) + min);
        return normalizedAngle;
    }, [center, min, max]);

    const getThumbPosition = useMemo(() => {
        const normalizedValue = ((value - min) / (max - min)) * 180;
        const svgAngle = 180 - normalizedValue;

        const angleRad = degToRad(svgAngle);
        return {
            x: arcCenter + radius * Math.cos(angleRad),
            y: arcCenter + radius * Math.sin(angleRad),
        };
    }, [value, min, max, arcCenter, radius]);

    const d = `M ${arcCenter - radius}, ${arcCenter} A ${radius}, ${radius} 0 1 1 ${arcCenter + radius}, ${arcCenter}`.trim();
    const circumference = Math.PI * radius;
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

    return React.createElement('div', { className: 'arc-control' },
        React.createElement('div', { className: 'arc-label' }, label),
        React.createElement('div', {
            className: 'arc-svg-container',
            ref: svgRef,
            onMouseDown: handleStart,
            onTouchStart: handleStart
        },
            React.createElement('svg', { viewBox: `0 0 ${size} ${size}`, preserveAspectRatio: 'xMidYMin meet' },
                React.createElement('path', { d, className: 'arc-track', strokeLinecap: 'round' }),
                React.createElement('path', {
                    d,
                    className: 'arc-progress',
                    strokeLinecap: 'round',
                    style: {
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                    }
                }),
                React.createElement('circle', {
                    cx: getThumbPosition.x,
                    cy: getThumbPosition.y,
                    r: strokeWidth / 2 + 5,
                    className: 'arc-thumb',
                    onMouseDown: handleStart,
                    onTouchStart: handleStart
                })
            )
        ),
        React.createElement('div', { className: 'arc-value' }, `${value}°`),
        React.createElement('button', {
            onClick: () => onUpdate(index, resetValue),
            disabled: value === resetValue,
            className: 'arc-reset',
            title: `Reset to ${resetValue}°`
        },
            React.createElement(RotateCcw, { size: 14 }),
            'RESET'
        )
    );
});

function App() {
    const [armAngles, setArmAngles] = useState(INITIAL_ANGLES);
    const [currentDirection, setCurrentDirection] = useState('STOP');
    const [isSendingArm, setIsSendingArm] = useState(false);
    const [toast, setToast] = useState(null);
    const debounceTimerRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const sendMovementCommand = async (direction) => {
        try {
            const response = await fetch(`${API_BASE_URL}/movement`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ direction }),
            });
            if (!response.ok) throw new Error('Movement command failed');
        } catch (error) {
            showToast(`Movement error: ${error.message}`, 'error');
        }
    };

    const sendArmAngles = async (angles) => {
        setIsSendingArm(true);
        try {
            const response = await fetch(`${API_BASE_URL}/arm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ angles }),
            });
            if (!response.ok) throw new Error('Arm update failed');
        } catch (error) {
            showToast(`Arm error: ${error.message}`, 'error');
        } finally {
            setIsSendingArm(false);
        }
    };

    const handleDirectionPress = (direction) => {
        setCurrentDirection(direction);
        sendMovementCommand(direction);
    };

    const handleDirectionRelease = () => {
        setCurrentDirection('STOP');
        sendMovementCommand('STOP');
    };

    const handleArmUpdate = useCallback((index, newValue) => {
        setArmAngles((prev) => {
            const updated = [...prev];
            updated[index] = newValue;
            return updated;
        });
    }, []);

    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            sendArmAngles(armAngles);
        }, DEBOUNCE_TIME_MS);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [armAngles]);

    const renderDpadButton = (className, direction, icon, isStop = false) => {
        if (isStop) {
            return React.createElement('button', {
                className: `dpad-btn ${className}`,
                onClick: () => {
                    handleDirectionPress('STOP');
                    showToast('Emergency Stop Activated', 'error');
                }
            },
                React.createElement(icon, { size: 32 })
            );
        }
        return React.createElement('button', {
            className: `dpad-btn ${className} ${currentDirection === direction ? 'active' : ''}`,
            onMouseDown: () => handleDirectionPress(direction),
            onMouseUp: handleDirectionRelease,
            onMouseLeave: handleDirectionRelease,
            onTouchStart: () => handleDirectionPress(direction),
            onTouchEnd: handleDirectionRelease
        },
            React.createElement(icon, { size: 32 })
        );
    };

    return React.createElement(React.Fragment, null,
        React.createElement(StyleInjector),
        React.createElement('div', { className: 'game-controller' },
            React.createElement('div', { className: 'sparkle-bg' }),

            toast && React.createElement('div', { className: `status-toast ${toast.type}` },
                toast.type === 'success' ? '✓' : '✗',
                ' ',
                toast.message
            ),

            React.createElement('div', { className: 'controller-layout' },
                React.createElement('section', { className: 'arm-section' },
                    React.createElement('div', { className: 'section-header' },
                        React.createElement('span', { className: 'header-icon' }, '⚙️'),
                        React.createElement('h2', null, 'ARM SERVOS')
                    ),
                    React.createElement('div', { className: 'servo-grid' },
                        armAngles.map((angle, idx) =>
                            React.createElement(ArcSlider, {
                                key: idx,
                                index: idx,
                                value: angle,
                                onUpdate: handleArmUpdate,
                                min: MIN_ANGLE,
                                max: MAX_ANGLE,
                                resetValue: RESET_ANGLE,
                                label: SERVO_LABELS[idx]
                            })
                        )
                    ),
                    React.createElement('div', { className: 'arm-status' },
                        React.createElement('span', { className: 'arm-status-label' }, 'Status:'),
                        React.createElement('span', { className: 'arm-status-value' },
                            armAngles.map((a, i) => `${SERVO_LABELS[i]}:${a}°`).join(' | ')
                        ),
                        isSendingArm && React.createElement('span', { className: 'sending-indicator' }, '⚡')
                    )
                ),

                React.createElement('section', { className: 'movement-section' },
                    React.createElement('div', { className: 'section-header' },
                        React.createElement('span', { className: 'header-icon' }, '🎮'),
                        React.createElement('h2', null, 'MOVEMENT')
                    ),
                    React.createElement('div', { className: 'dpad-container' },
                        renderDpadButton('dpad-up', 'FORWARD', ChevronUp),
                        renderDpadButton('dpad-left', 'LEFT', ChevronLeft),
                        renderDpadButton('dpad-center', null, StopCircle, true),
                        renderDpadButton('dpad-right', 'RIGHT', ChevronRight),
                        renderDpadButton('dpad-down', 'BACKWARD', ChevronDown)
                    ),
                    React.createElement('div', { className: 'status-display' },
                        React.createElement('div', { className: 'status-label' }, 'CURRENT DIRECTION'),
                        React.createElement('div', { className: `status-value ${currentDirection !== 'STOP' ? 'moving' : ''}` },
                            currentDirection
                        )
                    )
                )
            )
        )
    );
}

export default App;
