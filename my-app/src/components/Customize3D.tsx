import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { models, props } from '../content'
import { ArtifactModel } from './Artifact3D'
import type { Hotspot, HotspotId, ModelId, PropId, PropPlacement } from '../types'

const modelX: Record<ModelId, number> = {
  'ancient-stone': -3.5,
  'secret-academy': -1.17,
  wanted: 1.17,
  'noble-palace': 3.5,
}

const hotspotLocal = {
  top: [0, 1.55, 0.62],
  bottom: [0, -0.92, 0.62],
} as const

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

function PropMesh({
  propId,
  position,
  onDrop,
}: {
  propId: PropId
  position: readonly [number, number, number]
  onDrop: (propId: PropId, point: THREE.Vector3) => void
}) {
  const config = props.find((prop) => prop.id === propId)!
  const gltf = useGLTF(config.modelUrl)
  const object = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const [dragPosition, setDragPosition] = useState<THREE.Vector3 | null>(null)
  const dragging = useRef(false)
  const latestPoint = useRef<THREE.Vector3 | null>(null)
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.74), [])
  const intersection = useRef(new THREE.Vector3())

  const projectPointer = (event: ThreeEvent<PointerEvent>) => {
    const point = event.ray.intersectPlane(dragPlane, intersection.current)
    return point?.clone() ?? null
  }

  return (
    <group
      position={dragPosition ? [dragPosition.x, dragPosition.y, 0.78] : position}
      scale={propId === 'potion-stats' ? 0.48 : 0.42}
      onPointerDown={(event) => {
        event.stopPropagation()
        const target = event.target as unknown as { setPointerCapture: (pointerId: number) => void }
        target.setPointerCapture(event.pointerId)
        dragging.current = true
        const point = projectPointer(event)
        latestPoint.current = point
        setDragPosition(point)
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return
        event.stopPropagation()
        const point = projectPointer(event)
        if (point) {
          latestPoint.current = point
          setDragPosition(point)
        }
      }}
      onPointerUp={(event) => {
        if (!dragging.current) return
        event.stopPropagation()
        const target = event.target as unknown as { releasePointerCapture: (pointerId: number) => void }
        target.releasePointerCapture(event.pointerId)
        const point = projectPointer(event) ?? latestPoint.current
        if (point) onDrop(propId, point)
        dragging.current = false
        latestPoint.current = null
        setDragPosition(null)
      }}
      onPointerCancel={() => {
        dragging.current = false
        latestPoint.current = null
        setDragPosition(null)
      }}
    >
      <primitive object={object} />
    </group>
  )
}

interface CustomizeSceneProps {
  placements: PropPlacement
  activeModel: ModelId | null
  onPlace: (propId: PropId, hotspotId: HotspotId) => boolean
}

function CustomizeScene({ placements, activeModel, onPlace }: CustomizeSceneProps) {
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
    const nearest = hotspots
      .map((hotspot) => ({
        hotspot,
        distance: point.distanceTo(new THREE.Vector3(...hotspot.position)),
      }))
      .sort((a, b) => a.distance - b.distance)[0]
    if (nearest && nearest.distance <= 0.72) onPlace(propId, nearest.hotspot.id)
  }

  return (
    <>
      <ambientLight intensity={2.2} />
      <directionalLight position={[3, 5, 7]} intensity={3.1} />
      {models.map((model) => {
        if (activeModel && model.id !== activeModel) return null
        const x = activeModel ? 0 : modelX[model.id]
        return (
          <group key={model.id} position={[x, 0, 0]} scale={1.3}>
            <ArtifactModel artworkUrl={model.artworkUrl} />
          </group>
        )
      })}
      {hotspots.map((hotspot) => (
        <mesh
          key={hotspot.id}
          position={[hotspot.position[0], hotspot.position[1], hotspot.position[2] - 0.08]}
          renderOrder={-1}
        >
          <planeGeometry args={[0.16, 0.1]} />
          <meshBasicMaterial color="#ff5e67" transparent opacity={0.72} />
        </mesh>
      ))}
      {props.map((prop) => {
        const placement = placements[prop.id]
        if (activeModel && placement && !placement.startsWith(activeModel)) return null
        return <PropMesh key={prop.id} propId={prop.id} position={positions[prop.id]} onDrop={handleDrop} />
      })}
    </>
  )
}

export function CustomizeCanvas({ placements, activeModel, onPlace }: CustomizeSceneProps) {
  return (
    <div className="customize-canvas" aria-hidden="true">
      <Suspense fallback={<div className="model-loader">Loading customizer…</div>}>
        <Canvas
          orthographic
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 10], zoom: activeModel ? 115 : 140 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <CustomizeScene placements={placements} activeModel={activeModel} onPlace={onPlace} />
        </Canvas>
      </Suspense>
    </div>
  )
}

props.forEach((prop) => useGLTF.preload(prop.modelUrl))
