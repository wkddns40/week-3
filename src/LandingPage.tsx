import { useI18n, LanguageToggle } from './i18n'

interface LandingPageProps {
  onStart: () => void
}

function LandingPage({ onStart }: LandingPageProps) {
  const { t } = useI18n()

  return (
    <div className="landing-page">
      {/* Language Toggle */}
      <LanguageToggle />

      {/* Top Navigation Bar */}
      <header className="landing-header">
        <div className="logo">
          <span className="material-symbols-outlined logo-icon">auto_awesome</span>
          <span className="logo-text">{t('logoText')}</span>
        </div>
        <div className="header-buttons">
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero-section">
        {/* Background Image */}
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-overlay"></div>
          <img
            alt="Virtual K-Pop Idol"
            className="hero-image"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoFmXq1-GT42tEA_Ya566twHoSYNKI5sqzh7ZNd6N03Gn9vLWMOL8oLcCId9AAiY4qQjZv8Wy6mp_cKOAuRr7envTZtjOOL62jNLol7EIHy4iOv2hBxvB89pXt01inGX3wWyO5T3lHdqxhXZ3uQUCViwJQED3CY8nKsXMaaMQQa8LmrBLdQcmp2vW0yRxaRr_RTlI8hqrf4sKa_V7CeJ-PZ7Gg95jSPV9T9HeBhKR6ozZsToD2nexhYRKQ3uGkJwS7a3tCCezbtwWf"
          />
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              {t('heroTitle').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br/>}</span>
              ))}
            </h1>
            <p className="hero-description">
              {t('heroDescription')}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="cta-buttons">
            <button className="cta-primary" onClick={onStart}>
              <span className="material-symbols-outlined">camera_enhance</span>
              {t('startAudition')}
            </button>
          </div>

          {/* Feature Icons */}
          <div className="feature-icons">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <span className="material-symbols-outlined feature-icon">face</span>
              </div>
              <span className="feature-label">{t('faceTech')}</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <span className="material-symbols-outlined feature-icon">straighten</span>
              </div>
              <span className="feature-label">{t('bodyFit')}</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <span className="material-symbols-outlined feature-icon">temp_preferences_custom</span>
              </div>
              <span className="feature-label">{t('curated')}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer CTA Section */}
      <section className="footer-cta">
        <div className="footer-content">
          <div className="footer-text">
            <h2 className="footer-title">{t('readyForStage')}</h2>
            <p className="footer-description">
              {t('joinFans')}
            </p>
          </div>

          <button className="footer-cta-btn" onClick={onStart}>
            {t('getStartedNow')}
          </button>

          {/* Social Icons */}
          <div className="social-icons">
            <span className="material-symbols-outlined social-icon">brand_family</span>
            <span className="material-symbols-outlined social-icon">diamond</span>
            <span className="material-symbols-outlined social-icon">music_note</span>
          </div>

          <p className="copyright">
            {t('copyright')}
          </p>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
