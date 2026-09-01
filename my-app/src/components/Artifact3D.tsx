import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, Environment, OrbitControls, useGLTF, useProgress, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { Mesh } from 'three'
import { artifactModelUrl } from '../content'
import { useMediaQuery, useVisualTestMode } from '../hooks'

const projectionUrl = '/Splash - Projected Animation on 3D model.mp4'
const environmentUrl = '/pink_sunrise_4k.exr'

type ModelNodes = {
  Cube: Mesh
  壳1: Mesh
  壳2: Mesh
}

function LoadingModel() {
  const { progress } = useProgress()
  return <div className="model-loader" role="status">Loading model {Math.round(progress)}%</div>
}

export function ModelEnvironment() {
  const lightRig = useRef<THREE.Group>(null)
  const keyLight = useRef<THREE.RectAreaLight>(null)
  const rimLight = useRef<THREE.RectAreaLight>(null)

  useFrame(({ camera }) => {
    if (!lightRig.current) return
    lightRig.current.position.copy(camera.position)
    lightRig.current.quaternion.copy(camera.quaternion)
    keyLight.current?.lookAt(0, 0, 0)
    rimLight.current?.lookAt(0, 0, 0)
  })

  return (
    <>
      <Environment files={environmentUrl} background={false} environmentIntensity={2} />
      <group ref={lightRig}>
        <rectAreaLight
          ref={keyLight}
          color="#fff8f1"
          intensity={1}
          width={3}
          height={9}
          position={[0, 1, -2.5]}
        />
        <rectAreaLight
          ref={rimLight}
          color="#80afff"
          intensity={12}
          width={12}
          height={9}
          position={[6, 2, -7]}
        />
      </group>
    </>
  )
}

function useProjectionTexture(video: HTMLVideoElement | null, shouldPlay: boolean) {
  const [readyVideo, setReadyVideo] = useState<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!video) {
      setReadyVideo(null)
      return
    }

    const markReady = () => setReadyVideo(video)

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) markReady()
    else video.addEventListener('loadeddata', markReady, { once: true })

    return () => {
      video.removeEventListener('loadeddata', markReady)
    }
  }, [video])

  const texture = useMemo(() => {
    if (!video || readyVideo !== video) return null
    const nextTexture = new THREE.VideoTexture(video)
    nextTexture.colorSpace = THREE.SRGBColorSpace
    nextTexture.minFilter = THREE.LinearFilter
    nextTexture.magFilter = THREE.LinearFilter
    return nextTexture
  }, [readyVideo, video])

  useEffect(() => () => texture?.dispose(), [texture])

  useEffect(() => {
    if (!video) return

    const startPlayback = () => {
      if (!shouldPlay || document.visibilityState !== 'visible' || !video.paused) return
      void video.play().catch(() => {
        // The element's native muted autoplay remains the fallback.
      })
    }

    const handleVisibility = () => {
      if (shouldPlay && document.visibilityState === 'visible') startPlayback()
      else if (!video.paused) video.pause()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    handleVisibility()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [shouldPlay, video])

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
    .map(([name, node]) => {
      const object = (node as THREE.Mesh).clone()
      object.castShadow = true
      object.receiveShadow = true
      return { name, object }
    }), [gltf.nodes])

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
  const projectionTexture = useProjectionTexture(
    projectionVideo,
    !freezeProjection,
  )
  return (
    <>
      <ModelEnvironment />
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
  const [inViewport, setInViewport] = useState(true)
  const viewer = useRef<HTMLDivElement>(null)
  const projectionRef = useCallback((video: HTMLVideoElement | null) => setProjectionVideo(video), [])

  useEffect(() => {
    const element = viewer.current
    if (!element || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => {
      setInViewport(entry.isIntersecting)
    }, { rootMargin: '120px 0px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={viewer}
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
        autoPlay
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
          frameloop={inViewport ? 'always' : 'never'}
          dpr={[1, 1.75]}
          camera={{ position: [0, 0.72, 5.4], fov: 35 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <SplashScene
            keyboardYaw={keyboardYaw}
            reducedMotion={reducedMotion}
            freezeProjection={reducedMotion}
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
