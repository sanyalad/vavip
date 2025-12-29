import catalogHeroBg from '@/assets/catalog-hero-bg.jpg'
import styles from './CatalogHero.module.css'

interface CatalogHeroProps {
  title: string
  subtitle?: string
}

export default function CatalogHero({ title, subtitle }: CatalogHeroProps) {
  return (
    <div className={styles.catalogHero}>
      <div className={styles.heroImage}>
        <img
          src={catalogHeroBg}
          alt=""
          className={styles.heroImg}
          loading="eager"
        />
      </div>
      <div className={styles.heroGradient} />
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>{title}</h1>
        {subtitle && <p className={styles.heroSubtitle}>{subtitle}</p>}
      </div>
    </div>
  )
}
