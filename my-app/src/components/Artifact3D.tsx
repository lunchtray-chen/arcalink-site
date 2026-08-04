import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, OrbitControls, useGLTF, useProgress, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { Mesh } from 'three'
import { artifactModelUrl } from '../content'
import { useMediaQuery, useVisualTestMode } from '../hooks'

const projectionUrl = '/Splash - Projected Animation on 3D model.mp4'

type ModelNodes = {
  Cube: Mesh
  壳1: Mesh
  壳2: Mesh
}

function LoadingModel() {
  const { progress } = useProgress()
  return <div className="model-loader" role="status">Loading model {Math.round(progress)}%</div>
}

function SplashLights() {
  const rig = useRef<THREE.Group>(null)

  useFrame(({ camera }) => {
    if (!rig.current) return
    rig.current.position.copy(camera.position)
    rig.current.quaternion.copy(camera.quaternion)
  })

  return (
    <>
      <ambientLight intensity={2.1} />
      <group ref={rig}>
        <directionalLight position={[3, 4.28, -0.4]} intensity={4} />
        <directionalLight position={[-4, -2.72, -2.4]} intensity={1.1} color="#ff902e" />
        <directionalLight position={[-3, 1.28, -9.4]} intensity={2.2} color="#4d8dff" />
        <directionalLight position={[3, 1.28, -9.4]} intensity={2.2} color="#4d8dff" />
      </group>
    </>
  )
}

function useProjectionTexture(video: HTMLVideoElement | null, paused: boolean) {
  const [readyVideo, setReadyVideo] = useState<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!video) {
      setReadyVideo(null)
      return
    }

    const markReady = () => setReadyVideo(video)
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) markReady()
    video.addEventListener('loadeddata', markReady)
    return () => video.removeEventListener('loadeddata', markReady)
  }, [video])

  const texture = useMemo(() => {
    if (!video || readyVideo !== video) return null
    const nextTexture = new THREE.VideoTexture(video)
    nextTexture.colorSpace = THREE.SRGBColorSpace
    nextTexture.minFilter = THREE.LinearFilter
    nextTexture.magFilter = THREE.LinearFilter
    nextTexture.needsUpdate = true
    return nextTexture
  }, [readyVideo, video])

  useEffect(() => () => texture?.dispose(), [texture])

  useEffect(() => {
    if (!video || !texture) return
    video.pause()
    let frameRequest = 0
    let timelineOrigin = performance.now() - video.currentTime * 1000

    const refreshFrame = () => {
      texture.needsUpdate = true
    }

    const advanceProjection = (now: number) => {
      const duration = video.duration
      if (paused) {
        if (video.currentTime !== 0 && !video.seeking) video.currentTime = 0
      } else if (
        document.visibilityState === 'visible'
        && Number.isFinite(duration)
        && duration > 0
        && !video.seeking
      ) {
        const nextTime = ((now - timelineOrigin) / 1000) % duration
        if (Math.abs(nextTime - video.currentTime) >= 1 / 30) video.currentTime = nextTime
      }
      frameRequest = window.requestAnimationFrame(advanceProjection)
    }

    const resetTimeline = () => {
      timelineOrigin = performance.now() - video.currentTime * 1000
    }

    video.addEventListener('seeked', refreshFrame)
    document.addEventListener('visibilitychange', resetTimeline)
    frameRequest = window.requestAnimationFrame(advanceProjection)

    return () => {
      window.cancelAnimationFrame(frameRequest)
      video.removeEventListener('seeked', refreshFrame)
      document.removeEventListener('visibilitychange', resetTimeline)
      video.pause()
    }
  }, [paused, texture, video])

  return texture
}

interface ArtifactModelProps {
  artworkUrl?: string
  modelUrl?: string
  videoTexture?: THREE.VideoTexture | null
  rotationY?: number
}

function ArtworkPlanes({ texture, screen }: { texture: THREE.Texture; screen: { box: THREE.Box3; size: THREE.Vector3; center: THREE.Vector3 } }) {
  texture.colorSpace = THREE.SRGBColorSpace
  return (
    <>
      <mesh position={[screen.center.x, screen.center.y, screen.box.max.z + 0.006]}>
        <planeGeometry args={[screen.size.x * 0.94, screen.size.y * 0.94]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[screen.center.x, screen.center.y, screen.box.min.z - 0.006]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[screen.size.x * 0.94, screen.size.y * 0.94]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </>
  )
}

function ArtworkScreens({ artworkUrl, screen }: { artworkUrl: string; screen: { box: THREE.Box3; size: THREE.Vector3; center: THREE.Vector3 } }) {
  const texture = useTexture(artworkUrl)
  return <ArtworkPlanes texture={texture} screen={screen} />
}

export function ArtifactModel({ artworkUrl, modelUrl = artifactModelUrl, videoTexture, rotationY = 0 }: ArtifactModelProps) {
  const gltf = useGLTF(modelUrl)
  const nodes = gltf.nodes as unknown as ModelNodes

  const additionalMeshes = useMemo(() => Object.entries(gltf.nodes)
    .filter(([name, node]) => !['Cube', '壳1', '壳2'].includes(name) && node instanceof THREE.Mesh)
    .map(([name, node]) => ({ name, object: node.clone() })), [gltf.nodes])

  const screen = useMemo(() => {
    nodes.Cube.geometry.computeBoundingBox()
    const box = nodes.Cube.geometry.boundingBox!
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    return { box, size, center }
  }, [nodes.Cube.geometry])

  return (
    <group rotation={[0, rotationY, 0]} dispose={null}>
      {additionalMeshes.length === 0 && (
        <>
          <mesh geometry={nodes['壳1'].geometry} castShadow receiveShadow>
            <meshStandardMaterial color="#a58f8c" roughness={0.76} metalness={0.04} />
            {!artworkUrl && <Edges color="#fff7f0" threshold={34} />}
          </mesh>
          <mesh geometry={nodes['壳2'].geometry} castShadow receiveShadow>
            <meshStandardMaterial color="#907b7a" roughness={0.8} metalness={0.03} />
            {!artworkUrl && <Edges color="#fff7f0" threshold={34} />}
          </mesh>
        </>
      )}
      <mesh geometry={nodes.Cube.geometry}>
        <meshStandardMaterial color="#171414" roughness={0.62} />
      </mesh>
      {additionalMeshes.map(({ name, object }) => <primitive key={name} object={object} />)}
      {videoTexture && <ArtworkPlanes texture={videoTexture} screen={screen} />}
      {artworkUrl && <ArtworkScreens artworkUrl={artworkUrl} screen={screen} />}
    </group>
  )
}

function SplashScene({
  keyboardYaw,
  reducedMotion,
  freezeProjection,
  projectionVideo,
  interacted,
  onInteraction,
}: {
  keyboardYaw: number
  reducedMotion: boolean
  freezeProjection: boolean
  projectionVideo: HTMLVideoElement | null
  interacted: boolean
  onInteraction: () => void
}) {
  const projectionTexture = useProjectionTexture(projectionVideo, freezeProjection)
  return (
    <>
      <SplashLights />
      <group scale={1.32} rotation={[0, -0.38, -0.1]} position={[0, -0.08, 0]}>
        <ArtifactModel videoTexture={projectionTexture} rotationY={keyboardYaw} />
      </group>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        enableDamping={!reducedMotion}
        dampingFactor={0.055}
        autoRotate={!interacted && !reducedMotion}
        autoRotateSpeed={0.48}
        onStart={onInteraction}
        target={[0, -0.12, 0]}
        minPolarAngle={Math.PI / 2 - 0.62}
        maxPolarAngle={Math.PI / 2 + 0.48}
        rotateSpeed={0.84}
      />
    </>
  )
}

export function SplashViewer() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const visualTest = useVisualTestMode()
  const reducedMotion = prefersReducedMotion || visualTest
  const [keyboardYaw, setKeyboardYaw] = useState(0)
  const [interacted, setInteracted] = useState(false)
  const [projectionVideo, setProjectionVideo] = useState<HTMLVideoElement | null>(null)
  const projectionRef = useCallback((video: HTMLVideoElement | null) => setProjectionVideo(video), [])

  return (
    <div
      className="splash-viewer"
      role="application"
      aria-label="Interactive Artifact Mini model. Drag to rotate, or use left and right arrow keys."
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          setInteracted(true)
          setKeyboardYaw((yaw) => yaw + (event.key === 'ArrowLeft' ? -0.12 : 0.12))
        }
      }}
    >
      <video
        ref={projectionRef}
        className="projection-video-source"
        src={projectionUrl}
        muted
        loop
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        disablePictureInPicture
        data-artifact-projection="true"
        aria-hidden="true"
        tabIndex={-1}
      />
      <Suspense fallback={<LoadingModel />}>
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 0.72, 5.4], fov: 35 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <SplashScene
            keyboardYaw={keyboardYaw}
            reducedMotion={reducedMotion}
            freezeProjection={visualTest}
            projectionVideo={projectionVideo}
            interacted={interacted}
            onInteraction={() => setInteracted(true)}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}

useGLTF.preload(artifactModelUrl)
