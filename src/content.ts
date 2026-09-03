import appSlide1 from './assets/images/How it works - 1.webp'
import appSlide2 from './assets/images/How it works - 2.gif'
import appSlide3 from './assets/images/How it works - 3.gif'
import appSlide4 from './assets/images/App - Placeholder Image 4.png'
import customizeDeviceAcademy from './assets/images/Customize Device - Academy.png'
import customizeDevicePalace from './assets/images/Customize Device - Palace.png'
import customizeDeviceStone from './assets/images/Customize Device - Stone.png'
import customizeDeviceWanted from './assets/images/Customize Device - Wanted.png'
import type { FaqItem, ModelConfig, PropConfig, Review, Slide } from './types'

export const publicAssetUrl = (filename: string) => `${import.meta.env.BASE_URL}${filename}`

export const artifactModelUrl = publicAssetUrl('Customize 3D Model - Wanted.glb')

export const models: ModelConfig[] = [
  { id: 'ancient-stone', label: 'Ancient Stone', imageUrl: customizeDeviceStone },
  { id: 'secret-academy', label: 'Secret Academy', imageUrl: customizeDeviceAcademy },
  { id: 'wanted', label: 'Wanted: Dead or Alive', imageUrl: customizeDeviceWanted },
  { id: 'noble-palace', label: 'Noble Palace', imageUrl: customizeDevicePalace },
]

export const props: PropConfig[] = [
  {
    id: 'burning',
    label: 'Burning',
    modelUrl: publicAssetUrl('Prop - Burning.glb'),
    initialHotspot: 'secret-academy-bottom',
  },
  {
    id: 'charmed',
    label: 'Charmed',
    modelUrl: publicAssetUrl('Prop - Charmed.glb'),
    initialHotspot: 'noble-palace-bottom',
  },
  {
    id: 'dragon',
    label: 'Dragon',
    modelUrl: publicAssetUrl('Prop - Dragon.glb'),
    initialHotspot: 'secret-academy-top',
  },
  {
    id: 'gauntlet',
    label: 'Gauntlet',
    modelUrl: publicAssetUrl('Prop - Gauntlet.glb'),
    initialHotspot: 'noble-palace-top',
  },
  {
    id: 'owl',
    label: 'Owl',
    modelUrl: publicAssetUrl('Prop - Owl.glb'),
    initialHotspot: 'ancient-stone-left',
  },
  {
    id: 'potion',
    label: 'Potion',
    modelUrl: publicAssetUrl('Prop - Potion.glb'),
    initialHotspot: 'wanted-left',
  },
  {
    id: 'spider',
    label: 'Spider',
    modelUrl: publicAssetUrl('Prop - Spider.glb'),
    initialHotspot: 'wanted-top',
  },
  {
    id: 'staff',
    label: 'Staff',
    modelUrl: publicAssetUrl('Prop - Staff.glb'),
    initialHotspot: 'ancient-stone-right',
  },
]

export const slides: Slide[] = [
  { src: appSlide1, alt: 'How the Artifex app works, step one' },
  { src: appSlide2, alt: 'How the Artifex app works, step two' },
  { src: appSlide3, alt: 'How the Artifex app works, step three' },
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
