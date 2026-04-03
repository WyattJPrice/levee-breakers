import Image from 'next/image'
import styles from './LeveeBreakers.module.css'
import AthleteSubmissionForm from './AthleteSubmissionForm'
import type { AthleteProfile } from '@/lib/supabase'

type Social = {
    platform: 'instagram' | 'strava' | 'facebook' | 'twitter'
    url: string
}

type Breaker = {
    name: string
    duration: string
    description: string
    image?: string
    socials: Social[]
}

const BREAKERS: Breaker[] = [

]

function InstagramIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
            <path d="M127.999746,23.06353 C162.177385,23.06353 166.225393,23.1936027 179.722476,23.8094161 C192.20235,24.3789926 198.979853,26.4642218 203.490736,28.2166477 C209.464938,30.5386501 213.729395,33.3128586 218.208268,37.7917319 C222.687141,42.2706052 225.46135,46.5350617 227.782844,52.5092638 C229.535778,57.0201472 231.621007,63.7976504 232.190584,76.277016 C232.806397,89.7746075 232.93647,93.8226147 232.93647,128.000254 C232.93647,162.177893 232.806397,166.225901 232.190584,179.722984 C231.621007,192.202858 229.535778,198.980361 227.782844,203.491244 C225.46135,209.465446 222.687141,213.729903 218.208268,218.208776 C213.729395,222.687649 209.464938,225.461858 203.490736,227.783352 C198.979853,229.536286 192.20235,231.621516 179.722476,232.191092 C166.227425,232.806905 162.179418,232.936978 127.999746,232.936978 C93.8200742,232.936978 89.772067,232.806905 76.277016,232.191092 C63.7971424,231.621516 57.0196391,229.536286 52.5092638,227.783352 C46.5345536,225.461858 42.2700971,222.687649 37.7912238,218.208776 C33.3123505,213.729903 30.538142,209.465446 28.2166477,203.491244 C26.4637138,198.980361 24.3784845,192.202858 23.808908,179.723492 C23.1930946,166.225901 23.0630219,162.177893 23.0630219,128.000254 C23.0630219,93.8226147 23.1930946,89.7746075 23.808908,76.2775241 C24.3784845,63.7976504 26.4637138,57.0201472 28.2166477,52.5092638 C30.538142,46.5350617 33.3123505,42.2706052 37.7912238,37.7917319 C42.2700971,33.3128586 46.5345536,30.5386501 52.5092638,28.2166477 C57.0196391,26.4642218 63.7971424,24.3789926 76.2765079,23.8094161 C89.7740994,23.1936027 93.8221066,23.06353 127.999746,23.06353 M127.999746,0 C93.2367791,0 88.8783247,0.147348072 75.2257637,0.770274749 C61.601148,1.39218523 52.2968794,3.55566141 44.1546281,6.72008828 C35.7374966,9.99121548 28.5992446,14.3679613 21.4833489,21.483857 C14.3674532,28.5997527 9.99070739,35.7380046 6.71958019,44.1551362 C3.55515331,52.2973875 1.39167714,61.6016561 0.769766653,75.2262718 C0.146839975,88.8783247 0,93.2372872 0,128.000254 C0,162.763221 0.146839975,167.122183 0.769766653,180.774236 C1.39167714,194.398852 3.55515331,203.703121 6.71958019,211.845372 C9.99070739,220.261995 14.3674532,227.400755 21.4833489,234.516651 C28.5992446,241.632547 35.7374966,246.009293 44.1546281,249.28042 C52.2968794,252.444847 61.601148,254.608323 75.2257637,255.230233 C88.8783247,255.85316 93.2367791,256 127.999746,256 C162.762713,256 167.121675,255.85316 180.773728,255.230233 C194.398344,254.608323 203.702613,252.444847 211.844864,249.28042 C220.261995,246.009293 227.400247,241.632547 234.516143,234.516651 C241.632039,227.400755 246.008785,220.262503 249.279912,211.845372 C252.444339,203.703121 254.607815,194.398852 255.229725,180.774236 C255.852652,167.122183 256,162.763221 256,128.000254 C256,93.2372872 255.852652,88.8783247 255.229725,75.2262718 C254.607815,61.6016561 252.444339,52.2973875 249.279912,44.1551362 C246.008785,35.7380046 241.632039,28.5997527 234.516143,21.483857 C227.400247,14.3679613 220.261995,9.99121548 211.844864,6.72008828 C203.702613,3.55566141 194.398344,1.39218523 180.773728,0.770274749 C167.121675,0.147348072 162.762713,0 127.999746,0 Z M127.999746,62.2703115 C91.698262,62.2703115 62.2698034,91.69877 62.2698034,128.000254 C62.2698034,164.301738 91.698262,193.730197 127.999746,193.730197 C164.30123,193.730197 193.729689,164.301738 193.729689,128.000254 C193.729689,91.69877 164.30123,62.2703115 127.999746,62.2703115 Z M127.999746,170.667175 C104.435741,170.667175 85.3328252,151.564259 85.3328252,128.000254 C85.3328252,104.436249 104.435741,85.3333333 127.999746,85.3333333 C151.563751,85.3333333 170.666667,104.436249 170.666667,128.000254 C170.666667,151.564259 151.563751,170.667175 127.999746,170.667175 Z M211.686338,59.6734287 C211.686338,68.1566129 204.809755,75.0337031 196.326571,75.0337031 C187.843387,75.0337031 180.966297,68.1566129 180.966297,59.6734287 C180.966297,51.1902445 187.843387,44.3136624 196.326571,44.3136624 C204.809755,44.3136624 211.686338,51.1902445 211.686338,59.6734287 Z" />
        </svg>
    )
}

function StravaIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
        </svg>
    )
}

function FacebookIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
            <path d="M256,128 C256,57.3075 198.6925,0 128,0 C57.3075,0 0,57.3075 0,128 C0,191.8885 46.80775,244.8425 108,254.445 L108,165 L75.5,165 L75.5,128 L108,128 L108,99.8 C108,67.72 127.1095,50 156.3475,50 C170.35175,50 185,52.5 185,52.5 L185,84 L168.8595,84 C152.95875,84 148,93.86675 148,103.98925 L148,128 L183.5,128 L177.825,165 L148,165 L148,254.445 C209.19225,244.8425 256,191.8885 256,128" />
            <path d="M177.825,165 L183.5,128 L148,128 L148,103.98925 C148,93.86675 152.95875,84 168.8595,84 L185,84 L185,52.5 C185,52.5 170.35175,50 156.3475,50 C127.1095,50 108,67.72 108,99.8 L108,128 L75.5,128 L75.5,165 L108,165 L108,254.445 C114.51675,255.4675 121.196,256 128,256 C134.804,256 141.48325,255.4675 148,254.445 L148,165 L177.825,165" fill="var(--surface)" />
        </svg>
    )
}

function TwitterIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 250.495364 256" fill="currentColor">
            <path d="M149.078767,108.398529 L242.331303,0 L220.233437,0 L139.262272,94.1209195 L74.5908396,0 L0,0 L97.7958952,142.3275 L0,256 L22.0991185,256 L107.606755,156.605109 L175.904525,256 L250.495364,256 L149.07334,108.398529 L149.078767,108.398529 Z M118.810995,143.581438 L108.902233,129.408828 L30.0617399,16.6358981 L64.0046968,16.6358981 L127.629893,107.647252 L137.538655,121.819862 L220.243874,240.120681 L186.300917,240.120681 L118.810995,143.586865 L118.810995,143.581438 Z" />
        </svg>
    )
}

function calcMonths(initialMonths: number, createdAt: string): number {
    const msPerMonth = 1000 * 60 * 60 * 24 * 30.4375
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / msPerMonth)
    return initialMonths + Math.max(0, elapsed)
}

function SocialIcon({ platform }: { platform: Social['platform'] }) {
    if (platform === 'instagram') return <InstagramIcon />
    if (platform === 'strava') return <StravaIcon />
    if (platform === 'facebook') return <FacebookIcon />
    if (platform === 'twitter') return <TwitterIcon />
    return null
}

export default function LeveeBreakers({
    cmsProfiles = [],
    isMonthlyMember = false,
    hasSubmitted = false,
}: {
    cmsProfiles?: AthleteProfile[]
    isMonthlyMember?: boolean
    hasSubmitted?: boolean
}) {
    return (
        <section className={styles.section}>
            <div className={styles.inner}>

                <div className={styles.header}>
                    <h2 className={styles.heading}>
                        Meet the
                        <span className={styles.accent}> Levee Breakers</span>
                    </h2>
                </div>

                {isMonthlyMember && <AthleteSubmissionForm hasSubmitted={hasSubmitted} />}

                <div className={styles.track}>
                    {cmsProfiles.map((profile) => {
                        const socials: Social[] = []
                        if (profile.instagram_url) socials.push({ platform: 'instagram', url: profile.instagram_url })
                        if (profile.strava_url) socials.push({ platform: 'strava', url: profile.strava_url })
                        if (profile.facebook_url) socials.push({ platform: 'facebook', url: profile.facebook_url })
                        if (profile.twitter_url) socials.push({ platform: 'twitter', url: profile.twitter_url })

                        return (
                            <div key={profile.id} className={styles.card}>
                                <div className={styles.cardImage}>
                                    {profile.photo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={profile.photo_url}
                                            alt={profile.name}
                                            className={styles.cardImg}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className={styles.cardImgPlaceholder}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                                                <circle cx="12" cy="8" r="4" />
                                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardHeader}>
                                        <div>
                                            <div className={styles.name}>{profile.name}</div>
                                            <div className={styles.duration}>
                                                {(() => { const m = calcMonths(profile.months, profile.created_at); return `Levee Breaker · ${m} ${m === 1 ? 'month' : 'months'}` })()}
                                            </div>
                                        </div>
                                        {socials.length > 0 && (
                                            <div className={styles.socials}>
                                                {socials.map((s) => (
                                                    <a
                                                        key={s.platform}
                                                        href={s.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.socialLink}
                                                        aria-label={s.platform}
                                                    >
                                                        <SocialIcon platform={s.platform} />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className={styles.quote}>&ldquo;{profile.testimonial}&rdquo;</p>
                                </div>
                            </div>
                        )
                    })}

                    {BREAKERS.map((breaker) => (
                        <div key={breaker.name} className={styles.card}>

                            <div className={styles.cardImage}>
                                {breaker.image ? (
                                    <Image
                                        src={breaker.image}
                                        alt={breaker.name}
                                        fill
                                        sizes="240px"
                                        className={styles.cardImg}
                                    />
                                ) : (
                                    <div className={styles.cardImgPlaceholder}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                                            <circle cx="12" cy="8" r="4" />
                                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <div className={styles.name}>{breaker.name}</div>
                                        <div className={styles.duration}>{breaker.duration}</div>
                                    </div>
                                    <div className={styles.socials}>
                                        {breaker.socials.map((s) => (
                                            <a
                                                key={s.platform}
                                                href={s.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.socialLink}
                                                aria-label={s.platform}
                                            >
                                                <SocialIcon platform={s.platform} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                                <p className={styles.quote}>
                                    &ldquo;{breaker.description}&rdquo;
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}
