export default function Home() {
  return (
    <main>
      <section className="flex min-h-screen flex-col justify-center py-24">
        <h1 className="font-display text-5xl font-bold">John Moorman</h1>
        <p className="mt-4 font-body text-lg text-text-secondary">
          Software Engineer &middot; Berlin
        </p>
        <code className="mt-2 font-mono text-sm text-accent">
          Building things that work.
        </code>
      </section>

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
