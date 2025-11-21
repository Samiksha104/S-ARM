/**
 * ARM ROBOT CONTROLLER SERVER (server.js)
 * ----------------------------------------------------
 * This Express server acts as a central hub (middleware) 
 * for the Arm Robot Controller system.
 */

const express = require('express');
const cors = require('cors'); 
const path = require('path'); 
const app = express();
// CRITICAL CHANGE: Use the port provided by the hosting environment (process.env.PORT), or default to 3000 for local testing.
const PORT = process.env.PORT || 3000;

// --- Configuration Constants ---
const MIN_ANGLE = 0;
const MAX_ANGLE = 180;
const MOVEMENT_COMMANDS = ['FRONT', 'BACK', 'LEFT', 'RIGHT', 'STOP'];
const ARM_ANGLE_COUNT = 5;

// --- Internal State Management ---
let robotState = {
    movementCommand: "STOP", 
    // Array order: [Rotate, Link 1, Link 2, Holder, Gripper]
    armAngles: [90, 90, 90, 90, 90]
};

// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 


// ===========================================
// 1. FRONTEND -> SERVER (POST Endpoints)
// ===========================================

app.post('/api/sarm/move', (req, res) => {
    // CORRECTED: The frontend sends a JSON body with the key 'direction'.
    const { direction: incomingDirection } = req.body; 
    const direction = incomingDirection ? incomingDirection.toUpperCase() : null;
    
    if (direction && MOVEMENT_COMMANDS.includes(direction)) {
        robotState.movementCommand = direction;
        console.log(`[POST /api/sarm/move] New movement command set: ${robotState.movementCommand}`);
        res.status(200).json({ status: 'OK', message: `Direction set: ${robotState.movementCommand}` });
    } else {
        res.status(400).json({ 
            status: 'Error', 
            message: `Invalid or missing direction parameter. Must be one of: ${MOVEMENT_COMMANDS.join(', ')}.` 
        });
    }
});

app.post('/api/sarm/arm', (req, res) => {
    const { angles } = req.body;
    
    if (Array.isArray(angles) && angles.length === ARM_ANGLE_COUNT) {
        const validAngles = angles.every(angle => 
            typeof angle === 'number' && angle >= MIN_ANGLE && angle <= MAX_ANGLE
        );
        
        if (validAngles) {
            robotState.armAngles = angles;
            console.log(`[POST /api/sarm/arm] New arm angles set: ${robotState.armAngles.join(', ')}`);
            res.status(200).json({ status: 'OK', message: 'Arm angles updated successfully.' });
        } else {
            res.status(400).json({ status: 'Error', message: `Invalid angle values. Must be ${ARM_ANGLE_COUNT} numbers between ${MIN_ANGLE} and ${MAX_ANGLE}.` });
        }
    } else {
        res.status(400).json({ status: 'Error', message: `Invalid array format. Expected an array of ${ARM_ANGLE_COUNT} angle values.` });
    }
});


// ===========================================
// 2. ESP SERVER -> ESP (GET Endpoints - Polling)
// ===========================================

app.get('/api/sarm/fetch/base', (req, res) => {
    // Sends plain text command for easiest parsing by ESP 1
    res.type('text/plain').send(robotState.movementCommand);
    console.log(`[GET /api/sarm/fetch/base] ESP 1 requested command: ${robotState.movementCommand}`);
});

app.get('/api/sarm/fetch/arm', (req, res) => {
    // Sends JSON array of angles for ESP 2
    res.json(robotState.armAngles);
    console.log(`[GET /api/sarm/fetch/arm] ESP 2 requested angles: ${robotState.armAngles.join(', ')}`);
});


// ===========================================
// 3. HTML Serving (For Frontend Web Page)
// ===========================================

// When a browser hits the base URL (http://IP:3000), send the index.html file.
// 1. Tell Express to look inside the 'frontend' folder for static assets
app.use(express.static(path.join(__dirname, '../frontend/build')));

// 3. For any unknown request, serve the main index.html (handles React client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});


// --- Start the server ---
app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`✅ SARM Robot Control Server is running at http://localhost:${PORT}`);
    console.log(`=================================================`);
    console.log(`\nEndpoints for Frontend (POST):`);
    console.log(`- Base Movement: http://localhost:${PORT}/api/sarm/move`);
    console.log(`- Arm Control: http://localhost:${PORT}/api/sarm/arm`);
    console.log(`\nEndpoints for ESPs (GET):`);
    console.log(`- ESP 1 (Movement): http://localhost:${PORT}/api/sarm/fetch/base`);
    console.log(`- ESP 2 (Arm Angles): http://localhost:${PORT}/api/sarm/fetch/arm`);
    console.log(`\n--- IMPORTANT: ESP Connection ---`);
    console.log(`Remember to replace 'localhost' with your computer's actual local IP address (e.g., 192.168.1.XX) when using the ESPs.`);
});