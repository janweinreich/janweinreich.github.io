import type { PostRecord } from "@/content/posts";
import styles from "../home.module.css";

export function FeaturedPost({ post }: { post: PostRecord | undefined }) {
  if (!post) return null;

  const { title, summary, published, image } = post.metadata;
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${published}T00:00:00Z`));

  return (
    <section className={styles.feature} id="latest-article" aria-labelledby="latest-article-title">
      <a className={styles.featureLink} href={`/writing/${post.slug}/`} data-has-image={Boolean(image)}>
        <div className={styles.featureCopy} data-scroll-reveal>
          <div className={styles.featureMeta}>
            <span>Latest article</span>
            <time dateTime={published}>{date}</time>
          </div>
          <h2 id="latest-article-title">{title}</h2>
          <p>{summary}</p>
          <span className={styles.featureRead}>Read article <span aria-hidden="true">↗</span></span>
        </div>
        {image && (
          <div className={styles.featureImage} aria-hidden="true" data-scroll-reveal data-scroll-image>
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 960px) calc((100vw - 80px) * 0.53), (max-width: 1104px) calc((100vw - 128px) * 0.53), 517px"
              alt=""
              width={image.width}
              height={image.height}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        )}
      </a>
    </section>
  );
}
