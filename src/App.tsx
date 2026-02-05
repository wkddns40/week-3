import { useState, useRef } from 'react'
import './App.css'
import LandingPage from './LandingPage'
import { useI18n, LanguageToggle } from './i18n'

type PageType = 'landing' | 'input' | 'result'
type InputStep = 'photo' | 'height' | 'weight' | 'ready'

function App() {
  const { t, lang } = useI18n()
  const [currentPage, setCurrentPage] = useState<PageType>('landing')
  const [inputStep, setInputStep] = useState<InputStep>('photo')
  const [photo, setPhoto] = useState<string | null>(null)
  // Metric units (Korean)
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  // Imperial units (English)
  const [heightFeet, setHeightFeet] = useState('')
  const [heightInches, setHeightInches] = useState('')
  const [weightLbs, setWeightLbs] = useState('')

  const [loading, setLoading] = useState(false)
  const [outfitImages, setOutfitImages] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
        // Auto advance to next step after photo upload
        setTimeout(() => setInputStep('height'), 500)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const getMetricValues = () => {
    if (lang === 'ko') {
      return {
        height: heightCm,
        weight: weightKg
      }
    } else {
      // Convert imperial to metric
      const totalInches = (parseFloat(heightFeet) || 0) * 12 + (parseFloat(heightInches) || 0)
      const cm = Math.round(totalInches * 2.54)
      const kg = Math.round((parseFloat(weightLbs) || 0) / 2.205)
      return {
        height: cm.toString(),
        weight: kg.toString()
      }
    }
  }

  const handleHeightNext = () => {
    if (lang === 'ko' && heightCm) {
      setInputStep('weight')
    } else if (lang === 'en' && heightFeet && heightInches) {
      setInputStep('weight')
    }
  }

  const handleWeightNext = () => {
    if (lang === 'ko' && weightKg) {
      setInputStep('ready')
    } else if (lang === 'en' && weightLbs) {
      setInputStep('ready')
    }
  }

  const handleSubmit = async () => {
    if (!photo) {
      alert(t('uploadPhoto'))
      return
    }

    const { height, weight } = getMetricValues()

    setLoading(true)
    setOutfitImages([])

    try {
      const response = await fetch('/api/consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo, height, weight }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('errorOccurred'))
      }

      if (data.outfitImages && data.outfitImages.length > 0) {
        setOutfitImages(data.outfitImages)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : t('errorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setOutfitImages([])
    setPhoto(null)
    setHeightCm('')
    setWeightKg('')
    setHeightFeet('')
    setHeightInches('')
    setWeightLbs('')
    setInputStep('photo')
    setCurrentPage('input')
  }

  const handleBackToLanding = () => {
    setOutfitImages([])
    setPhoto(null)
    setHeightCm('')
    setWeightKg('')
    setHeightFeet('')
    setHeightInches('')
    setWeightLbs('')
    setInputStep('photo')
    setCurrentPage('landing')
  }

  const getDialogueMessage = () => {
    switch (inputStep) {
      case 'photo':
        return t('dialoguePhoto')
      case 'height':
        return t('dialogueHeight')
      case 'weight':
        return t('dialogueWeight')
      case 'ready':
        return t('dialogueReady')
    }
  }

  // Landing Page
  if (currentPage === 'landing') {
    return <LandingPage onStart={() => setCurrentPage('input')} />
  }

  // Result Page
  if (outfitImages.length > 0) {
    return (
      <div className="app-wrapper">
        <LanguageToggle />
        <button className="back-btn" onClick={handleBackToLanding}>
          <span className="material-symbols-outlined">arrow_back</span>
          {t('back')}
        </button>
      <div className="container report-container">
        <h1 className="title">{t('styleReport')}</h1>

        <div className="hairstyle-section">
          <h2 className="report-heading">{t('yourKpopStyle')}</h2>
          <div className="outfit-grid">
            {outfitImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${t('recommendedStyle')} ${index + 1}`}
                className="hairstyle-image"
              />
            ))}
          </div>
        </div>

        <div className="result-buttons">
          <button onClick={handleReset} className="submit-btn">
            <span className="material-symbols-outlined" style={{fontSize: '1.25rem', verticalAlign: 'middle', marginRight: '0.5rem'}}>refresh</span>
            {t('tryAgain')}
          </button>
          <button onClick={handleBackToLanding} className="submit-btn secondary">
            <span className="material-symbols-outlined" style={{fontSize: '1.25rem', verticalAlign: 'middle', marginRight: '0.5rem'}}>home</span>
            {t('backToHome')}
          </button>
        </div>
      </div>
      </div>
    )
  }

  // Input Page - Dialogue Flow
  return (
    <div className="app-wrapper dialogue-page">
      <LanguageToggle />
      <button className="back-btn" onClick={handleBackToLanding}>
        <span className="material-symbols-outlined">arrow_back</span>
        {t('back')}
      </button>

      <div className="dialogue-container">
        {/* AI Model Character */}
        <div className="model-section">
          <div className="model-background"></div>
          <div className="model-animated">
            <div className="model-breathing">
              <div className="model-sway">
                <img
                  src="/kpopmodel.png"
                  alt="AI Stylist"
                  className="model-image"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Speech Bubble - Below Model */}
        <div className="speech-bubble">
          <p className="dialogue-text">{getDialogueMessage()}</p>

          {/* Step 1: Photo Upload */}
          {inputStep === 'photo' && (
            <div className="dialogue-input">
              <div
                className={`photo-upload-dialogue ${isDragging ? 'dragging' : ''} ${photo ? 'has-photo' : ''}`}
                onClick={handlePhotoClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {photo ? (
                  <img src={photo} alt={t('profilePhoto')} className="photo-preview-dialogue" />
                ) : (
                  <div className="photo-placeholder-dialogue">
                    <span className="material-symbols-outlined photo-icon-dialogue">
                      {isDragging ? 'download' : 'add_a_photo'}
                    </span>
                    <span className="photo-text-dialogue">
                      {isDragging ? t('dropHere') : t('clickOrDrag')}
                    </span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="file-input"
              />
            </div>
          )}

          {/* Step 2: Height Input */}
          {inputStep === 'height' && (
            <div className="dialogue-input">
              {lang === 'ko' ? (
                <div className="input-group-dialogue">
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder={t('heightPlaceholder')}
                    className="input-dialogue"
                    min="100"
                    max="250"
                    autoFocus
                  />
                  <span className="unit-text">cm</span>
                </div>
              ) : (
                <div className="input-row-dialogue">
                  <div className="input-group-dialogue">
                    <input
                      type="number"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      placeholder="5"
                      className="input-dialogue small"
                      min="3"
                      max="8"
                      autoFocus
                    />
                    <span className="unit-text">ft</span>
                  </div>
                  <div className="input-group-dialogue">
                    <input
                      type="number"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      placeholder="7"
                      className="input-dialogue small"
                      min="0"
                      max="11"
                    />
                    <span className="unit-text">in</span>
                  </div>
                </div>
              )}
              <button
                className="next-btn"
                onClick={handleHeightNext}
                disabled={lang === 'ko' ? !heightCm : (!heightFeet || !heightInches)}
              >
                {t('nextButton')}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          )}

          {/* Step 3: Weight Input */}
          {inputStep === 'weight' && (
            <div className="dialogue-input">
              <div className="input-group-dialogue">
                <input
                  type="number"
                  value={lang === 'ko' ? weightKg : weightLbs}
                  onChange={(e) => lang === 'ko' ? setWeightKg(e.target.value) : setWeightLbs(e.target.value)}
                  placeholder={t('weightPlaceholder')}
                  className="input-dialogue"
                  min={lang === 'ko' ? 30 : 65}
                  max={lang === 'ko' ? 200 : 440}
                  autoFocus
                />
                <span className="unit-text">{lang === 'ko' ? 'kg' : 'lbs'}</span>
              </div>
              <button
                className="next-btn"
                onClick={handleWeightNext}
                disabled={lang === 'ko' ? !weightKg : !weightLbs}
              >
                {t('nextButton')}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          )}

          {/* Step 4: Ready to Submit */}
          {inputStep === 'ready' && (
            <div className="dialogue-input">
              <button
                className="submit-btn-dialogue"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading">
                    <span className="spinner"></span>
                    {t('analyzing')}
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    {t('getMyStyle')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* User's uploaded photo preview (small) */}
        {photo && inputStep !== 'photo' && (
          <div className="user-photo-preview">
            <img src={photo} alt="Your photo" />
          </div>
        )}

        {/* Progress indicator */}
        <div className="progress-dots">
          <span className={`dot ${inputStep === 'photo' ? 'active' : (photo ? 'completed' : '')}`}></span>
          <span className={`dot ${inputStep === 'height' ? 'active' : (inputStep === 'weight' || inputStep === 'ready' ? 'completed' : '')}`}></span>
          <span className={`dot ${inputStep === 'weight' ? 'active' : (inputStep === 'ready' ? 'completed' : '')}`}></span>
          <span className={`dot ${inputStep === 'ready' ? 'active' : ''}`}></span>
        </div>
      </div>
    </div>
  )
}

export default App
