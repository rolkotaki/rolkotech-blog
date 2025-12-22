import meImage from "../assets/images/about_me.jpeg";
import meCartoonImage from "../assets/images/me_cartoon.png";
import collageImage from "../assets/images/collage.jpg";

function About() {
  return (
    <main className="container mx-auto px-4 pt-6 max-w-3xl flex-grow">
      <img
        src={meCartoonImage}
        className="w-40 mx-auto mb-4"
        data-testid="me-cartoon-image"
      />
      <h1
        className="text-3xl text-blue-700 mb-6 text-center"
        style={{
          fontFamily: "Dyson Sans Modern, sans-serif"
        }}
      >
        Hey there, I'm Roland Takacs
      </h1>

      <p className="text-base leading-relaxed">
        I'm neither a Python nor a Backend Developer — I'm a Software Engineer,
        a problem solver who happens to be using Python and TypeScript these
        days to achieve business goals and user happiness.
      </p>

      <img src={meImage} alt="Roland Takacs" className="rounded-md my-4" />

      <p className="mb-4 text-base leading-relaxed">
        Over the years, I've worked with a wide range of technologies:
      </p>
      <ul className="mb-4 text-base leading-relaxed space-y-1 list-none">
        <li>
          <strong>Backend:</strong> Python, FastAPI, Django, Flask, REST APIs
        </li>
        <li>
          <strong>Frontend:</strong> TypeScript, React, Svelte, HTML, CSS,
          JavaScript
        </li>
        <li>
          <strong>Database:</strong> PostgreSQL, Oracle, PL/SQL
        </li>
        <li>
          <strong>DevOps:</strong> Docker, Ansible, Jenkins, Linux, Bash
          scripting, vSphere
        </li>
        <li>
          <strong>Data:</strong> Hive, Trino DB, Airflow
        </li>
        <li>
          <strong>Testing:</strong> Unit testing, Playwright, Robot Framework,
          Selenium
        </li>
      </ul>
      <p className="mb-6 text-base leading-relaxed">
        I've also been exploring{" "}
        <a
          href="https://www.modular.com/mojo"
          className="text-blue-600 hover:underline"
        >
          Mojo
        </a>{" "}
        with growing interest.
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

      <img
        src={collageImage}
        alt="RolkoTech adventures"
        className="rounded-md my-4"
      />

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

      {/* Contact Icons */}
      <div className="mt-6 mb-8 pt-4 border-t border-gray-200">
        <p className="text-center text-gray-600 mb-4">Connect with me:</p>
        <div className="flex justify-center space-x-6">
          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/roland-takacs-a7000582/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 transition-colors duration-200"
            title="LinkedIn"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/rolkotaki"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 transition-colors duration-200"
            title="GitHub"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://www.youtube.com/@rolandTRavel"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 transition-colors duration-200"
            title="YouTube"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
        </div>
      </div>
    </main>
  );
}

export default About;
