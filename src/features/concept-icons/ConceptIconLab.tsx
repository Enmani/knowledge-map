import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import './ConceptIconLab.css'
import {
  createGridPlanePaths,
  LINEAR_OPEN_ROTATIONS,
  LINEAR_PLANE_DEFINITIONS,
} from './linearAlgebraGeometry'

type PlaybackSpeed = 0.7 | 1 | 1.35

interface IconShellProps {
  className?: string
  index: string
  title: string
  english: string
  motion: string
  children: ReactNode
}

interface AnimatedIconProps {
  speed: PlaybackSpeed
}

function IconShell({
  className = '',
  index,
  title,
  english,
  motion,
  children,
}: IconShellProps) {
  return (
    <article className={`concept-study ${className}`.trim()}>
      <div className="concept-study__meta" aria-hidden="true">
        <span>{index}</span>
        <span>{motion}</span>
      </div>
      <div className="concept-study__stage">{children}</div>
      <div className="concept-study__caption">
        <h2>{title}</h2>
        <p>{english}</p>
      </div>
    </article>
  )
}

function WaveIcon() {
  return (
    <svg className="concept-icon concept-icon--wave" viewBox="0 0 180 140" role="img" aria-label="传播中的正弦波">
      <defs>
        <clipPath id="wave-clip">
          <rect x="19" y="22" width="142" height="97" />
        </clipPath>
        <linearGradient id="wave-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.24" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="icon-grid">
        <path d="M19 70H166" />
        <path d="M35 116V20" />
        <path d="m166 70-7-4m7 4-7 4M35 20l-4 7m4-7 4 7" />
      </g>
      <path className="wave-area" d="M35 70C47 70 49 39 63 39s17 62 31 62 17-62 31-62 17 31 31 31v0H35Z" />
      <path className="wave-base" d="M19 70C33 70 35 39 49 39s17 62 31 62 17-62 31-62 17 62 31 62 17-31 31-31" />
      <path className="wave-signal" pathLength="1" d="M19 70C33 70 35 39 49 39s17 62 31 62 17-62 31-62 17 62 31 62 17-31 31-31" />
      <g clipPath="url(#wave-clip)">
        <circle className="wave-particle" cx="49" cy="39" r="3.4" />
      </g>
    </svg>
  )
}

function OrbitIcon({ speed }: AnimatedIconProps) {
  return (
    <svg className="concept-icon concept-icon--orbit" viewBox="0 0 160 160" role="img" aria-label="粒子沿三个原子轨道运行">
      <g className="orbit-rings">
        <ellipse cx="80" cy="80" rx="57" ry="23" />
        <ellipse cx="80" cy="80" rx="57" ry="23" transform="rotate(60 80 80)" />
        <ellipse cx="80" cy="80" rx="57" ry="23" transform="rotate(120 80 80)" />
      </g>
      <circle className="orbit-nucleus orbit-nucleus--outer" cx="80" cy="80" r="9" />
      <circle className="orbit-nucleus orbit-nucleus--inner" cx="80" cy="80" r="3" />
      <circle className="orbit-particle" r="3.6">
        <animateMotion dur={`${4.8 / speed}s`} repeatCount="indefinite" path="M23 80a57 23 0 1 0 114 0 57 23 0 1 0-114 0" />
      </circle>
      <g transform="rotate(60 80 80)">
        <circle className="orbit-particle orbit-particle--dim" r="3.1">
          <animateMotion begin="-1.4s" dur={`${5.4 / speed}s`} repeatCount="indefinite" path="M23 80a57 23 0 1 0 114 0 57 23 0 1 0-114 0" />
        </circle>
      </g>
      <g transform="rotate(120 80 80)">
        <circle className="orbit-particle orbit-particle--dim" r="3.1">
          <animateMotion begin="-2.7s" dur={`${6.1 / speed}s`} repeatCount="indefinite" path="M23 80a57 23 0 1 0 114 0 57 23 0 1 0-114 0" />
        </circle>
      </g>
    </svg>
  )
}

function GoldenSpiralIcon() {
  return (
    <svg className="concept-icon concept-icon--spiral" viewBox="0 0 160 160" role="img" aria-label="黄金螺旋沿斐波那契矩形生长">
      <g className="spiral-grid">
        <rect x="25" y="25" width="110" height="110" />
        <path d="M93 25v68H25M93 67h42M119 67v26M93 83h26M109 83v10" />
      </g>
      <path className="spiral-ghost" d="M109 91C109 86 105 83 101 83c-5 0-8 4-8 10 0 14 11 26 26 26 9 0 16-8 16-18 0-20-16-34-42-34-37 0-68 30-68 68" />
      <path className="spiral-draw" pathLength="1" d="M109 91C109 86 105 83 101 83c-5 0-8 4-8 10 0 14 11 26 26 26 9 0 16-8 16-18 0-20-16-34-42-34-37 0-68 30-68 68" />
      <circle className="spiral-origin" cx="109" cy="91" r="2.4" />
    </svg>
  )
}

function LightConeIcon() {
  return (
    <svg className="concept-icon concept-icon--cone" viewBox="0 0 160 160" role="img" aria-label="截面沿光锥扫描">
      <defs>
        <clipPath id="cone-clip">
          <path d="M80 17 25 72l55 71 55-71Z" />
        </clipPath>
      </defs>
      <g className="cone-frame">
        <path d="M80 17 25 72l55 71 55-71Z" />
        <path d="M25 72c0 8 25 15 55 15s55-7 55-15M25 72c0-8 25-15 55-15s55 7 55 15" />
        <path d="M80 17v126" />
      </g>
      <g className="cone-ripples" clipPath="url(#cone-clip)">
        <ellipse cx="80" cy="72" rx="48" ry="13" />
        <ellipse cx="80" cy="72" rx="35" ry="9" />
        <ellipse cx="80" cy="72" rx="21" ry="5.5" />
      </g>
      <g className="cone-scan" clipPath="url(#cone-clip)">
        <ellipse cx="80" cy="72" rx="48" ry="13" />
        <path d="M28 72H132" />
      </g>
      <circle className="cone-event" cx="80" cy="72" r="3" />
    </svg>
  )
}

const torusLatitudePaths = Array.from({ length: 8 }, (_, index) => {
  const radius = 20 + index * 4.1
  return `M${80 - radius} 80a${radius} ${radius * 0.34} 0 1 0 ${radius * 2} 0a${radius} ${radius * 0.34} 0 1 0-${radius * 2} 0`
})

const torusLongitudeAngles = [-70, -50, -30, -10, 10, 30, 50, 70]

function TorusIcon() {
  return (
    <svg className="concept-icon concept-icon--torus" viewBox="0 0 160 160" role="img" aria-label="环面线框中的相位持续流动">
      <g className="torus-tilt" transform="rotate(-9 80 80)">
        <g className="torus-wire">
          {torusLatitudePaths.map((path, index) => (
            <path key={path} d={path} opacity={0.35 + index * 0.07} />
          ))}
          {torusLongitudeAngles.map((angle) => (
            <ellipse key={angle} cx="80" cy="80" rx="19" ry="53" transform={`rotate(${angle} 80 80)`} />
          ))}
        </g>
        <ellipse className="torus-core" cx="80" cy="80" rx="23" ry="8" />
        <path className="torus-flow" pathLength="1" d="M27 80a53 18 0 1 0 106 0 53 18 0 1 0-106 0" />
      </g>
    </svg>
  )
}

const LINEAR_EASING = '0 0 1 1; 0.7 0 0.3 1; 0 0 1 1; 0.7 0 0.3 1; 0 0 1 1'

const LINEAR_PLANES = LINEAR_PLANE_DEFINITIONS.map((plane) => ({
  id: plane.id,
  start: createGridPlanePaths(plane.firstAxis, plane.secondAxis),
  opened: createGridPlanePaths(
    plane.firstAxis,
    plane.secondAxis,
    LINEAR_OPEN_ROTATIONS[plane.id],
  ),
}))

function planeAnimationValues(start: string, opened: string): string {
  return [start, start, opened, opened, start, start].join(';')
}

interface LinearAlgebraIconProps {
  speed?: number
  durationSeconds?: number
  repeatCount?: number | 'indefinite'
}

export function LinearAlgebraIcon({
  speed = 1,
  durationSeconds,
  repeatCount = 'indefinite',
}: LinearAlgebraIconProps) {
  const duration = `${durationSeconds ?? 4 / speed}s`

  return (
    <svg
      className="concept-icon concept-icon--linear"
      viewBox="0 0 160 160"
      role="img"
      aria-label="三个完整网格平面穿过中心旋转，原平面轮廓保持可见"
    >
      <g className="linear-reference-planes" aria-hidden="true">
        {LINEAR_PLANES.map((plane) => (
          <path
            key={plane.id}
            className={`linear-reference-plane linear-reference-plane--${plane.id}`}
            d={plane.start.fill}
          />
        ))}
      </g>

      <g className="linear-grid-planes">
        {LINEAR_PLANES.map((plane) => (
          <g key={plane.id} className={`linear-grid-plane linear-grid-plane--${plane.id}`}>
            <path className="linear-grid-plane__fill" d={plane.start.fill}>
              <animate
                attributeName="d"
                dur={duration}
                repeatCount={repeatCount}
                calcMode="spline"
                keyTimes="0; 0.12; 0.48; 0.62; 0.92; 1"
                keySplines={LINEAR_EASING}
                values={planeAnimationValues(plane.start.fill, plane.opened.fill)}
              />
            </path>
            <path className="linear-grid-plane__lines" d={plane.start.grid}>
              <animate
                attributeName="d"
                dur={duration}
                repeatCount={repeatCount}
                calcMode="spline"
                keyTimes="0; 0.12; 0.48; 0.62; 0.92; 1"
                keySplines={LINEAR_EASING}
                values={planeAnimationValues(plane.start.grid, plane.opened.grid)}
              />
            </path>
          </g>
        ))}
      </g>

    </svg>
  )
}

export default function ConceptIconLab() {
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState<PlaybackSpeed>(1)
  const [epoch, setEpoch] = useState(0)
  const labRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const icons = labRef.current?.querySelectorAll('svg') ?? []
    icons.forEach((icon) => {
      if (playing) icon.unpauseAnimations()
      else icon.pauseAnimations()
    })
  }, [epoch, playing, speed])

  const style = {
    '--motion-state': playing ? 'running' : 'paused',
    '--motion-rate': 1 / speed,
  } as CSSProperties

  const replay = () => {
    setPlaying(true)
    setEpoch((current) => current + 1)
  }

  return (
    <div ref={labRef} className="concept-lab" style={style}>
      <header className="concept-lab__header">
        <div className="concept-lab__intro">
          <p className="concept-lab__eyebrow">Motion studies · 01—06</p>
          <h1>让概念<br />自己运动</h1>
          <p className="concept-lab__lede">
            六种数学与物理运动语法。骨架保持安静，只有承载含义的部分持续变化。
          </p>
        </div>

        <div className="concept-controls" aria-label="动画播放控制">
          <button type="button" className="concept-controls__primary" onClick={() => setPlaying((current) => !current)}>
            <span className="concept-controls__symbol" aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
            {playing ? '暂停' : '播放'}
          </button>
          <button type="button" onClick={replay}>从头播放</button>
          <div className="concept-speed" aria-label="播放速度">
            {([0.7, 1, 1.35] as const).map((rate) => (
              <button
                type="button"
                key={rate}
                aria-pressed={speed === rate}
                onClick={() => setSpeed(rate)}
              >
                {rate === 0.7 ? '慢' : rate === 1 ? '标准' : '快'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section key={epoch} className="concept-lab__studies" aria-label="动态概念图标原型">
        <IconShell className="concept-study--wave" index="01" title="正弦波" english="Sine wave" motion="传播 / Phase">
          <WaveIcon />
        </IconShell>
        <IconShell className="concept-study--orbit" index="02" title="原子轨道" english="Atomic orbit" motion="轨道 / Orbit">
          <OrbitIcon speed={speed} />
        </IconShell>
        <IconShell className="concept-study--spiral" index="03" title="黄金螺旋" english="Golden spiral" motion="生长 / Draw">
          <GoldenSpiralIcon />
        </IconShell>
        <IconShell className="concept-study--cone" index="04" title="光锥" english="Light cone" motion="扫描 / Sweep">
          <LightConeIcon />
        </IconShell>
        <IconShell className="concept-study--torus" index="05" title="环面" english="Torus" motion="相位 / Flow">
          <TorusIcon />
        </IconShell>
        <IconShell className="concept-study--linear" index="06" title="线性代数" english="Linear algebra" motion="旋转 / Planes">
          <LinearAlgebraIcon speed={speed} />
        </IconShell>
      </section>

      <footer className="concept-lab__footer">
        <span>SVG / CSS / SMIL</span>
        <span>Knowledge map motion prototype</span>
      </footer>
    </div>
  )
}
