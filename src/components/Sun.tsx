interface Props {
  size: number
  name: string
  percent: number
  done: number
  total: number
}

export default function Sun({ size, name, percent, done, total }: Props) {
  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{ left: '50%', top: '50%', width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
    >
      {/* rotating corona */}
      <div
        className="absolute animate-corona rounded-full"
        style={{
          inset: -size * 0.55,
          background:
            'conic-gradient(from 0deg, rgba(251,191,36,0) 0deg, rgba(251,146,60,.35) 40deg, rgba(251,191,36,0) 90deg, rgba(253,224,71,.3) 160deg, rgba(251,191,36,0) 220deg, rgba(249,115,22,.35) 290deg, rgba(251,191,36,0) 360deg)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 28%, #000 36%, transparent 70%)',
          maskImage: 'radial-gradient(circle, transparent 28%, #000 36%, transparent 70%)',
          filter: 'blur(3px)',
        }}
      />
      {/* body */}
      <div
        className="absolute inset-0 rounded-full animate-sun-pulse flex flex-col items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #fffbe0 0%, #fde047 25%, #fb923c 65%, #ea580c 100%)',
          boxShadow: '0 0 40px 12px rgba(251,146,60,.55), 0 0 110px 36px rgba(251,191,36,.25)',
        }}
      >
        <div className="font-extrabold text-amber-950 leading-none" style={{ fontSize: Math.max(14, size * 0.28) }}>
          {percent}%
        </div>
        <div className="text-amber-900/80 font-semibold leading-none mt-0.5" style={{ fontSize: Math.max(8, size * 0.1) }}>
          {done}/{total} done
        </div>
      </div>
      {/* sprint name */}
      <div
        className="absolute left-1/2 text-center text-[10px] font-semibold text-amber-100/90 truncate"
        style={{ top: size + 6, transform: 'translateX(-50%)', maxWidth: size * 1.6, textShadow: '0 0 6px #000' }}
      >
        {name}
      </div>
    </div>
  )
}
