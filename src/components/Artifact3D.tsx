import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, Environment, OrbitControls, useGLTF, useProgress, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { Mesh } from 'three'
import { artifactModelUrl, publicAssetUrl } from '../content'
import { useMediaQuery, useVisualTestMode } from '../hooks'

const projectionUrl = publicAssetUrl('Splash - Projected Animation on 3D model.mp4')
const environmentUrl = publicAssetUrl('pink-sunrise-compressed.exr')

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
  const pendingPlay = useRef<Promise<void> | null>(null)

  useEffect(() => {
    if (!video) {
      setReadyVideo(null)
      return
    }

    let frameCallback = 0
    let fallbackTimer = 0
    let waitingForFrame = false

    const markReady = () => {
      window.clearTimeout(fallbackTimer)
      setReadyVideo(video)
    }

    const waitForDecodedFrame = () => {
      if (waitingForFrame) return
      waitingForFrame = true
      if (typeof video.requestVideoFrameCallback === 'function') {
        frameCallback = video.requestVideoFrameCallback(markReady)
        fallbackTimer = window.setTimeout(markReady, 500)
      } else {
        markReady()
      }
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) waitForDecodedFrame()
    video.addEventListener('loadeddata', waitForDecodedFrame)
    video.addEventListener('playing', waitForDecodedFrame)
    return () => {
      video.removeEventListener('loadeddata', waitForDecodedFrame)
      video.removeEventListener('playing', waitForDecodedFrame)
      window.clearTimeout(fallbackTimer)
      if (frameCallback && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(frameCallback)
      }
    }
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
    if (!video) return

    let disposed = false
    let retryTimer = 0
    let retryCount = 0

    video.defaultMuted = true
    video.muted = true
    video.loop = true
    video.playsInline = true

    const clearRetry = () => {
      window.clearTimeout(retryTimer)
      retryTimer = 0
    }

    const ensurePlayback = () => {
      if (
        disposed
        || !shouldPlay
        || document.visibilityState !== 'visible'
        || (!video.paused && !video.ended)
        || pendingPlay.current
      ) return

      if (video.ended) video.currentTime = 0
      const attempt = video.play()
      pendingPlay.current = attempt
      attempt
        .then(() => {
          retryCount = 0
          clearRetry()
        })
        .catch((error: DOMException) => {
          if (disposed || error.name === 'AbortError' || retryCount >= 3) return
          retryCount += 1
          clearRetry()
          retryTimer = window.setTimeout(ensurePlayback, 750)
        })
        .finally(() => {
          if (pendingPlay.current === attempt) pendingPlay.current = null
        })
    }

    const pausePlayback = () => {
      clearRetry()
      if (!video.paused) video.pause()
    }

    const handleVisibility = () => {
      if (shouldPlay && document.visibilityState === 'visible') ensurePlayback()
      else pausePlayback()
    }

    const handlePageShow = () => ensurePlayback()
    const handleRecoverablePause = () => {
      if (!shouldPlay || document.visibilityState !== 'visible') return
      clearRetry()
      retryTimer = window.setTimeout(ensurePlayback, 100)
    }

    video.addEventListener('loadeddata', ensurePlayback)
    video.addEventListener('canplay', ensurePlayback)
    video.addEventListener('ended', handleRecoverablePause)
    video.addEventListener('pause', handleRecoverablePause)
    video.addEventListener('stalled', handleRecoverablePause)
    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibility)

    if (shouldPlay && document.visibilityState === 'visible') ensurePlayback()
    else pausePlayback()

    return () => {
      disposed = true
      clearRetry()
      pendingPlay.current = null
      video.removeEventListener('loadeddata', ensurePlayback)
      video.removeEventListener('canplay', ensurePlayback)
      video.removeEventListener('ended', handleRecoverablePause)
      video.removeEventListener('pause', handleRecoverablePause)
      video.removeEventListener('stalled', handleRecoverablePause)
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibility)
      video.pause()
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
  projectionInViewport,
  projectionVideo,
  interacted,
  onInteraction,
}: {
  keyboardYaw: number
  reducedMotion: boolean
  freezeProjection: boolean
  projectionInViewport: boolean
  projectionVideo: HTMLVideoElement | null
  interacted: boolean
  onInteraction: () => void
}) {
  const projectionTexture = useProjectionTexture(
    projectionVideo,
    !freezeProjection && projectionInViewport,
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
            projectionInViewport={inViewport}
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
