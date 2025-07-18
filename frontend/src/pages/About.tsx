function About() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl flex-grow">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">About Me</h1>

      <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-6">
        {/* Image */}
        <img
          src="me.png"
          alt="Roland Takacs"
          className="w-32 h-32 rounded-full object-cover mb-4 md:mb-0"
        />

        {/* Intro paragraph */}
        <p className="text-base leading-relaxed">
          I’m not a Python nor or Database Developer — I’m a Software Engineer,
          a problem solver who happens to be using Python these days to achieve
          business goals and user happiness.
        </p>
      </div>

      <p className="mb-6 text-base leading-relaxed">
        Over the years, I’ve worked with a wide range of technologies,
        including: Python, Docker, Oracle, PL/SQL, REST APIs, Django, FastAPI,
        React, TypeScript, Ansible, Jenkins, PostgreSQL, Linux Shell, Hive,
        HTML, CSS, JavaScript, Airflow, vSphere, Trino DB, and VB. <br />
        Lately, I’ve been exploring Mojo with growing interest.
      </p>

      <p className="mb-6 text-base leading-relaxed">
        When the workday ends, I turn to my other passions: working out, playing
        the piano, having fun with friends, watching good series, and spending
        time with loved ones. And yes, sometimes I even code during my free
        time. But my favorite hobby? Traveling and going on adventures. <br />
        If you're tired of tech talk, feel free to check out some travel videos
        on my{" "}
        <a
          href="https://www.youtube.com/@rolandTRavel"
          className="text-blue-600 hover:underline"
        >
          YouTube channel
        </a>
        .
      </p>

      <p className="text-base leading-relaxed">
        Thanks for stopping by — I hope you find something valuable or inspiring
        here on the blog. <br />
        If you'd like to connect, you can find me on{" "}
        <a
          href="https://www.linkedin.com/in/roland-takacs-a7000582/"
          className="text-blue-600 hover:underline"
        >
          LinkedIn
        </a>{" "}
        or{" "}
        <a
          href="https://github.com/rolkotaki"
          className="text-blue-600 hover:underline"
        >
          GitHub
        </a>
        .
      </p>
    </main>
  );
}

export default About;
