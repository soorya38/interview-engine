import React, { useEffect, useRef, useCallback } from 'react';

// --- Constants for Pixel Art Look ---
const CANVAS_WIDTH = 64;
const CANVAS_HEIGHT = 64;

// --- Color Palettes ---
const MALE_COLORS = {
    bg: '#FDF6E3',
    hair: '#2A1F1D',
    hairLight: '#3E2F2C',
    skin: '#F2C5A8',
    skinShadow: '#E0B090',
    cheeks: '#EF9A9A',
    suit: '#2C3E50',
    suitShadow: '#1A2530',
    suitLight: '#34495E',
    shirtWhite: '#F5F5F5',
    tie: '#C0392B',
    tieHighlight: '#E74C3C',
    white: '#FFFFFF',
    pupil: '#1A1A1A',
    mouthInside: '#3A1515',
    teeth: '#EEEEEE'
};

const FEMALE_COLORS = {
    bg: '#FDF6E3',
    hair: '#2A1F1D',
    hairLight: '#4E3835',
    skin: '#F2C5A8',
    skinShadow: '#E0B090',
    cheeks: '#EF9A9A', // Kept in palette but unused per request
    lips: '#CC8585',
    suit: '#2C3E50',
    suitShadow: '#1A2530',
    suitLight: '#34495E',
    blouse: '#FAFAFA',
    blouseShadow: '#E0E0E0',
    white: '#FFFFFF',
    pupil: '#1A1A1A',
    mouthInside: '#3A1515',
    teeth: '#EEEEEE'
};

interface InterviewerAgentProps {
    isSpeaking: boolean;
    gender?: 'male' | 'female';
}

export const InterviewerAgent: React.FC<InterviewerAgentProps> = ({ isSpeaking, gender = 'male' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Animation States
    const animState = useRef({
        time: 0,
        blinkTimer: 0,
        isBlinking: false,
        mouthOpen: 0,
        mouthTarget: 0,
    });

    const drawRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    const drawClump = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
        drawRect(ctx, x + 1, y, size - 2, size, color);
        drawRect(ctx, x, y + 1, size, size - 2, color);
    };

    // --- Drawing Routines ---

    const drawMaleCharacter = (ctx: CanvasRenderingContext2D, state: any) => {
        const COLORS = MALE_COLORS;
        const bob = 0;
        const bodyY = 52 + bob;

        // Shoulders
        drawRect(ctx, 12, bodyY, 40, 12, COLORS.suit);
        drawRect(ctx, 14, bodyY - 2, 36, 4, COLORS.suit);

        // Shirt & Collar
        drawRect(ctx, 26, bodyY - 2, 12, 8, COLORS.shirtWhite);
        drawRect(ctx, 26, bodyY - 2, 3, 4, '#E0E0E0');
        drawRect(ctx, 35, bodyY - 2, 3, 4, '#E0E0E0');

        // Tie
        drawRect(ctx, 30, bodyY, 4, 4, COLORS.tie);
        drawRect(ctx, 31, bodyY + 4, 2, 8, COLORS.tie);
        drawRect(ctx, 31, bodyY + 2, 1, 2, COLORS.tieHighlight);

        // Lapels & Shading
        drawRect(ctx, 22, bodyY + 2, 6, 10, COLORS.suitLight);
        drawRect(ctx, 36, bodyY + 2, 6, 10, COLORS.suitLight);
        drawRect(ctx, 12, bodyY + 4, 4, 8, COLORS.suitShadow);
        drawRect(ctx, 48, bodyY + 4, 4, 8, COLORS.suitShadow);
        drawRect(ctx, 28, bodyY + 8, 1, 4, COLORS.suitShadow);

        // Neck & Head
        drawRect(ctx, 26, 44 + bob, 12, 8, COLORS.skinShadow);
        drawRect(ctx, 20, 20 + bob, 24, 28, COLORS.skin);
        drawRect(ctx, 20, 20 + bob, 24, 2, COLORS.skinShadow);

        // Ears
        drawRect(ctx, 17, 31 + bob, 3, 6, COLORS.skin);
        drawRect(ctx, 44, 31 + bob, 3, 6, COLORS.skin);

        // Hair
        const hairBaseY = 12 + bob;
        drawRect(ctx, 18, hairBaseY, 28, 10, COLORS.hair);
        drawClump(ctx, 20, hairBaseY - 2, 8, COLORS.hair);
        drawClump(ctx, 30, hairBaseY - 3, 8, COLORS.hair);
        drawClump(ctx, 38, hairBaseY, 6, COLORS.hair);
        drawRect(ctx, 17, hairBaseY + 8, 3, 8, COLORS.hair);
        drawRect(ctx, 44, hairBaseY + 8, 3, 8, COLORS.hair);
        drawRect(ctx, 22, hairBaseY + 2, 6, 2, COLORS.hairLight);
        drawRect(ctx, 34, hairBaseY + 2, 6, 2, COLORS.hairLight);
        drawRect(ctx, 17, 28 + bob, 3, 6, COLORS.hair);
        drawRect(ctx, 44, 28 + bob, 3, 6, COLORS.hair);

        // Face Features
        drawRect(ctx, 29, 30 + bob, 6, 8, COLORS.skinShadow);
        drawRect(ctx, 30, 28 + bob, 4, 10, COLORS.skinShadow);
        drawRect(ctx, 31, 31 + bob, 2, 4, COLORS.skin);

        // Beard
        const beardY = 39 + bob;
        drawRect(ctx, 24, beardY, 16, 3, COLORS.hair);
        drawRect(ctx, 26, beardY + 9, 12, 4, COLORS.hair);
        drawRect(ctx, 24, beardY + 3, 3, 6, COLORS.hair);
        drawRect(ctx, 37, beardY + 3, 3, 6, COLORS.hair);
        drawRect(ctx, 30, beardY + 4, 4, 2, COLORS.hair);

        // Mouth
        const mouthY = 42 + bob;
        const mouthH = Math.max(0, state.mouthOpen * 5);
        if (mouthH > 1) {
            drawRect(ctx, 27, mouthY, 10, mouthH, COLORS.mouthInside);
            drawRect(ctx, 28, mouthY, 8, 1, COLORS.teeth);
        } else {
            drawRect(ctx, 28, mouthY + 2, 8, 1, '#1A1010');
        }

        // Eyes
        const eyeY = 27 + bob;
        if (state.isBlinking) {
            drawRect(ctx, 22, eyeY + 1, 6, 2, COLORS.skinShadow);
            drawRect(ctx, 36, eyeY + 1, 6, 2, COLORS.skinShadow);
        } else {
            drawRect(ctx, 22, eyeY, 6, 5, COLORS.white);
            drawRect(ctx, 36, eyeY, 6, 5, COLORS.white);
            drawRect(ctx, 24, eyeY + 1, 2, 3, COLORS.pupil);
            drawRect(ctx, 38, eyeY + 1, 2, 3, COLORS.pupil);
            drawRect(ctx, 21, eyeY - 3, 8, 2, COLORS.hair);
            drawRect(ctx, 35, eyeY - 3, 8, 2, COLORS.hair);
        }
    };

    const drawFemaleCharacter = (ctx: CanvasRenderingContext2D, state: any) => {
        const COLORS = FEMALE_COLORS;
        const bob = 0;

        // Hair Back
        const hairY = 16 + bob;
        drawRect(ctx, 16, hairY + 10, 32, 24, COLORS.hair);
        drawRect(ctx, 14, hairY + 20, 4, 12, COLORS.hair);
        drawRect(ctx, 46, hairY + 20, 4, 12, COLORS.hair);

        // Body
        const bodyY = 52 + bob;
        drawRect(ctx, 14, bodyY, 36, 12, COLORS.suit);
        drawRect(ctx, 26, bodyY, 12, 12, COLORS.blouse);
        drawRect(ctx, 26, bodyY, 2, 8, COLORS.suitLight);
        drawRect(ctx, 36, bodyY, 2, 8, COLORS.suitLight);
        drawRect(ctx, 28, bodyY + 1, 8, 1, COLORS.blouseShadow);
        drawRect(ctx, 14, bodyY + 4, 4, 8, COLORS.suitShadow);
        drawRect(ctx, 46, bodyY + 4, 4, 8, COLORS.suitShadow);

        // Neck & Head
        drawRect(ctx, 27, 46 + bob, 10, 6, COLORS.skinShadow);
        drawRect(ctx, 21, 22 + bob, 22, 26, COLORS.skin);
        drawRect(ctx, 22, 46 + bob, 20, 2, COLORS.skin); // Jaw tapering

        // Ears
        drawRect(ctx, 19, 33 + bob, 2, 5, COLORS.skin);
        drawRect(ctx, 43, 33 + bob, 2, 5, COLORS.skin);

        // Face (No Cheeks)
        drawRect(ctx, 30, 33 + bob, 4, 2, COLORS.skinShadow);
        drawRect(ctx, 31, 35 + bob, 2, 2, COLORS.skinShadow);

        // Mouth
        const mouthY = 41 + bob;
        const mouthH = Math.max(0, state.mouthOpen * 4);
        if (mouthH > 1) {
            drawRect(ctx, 28, mouthY, 8, mouthH, COLORS.mouthInside);
            drawRect(ctx, 29, mouthY, 6, 1, COLORS.teeth);
            drawRect(ctx, 29, mouthY + mouthH, 6, 1, COLORS.lips);
        } else {
            drawRect(ctx, 28, mouthY + 1, 8, 1, COLORS.lips);
            drawRect(ctx, 29, mouthY + 2, 6, 1, '#B07070');
        }

        // Eyes
        const eyeY = 28 + bob;
        if (state.isBlinking) {
            drawRect(ctx, 23, eyeY + 2, 6, 1, COLORS.skinShadow);
            drawRect(ctx, 35, eyeY + 2, 6, 1, COLORS.skinShadow);
        } else {
            drawRect(ctx, 23, eyeY, 6, 5, COLORS.white);
            drawRect(ctx, 35, eyeY, 6, 5, COLORS.white);
            drawRect(ctx, 25, eyeY + 1, 2, 3, COLORS.pupil);
            drawRect(ctx, 37, eyeY + 1, 2, 3, COLORS.pupil);
            drawRect(ctx, 22, eyeY, 1, 2, COLORS.pupil); // Lashes
            drawRect(ctx, 41, eyeY, 1, 2, COLORS.pupil);

            // Eyebrows (Thinner, arched)
            drawRect(ctx, 23, eyeY - 3, 6, 1, COLORS.hair);
            drawRect(ctx, 35, eyeY - 3, 6, 1, COLORS.hair);
        }

        // Hair Front (Bangs reduced to 2px height to separate from eyebrows)
        drawRect(ctx, 19, 16 + bob, 26, 8, COLORS.hair);
        drawRect(ctx, 24, 18 + bob, 10, 2, COLORS.hairLight);
        drawRect(ctx, 18, 22 + bob, 4, 24, COLORS.hair);
        drawRect(ctx, 20, 44 + bob, 2, 4, COLORS.hair);
        drawRect(ctx, 42, 22 + bob, 4, 24, COLORS.hair);
        drawRect(ctx, 42, 44 + bob, 2, 4, COLORS.hair);
        drawRect(ctx, 22, 22 + bob, 4, 2, COLORS.hair); // Shortened bangs
        drawRect(ctx, 38, 22 + bob, 3, 2, COLORS.hair); // Shortened bangs
    };

    // --- Main Draw Loop ---
    const drawCharacter = useCallback((ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = MALE_COLORS.bg;
        ctx.fillRect(0, 0, width, height);

        if (gender === 'male') {
            drawMaleCharacter(ctx, animState.current);
        } else {
            drawFemaleCharacter(ctx, animState.current);
        }
    }, [gender]);

    // --- Animation Loop ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;

        let animationFrameId: number;
        const loop = () => {
            const state = animState.current;
            state.time += 1;

            state.blinkTimer--;
            if (state.blinkTimer <= 0) {
                state.isBlinking = true;
                if (state.blinkTimer <= -8) {
                    state.isBlinking = false;
                    state.blinkTimer = Math.random() * 200 + 100;
                }
            }

            if (isSpeaking) {
                if (state.time % 4 === 0) state.mouthTarget = Math.random();
                state.mouthOpen += (state.mouthTarget - state.mouthOpen) * 0.4;
            } else {
                state.mouthOpen += (0 - state.mouthOpen) * 0.2;
            }

            drawCharacter(ctx);
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isSpeaking, drawCharacter]);

    return (
        <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-[#1e1e24] shadow-2xl">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

            {/* The Canvas */}
            <div className="relative z-10">
                {/* CRT Bezel */}
                <div className="absolute -inset-4 bg-slate-800 rounded-lg border border-slate-700"></div>
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="relative w-[320px] h-[320px] bg-[#FDF6E3] rounded-sm"
                    style={{ imageRendering: 'pixelated' }}
                />
                {/* Screen Glare */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-sm"></div>
            </div>

            <div className={`absolute bottom-6 left-0 w-full text-center transition-opacity duration-300 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}>
                <span className={`px-3 py-1 rounded-full text-xs font-mono border backdrop-blur-sm ${gender === 'male' ? 'bg-blue-900/50 text-blue-200 border-blue-500/30' : 'bg-pink-900/50 text-pink-200 border-pink-500/30'}`}>
                    Speaking...
                </span>
            </div>
        </div>
    );
};
