'use client'

import { useEffect, useRef } from 'react'

interface ShuttleLoaderProps {
    size?: number
    className?: string
}

export function ShuttleLoader({ size = 200, className }: ShuttleLoaderProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const logoRef = useRef<HTMLImageElement | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const context = canvas.getContext('2d')
        if (!context) return

        const ctx: CanvasRenderingContext2D = context

        const W = 900
        const H = 900
        const C = W / 2
        canvas.width = W
        canvas.height = H

        const logo = new Image()
        logo.src = '/images/logo.png'
        logoRef.current = logo

        function drawShuttle(x: number, y: number, angle: number, scale = 1) {
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(angle)
            ctx.scale(scale, scale)
            ctx.shadowColor = 'rgba(156,255,47,.9)'
            ctx.shadowBlur = 15
            ctx.fillStyle = '#fbfff4'
            ctx.strokeStyle = '#071004'
            ctx.lineWidth = 2.5
            for (let i = -2; i <= 2; i++) {
                ctx.save()
                ctx.rotate(i * 0.15)
                ctx.beginPath()
                ctx.moveTo(0, -10)
                ctx.quadraticCurveTo(34, -42, 82, -46)
                ctx.quadraticCurveTo(62, -15, 13, 5)
                ctx.closePath()
                ctx.fill()
                ctx.stroke()
                ctx.restore()
            }
            ctx.strokeStyle = '#75bf20'
            ctx.lineWidth = 3
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath()
                ctx.moveTo(12, 0)
                ctx.lineTo(76, -32 + i * 7)
                ctx.stroke()
            }
            ctx.shadowBlur = 8
            ctx.fillStyle = '#fbfff4'
            ctx.strokeStyle = '#071004'
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.ellipse(-11, 6, 21, 26, -0.72, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(7, -12)
            ctx.lineTo(26, 7)
            ctx.lineTo(14, 23)
            ctx.lineTo(-8, 2)
            ctx.closePath()
            ctx.fillStyle = '#111'
            ctx.fill()
            ctx.restore()
        }

        function roundedArc(t: number) {
            const r = 360
            ctx.save()
            ctx.translate(C, C)
            ctx.rotate(t * 0.9)
            ctx.lineCap = 'round'
            ctx.lineWidth = 12
            ctx.strokeStyle = '#75bf20'
            ctx.shadowColor = 'rgba(117,191,32,.85)'
            ctx.shadowBlur = 20
            ctx.beginPath()
            ctx.arc(0, 0, r, -1.5, 1.1)
            ctx.stroke()
            ctx.strokeStyle = '#f8fff1'
            ctx.lineWidth = 5
            ctx.shadowBlur = 10
            ctx.beginPath()
            ctx.arc(0, 0, r + 18, 1.8, 2.45)
            ctx.stroke()
            ctx.restore()
        }

        function draw(tms: number) {
            const t = tms / 1000
            ctx.clearRect(0, 0, W, H)

            const pulse = 1 + Math.sin(t * 3) * 0.018
            ctx.save()
            ctx.translate(C, C)
            ctx.scale(pulse, pulse)
            ctx.strokeStyle = 'rgba(117,191,32,.18)'
            ctx.lineWidth = 34
            ctx.beginPath()
            ctx.arc(0, 0, 372, 0, Math.PI * 2)
            ctx.stroke()
            ctx.restore()

            ctx.save()
            ctx.beginPath()
            ctx.arc(C, C, 310, 0, Math.PI * 2)
            ctx.clip()
            ctx.globalAlpha = 0.96
            const currentLogo = logoRef.current
            if (currentLogo?.complete && currentLogo.naturalWidth > 0) {
                ctx.drawImage(currentLogo, C - 310, C - 310, 620, 620)
            }
            ctx.restore()

            ctx.save()
            const grad = ctx.createRadialGradient(C, C, 210, C, C, 360)
            grad.addColorStop(0, 'rgba(0,0,0,0)')
            grad.addColorStop(1, 'rgba(0,0,0,.18)')
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.arc(C, C, 310, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()

            roundedArc(t)

            const a = -Math.PI / 2 + t * 1.65
            const rr = 365
            const x = C + Math.cos(a) * rr
            const y = C + Math.sin(a) * rr
            drawShuttle(x, y, a + Math.PI * 0.63, 0.72)

            ctx.save()
            ctx.translate(C, C + 365)
            ctx.lineCap = 'round'
            ctx.strokeStyle = 'rgba(255,255,255,.23)'
            ctx.lineWidth = 8
            ctx.beginPath()
            ctx.moveTo(-150, 0)
            ctx.lineTo(150, 0)
            ctx.stroke()
            const w = 70 + (Math.sin(t * 2.4) + 1) * 70
            ctx.strokeStyle = '#75bf20'
            ctx.shadowColor = '#75bf20'
            ctx.shadowBlur = 14
            ctx.beginPath()
            ctx.moveTo(-w, 0)
            ctx.lineTo(w, 0)
            ctx.stroke()
            ctx.restore()

            animRef.current = requestAnimationFrame(draw)
        }

        animRef.current = requestAnimationFrame(draw)

        return () => {
            cancelAnimationFrame(animRef.current)
        }
    }, [])

    return (
        <div
            className={className}
            style={{ width: size, height: size }}
            aria-label="Загрузка"
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ filter: 'drop-shadow(0 0 18px rgba(117,191,32,.26))' }}
            />
        </div>
    )
}