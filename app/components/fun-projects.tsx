import { FUN_PROJECTS } from "@/content/projects";
import home from "../home.module.css";
import styles from "./fun-projects.module.css";

function ProjectIllustration({ id }: { id: typeof FUN_PROJECTS[number]["id"] }) {
  if (id === "decascope") {
    return (
      <svg className={styles.cosmos} viewBox="0 0 480 172" fill="none" aria-hidden="true">
        <g fill="#d4e1fa" opacity="0.55">
          <circle cx="37" cy="37" r="1" /><circle cx="102" cy="136" r="1.2" />
          <circle cx="148" cy="21" r="1" /><circle cx="346" cy="43" r="1.5" />
          <circle cx="421" cy="121" r="1" /><circle cx="439" cy="34" r="1" />
          <circle cx="55" cy="104" r="1" /><circle cx="383" cy="157" r="1.2" />
        </g>
        <g stroke="#9eb7dc" strokeWidth="0.75">
          <circle cx="240" cy="86" r="13" opacity="0.8" />
          <circle cx="240" cy="86" r="30" opacity="0.6" />
          <circle cx="240" cy="86" r="56" opacity="0.45" />
          <circle cx="240" cy="86" r="91" opacity="0.3" />
          <circle cx="240" cy="86" r="138" opacity="0.18" />
          <circle cx="240" cy="86" r="194" opacity="0.1" />
          <path d="M42 86h396M240 8v156" strokeDasharray="2 7" opacity="0.2" />
        </g>
        <ellipse cx="240" cy="86" rx="110" ry="25" transform="rotate(-24 240 86)" stroke="#dab39b" strokeWidth="0.8" opacity="0.75" />
        <circle cx="240" cy="86" r="3" fill="#eee8d2" />
        <circle cx="316" cy="33" r="3.5" fill="#dab39b" />
      </svg>
    );
  }

  return (
    <svg className={styles.mars} viewBox="0 0 480 172" fill="none" aria-hidden="true">
      <g fill="#f5d7bb" opacity="0.55">
        <circle cx="35" cy="35" r="1" /><circle cx="98" cy="102" r="1.2" />
        <circle cx="168" cy="22" r="1" /><circle cx="382" cy="27" r="1.2" />
        <circle cx="445" cy="81" r="1" />
      </g>
      <circle cx="304" cy="185" r="125" fill="#a85c40" />
      <path d="M188 139c43-17 76-1 111 9s74 10 120-7M208 113c52-12 78 4 115 9s56 2 79-1" stroke="#de9d72" strokeWidth="1" opacity="0.4" />
      <ellipse cx="282" cy="156" rx="21" ry="7" fill="#804933" opacity="0.55" />
      <ellipse cx="351" cy="100" rx="11" ry="4" fill="#804933" opacity="0.55" />
      <path d="M83 152c34-56 82-95 144-112 52-14 99-8 138 12" stroke="#edc9a7" strokeWidth="0.8" strokeDasharray="3 6" opacity="0.55" />
      <g transform="translate(181 66) rotate(48)">
        <path d="M0-25C-8-18-10-6-9 10H9C10-6 8-18 0-25Z" fill="#e1d9c6" />
        <path d="m-9-2-8 15 9-3M9-2l8 15-9-3" fill="#b8c3b0" />
        <circle cy="-7" r="4" fill="#597b83" />
        <path d="m-4 14 4 15 4-15" fill="#d6a265" />
      </g>
      <path d="M300 61V39l17 4-17 7" stroke="#f5d7bb" strokeWidth="1.2" />
    </svg>
  );
}

export function FunProjects() {
  return (
    <section className={styles.section} id="fun-projects" aria-labelledby="fun-projects-title">
      <header className={styles.heading}>
        <div className={home.sectionTitle}>
          <span className={home.sectionNumber} aria-hidden="true">02 /</span>
          <h2 id="fun-projects-title">Fun projects</h2>
        </div>
        <p>A couple of things I vibe-coded for fun.</p>
      </header>
      <ul className={styles.grid}>
        {FUN_PROJECTS.map((project) => (
          <li key={project.id}>
            <a className={styles.card} href={project.url} target="_blank" rel="noopener noreferrer">
              <div className={styles.illustration}><ProjectIllustration id={project.id} /></div>
              <div className={styles.copy}>
                <span className={styles.kind}>{project.kind}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <span className={styles.action}>{project.action} <span aria-hidden="true">↗</span></span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
