import React, { useRef, useEffect } from "react";
import { Organism } from "../types";

interface CanvasProps {
  organisms: Organism[];
  environment: string;
}

/* ── helper: draw a rabbit ─────────────────────────────── */
function drawRabbit(ctx: CanvasRenderingContext2D, org: Organism, env: string) {
  const s = org.size * 0.7 + 3; // body radius scales with size trait

  // Fur color based on camouflage + environment
  // High camouflage → matches environment; low → stands out
  const camo = org.camouflage / 10; // 0‑1
  let furR: number, furG: number, furB: number;

  if (env === "arctic") {
    // Arctic: high camo → white, low → brown
    furR = Math.floor(180 + camo * 75);
    furG = Math.floor(150 + camo * 105);
    furB = Math.floor(130 + camo * 125);
  } else if (env === "desert") {
    // Desert: high camo → sand, low → dark
    furR = Math.floor(140 + camo * 80);
    furG = Math.floor(110 + camo * 60);
    furB = Math.floor(70 + camo * 40);
  } else {
    // Forest: high camo → dark brown/green, low → light
    furR = Math.floor(100 + (1 - camo) * 100);
    furG = Math.floor(80 + camo * 40);
    furB = Math.floor(60 + (1 - camo) * 40);
  }

  const fur = `rgb(${furR}, ${furG}, ${furB})`;
  const furDark = `rgb(${furR - 30}, ${furG - 30}, ${furB - 30})`;
  const innerEar = `rgb(${Math.min(furR + 40, 255)}, ${Math.min(furG + 10, 220)}, ${Math.min(furB + 10, 210)})`;

  // ─ Ears (behind body) ─
  const earH = s * 1.5 + org.size * 0.4; // ear height grows with size trait
  const earW = s * 0.35;
  ctx.fillStyle = fur;
  // Left ear
  ctx.beginPath();
  ctx.ellipse(
    org.x - s * 0.35,
    org.y - s - earH * 0.35,
    earW,
    earH * 0.55,
    -0.2,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  // Right ear
  ctx.beginPath();
  ctx.ellipse(
    org.x + s * 0.35,
    org.y - s - earH * 0.35,
    earW,
    earH * 0.55,
    0.2,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  // Inner ears
  ctx.fillStyle = innerEar;
  ctx.beginPath();
  ctx.ellipse(
    org.x - s * 0.35,
    org.y - s - earH * 0.35,
    earW * 0.55,
    earH * 0.38,
    -0.2,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    org.x + s * 0.35,
    org.y - s - earH * 0.35,
    earW * 0.55,
    earH * 0.38,
    0.2,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // ─ Body ─
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(org.x, org.y + s * 0.2, s * 1.1, s * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // ─ Head ─
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.arc(org.x, org.y - s * 0.3, s * 0.75, 0, Math.PI * 2);
  ctx.fill();

  // ─ Eyes ─
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(org.x - s * 0.28, org.y - s * 0.45, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(org.x + s * 0.28, org.y - s * 0.45, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Pupils
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(org.x - s * 0.25, org.y - s * 0.45, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(org.x + s * 0.31, org.y - s * 0.45, s * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // ─ Nose ─
  ctx.fillStyle = "#F4A0A0";
  ctx.beginPath();
  ctx.ellipse(org.x, org.y - s * 0.15, s * 0.12, s * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // ─ Tail (fluffy puff) ─
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(org.x - s * 0.6, org.y + s * 0.8, s * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // ─ Feet/legs hint ─
  ctx.fillStyle = furDark;
  ctx.beginPath();
  ctx.ellipse(
    org.x - s * 0.5,
    org.y + s * 0.95,
    s * 0.25,
    s * 0.12,
    -0.2,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    org.x + s * 0.5,
    org.y + s * 0.95,
    s * 0.25,
    s * 0.12,
    0.2,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

/* ── helper: draw a wolf ───────────────────────────────── */
function drawWolf(ctx: CanvasRenderingContext2D, org: Organism) {
  const s = org.size * 0.6 + 5;
  const gray = 80;
  const fur = `rgb(${gray + 20}, ${gray + 15}, ${gray + 10})`;
  const furDark = `rgb(${gray}, ${gray - 5}, ${gray - 10})`;

  // ─ Ears (pointed, behind head) ─
  ctx.fillStyle = furDark;
  ctx.beginPath();
  ctx.moveTo(org.x - s * 0.6, org.y - s * 1.3);
  ctx.lineTo(org.x - s * 0.2, org.y - s * 0.5);
  ctx.lineTo(org.x - s * 0.8, org.y - s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(org.x + s * 0.6, org.y - s * 1.3);
  ctx.lineTo(org.x + s * 0.2, org.y - s * 0.5);
  ctx.lineTo(org.x + s * 0.8, org.y - s * 0.5);
  ctx.closePath();
  ctx.fill();

  // ─ Body (larger oval) ─
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(org.x, org.y + s * 0.3, s * 1.2, s * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // ─ Head ─
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.arc(org.x, org.y - s * 0.2, s * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // ─ Snout (elongated) ─
  ctx.fillStyle = furDark;
  ctx.beginPath();
  ctx.ellipse(org.x, org.y + s * 0.05, s * 0.35, s * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // ─ Eyes (yellow/amber, menacing) ─
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.ellipse(
    org.x - s * 0.3,
    org.y - s * 0.35,
    s * 0.18,
    s * 0.15,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    org.x + s * 0.3,
    org.y - s * 0.35,
    s * 0.18,
    s * 0.15,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  // Slit pupils
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(
    org.x - s * 0.28,
    org.y - s * 0.35,
    s * 0.06,
    s * 0.12,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    org.x + s * 0.32,
    org.y - s * 0.35,
    s * 0.06,
    s * 0.12,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // ─ Nose ─
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(org.x, org.y - s * 0.02, s * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // ─ Fangs ─
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(org.x - s * 0.12, org.y + s * 0.15);
  ctx.lineTo(org.x - s * 0.08, org.y + s * 0.32);
  ctx.lineTo(org.x - s * 0.04, org.y + s * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(org.x + s * 0.04, org.y + s * 0.15);
  ctx.lineTo(org.x + s * 0.08, org.y + s * 0.32);
  ctx.lineTo(org.x + s * 0.12, org.y + s * 0.15);
  ctx.closePath();
  ctx.fill();

  // ─ Tail ─
  ctx.strokeStyle = furDark;
  ctx.lineWidth = s * 0.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(org.x + s * 0.9, org.y + s * 0.5);
  ctx.quadraticCurveTo(
    org.x + s * 1.5,
    org.y - s * 0.1,
    org.x + s * 1.3,
    org.y + s * 0.3,
  );
  ctx.stroke();

  // ─ Legs ─
  ctx.fillStyle = furDark;
  ctx.beginPath();
  ctx.ellipse(org.x - s * 0.6, org.y + s, s * 0.2, s * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(org.x + s * 0.6, org.y + s, s * 0.2, s * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* ── environment decorations ───────────────────────────── */
function drawEnvironmentDetails(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  env: string,
) {
  if (env === "forest") {
    // Grass tufts
    ctx.strokeStyle = "rgba(0, 100, 0, 0.3)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 40; i++) {
      const gx = (i * 23 + 7) % w;
      const gy = (i * 17 + 11) % h;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx - 3, gy - 8);
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 2, gy - 7);
      ctx.stroke();
    }
  } else if (env === "desert") {
    // Sandy dots / pebbles
    ctx.fillStyle = "rgba(160, 120, 70, 0.2)";
    for (let i = 0; i < 30; i++) {
      const dx = (i * 31 + 13) % w;
      const dy = (i * 23 + 5) % h;
      ctx.beginPath();
      ctx.ellipse(dx, dy, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (env === "arctic") {
    // Snowflake sparkles
    ctx.fillStyle = "rgba(200, 220, 255, 0.5)";
    for (let i = 0; i < 25; i++) {
      const sx = (i * 37 + 9) % w;
      const sy = (i * 19 + 3) % h;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ── Main Canvas component ─────────────────────────────── */
const Canvas: React.FC<CanvasProps> = ({ organisms, environment }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // ── background gradient ──
    ctx.clearRect(0, 0, W, H);
    const bgGradients: Record<string, [string, string]> = {
      forest: ["#3a7d44", "#6abf69"],
      desert: ["#d4a76a", "#e8cfa0"],
      arctic: ["#e8eef5", "#f8faff"],
    };
    const [c1, c2] = bgGradients[environment] ?? ["#3a7d44", "#6abf69"];
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ── subtle details ──
    drawEnvironmentDetails(ctx, W, H, environment);

    // ── draw prey first, predators on top ──
    const prey = organisms.filter((o) => o.alive && o.role !== "predator");
    const predators = organisms.filter((o) => o.alive && o.role === "predator");

    prey.forEach((org) => drawRabbit(ctx, org, environment));
    predators.forEach((org) => drawWolf(ctx, org));
  }, [organisms, environment]);

  // Animation loop — move organisms
  useEffect(() => {
    const interval = setInterval(() => {
      organisms.forEach((org) => {
        if (!org.alive) return;
        org.x += (Math.random() - 0.5) * org.speed * 0.5;
        org.y += (Math.random() - 0.5) * org.speed * 0.5;
        org.x = Math.max(10, Math.min(790, org.x));
        org.y = Math.max(15, Math.min(585, org.y));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [organisms]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="rounded-lg shadow-inner border border-slate-200"
    />
  );
};

export default Canvas;
