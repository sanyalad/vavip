import { useVideoStack } from '@/hooks/useVideoStack'
import VideoSection from '@/components/animations/VideoSection'
import Footer from '@/components/layout/Footer'
import styles from './Home.module.css'

const videoSections = [
  {
    id: 'uzel-vvoda',
    title: '╨г╨Ч╨Х╨Ы ╨Т╨Т╨Ю╨Ф╨Р',
    videoSrc: '/videos/background1.mp4',
    posterSrc: undefined,
    link: '/catalog/uzel-vvoda',
  },
  {
    id: 'bim',
    title: '╨Я╨а╨Ю╨Х╨Ъ╨в╨Ш╨а╨Ю╨Т╨Р╨Э╨Ш╨Х BIM',
    videoSrc: '/videos/background2.mp4',
    posterSrc: undefined,
    link: '/services/bim',
  },
  {
    id: 'montazh',
    title: '╨Ь╨Ю╨Э╨в╨Р╨Ц',
    videoSrc: '/videos/background3.mp4',
    posterSrc: undefined,
    link: '/services/montazh',
  },
  {
    id: 'shop',
    title: '╨Ь╨Р╨У╨Р╨Ч╨Ш╨Э',
    videoSrc: '/videos/background4.mp4',
    posterSrc: undefined,
    link: '/shop',
  },
]

export default function HomePage() {
  const {
    activeIndex,
    direction,
    isFooterOpen,
    sectionRefs,
    closeFooter,
  } = useVideoStack({ totalSections: videoSections.length })

  return (
    <div className={styles.home}>
      {/* Video Sections Wrapper */}
      <div className={styles.videoSectionsWrapper}>
        {videoSections.map((section, index) => {
          const isLast = index === videoSections.length - 1
          const nextVideoSrc = index < videoSections.length - 1 ? videoSections[index + 1].videoSrc : undefined

          return (
            <VideoSection
              key={section.id}
              ref={(el) => {
                sectionRefs.current[index] = el
              }}
              {...section}
              index={index}
              isLast={isLast}
              isActive={index === activeIndex}
              isNext={index === activeIndex + 1}
              isPrev={index === activeIndex - 1}
              direction={direction}
              nextVideoSrc={nextVideoSrc}
            />
          )
        })}
      </div>

      {/* Footer Overlay */}
      <Footer onClose={closeFooter} isOpen={isFooterOpen} />
    </div>
  )
}
