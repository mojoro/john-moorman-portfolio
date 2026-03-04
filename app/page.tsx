"use client"

import { motion, useReducedMotion } from "framer-motion"

export default function Home() {
  const shouldReduceMotion = useReducedMotion()

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  }

  const fadeUp = {
    hidden: shouldReduceMotion ? {} : { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  }

  return (
    <main>
      {/* ── Hero ── */}
      <motion.section
        className="flex min-h-screen flex-col justify-center py-24"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.p variants={fadeUp} className="font-mono text-sm text-accent">
          Hi, my name is
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl"
        >
          John Moorman.
        </motion.h1>
        <motion.h2
          variants={fadeUp}
          className="font-display text-[clamp(1.5rem,4vw,3rem)] font-bold leading-tight text-text-secondary"
        >
          I build things that work — and automate the rest.
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-xl text-text-secondary"
        >
          Software engineer in Berlin. I saved a company €74K/year by automating
          their entire admin function, and I build AI-native tools that ship to
          production. Currently freelancing and looking for the right team.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-4">
          <a
            href="mailto:john@johnmoorman.com"
            className="inline-flex items-center gap-2 rounded border border-accent px-6 py-3 font-mono text-sm text-accent transition-colors hover:bg-accent/10"
          >
            Get in touch
          </a>
          <a
            href="#work"
            className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm text-text-secondary transition-colors hover:text-accent"
          >
            See my work &darr;
          </a>
        </motion.div>
        <motion.div
          variants={fadeUp}
          className="mt-6 flex flex-wrap items-center gap-5 text-text-muted"
        >
          <a
            href="mailto:john@johnmoorman.com"
            className="font-mono text-sm transition-colors hover:text-accent"
          >
            john@johnmoorman.com
          </a>
          <span className="text-border" aria-hidden="true">|</span>
          <a
            href="https://linkedin.com/in/john-moorman"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm transition-colors hover:text-accent"
          >
            LinkedIn
          </a>
          <span className="text-border" aria-hidden="true">|</span>
          <a
            href="https://github.com/mojoro"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm transition-colors hover:text-accent"
          >
            GitHub
          </a>
        </motion.div>
      </motion.section>

      <section id="about" className="min-h-screen py-24">
        <h2 className="font-display text-3xl font-semibold">
          <span className="mr-2 font-mono text-lg text-accent">01.</span>
          About
        </h2>
        <p className="mt-6 text-text-secondary">About section placeholder.</p>
      </section>

      <section id="work" className="min-h-screen py-24">
        <h2 className="font-display text-3xl font-semibold">
          <span className="mr-2 font-mono text-lg text-accent">02.</span>
          Work
        </h2>
        <p className="mt-6 text-text-secondary">Work section placeholder.</p>
      </section>

      <section id="blog" className="min-h-screen py-24">
        <h2 className="font-display text-3xl font-semibold">
          <span className="mr-2 font-mono text-lg text-accent">03.</span>
          Blog
        </h2>
        <p className="mt-6 text-text-secondary">Blog section placeholder.</p>
      </section>

      <section id="contact" className="py-24">
        <h2 className="font-display text-3xl font-semibold">
          <span className="mr-2 font-mono text-lg text-accent">04.</span>
          Contact
        </h2>
        <p className="mt-6 text-text-secondary">
          Contact section placeholder.
        </p>
      </section>
    </main>
  )
}
