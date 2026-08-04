import appSlide1 from './assets/images/App - Placeholder Image 1.png'
import appSlide2 from './assets/images/App - Placeholder Image 2.png'
import appSlide3 from './assets/images/App - Placeholder Image 3.png'
import appSlide4 from './assets/images/App - Placeholder Image 4.png'
import customizeArtwork from './assets/images/Customize - Unique Artwork Placeholder.png'
import type { FaqItem, ModelConfig, PropConfig, Review, Slide } from './types'

export const artifactModelUrl = '/Splash Page Rotatable 3D Model.glb'

export const models: ModelConfig[] = [
  { id: 'ancient-stone', label: 'Ancient Stone', modelUrl: artifactModelUrl, artworkUrl: customizeArtwork },
  { id: 'secret-academy', label: 'Secret Academy', modelUrl: artifactModelUrl, artworkUrl: customizeArtwork },
  { id: 'wanted', label: 'Wanted: Dead or Alive', modelUrl: artifactModelUrl, artworkUrl: customizeArtwork },
  { id: 'noble-palace', label: 'Noble Palace', modelUrl: artifactModelUrl, artworkUrl: customizeArtwork },
]

export const props: PropConfig[] = [
  {
    id: 'potion-stats',
    label: 'Potion stats',
    modelUrl: '/Customize - Prop placeholder 1.glb',
    initialHotspot: 'ancient-stone-top',
  },
  {
    id: 'character-status',
    label: 'Character status',
    modelUrl: '/Customize - Prop placeholder 2.glb',
    initialHotspot: 'secret-academy-bottom',
  },
  {
    id: 'character-class',
    label: 'Character class',
    modelUrl: '/Customize - Prop placeholder 3.glb',
    initialHotspot: 'wanted-top',
  },
]

export const slides: Slide[] = [
  { src: appSlide1, alt: 'Arca Studio app preview, orange placeholder' },
  { src: appSlide2, alt: 'Arca Studio app preview, green placeholder' },
  { src: appSlide3, alt: 'Arca Studio app preview, blue placeholder' },
  { src: appSlide4, alt: 'Arca Studio app preview, pink placeholder' },
]

export const reviews: Review[] = Array.from({ length: 6 }, () => ({
  name: 'Name',
  role: 'Info',
  quote: '“Wow, so good!”',
}))

export const faqs: FaqItem[] = [
  {
    id: 'what-is-it',
    question: 'What is the Artifact Mini?',
    answer: 'The Artifact Mini is a digital tabletop miniature with a vivid screen, made to bring animated characters and campaign moments to the table.',
  },
  {
    id: 'comparison',
    question: 'How does the Artifact Mini compare to other digital miniatures?',
    answer: 'The Artifact Mini is a one-of-a-kind, high-quality digital miniature that supports animation and is thoughtfully designed to fit the scenery of your campaign.',
  },
  {
    id: 'customize',
    question: 'Can I customize my Artifact Mini?',
    answer: 'Yes. Magnetic hotspots let you rearrange compatible props, while different casings and character artwork help each miniature feel unique.',
  },
  {
    id: 'included',
    question: 'What comes in the box?',
    answer: 'Each Artifact Mini includes the LCD display, magnetic charging stand, and a USB-C to USB-A cable.',
  },
]
