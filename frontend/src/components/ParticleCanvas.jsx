import { useEffect, useRef } from 'react'

export default function ParticleCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    let w = cv.width = cv.offsetWidth
    let h = cv.height = cv.offsetHeight

    const suits = ['♠', '♥', '♦', '♣']
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.35 - 0.1,
      suit: suits[Math.floor(Math.random() * 4)],
      size: Math.random() * 14 + 8,
      opacity: Math.random() * 0.07 + 0.02,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.008,
    }))

    let raf
    function draw() {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        if (p.y < -30) { p.y = h + 30; p.x = Math.random() * w }
        if (p.x < -30) p.x = w + 30
        if (p.x > w + 30) p.x = -30
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.font = `${p.size}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const isRedSuit = p.suit === '♥' || p.suit === '♦'
        ctx.fillStyle = isRedSuit
          ? `rgba(239,68,68,${p.opacity})`
          : `rgba(255,255,255,${p.opacity})`
        ctx.fillText(p.suit, 0, 0)
        ctx.restore()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    const ro = new ResizeObserver(() => {
      w = cv.width = cv.offsetWidth
      h = cv.height = cv.offsetHeight
    })
    ro.observe(cv)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  )
}
