interface Props {
  radius: number
  color: string
  label: string
  count: number
  highlighted: boolean
}

export default function OrbitRing({ radius, color, label, count, highlighted }: Props) {
  return (
    <div
      className="absolute pointer-events-none rounded-full transition-all duration-200"
      style={{
        left: '50%',
        top: '50%',
        width: radius * 2,
        height: radius * 2,
        marginLeft: -radius,
        marginTop: -radius,
        border: `${highlighted ? 2 : 1}px ${highlighted ? 'solid' : 'dashed'} ${color}${highlighted ? '' : '66'}`,
        boxShadow: highlighted ? `0 0 24px 4px ${color}88, inset 0 0 24px 2px ${color}44` : 'none',
      }}
    >
      <span
        className="absolute left-1/2 -top-2.5 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide whitespace-nowrap bg-[#05060f]/80"
        style={{ color, border: `1px solid ${color}${highlighted ? 'cc' : '44'}` }}
      >
        {label} · {count}
      </span>
    </div>
  )
}
