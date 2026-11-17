// 2D Canvas Pool Renderer & Swimmer Animation Engine
import { RaceSimulation } from '../engine/simulation.js';
import { STROKES } from '../constants.js';
import { soundManager } from '../audio/soundFx.js';

export class PoolRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Splash particles
    this.particles = [];

    // Sound trigger flags
    this.finishedSet = new Set();
    this.halfwaySplitsReported = new Set();
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
  }

  reset() {
    this.particles = [];
    this.finishedSet.clear();
    this.halfwaySplitsReported.clear();
  }

  addSplash(x, y, color = '#ffffff', count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.9,
        color
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawParticles() {
    this.ctx.save();
    this.particles.forEach(p => {
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  /**
   * Main render loop
   */
  render({
    event,
    liveResults,
    elapsedSeconds,
    allFinished
  }) {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    if (!liveResults || liveResults.length === 0) {
      this.drawEmptyPool();
      return;
    }

    const orderedResults = [...liveResults].sort((a, b) => a.lane - b.lane);
    const numLanes = Math.max(6, orderedResults.length);
    const poolMarginLeft = 140; // Space for lane badges & names
    const poolMarginRight = 35;
    const poolMarginTop = 50;
    const poolMarginBottom = 30;

    const poolWidth = width - poolMarginLeft - poolMarginRight;
    const poolHeight = height - poolMarginTop - poolMarginBottom;
    const laneHeight = poolHeight / numLanes;

    // 1. Draw Pool Basin
    this.drawPoolBasin(poolMarginLeft, poolMarginTop, poolWidth, poolHeight, numLanes, laneHeight);

    // 2. Draw Lane lines & Ropes
    this.drawLaneRopes(poolMarginLeft, poolMarginTop, poolWidth, numLanes, laneHeight);

    // 3. Draw Starting Blocks & Walls
    this.drawStartingBlocks(poolMarginLeft, poolMarginTop, numLanes, laneHeight);

    // 4. Draw Turn / Finish Touchpads
    this.drawTouchpads(poolMarginLeft, poolMarginTop, poolWidth, numLanes, laneHeight);

    // 5. Draw Swimmers
    orderedResults.forEach((swimmerState, idx) => {
      const laneIndex = idx;
      const laneY = poolMarginTop + laneIndex * laneHeight + laneHeight / 2;

      // Position in pixels
      const swimmerX = poolMarginLeft + swimmerState.poolX * poolWidth;

      // Check for turn splash
      if (swimmerState.nearTurn && Math.random() < 0.25) {
        const wallX = swimmerState.isGoingRight ? poolMarginLeft + poolWidth : poolMarginLeft;
        this.addSplash(wallX, laneY, '#93c5fd', 4);
      }

      // Check finish sound trigger
      if (swimmerState.isFinished && !this.finishedSet.has(swimmerState.id)) {
        this.finishedSet.add(swimmerState.id);
        const wallX = swimmerState.poolX > 0.5 ? poolMarginLeft + poolWidth : poolMarginLeft;
        this.addSplash(wallX, laneY, '#60a5fa', 20);
        soundManager.playTouchBeep();
        if (swimmerState.rank === 1) {
          soundManager.playCheer();
        }
      }

      // Draw Swimmer Info Label on Left Margin
      this.drawLaneLabel(laneIndex, swimmerState, poolMarginLeft, laneY, laneHeight);

      // Draw Animated Swimmer Body
      this.drawSwimmer({
        x: swimmerX,
        y: laneY,
        swimmerState,
        stroke: event.stroke,
        laneHeight
      });
    });

    // 6. Update and Draw Water Particles
    this.updateParticles();
    this.drawParticles();

    // 7. Top HUD (Race Timer & Distance)
    this.drawRaceHUD(event, elapsedSeconds, liveResults, allFinished);
  }

  drawEmptyPool() {
    this.ctx.fillStyle = '#082f49';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '16px system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Piscina preparada para a competición', this.width / 2, this.height / 2);
  }

  drawPoolBasin(x, y, w, h, numLanes, laneHeight) {
    const { ctx } = this;

    // Deep water gradient
    const waterGrad = ctx.createLinearGradient(x, y, x, y + h);
    waterGrad.addColorStop(0, '#0369a1');
    waterGrad.addColorStop(0.5, '#0284c7');
    waterGrad.addColorStop(1, '#0369a1');

    ctx.fillStyle = waterGrad;
    ctx.fillRect(x, y, w, h);

    // Pool tile grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const tileSpacing = 25;
    for (let lx = x; lx <= x + w; lx += tileSpacing) {
      ctx.beginPath();
      ctx.moveTo(lx, y);
      ctx.lineTo(lx, y + h);
      ctx.stroke();
    }

    // 5m and 15m marker lines
    const fiveMeterX1 = x + w * (5 / 25);
    const fifteenMeterX = x + w * (15 / 25);
    const fiveMeterX2 = x + w * (20 / 25);

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)'; // Red marker lines
    ctx.setLineDash([4, 4]);
    [fiveMeterX1, fifteenMeterX, fiveMeterX2].forEach(mx => {
      ctx.beginPath();
      ctx.moveTo(mx, y);
      ctx.lineTo(mx, y + h);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  drawLaneRopes(x, y, w, numLanes, laneHeight) {
    const { ctx } = this;
    for (let i = 0; i <= numLanes; i++) {
      const lineY = y + i * laneHeight;

      // Draw alternating colored floaters (standard FINA/World Aquatics colors: red ends, blue/white middle)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.lineTo(x + w, lineY);
      ctx.stroke();

      // Floater segments
      const segmentWidth = 14;
      const numSegments = Math.floor(w / segmentWidth);
      for (let s = 0; s < numSegments; s++) {
        const sx = x + s * segmentWidth;
        const distFromEdge = Math.min(s * segmentWidth, w - s * segmentWidth);
        let floaterColor = '#f1f5f9';
        if (distFromEdge < w * 0.2) floaterColor = '#ef4444'; // Red 5m zones
        else if (s % 2 === 0) floaterColor = '#0284c7'; // Blue/White pattern

        ctx.fillStyle = floaterColor;
        ctx.beginPath();
        ctx.arc(sx + segmentWidth / 2, lineY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawStartingBlocks(x, y, numLanes, laneHeight) {
    const { ctx } = this;
    for (let i = 0; i < numLanes; i++) {
      const blockY = y + i * laneHeight + laneHeight * 0.2;
      const blockH = laneHeight * 0.6;
      const blockW = 18;

      // Block base
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - blockW - 4, blockY, blockW, blockH);

      // Block top (Omega style yellow/white top)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x - blockW - 2, blockY + 2, blockW - 4, blockH - 4);

      // Lane number
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x - blockW / 2 - 4, blockY + blockH / 2);
    }
  }

  drawTouchpads(x, y, w, numLanes, laneHeight) {
    const { ctx } = this;
    // Left & Right touchpads (yellow Omega pads)
    for (let i = 0; i < numLanes; i++) {
      const padY = y + i * laneHeight + 4;
      const padH = laneHeight - 8;

      // Left Pad
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x, padY, 4, padH);

      // Right Pad
      ctx.fillRect(x + w - 4, padY, 4, padH);
    }
  }

  drawLaneLabel(laneIdx, state, marginW, centerY, laneHeight) {
    const { ctx } = this;
    const boxX = 8;
    const boxY = centerY - laneHeight * 0.42;
    const boxW = marginW - 26;
    const boxH = laneHeight * 0.84;

    // Card background
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();

    // Club color indicator strip
    ctx.fillStyle = state.clubColor || '#0284c7';
    ctx.fillRect(boxX, boxY, 5, boxH);

    // Lane number badge
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`C${state.lane || (laneIdx + 1)}`, boxX + 10, centerY - 5);

    // Swimmer / Relay Name
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px system-ui, sans-serif';
    const nameStr = state.isRelay ? (state.activeSwimmerName || state.relayName) : state.swimmerName;
    const truncatedName = nameStr.length > 13 ? nameStr.substring(0, 12) + '…' : nameStr;
    ctx.fillText(truncatedName, boxX + 32, centerY - 5);

    // Club name & Time/Live position
    let subStr = '';
    if (state.isFinished) {
      subStr = `${RaceSimulation.formatTime(state.finalTime)} (#${state.rank})`;
      ctx.fillStyle = state.rank === 1 ? '#f59e0b' : '#38bdf8';
    } else {
      const leaderTag = state.liveRank === 1 ? '👑 #1' : `#${state.liveRank || state.rank}`;
      subStr = `${state.clubName.substring(0, 9)} · ${leaderTag}`;
      ctx.fillStyle = state.liveRank === 1 ? '#fbbf24' : '#94a3b8';
    }
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(subStr, boxX + 10, centerY + 10);
  }

  drawSwimmer({ x, y, swimmerState, stroke, laneHeight }) {
    const { ctx } = this;
    const { isGoingRight, isFinished, strokePhase, clubColor } = swimmerState;

    ctx.save();
    ctx.translate(x, y);

    // If swimming left, flip horizontally
    if (!isGoingRight) {
      ctx.scale(-1, 1);
    }

    // Wake / Bubbles trailing behind swimmer
    if (!isFinished) {
      const bubbleCount = 4;
      for (let b = 0; b < bubbleCount; b++) {
        const bx = -14 - Math.random() * 12;
        const by = (Math.random() - 0.5) * 8;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(bx, by, 1.2 + Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Torso / Body
    const bodyColor = '#fbcfe8'; // Skin tone
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Swimsuit (Jammed / Kneeskin)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(-2, 0, 6, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head & Swim Cap (Club color)
    ctx.fillStyle = clubColor || '#0284c7';
    ctx.beginPath();
    ctx.arc(8, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();

    // Swimming Goggles
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(9, -2, 2.5, 4);

    // Stroke Arms Animation
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';

    if (stroke === STROKES.FLY) {
      // Butterfly: double arm simultaneous recovery
      const flyArmY = Math.sin(strokePhase * Math.PI * 2) * 8;
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(8, -flyArmY);
      ctx.moveTo(3, 0);
      ctx.lineTo(8, flyArmY);
      ctx.stroke();
    } else if (stroke === STROKES.BREAST) {
      // Breaststroke: pull and glide
      const breastAngle = Math.sin(strokePhase * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(8, -breastAngle * 6);
      ctx.moveTo(4, 0);
      ctx.lineTo(8, breastAngle * 6);
      ctx.stroke();
    } else if (stroke === STROKES.BACK) {
      // Backstroke: alternate over-water arm recovery
      const backArm1 = Math.cos(strokePhase * Math.PI * 2) * 9;
      const backArm2 = -backArm1;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(5, backArm1);
      ctx.moveTo(2, 0);
      ctx.lineTo(5, backArm2);
      ctx.stroke();
    } else {
      // Freestyle (Crol): alternating front crawl arms
      const armAngle1 = Math.sin(strokePhase * Math.PI * 2) * 9;
      const armAngle2 = -armAngle1;
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(9, armAngle1);
      ctx.moveTo(3, 0);
      ctx.lineTo(9, armAngle2);
      ctx.stroke();
    }

    // Flutter Kicks / Feet
    const kickAngle = Math.sin(strokePhase * Math.PI * 4) * 4;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-15, kickAngle);
    ctx.moveTo(-10, 0);
    ctx.lineTo(-15, -kickAngle);
    ctx.stroke();

    ctx.restore();
  }

  drawRaceHUD(event, elapsedSeconds, liveResults, allFinished) {
    const { ctx, width } = this;

    // Header bar background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, 46);

    // Event title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${event.name}`, 14, 28);

    // Current distance / lap info
    const leadSwimmer = liveResults.find(r => r.isLeading) || liveResults[0];
    const currentDist = leadSwimmer ? Math.min(event.distance, Math.round(leadSwimmer.currentDistance)) : 0;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${currentDist} m / ${event.distance} m`, 260, 28);

    // Current leader badge
    if (leadSwimmer && !allFinished) {
      const leaderName = leadSwimmer.isRelay ? (leadSwimmer.activeSwimmerName || leadSwimmer.relayName) : leadSwimmer.swimmerName;
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(`👑 Líder: ${leaderName.substring(0, 16)} (${leadSwimmer.clubName})`, 410, 28);
    }

    // Large Digital Race Clock
    const formattedClock = RaceSimulation.formatTime(elapsedSeconds);
    ctx.fillStyle = allFinished ? '#4ade80' : '#fbbf24';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(formattedClock, width - 20, 31);
  }
}
