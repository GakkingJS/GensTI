import ScrollReveal from "./ScrollReveal";

const areas = [
  {
    symbol: "</>",
    title: "Desarrollo de software",
    description:
      "Diseña y construye aplicaciones que resuelven problemas reales.",
  },
  {
    symbol: "AI",
    title: "Inteligencia artificial",
    description:
      "Explora cómo los datos y los modelos inteligentes pueden generar soluciones.",
  },
  {
    symbol: "{ }",
    title: "Datos y sistemas",
    description:
      "Organiza información y desarrolla sistemas que apoyan la toma de decisiones.",
  },
  {
    symbol: "↗",
    title: "Innovación tecnológica",
    description:
      "Transforma ideas en proyectos con impacto en las personas y las organizaciones.",
  },
];

function SystemsEngineering() {
  return (
    <section
      className="systems-engineering"
      id="ingenieria-sistemas"
    >
      <div className="systems-engineering__header">
        <span className="systems-engineering__eyebrow">
          UNA CARRERA PARA CREAR EL FUTURO
        </span>

        <h2>
          No se trata solo de computadores.
          <span> Se trata de resolver problemas.</span>
        </h2>

        <p>
          Ingeniería de Sistemas combina lógica, creatividad y tecnología
          para diseñar soluciones, comprender necesidades y convertir
          desafíos en oportunidades.
        </p>
      </div>

      <div className="systems-engineering__grid">
        {areas.map((area) => (
          <article className="systems-engineering__item" key={area.title}>
            <div className="systems-engineering__symbol">
              <span>{area.symbol}</span>
            </div>

            <h3>{area.title}</h3>

            <p>{area.description}</p>
          </article>
        ))}
      </div>

      <div className="systems-engineering__statement">
        <span className="systems-engineering__quote-mark">“</span>
        <p>
          El próximo avance tecnológico también puede comenzar con una
          idea tuya.
        </p>
      </div>
    </section>
  );
}

export default SystemsEngineering;
