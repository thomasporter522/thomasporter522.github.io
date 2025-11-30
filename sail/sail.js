// Ship sailing simulation in JavaScript
// Translated from ship.py

const SCREENSIZE = { width: window.innerWidth, height: window.innerHeight };
const SCREENCENTER = { x: SCREENSIZE.width / 2, y: SCREENSIZE.height / 2 };

const SHIP_LENGTH = 100;
const SHIP_WIDTH = 40;
const SHIP_COLOR = "rgb(150,100,0)";
const SAIL_COLOR = "rgb(255,255,255)";
const RUDDER_COLOR = SHIP_COLOR;
const WATER_COLOR = "rgb(100,200,250)";
const WIND_COLOR = "rgb(150,225,250)";
const CLEAR_WIND_COLOR = "rgba(150,225,250,0.5)"
const EFFICIENCY_COLOR_MAIN = "rgb(255,0,0)"
const EFFICIENCY_COLOR_SECOND = "rgb(255, 169, 169)"

const WINDSCALE = 8;
const DRAG = 0.05;

const WINDPARA = true;
const DRAGVECTOR = false;

// Utility functions
function rotate(v, heading) {
    return {
        x: v.x * Math.cos(heading) + v.y * Math.sin(heading),
        y: v.y * Math.cos(heading) - v.x * Math.sin(heading)
    };
}

function sum(v1, v2) {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
}

function midpoint(v1, v2) {
    return { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
}

function scale(v, c) {
    return { x: v.x * c, y: v.y * c };
}

function distance(v1, v2) {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
}

function worldToScreen(worldPos, shipPos) {
    return sum(SCREENCENTER, sum(worldPos, scale(shipPos, -1)));
}

// Ship and sailing functions
function shipTriangle(pos, heading) {
    const v0 = { x: 0, y: -SHIP_LENGTH * 0.3 };
    const v1 = { x: SHIP_WIDTH / 2, y: SHIP_LENGTH * 0.7 };
    const v2 = { x: -SHIP_WIDTH / 2, y:     SHIP_LENGTH * 0.7 };
    
    return [
        sum(pos, rotate(v0, heading)),
        sum(pos, rotate(v1, heading)),
        sum(pos, rotate(v2, heading))
    ];
}

function shipPentagon(pos, heading) {
    const v0 = { x: 0, y: -SHIP_LENGTH * 0.3 };
    const v1 = { x: SHIP_WIDTH / 2, y: 0 };
    const v2 = { x: -SHIP_WIDTH / 2, y: 0 };
    const v3 = { x: +SHIP_WIDTH / 2, y: SHIP_LENGTH * 0.7 };
    const v4 = { x: -SHIP_WIDTH / 2, y: SHIP_LENGTH * 0.7 };
    
    return [
        sum(pos, rotate(v0, heading)),
        sum(pos, rotate(v1, heading)),
        sum(pos, rotate(v3, heading)),
        sum(pos, rotate(v4, heading)),
        sum(pos, rotate(v2, heading))
    ];
}

function sailLine(pos, heading, sailAngle) {
    const v = { x: 0, y: SHIP_LENGTH * 0.7 };
    return [pos, sum(pos, rotate(v, heading + sailAngle))];
}

function efficiencyLine(pos, heading, sailAngle, efficiency) {
    const v = { x: 0, y: SHIP_LENGTH * 0.7 };
    return [pos, sum(pos, scale(rotate(v, heading + sailAngle), efficiency))];
}

function rudderLine(triangle, heading, rudderAngle) {
    const center = midpoint(triangle[1], triangle[2]);
    const v = { x: 0, y: SHIP_LENGTH * 0.3 };
    return [center, sum(center, rotate(v, heading + rudderAngle))];
}

function dragLine(triangle, heading, dragForce) {
    const center = midpoint(triangle[1], triangle[2]);
    const v = { x: 0, y: -dragForce * 10 };
    return [center, sum(center, rotate(v, heading))];
}

function relWindPara(endpoints, windHeading, relSpeed) {
    const v = { x: 0, y: -relSpeed * 10 };
    return [endpoints[1], sum(endpoints[1], rotate(v, windHeading)), sum(endpoints[0], rotate(v, windHeading)), endpoints[0]];
}

function windicator(windHeading, windSpeed) {
    const center = { x: 100, y: 100 };
    const v0 = scale({ x: -30, y: 20 }, 10 * windSpeed/WINDSCALE/7);
    const v1 = scale({ x: 30, y: 20 }, 10 * windSpeed/WINDSCALE/7);
    const v2 = scale({ x: 0, y: -50 }, 10 * windSpeed/WINDSCALE/7);
    
    return [
        sum(center, rotate(v0, windHeading)),
        center,
        sum(center, rotate(v1, windHeading)),
        sum(center, rotate(v2, windHeading))
    ];
}

function efficiency(angle1, angle2) {
    return Math.cos(angle1 - angle2);
}

function generateLand(position, variance, n) {
    if (n === 0) {
        variance = variance * 4;
        return [position];
    } else {
        const m = Math.floor(12 / Math.sqrt(n));
        let result = [];
        for (let i = 0; i < m; i++) {
            const p = {
                x: gaussianRandom(position.x, variance),
                y: gaussianRandom(position.y, variance)
            };
            result = result.concat(generateLand(p, variance / 2, n - 1));
        }
        return result;
    }
}

// Seeded random number generator (Linear Congruential Generator)
class SeededRandom {
    constructor(seed) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }
    
    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
}

// Simple Gaussian random number generator (Box-Muller transform)
function gaussianRandom(mean, stdDev, rng = null) {
    const random = rng ? () => rng.next() : Math.random;
    let u = 0, v = 0;
    while (u === 0) u = random(); // Converting [0,1) to (0,1)
    while (v === 0) v = random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
}

// Get seed from URL parameters
function getSeedFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get('seed');
    if (seedParam) {
        const seed = parseInt(seedParam, 10);
        return isNaN(seed) ? Date.now() : seed;
    }
    return Date.now();
}

function renderLand(ctx, position, dots) {
    ctx.fillStyle = "rgba(0,200,70,0.3)";
    dots.forEach(dot => {
        const pos = sum(position, dot);
        // Only render if the dot is visible on screen (with some margin for the dot size)
        const margin = 20; // 10 for dot radius + 10 for safety margin
        if (pos.x >= -margin && pos.x <= SCREENSIZE.width + margin &&
            pos.y >= -margin && pos.y <= SCREENSIZE.height + margin) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 10, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
}

function windFunction(t) {
    const heading = t / (60 * 60 * 5) * Math.PI * 2 + Math.cos(t / (60 * 60)) + 0.1 * Math.sin(t / (60 * 40)) +
                   0.02 * (Math.cos(t / 50) + Math.cos(t / 40) + Math.cos(t / 30) + Math.cos(t / 20));
    let speed = (Math.sin(t / (60 * 20)) ** 2 + Math.cos(t / (60 * 30)) ** 2);
    speed = (2 + speed) / 4;
    return { heading, speed };
}

// Drawing functions
function drawPolygon(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
}

function drawLine(ctx, point1, point2, color, width = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);
    ctx.stroke();
}

// Main game class
class ShipGame {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = SCREENSIZE.width;
        this.canvas.height = SCREENSIZE.height;
        this.ctx = this.canvas.getContext('2d');
        
        // Make canvas full screen
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '1000';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        
        document.body.appendChild(this.canvas);
        
        // Game state
        this.shipPos = { x: 250, y: 250 };
        this.heading = 0;
        this.sailAngle = 0;
        this.rudderAngle = 0;
        this.speed = 0.0;
        this.tick = 0;
        
        // End point and timer
        this.seed = getSeedFromURL();
        this.rng = new SeededRandom(this.seed);
        this.endPoint = this.generateEndPoint();
        this.startTime = Date.now();
        this.gameCompleted = false;
        this.completionTime = null;
        
        // Generate land
        this.land = generateLand(
            { x: SCREENSIZE.width / 2, y: SCREENSIZE.height / 2 }, 
            Math.max(SCREENSIZE.width, SCREENSIZE.height), 
            7
        );
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Handle window resize
        this.setupResize();
        
        // Start game loop
        this.gameLoop();
    }
    
    generateEndPoint() {
        // Generate endpoint around starting position with Gaussian distribution
        const startingPos = { x: 250, y: 250 };
        const stdDev = Math.max(SCREENSIZE.width, SCREENSIZE.height) * 0.8; // Standard deviation based on screen size
        
        const endX = gaussianRandom(startingPos.x, stdDev, this.rng);
        const endY = gaussianRandom(startingPos.y, stdDev, this.rng);
        
        return { x: endX, y: endY };
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    setupResize() {
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            // Update global constants
            SCREENSIZE.width = window.innerWidth;
            SCREENSIZE.height = window.innerHeight;
            SCREENCENTER.x = SCREENSIZE.width / 2;
            SCREENCENTER.y = SCREENSIZE.height / 2;
        });
    }
    
    handleInput() {
        let releasing = false;
        
        if (this.keys['a']) {
            this.rudderAngle += 0.02;
        } else if (this.keys['d']) {
            this.rudderAngle -= 0.02;
        }
        
        if (this.keys['arrowup'] || this.keys['w']) {
            releasing = true;  // Player is actively letting out the sail
        } else if (this.keys['arrowdown'] || this.keys['s']) {
            this.sailAngle *= 0.97;  // Player is pulling in the sail (reducing angle)
        }
        
        return releasing;
    }
    
    update() {
        this.tick++;
        const wind = windFunction(this.tick);
        const windHeading = wind.heading;
        const windSpeed = WINDSCALE * wind.speed;
        
        const releasing = this.handleInput();
        
        // Check if ship reached the endpoint
        if (!this.gameCompleted && distance(this.shipPos, this.endPoint) < 50) {
            this.gameCompleted = true;
            this.completionTime = Date.now();
        }
        
        // Normalize heading
        this.heading = ((this.heading % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        // Clamp sail and rudder
        this.sailAngle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.sailAngle));        
        this.rudderAngle = Math.max(-Math.PI / 8, Math.min(Math.PI / 8, this.rudderAngle));
        
        // Rudder reverts to center
        this.rudderAngle -= Math.sign(this.rudderAngle) * this.speed * 0.001
        
        // Sail reverts to wind direction
        let tweakAngle = this.sailAngle + this.heading - (windHeading + Math.PI);
        tweakAngle = ((tweakAngle + (3 * Math.PI)) % (2 * Math.PI)) - Math.PI;
        const tweakNegative = tweakAngle < 0;
        if (releasing || (tweakNegative !== (this.sailAngle > 0))) {
            if (tweakNegative) {
                this.sailAngle += Math.min(0.05, -tweakAngle); 
            } else {
                this.sailAngle -= Math.min(0.05, tweakAngle);  
            }
        }

        // Efficiency coefficient of wind force to mast
        const sailPerpendicular = this.heading + this.sailAngle - (this.sailAngle > 0 ? Math.PI / 2 : - Math.PI / 2);
        const windForceEfficiency = Math.max(0, efficiency(windHeading, sailPerpendicular));

        // Efficiency coefficient of mast force to keel direction
        const forwardEfficiency = efficiency(this.heading, sailPerpendicular);
        
        const netEfficiency = windForceEfficiency * Math.abs(forwardEfficiency);
        const windwardShipSpeed = this.speed * Math.abs(efficiency(windHeading, this.heading));
        const relativeWindSpeed = windSpeed - windwardShipSpeed;
        let netWindForce = relativeWindSpeed * netEfficiency;
        
        const dragForce = DRAG * this.speed * Math.abs(this.speed);
        
        this.speed += netWindForce - dragForce;
        this.heading -= this.speed * 0.015 * Math.tan(this.rudderAngle);
        this.shipPos = {
            x: this.shipPos.x - this.speed * Math.sin(this.heading),
            y: this.shipPos.y - this.speed * Math.cos(this.heading)
        };
        
        return { windHeading, windSpeed, relativeWindSpeed, windForceEfficiency, netEfficiency, dragForce };
    }
    
    render(windHeading, windSpeed, relativeWindSpeed, windForceEfficiency, netEfficiency, dragForce) {
        // Clear screen
        this.ctx.fillStyle = WATER_COLOR;
        this.ctx.fillRect(0, 0, SCREENSIZE.width, SCREENSIZE.height);
        
        // Render land
        renderLand(this.ctx, scale(this.shipPos, -1), this.land);
        
        // Draw ship
        const triangle = shipTriangle(SCREENCENTER, this.heading);
        const pentagon = shipPentagon(SCREENCENTER, this.heading);
        drawPolygon(this.ctx, pentagon, SHIP_COLOR);
        
        // Draw sail
        const sailLinePoints = sailLine(SCREENCENTER, this.heading, this.sailAngle);
        drawLine(this.ctx, sailLinePoints[0], sailLinePoints[1], SAIL_COLOR, 5);
        
        // Draw efficiency lines
        const effLineInner = efficiencyLine(SCREENCENTER, this.heading, this.sailAngle, windForceEfficiency);
        drawLine(this.ctx, effLineInner[0], effLineInner[1], EFFICIENCY_COLOR_SECOND, 5);
        
        const effLineRed = efficiencyLine(SCREENCENTER, this.heading, this.sailAngle, netEfficiency);
        drawLine(this.ctx, effLineRed[0], effLineRed[1], EFFICIENCY_COLOR_MAIN, 5);
        
        // Draw rudder
        const rudderLinePoints = rudderLine(triangle, this.heading, this.rudderAngle);
        drawLine(this.ctx, rudderLinePoints[0], rudderLinePoints[1], RUDDER_COLOR, 5);
        
        // Draw extra vectors if enabled
        if (DRAGVECTOR) {
            const dragLinePoints = dragLine(triangle, this.heading, dragForce);
            drawLine(this.ctx, dragLinePoints[0], dragLinePoints[1], "rgb(255, 187, 0)", 2);
        }

        if(WINDPARA) {
            const relWindPoints = relWindPara(effLineRed, windHeading, relativeWindSpeed);
            // drawLine(this.ctx, relWindPoints[0], relWindPoints[1], WIND_COLOR, 5);
            drawPolygon(this.ctx, [relWindPoints[0], relWindPoints[1], relWindPoints[2], relWindPoints[3]], CLEAR_WIND_COLOR);
        }
        
        // Draw wind indicator
        const windIndicatorPoints = windicator(windHeading, windSpeed);
        drawPolygon(this.ctx, windIndicatorPoints, WIND_COLOR);
        
        // Draw endpoint if visible
        const endPointScreenPos = worldToScreen(this.endPoint, this.shipPos);
        if (endPointScreenPos.x > -50 && endPointScreenPos.x < SCREENSIZE.width + 50 &&
            endPointScreenPos.y > -50 && endPointScreenPos.y < SCREENSIZE.height + 50) {
            this.ctx.strokeStyle = this.gameCompleted ? "rgb(0,255,0)" : "rgb(255,0,0)";
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(endPointScreenPos.x, endPointScreenPos.y, 25, 0, 2 * Math.PI);
            this.ctx.stroke();
            
            if (this.gameCompleted) {
                this.ctx.fillStyle = "rgba(0,255,0,0.3)";
                this.ctx.fill();
            }
        } else {
            // Draw direction marker pointing toward endpoint
            this.drawDirectionMarker();
        }
        
        // Draw timer
        this.drawTimer();
    }
    
    drawDirectionMarker() {
        // Calculate direction to endpoint
        const toEndPoint = {
            x: this.endPoint.x - this.shipPos.x,
            y: this.endPoint.y - this.shipPos.y
        };
        const direction = normalize(toEndPoint);
        
        // Position marker at edge of screen
        const margin = 50;
        const centerX = SCREENSIZE.width / 2;
        const centerY = SCREENSIZE.height / 2;
        
        // Calculate where the direction vector intersects the screen edge
        let markerX, markerY;
        const absX = Math.abs(direction.x);
        const absY = Math.abs(direction.y);
        
        if (absX * SCREENSIZE.height > absY * SCREENSIZE.width) {
            // Hit left or right edge
            markerX = direction.x > 0 ? SCREENSIZE.width - margin : margin;
            markerY = centerY + (markerX - centerX) * direction.y / direction.x;
        } else {
            // Hit top or bottom edge
            markerY = direction.y > 0 ? SCREENSIZE.height - margin : margin;
            markerX = centerX + (markerY - centerY) * direction.x / direction.y;
        }
        
        // Draw arrow pointing toward endpoint
        const arrowSize = 20;
        const angle = Math.atan2(direction.y, direction.x);
        
        this.ctx.fillStyle = "rgb(255,255,0)";
        this.ctx.strokeStyle = "rgb(200,200,0)";
        this.ctx.lineWidth = 2;
        
        // Draw arrow head
        this.ctx.beginPath();
        this.ctx.moveTo(markerX + arrowSize * Math.cos(angle), markerY + arrowSize * Math.sin(angle));
        this.ctx.lineTo(markerX + arrowSize * Math.cos(angle - 2.5), markerY + arrowSize * Math.sin(angle - 2.5));
        this.ctx.lineTo(markerX + arrowSize * Math.cos(angle + 2.5), markerY + arrowSize * Math.sin(angle + 2.5));
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    drawTimer() {
        const currentTime = this.gameCompleted ? this.completionTime : Date.now();
        const elapsedSeconds = (currentTime - this.startTime) / 1000;
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = Math.floor(elapsedSeconds % 60);
        const milliseconds = Math.floor((elapsedSeconds * 10) % 10);
        
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
        
        this.ctx.fillStyle = this.gameCompleted ? "rgb(0,255,0)" : "rgb(255,255,255)";
        this.ctx.strokeStyle = "rgb(0,0,0)";
        this.ctx.font = "bold 24px monospace";
        this.ctx.lineWidth = 2;
        
        // Position timer in top-right corner
        const x = SCREENSIZE.width - 150;
        const y = 40;
        
        this.ctx.strokeText(timeString, x, y);
        this.ctx.fillText(timeString, x, y);
        
        if (this.gameCompleted) {
            this.ctx.font = "bold 18px sans-serif";
            this.ctx.strokeText("COMPLETE!", x, y + 25);
            this.ctx.fillText("COMPLETE!", x, y + 25);
        }
    }
    
    gameLoop() {
        const gameState = this.update();
        this.render(gameState.windHeading, gameState.windSpeed, gameState.relativeWindSpeed, gameState.windForceEfficiency, gameState.netEfficiency, gameState.dragForce);
        
        setTimeout(() => this.gameLoop(), 1000 / 60); // 60 FPS
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new ShipGame();
});
