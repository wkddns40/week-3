import { createContext, useContext, useState, type ReactNode } from 'react'

type Language = 'ko' | 'en'

const translations = {
  ko: {
    // Landing Page
    logoText: 'K-Stylist AI',
    heroTitle: 'YOUR AI\nIDOL STYLIST',
    heroDescription: '당신의 비주얼 잠재력을 열어보세요. AI 아이돌 엔진이 큐레이팅한 맞춤 K-스타일.',
    startAudition: '오디션 시작하기',
    faceTech: '얼굴 분석',
    bodyFit: '체형 분석',
    curated: '맞춤 추천',
    readyForStage: '무대에 오를 준비 됐나요?',
    joinFans: '오늘 나만의 시그니처 아이돌 룩을 찾아보세요.',
    getStartedNow: '지금 시작하기',
    copyright: '© 2026 K-Stylist AI Studio. All Visuals Protected.',

    // Input Page - Dialogue Flow
    styleCheck: 'STYLE CHECK',
    findYourStyle: '당신만의 K-POP 스타일을 찾아드립니다',
    profilePhoto: '프로필 사진',
    dropHere: '여기에 놓으세요',
    clickOrDrag: '클릭 또는 드래그',
    height: '키 (cm)',
    heightPlaceholder: '예: 170',
    heightPlaceholderInches: '',
    weight: '몸무게 (kg)',
    weightPlaceholder: '예: 65',
    feet: 'ft',
    inches: 'in',
    getMyStyle: '스타일 분석하기',
    analyzing: '분석 중...',
    uploadPhoto: '사진을 업로드해주세요.',
    errorOccurred: '오류가 발생했습니다.',
    // Dialogue messages
    dialoguePhoto: '안녕하세요! YUJI예요. 먼저 당신의 사진을 보여주세요!',
    dialogueHeight: '멋진 사진이네요! 키가 어떻게 되세요?',
    dialogueWeight: '좋아요! 마지막으로 몸무게를 알려주세요.',
    dialogueReady: '완벽해요! 이제 당신만의 K-POP 스타일을 찾아드릴게요!',
    nextButton: '다음',
    uploadButton: '사진 업로드',

    // Result Page
    styleReport: 'STYLE REPORT',
    yourKpopStyle: 'Your K-Pop Style',
    recommendedStyle: '추천 K-pop 스타일 코디',
    tryAgain: '다시 시도',
    backToHome: '홈으로',
    back: '뒤로',
  },
  en: {
    // Landing Page
    logoText: 'K-Stylist AI',
    heroTitle: 'YOUR AI\nIDOL STYLIST',
    heroDescription: 'Unlock your visual potential. Personalized K-Style curated by our virtual idol engine.',
    startAudition: 'Start My Audition',
    faceTech: 'Face Tech',
    bodyFit: 'Body Fit',
    curated: 'Curated',
    readyForStage: 'Ready for the Stage?',
    joinFans: 'Join many fans finding their signature idol look today.',
    getStartedNow: 'Get Started Now',
    copyright: '© 2026 K-Stylist AI Studio. All Visuals Protected.',

    // Input Page - Dialogue Flow
    styleCheck: 'STYLE CHECK',
    findYourStyle: 'Find your unique K-POP style',
    profilePhoto: 'Profile Photo',
    dropHere: 'Drop here',
    clickOrDrag: 'Click or Drag',
    height: 'Height',
    heightPlaceholder: 'ft',
    heightPlaceholderInches: 'in',
    weight: 'Weight (lbs)',
    weightPlaceholder: 'e.g. 140',
    feet: 'ft',
    inches: 'in',
    getMyStyle: 'Get My Style',
    analyzing: 'Analyzing...',
    uploadPhoto: 'Please upload a photo.',
    errorOccurred: 'An error occurred.',
    // Dialogue messages
    dialoguePhoto: "Hi! I'm YUJI. First, show me your photo!",
    dialogueHeight: "Great photo! What's your height?",
    dialogueWeight: "Nice! Lastly, what's your weight?",
    dialogueReady: "Perfect! Let me find your K-POP style!",
    nextButton: 'Next',
    uploadButton: 'Upload Photo',

    // Result Page
    styleReport: 'STYLE REPORT',
    yourKpopStyle: 'Your K-Pop Style',
    recommendedStyle: 'Recommended K-pop Style',
    tryAgain: 'Try Again',
    backToHome: 'Back to Home',
    back: 'Back',
  }
}

interface I18nContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: keyof typeof translations.ko) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('ko')

  const t = (key: keyof typeof translations.ko): string => {
    return translations[lang][key] || key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n()

  return (
    <button
      className="lang-toggle"
      onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
    >
      {lang === 'ko' ? 'EN' : '한국어'}
    </button>
  )
}
