// Define global variables for a more subtle grid system
let gridPoints = [];
const gridSize = 40; // Larger grid cells for subtlety
let activeZone = 250; // Active area around mouse
let mouseVel = { x: 0, y: 0 }; // Track mouse velocity

function setup() {
  createCanvas(windowWidth, windowHeight);
  createGrid();
}

function createGrid() {
  gridPoints = [];
  
  // Create a grid of points with subtle offset
  for (let x = 0; x < width; x += gridSize) {
    for (let y = 0; y < height; y += gridSize) {
      // Add slight variation to grid positions for less rigid feel
      const offsetX = random(-5, 5);
      const offsetY = random(-5, 5);
      
      gridPoints.push({
        x: x + offsetX,
        y: y + offsetY,
        origX: x + offsetX,
        origY: y + offsetY,
        size: random(1, 2),
        distortAmount: 0,
        activated: false,
        activationTime: 0,
        lineLength: 0
      });
    }
  }
}

function draw() {
  background(0); // Black background
  
  // Calculate mouse velocity
  mouseVel.x = mouseX - pmouseX;
  mouseVel.y = mouseY - pmouseY;
  const mouseSpeed = sqrt(mouseVel.x * mouseVel.x + mouseVel.y * mouseVel.y);
  
  // Update grid points
  for (let i = 0; i < gridPoints.length; i++) {
    const point = gridPoints[i];
    
    // Calculate distance to mouse
    const dx = mouseX - point.origX;
    const dy = mouseY - point.origY;
    const dist = sqrt(dx * dx + dy * dy);
    
    // Points gradually return to original position when far from mouse
    if (dist > activeZone) {
      point.x = lerp(point.x, point.origX, 0.1);
      point.y = lerp(point.y, point.origY, 0.1);
      point.distortAmount *= 0.9;
      point.lineLength *= 0.9;
      
      // Reset activation state after some time
      if (point.activated && frameCount - point.activationTime > 120) {
        point.activated = false;
      }
    } else {
      // Points near mouse become active
      if (!point.activated) {
        point.activated = true;
        point.activationTime = frameCount;
      }
      
      // Subtler distortion based on mouse position and velocity
      const angle = atan2(dy, dx);
      const distortFactor = map(dist, 0, activeZone, 0.5, 0) * mouseSpeed * 0.3;
      
      point.distortAmount = min(point.distortAmount + random(0, distortFactor * 0.2), gridSize);
      point.lineLength = min(point.lineLength + random(0, distortFactor * 0.3), gridSize);
      
      // Apply distortion in direction perpendicular to mouse
      point.x = point.origX + sin(angle) * point.distortAmount;
      point.y = point.origY - cos(angle) * point.distortAmount;
    }
  }
  
  // Draw subtle grid connections
  for (let i = 0; i < gridPoints.length; i++) {
    const p1 = gridPoints[i];
    
    // Find nearby points to connect
    for (let j = 0; j < gridPoints.length; j++) {
      if (i === j) continue;
      
      const p2 = gridPoints[j];
      const dx = p1.origX - p2.origX;
      const dy = p1.origY - p2.origY;
      const dist = sqrt(dx * dx + dy * dy);
      
      // Only connect points that are adjacent in the grid
      if (dist <= gridSize * 1.5) {
        // Calculate opacity based on activation and distance to mouse
        let opacity = 15; // Base opacity very low for subtlety
        let weight = 0.4; // Very thin lines by default
        
        if (p1.activated || p2.activated) {
          const activationLevel = max(p1.distortAmount, p2.distortAmount) / gridSize;
          opacity = map(activationLevel, 0, 1, 15, 40); // Still subtle, but more visible
          weight = map(activationLevel, 0, 1, 0.4, 0.8);
        }
        
        // Draw line
        stroke(196, 253, 82, opacity);
        strokeWeight(weight);
        line(p1.x, p1.y, p2.x, p2.y);
      }
    }
  }
  
  // Draw points - very subtle
  noStroke();
  
  for (let i = 0; i < gridPoints.length; i++) {
    const point = gridPoints[i];
    
    // Draw points
    if (point.activated) {
      fill(196, 253, 82, 60); // More visible but still subtle
      const pointSize = point.size + point.distortAmount * 0.15;
      rect(point.x - pointSize/2, point.y - pointSize/2, pointSize, pointSize);
      
      // Draw subtle line extensions only for highly active points
      if (point.lineLength > gridSize * 0.5) {
        stroke(196, 253, 82, 35);
        strokeWeight(point.size * 0.5);
        
        // Choose direction based on point position
        let lineAngle = noise(point.origX * 0.01, point.origY * 0.01) * TWO_PI;
        
        // Draw line in that direction
        let lineX = cos(lineAngle) * point.lineLength;
        let lineY = sin(lineAngle) * point.lineLength;
        
        line(point.x, point.y, point.x + lineX, point.y + lineY);
      }
    } else {
      // Inactive points are barely visible
      fill(196, 253, 82, 20);
      const size = point.size;
      rect(point.x - size/2, point.y - size/2, size, size);
    }
  }
  
  // Draw subtle geometric connections near mouse
  const mousePointRadius = activeZone * 0.5;
  let mousePoints = [];
  
  // Collect points near mouse
  for (let i = 0; i < gridPoints.length; i++) {
    const point = gridPoints[i];
    const dx = mouseX - point.x;
    const dy = mouseY - point.y;
    const dist = sqrt(dx * dx + dy * dy);
    
    if (dist < mousePointRadius) {
      mousePoints.push(point);
    }
  }
  
  // Sort points by distance to mouse
  mousePoints.sort((a, b) => {
    const distA = dist(a.x, a.y, mouseX, mouseY);
    const distB = dist(b.x, b.y, mouseX, mouseY);
    return distA - distB;
  });
  
  // Draw subtle angular connections between close points and mouse
  if (mousePoints.length >= 2 && mouseSpeed > 1) {
    // Limit the number of connections based on mouse speed
    const connectCount = min(floor(map(mouseSpeed, 1, 20, 1, 4)), mousePoints.length);
    
    for (let i = 0; i < connectCount; i++) {
      const p = mousePoints[i];
      const opacity = map(i, 0, connectCount, 50, 20);
      strokeWeight(map(i, 0, connectCount, 0.7, 0.3));
      stroke(196, 253, 82, opacity);
      
      // Draw simplified angular connection
      let steps = 2; // Fewer steps for subtlety
      let prevX = p.x;
      let prevY = p.y;
      
      for (let j = 1; j <= steps; j++) {
        let ratio = j / steps;
        let newX, newY;
        
        if (j % 2 === 1) {
          newX = lerp(prevX, mouseX, ratio);
          newY = prevY;
        } else {
          newX = prevX;
          newY = lerp(prevY, mouseY, ratio);
        }
        
        line(prevX, prevY, newX, newY);
        prevX = newX;
        prevY = newY;
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createGrid();
}