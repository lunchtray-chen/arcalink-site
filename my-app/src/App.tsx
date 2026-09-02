import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import './App.css'
import { hotspotOccupant, initialPlacements, placeProp } from './configurator'
import { faqs, models, props, reviews, slides } from './content'
import { useDocumentVisible, useHasApproachedViewport, useMediaQuery, useVisualTestMode } from './hooks'
import type { HotspotId, PropId } from './types'

import logo from './assets/logo.svg'
import whatBackground from './assets/images/BG image - A miniature thats just better.webp'
import animationBackgroundWebm from './assets/images/BG video - Animate your heros.webm'
import animationBackgroundMp4 from './assets/images/Fallback - BG video - Animate your heros.mp4'
import animationFallback from './assets/images/Fallback Image - Animate your heros.webp'
import profilePicture from './assets/images/Placeholder Profile Picture.png'
import specsDrawing from './assets/images/Specs - Decorative Side Drawing.png'
import ctaBackground from './assets/images/BG image - Footer.jpg'
import nextImageIcon from './assets/Icons/Next Image Button.png'
import previousImageIcon from './assets/Icons/Next Image Button (Left).png'
import downArrow from './assets/Icons/Downward arrow.png'
import upArrow from './assets/Icons/Upward arrow.png'
import discordIcon from './assets/Icons/Discord icon.png'
import emailIcon from './assets/Icons/Email icon.png'
import facebookIcon from './assets/Icons/Facebook icon.png'
import instagramIcon from './assets/Icons/Instagram icon.png'
import batteryIcon from './assets/Icons/specs - battery icon.png'
import wirelessIcon from './assets/Icons/specs - wireless icon.png'
import chargingIcon from './assets/Icons/specs - charging icon.png'
import includedIcon from './assets/Icons/specs - included icon.png'
import costIcon from './assets/Icons/specs - cost icon.png'
import displayIcon from './assets/Icons/specs - display icon.png'
import sizeIcon from './assets/Icons/specs - size icon.png'
import casingIcon from './assets/Icons/specs - casing icon.png'

const SplashViewer = lazy(() => import('./components/Artifact3D').then((module) => ({ default: module.SplashViewer })))
const CustomizeCanvas = lazy(() => import('./components/Customize3D').then((module) => ({ default: module.CustomizeCanvas })))

class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('The interactive model could not be displayed.', error, info)
  }

  render() {
    if (this.state.failed) {
      return <div className="model-error" role="status">Interactive model unavailable. The rest of the page is still ready.</div>
    }
    return this.props.children
  }
}

const specs = [
  { title: 'Battery', text: <>2 day standby clock<br />5 hours active</>, icon: batteryIcon },
  { title: 'Wireless', text: <>Bluetooth and Wi-Fi<br />connectivity</>, icon: wirelessIcon },
  { title: 'Charging', text: <>Effortless magnetic<br />charging port</>, icon: chargingIcon },
  { title: 'Included', text: <>Artifact Mini LCD Display<br />Magnetic Charging Stand<br />USB-C to A Cable</>, icon: includedIcon },
  { title: 'Cost', text: <>$59<br />Plus Taxes &amp; Shipping</>, icon: costIcon },
  { title: 'Display', text: <>4K Liquid Crystal full-color<br />screen, animation-supported</>, icon: displayIcon },
  { title: 'Size', text: <>50 x 30 x 15 mm</>, icon: sizeIcon },
  { title: 'Casing Options', text: <>Stone, Academy, Wanted, Palace</>, icon: casingIcon },
]

function InertAction({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inert-action ${className}`} role="link" aria-disabled="true">
      {children}
    </span>
  )
}

function SocialLinks({ dark = false }: { dark?: boolean }) {
  const links = [
    { label: 'Discord', icon: discordIcon },
    { label: 'Email', icon: emailIcon },
    { label: 'Instagram', icon: instagramIcon },
    { label: 'Facebook', icon: facebookIcon },
  ]
  return (
    <div className={`social-links ${dark ? 'social-links--dark' : ''}`} aria-label="Social links coming soon">
      {links.map((link) => (
        <span key={link.label} role="link" aria-label={`${link.label} link unavailable`} aria-disabled="true">
          <img src={link.icon} alt="" />
        </span>
      ))}
    </div>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="header-inner">
        <img className="brand-logo" src={logo} alt="Artifex Tinkers" />
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((current) => !current)}
        >
          <span /> <span /> <span />
          <span className="sr-only">Toggle navigation</span>
        </button>
        <nav id="mobile-menu" className={`main-nav ${open ? 'main-nav--open' : ''}`} aria-label="Main navigation">
          <InertAction>Artifact Mini</InertAction>
          <InertAction>About Us</InertAction>
          <InertAction className="nav-cta">Preorder!</InertAction>
        </nav>
      </div>
    </header>
  )
}

function SplashSection() {
  const mobile = useMediaQuery('(max-width: 767px)')
  return (
    <section className="splash-section" aria-labelledby="splash-title">
      <div className="section-container splash-layout">
        <div className="splash-copy">
          <p className="eyebrow">Where Tabletop Meets Technology</p>
          <h1 id="splash-title">Artifact Mini</h1>
          <p>
            A bridge between imagination and the table. The Interactive Hub for Tabletop RPGs makes gaming more immersive and effortless, allowing stories to be seen, heard, and remembered beautifully.
          </p>
          <InertAction className="primary-button">Preorder Now!</InertAction>
        </div>
        {!mobile && (
          <ModelErrorBoundary>
            <Suspense fallback={<div className="model-loader">Loading interactive model…</div>}>
              <SplashViewer />
            </Suspense>
          </ModelErrorBoundary>
        )}
      </div>
      <button
        className="scroll-cue"
        type="button"
        aria-label="Scroll to key features"
        onClick={() => document.getElementById('what-is-it')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <img src={downArrow} alt="" />
      </button>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section
      id="what-is-it"
      className="art-section feature-section what-section animation-section"
      aria-labelledby="what-title animation-title"
    >
      <div className="what-copy">
        <p className="eyebrow">Key Features</p>
        <h2 id="what-title">A Miniature That’s Just Better.</h2>
        <p>An electronic miniature that elevates face-to-face tabletop play, extending imagination through responsive visuals and sound.</p>
      </div>
      <div className="feature-media-grid">
        <div className="feature-column">
          <img className="feature-media" src={whatBackground} alt="Two Artifact Mini devices on a fantasy game board" />
          <div className="feature-caption">
            <h3 className="eyebrow">Beautiful display</h3>
            <p>See your characters animated beautifully on twin high-resolution LCD screens, adding movement and atmosphere to your campaign.</p>
          </div>
        </div>
        <div className="feature-column">
          <video
            className="background-video feature-media"
            poster={animationFallback}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          >
            <source src={animationBackgroundWebm} type="video/webm" />
            <source src={animationBackgroundMp4} type="video/mp4" />
          </video>
          <div className="animation-copy feature-caption">
            <h3 id="animation-title" className="eyebrow">Animate Your Heroes!</h3>
            <p>See your characters animated beautifully on twin high-resolution LCD screens, adding movement and atmosphere to your campaign.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function CustomizeSection() {
  const mobile = useMediaQuery('(max-width: 767px)')
  const stageRef = useRef<HTMLDivElement>(null)
  const shouldLoadCanvas = useHasApproachedViewport(stageRef)
  const [activeIndex, setActiveIndex] = useState(0)
  const [placements, setPlacements] = useState(initialPlacements)
  const [announcement, setAnnouncement] = useState('')
  const activeModel = models[activeIndex]

  const handlePlace = (propId: PropId, hotspotId: HotspotId) => {
    const occupant = hotspotOccupant(placements, hotspotId)
    setPlacements((current) => placeProp(current, propId, hotspotId))
    const prop = props.find((item) => item.id === propId)!
    if (occupant && occupant !== propId) {
      const displacedProp = props.find((item) => item.id === occupant)!
      setAnnouncement(`${prop.label} exchanged places with ${displacedProp.label}.`)
    } else {
      setAnnouncement(`${prop.label} attached to ${hotspotId.replaceAll('-', ' ')}.`)
    }
    return true
  }

  const visibleModels = mobile ? [activeModel] : models

  return (
    <section className="customize-section" aria-labelledby="customize-title">
      <div className="section-container customize-heading">
        <h2 id="customize-title">Totally Customizable.</h2>
        <p>Four handcrafted designs fitted with magnetic hotspots, the Arca 1 is designed to adapt to any character and situation.</p>
      </div>

      <div ref={stageRef} className="customize-stage">
        {shouldLoadCanvas ? (
          <ModelErrorBoundary>
            <Suspense fallback={<div className="model-loader">Loading customizer…</div>}>
              <CustomizeCanvas placements={placements} activeModel={mobile ? activeModel.id : null} interactive={!mobile} onPlace={handlePlace} />
            </Suspense>
          </ModelErrorBoundary>
        ) : (
          <div className="model-loader">Loading customizer…</div>
        )}
        <div className="model-labels" aria-hidden="true">
          {visibleModels.map((model) => <span key={model.id}>{model.label}</span>)}
        </div>
        {mobile && (
          <div className="casing-arrows" aria-label="Choose a casing">
            <button type="button" onClick={() => setActiveIndex((activeIndex + models.length - 1) % models.length)} aria-label="Previous casing">
              <img src={previousImageIcon} alt="" />
            </button>
            <button type="button" onClick={() => setActiveIndex((activeIndex + 1) % models.length)} aria-label="Next casing">
              <img src={nextImageIcon} alt="" />
            </button>
          </div>
        )}
      </div>

      {mobile && (
        <div className="carousel-dots casing-dots" aria-label="Choose a casing">
          {models.map((model, index) => (
            <button
              key={model.id}
              type="button"
              className={index === activeIndex ? 'is-active' : ''}
              aria-label={`Show ${model.label}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}

      {!mobile && (
        <div className="prop-controls section-container">
          <p className="prop-instructions">Drag and drop props to rearrange.</p>
        </div>
      )}
      {!mobile && <p className="sr-only" aria-live="polite">{announcement}</p>}
    </section>
  )
}

function AppSlideshow() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const visible = useDocumentVisible()
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const visualTest = useVisualTestMode()

  useEffect(() => {
    if (paused || !visible || reducedMotion || visualTest) return
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 3500)
    return () => window.clearInterval(timer)
  }, [paused, reducedMotion, visible, visualTest])

  return (
    <div
      className="slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
      }}
    >
      <div className="slide-frame" aria-live="polite">
        {slides.map((slide, index) => (
          <img
            key={slide.src}
            className={`slide-image ${index === active ? 'is-active' : ''}`}
            src={slide.src}
            alt={index === active ? slide.alt : ''}
            loading="eager"
            decoding="async"
          />
        ))}
        <button type="button" className="next-slide" onClick={() => setActive((current) => (current + 1) % slides.length)} aria-label="Next image">
          <img src={nextImageIcon} alt="" />
        </button>
      </div>
      <div className="slide-dots" aria-label="Choose a slide">
        {slides.map((slide, index) => (
          <button key={slide.src} type="button" className={index === active ? 'is-active' : ''} aria-current={index === active} aria-label={`Show slide ${index + 1}`} onClick={() => setActive(index)} />
        ))}
      </div>
    </div>
  )
}

function AppSection() {
  return (
    <section className="app-section" aria-labelledby="app-title">
      <div className="section-container app-layout">
        <div className="app-copy">
          <h2 id="app-title">How Does It Work?</h2>
          <p>Simply upload your selected artwork onto our companion app, send it to a connected device, and optionally customize your device with our magnetic attachments.</p>
        </div>
        <AppSlideshow />
      </div>
    </section>
  )
}

function ReviewsSection() {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const visible = useDocumentVisible()
  const visualTest = useVisualTestMode()
  const cards = useMemo(() => [...reviews, ...reviews], [])
  return (
    <section className="reviews-section" aria-labelledby="reviews-title">
      <div className="reviews-heading">
        <p className="eyebrow">Reviews</p>
        <h2 id="reviews-title">But that’s just us.<br />What do Players have to say?</h2>
      </div>
      <div className="reviews-viewport" aria-label="Player reviews">
        <div className={`review-track ${reducedMotion || !visible || visualTest ? 'is-paused' : ''}`}>
          {cards.map((review, index) => (
            <article className="review-card" key={`${review.name}-${index}`} aria-hidden={index >= reviews.length}>
              <img src={profilePicture} alt="" />
              <h3>{review.name}</h3>
              <p className="review-role">{review.role}</p>
              <blockquote>{review.quote}</blockquote>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function SpecsSection() {
  return (
    <section className="specs-section" aria-labelledby="specs-title">
      <div className="section-container specs-layout">
        <div className="specs-copy">
          <h2 id="specs-title">The Specs.</h2>
          <div className="specs-grid">
            {specs.map((spec) => (
              <div className="spec-item" key={spec.title}>
                <img src={spec.icon} alt="" loading="lazy" />
                <div><h3>{spec.title}</h3><p>{spec.text}</p></div>
              </div>
            ))}
          </div>
        </div>
        <img className="specs-drawing" src={specsDrawing} alt="Technical line drawing of the Artifact Mini" loading="lazy" />
      </div>
    </section>
  )
}

function FaqSection() {
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  return (
    <section className="faq-section" aria-labelledby="faq-title">
      <div className="faq-inner">
        <h2 id="faq-title">Frequently Asked Questions!</h2>
        <div className="faq-list">
          {faqs.map((faq) => {
            const expanded = open.has(faq.id)
            return (
              <div className={`faq-item ${expanded ? 'is-open' : ''}`} key={faq.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`${faq.id}-answer`}
                  onClick={() => setOpen((current) => {
                    const next = new Set(current)
                    if (next.has(faq.id)) next.delete(faq.id)
                    else next.add(faq.id)
                    return next
                  })}
                >
                  <span>{faq.question}</span>
                  <img src={expanded ? upArrow : downArrow} alt="" />
                </button>
                <div id={`${faq.id}-answer`} className="faq-answer" aria-hidden={!expanded}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="more-questions">
          <h2>Have More Questions?</h2>
          <p>Contact us directly on <strong>Discord, Instagram, Facebook,</strong> or <strong>email@gmail.com</strong></p>
          <SocialLinks />
        </div>
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section className="cta-section" aria-labelledby="cta-title">
      <img src={ctaBackground} className="cta-art" alt="Four Artifact Mini designs arranged across a fantasy tabletop" loading="lazy" />
      <div className="section-container cta-copy">
        <h2 id="cta-title">Now on Kickstarter.</h2>
        <p>Want to see our project come to life? Back for just $5 with exclusive rewards.</p>
        <InertAction className="cta-button">Preorder Now!</InertAction>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="section-container footer-layout">
        <div className="footer-brand">
          <img src={logo} alt="Artifex Tinkers" />
          <SocialLinks />
        </div>
        <div className="footer-links">
          <div><InertAction>Arca 1</InertAction><InertAction>Arca 2</InertAction><InertAction>Arca Studio</InertAction></div>
          <div><InertAction>Back on Kickstarter</InertAction><InertAction>Mailing List</InertAction><InertAction>About Us</InertAction></div>
        </div>
      </div>
    </footer>
  )
}

function App() {
  return (
    <>
      <Header />
      <main>
        <SplashSection />
        <FeaturesSection />
        <div className="customize-app-background">
          <CustomizeSection />
          <AppSection />
        </div>
        <ReviewsSection />
        <SpecsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}

export default App
