import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { decompressFrames, parseGIF, type ParsedFrame } from 'gifuct-js'
import * as THREE from 'three'
import { models, props } from '../content'
import { ModelEnvironment } from './Artifact3D'
import loadingAnimation from '../assets/images/loading animation.gif'
import type { Hotspot, HotspotId, HotspotSide, ModelId, PropId, PropPlacement } from '../types'

const modelX: Record<ModelId, number> = {
  'ancient-stone': -3.5,
  'secret-academy': -1.17,
  wanted: 1.17,
  'noble-palace': 3.5,
}

const hotspotLocal = {
  top: [0, 1.36, 0.62],
  bottom: [0, -0.91, 0.62],
  left: [-0.69, 0.8, 0.62],
  right: [0.68, 0.8, 0.62],
} as const

const snapRadius = 0.72

function DeviceImage({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl)
  texture.colorSpace = THREE.SRGBColorSpace
  const image = texture.image as HTMLImageElement
  const height = 2.8
  const width = height * (image.naturalWidth / image.naturalHeight)

  return (
    <mesh position={[0, 0, 0.2]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.01}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

function nearestHotspot(point: THREE.Vector3, hotspots: Hotspot[]) {
  const nearest = hotspots
    .map((hotspot) => ({
      hotspot,
      distance: point.distanceTo(new THREE.Vector3(...hotspot.position)),
    }))
    .sort((a, b) => a.distance - b.distance)[0]

  return nearest && nearest.distance <= snapRadius ? nearest.hotspot : null
}

function hotspotRotation(side: HotspotSide | null): readonly [number, number, number] {
  if (side === 'bottom') return [Math.PI / 2, 0, 0]
  if (side === 'left') return [Math.PI, 0, Math.PI / 2]
  if (side === 'right') return [0, 0, -Math.PI / 2]
  return [0, 0, 0]
}

function visibleHotspots(activeModel: ModelId | null): Hotspot[] {
  return models.flatMap((model) => {
    if (activeModel && activeModel !== model.id) return []
    const x = activeModel ? 0 : modelX[model.id]
    return (Object.entries(hotspotLocal) as [keyof typeof hotspotLocal, readonly [number, number, number]][])
      .map(([side, local]) => ({
        id: `${model.id}-${side}` as HotspotId,
        modelId: model.id,
        side,
        position: [x + local[0], local[1], local[2]] as const,
      }))
  })
}

type DecodedHotspotAnimation = {
  frames: ParsedFrame[]
  width: number
  height: number
}

function DecodedHotspotMarkers({ hotspots, animation }: { hotspots: Hotspot[]; animation: DecodedHotspotAnimation }) {
  const playback = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = animation.width
    canvas.height = animation.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not create the hotspot animation canvas.')

    const patchCanvas = document.createElement('canvas')
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.generateMipmaps = false
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter

    let previousFrame: ParsedFrame | null = null
    let restoreSnapshot: ImageData | null = null
    let frameIndex = 0
    let elapsedMs = 0
    let currentDelay = Math.max(animation.frames[0]?.delay ?? 100, 20)

    const drawFrame = (frame: ParsedFrame) => {
      if (previousFrame?.disposalType === 2) {
        const { left, top, width, height } = previousFrame.dims
        context.clearRect(left, top, width, height)
      } else if (previousFrame?.disposalType === 3 && restoreSnapshot) {
        context.putImageData(restoreSnapshot, 0, 0)
      }

      restoreSnapshot = frame.disposalType === 3
        ? context.getImageData(0, 0, canvas.width, canvas.height)
        : null

      patchCanvas.width = frame.dims.width
      patchCanvas.height = frame.dims.height
      const patchContext = patchCanvas.getContext('2d')
      if (!patchContext) return
      patchContext.putImageData(
        new ImageData(frame.patch, frame.dims.width, frame.dims.height),
        0,
        0,
      )
      context.drawImage(patchCanvas, frame.dims.left, frame.dims.top)
      previousFrame = frame
      texture.needsUpdate = true
    }

    if (animation.frames[0]) {
      drawFrame(animation.frames[0])
      frameIndex = animation.frames.length > 1 ? 1 : 0
    }

    return {
      texture,
      advance(deltaMs: number) {
        elapsedMs += Math.min(deltaMs, 250)
        let iterations = 0
        while (elapsedMs >= currentDelay && iterations < animation.frames.length) {
          elapsedMs -= currentDelay
          const frame = animation.frames[frameIndex]
          drawFrame(frame)
          currentDelay = Math.max(frame.delay, 20)
          frameIndex = (frameIndex + 1) % animation.frames.length
          iterations += 1
        }
      },
    }
  }, [animation])

  useEffect(() => () => playback.texture.dispose(), [playback])

  useFrame((_, delta) => playback.advance(delta * 1000))

  return hotspots.map((hotspot) => (
    <mesh
      key={hotspot.id}
      position={[hotspot.position[0], hotspot.position[1], hotspot.position[2] + 0.02]}
      renderOrder={1}
    >
      <planeGeometry args={[0.18, 0.18]} />
      <meshBasicMaterial
        map={playback.texture}
        transparent
        alphaTest={0.02}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  ))
}

function HotspotMarkers({ hotspots }: { hotspots: Hotspot[] }) {
  const [animation, setAnimation] = useState<DecodedHotspotAnimation | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(loadingAnimation, { signal: controller.signal })
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        const parsed = parseGIF(buffer)
        setAnimation({
          frames: decompressFrames(parsed, true),
          width: parsed.lsd.width,
          height: parsed.lsd.height,
        })
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.error('Could not decode the hotspot animation.', error)
      })
    return () => controller.abort()
  }, [])

  return animation ? <DecodedHotspotMarkers hotspots={hotspots} animation={animation} /> : null
}

function PropMesh({
  propId,
  position,
  placementSide,
  hotspots,
  interactive,
  onDrop,
}: {
  propId: PropId
  position: readonly [number, number, number]
  placementSide: HotspotSide | null
  hotspots: Hotspot[]
  interactive: boolean
  onDrop: (propId: PropId, point: THREE.Vector3) => void
}) {
  const config = props.find((prop) => prop.id === propId)!
  const gltf = useGLTF(config.modelUrl)
  const object = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const [dragPosition, setDragPosition] = useState<THREE.Vector3 | null>(null)
  const [hoveredSide, setHoveredSide] = useState<HotspotSide | null>(null)
  const group = useRef<THREE.Group>(null)
  const { gl } = useThree()
  const dragging = useRef(false)
  const positionInitialized = useRef(false)
  const latestPoint = useRef<THREE.Vector3 | null>(null)
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.74), [])
  const intersection = useRef(new THREE.Vector3())

  useEffect(() => () => {
    gl.domElement.style.cursor = 'default'
  }, [gl])

  useLayoutEffect(() => {
    if (!group.current || positionInitialized.current) return
    group.current.position.set(...position)
    positionInitialized.current = true
  }, [position])

  const projectPointer = (event: ThreeEvent<PointerEvent>) => {
    const point = event.ray.intersectPlane(dragPlane, intersection.current)
    return point?.clone() ?? null
  }

  const targetRotation = hotspotRotation(dragPosition ? hoveredSide : placementSide)

  useFrame((_, delta) => {
    if (!group.current) return

    if (dragPosition) {
      group.current.position.set(dragPosition.x, dragPosition.y, 0.78)
    } else {
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, position[0], 11, delta)
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, position[1], 11, delta)
      group.current.position.z = THREE.MathUtils.damp(group.current.position.z, position[2], 11, delta)
    }

    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      targetRotation[0],
      14,
      delta,
    )
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      targetRotation[1],
      14,
      delta,
    )
    group.current.rotation.z = THREE.MathUtils.damp(
      group.current.rotation.z,
      targetRotation[2],
      14,
      delta,
    )
  })

  return (
    <group
      ref={group}
      onPointerOver={interactive ? (event) => {
        event.stopPropagation()
        gl.domElement.style.cursor = 'pointer'
      } : undefined}
      onPointerOut={interactive ? () => {
        gl.domElement.style.cursor = 'default'
      } : undefined}
      onPointerDown={interactive ? (event) => {
        event.stopPropagation()
        const target = event.target as unknown as { setPointerCapture: (pointerId: number) => void }
        target.setPointerCapture(event.pointerId)
        dragging.current = true
        const point = projectPointer(event)
        latestPoint.current = point
        if (point) group.current?.position.set(point.x, point.y, 0.78)
        setDragPosition(point)
        setHoveredSide(point ? nearestHotspot(point, hotspots)?.side ?? null : null)
      } : undefined}
      onPointerMove={interactive ? (event) => {
        if (!dragging.current) return
        event.stopPropagation()
        const point = projectPointer(event)
        if (point) {
          latestPoint.current = point
          group.current?.position.set(point.x, point.y, 0.78)
          setDragPosition(point)
          setHoveredSide(nearestHotspot(point, hotspots)?.side ?? null)
        }
      } : undefined}
      onPointerUp={interactive ? (event) => {
        if (!dragging.current) return
        event.stopPropagation()
        const target = event.target as unknown as { releasePointerCapture: (pointerId: number) => void }
        target.releasePointerCapture(event.pointerId)
        const point = projectPointer(event) ?? latestPoint.current
        if (point) onDrop(propId, point)
        dragging.current = false
        latestPoint.current = null
        setDragPosition(null)
        setHoveredSide(null)
      } : undefined}
      onPointerCancel={interactive ? () => {
        gl.domElement.style.cursor = 'default'
        dragging.current = false
        latestPoint.current = null
        setDragPosition(null)
        setHoveredSide(null)
      } : undefined}
    >
      <primitive object={object} />
    </group>
  )
}

interface CustomizeSceneProps {
  placements: PropPlacement
  activeModel: ModelId | null
  interactive: boolean
  onPlace: (propId: PropId, hotspotId: HotspotId) => boolean
}

function CustomizeScene({ placements, activeModel, interactive, onPlace }: CustomizeSceneProps) {
  const hotspots = visibleHotspots(activeModel)
  const trayIds = props.filter((prop) => placements[prop.id] === null).map((prop) => prop.id)

  const positions = Object.fromEntries(
    props.map((prop) => {
      const placement = placements[prop.id]
      const hotspot = hotspots.find((item) => item.id === placement)
      if (hotspot) return [prop.id, hotspot.position]
      const trayIndex = trayIds.indexOf(prop.id)
      return [prop.id, [(-trayIds.length + 1) * 0.48 + trayIndex * 0.96, -2.1, 0.78] as const]
    }),
  ) as Record<PropId, readonly [number, number, number]>

  const handleDrop = (propId: PropId, point: THREE.Vector3) => {
    const target = nearestHotspot(point, hotspots)
    if (target) onPlace(propId, target.id)
  }

  return (
    <>
      <ModelEnvironment />
      {models.map((model) => {
        if (activeModel && model.id !== activeModel) return null
        const x = activeModel ? 0 : modelX[model.id]
        return (
          <group key={model.id} position={[x, 0, 0]}>
            <DeviceImage imageUrl={model.imageUrl} />
          </group>
        )
      })}
      <HotspotMarkers hotspots={hotspots} />
      {props.map((prop) => {
        const placement = placements[prop.id]
        if (activeModel && placement && !placement.startsWith(activeModel)) return null
        const placementSide = hotspots.find((hotspot) => hotspot.id === placement)?.side ?? null
        return (
          <PropMesh
            key={prop.id}
            propId={prop.id}
            position={positions[prop.id]}
            placementSide={placementSide}
            hotspots={hotspots}
            interactive={interactive}
            onDrop={handleDrop}
          />
        )
      })}
    </>
  )
}

export function CustomizeCanvas({ placements, activeModel, interactive, onPlace }: CustomizeSceneProps) {
  return (
    <div className="customize-canvas" aria-hidden="true">
      <Suspense fallback={<div className="model-loader">Loading customizer…</div>}>
        <Canvas
          orthographic
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 10], zoom: activeModel ? 115 : 140 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <CustomizeScene
            placements={placements}
            activeModel={activeModel}
            interactive={interactive}
            onPlace={onPlace}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}

props.forEach((prop) => useGLTF.preload(prop.modelUrl))
