import { FUN_PROJECTS } from "@/content/projects";
import styles from "./fun-projects.module.css";

export function FunProjects() {
  return (
    <section className={styles.section} id="fun-projects" aria-labelledby="fun-projects-title">
      <header className={styles.heading}>
        <h2 id="fun-projects-title">Games &amp; experiments</h2>
        <p>A couple of things I vibe-coded for fun.</p>
      </header>
      <ul className={styles.grid}>
        {FUN_PROJECTS.map((project) => (
          <li key={project.id}>
            <a className={styles.card} href={project.url} target="_blank" rel="noopener noreferrer">
              <div className={styles.preview} aria-hidden="true">
                <img src={`/projects/${project.id}.webp`} alt="" width={1200} height={750} loading="lazy" decoding="async" />
              </div>
              <div className={styles.copy}>
                <span className={styles.kind}>{project.kind}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <span className={styles.action}>{project.action} {project.title} <span aria-hidden="true">↗</span></span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
