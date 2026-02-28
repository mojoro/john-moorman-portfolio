const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const POSTS_DIR = path.join(__dirname, 'posts');
const OUTPUT_DIR = path.join(__dirname, 'blog');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const data = {};
  match[1].split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    data[key] = value;
  });

  return { data, body: match[2] };
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${day} ${months[month - 1]} ${year}`;
}

function head(title, description) {
  return `<head>
  <meta charset="UTF-8">
  <title>${title} | John Moorman</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <meta name="author" content="John Moorman">
  <link rel="stylesheet" href="../assets/css/styles.css">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="manifest" href="/site.webmanifest">
</head>`;
}

function footer() {
  return `<footer>
    <div class="footer-content-wrapper">
      <div class="contact-container">
        <h1>Contact Me</h1>
        <p>Please get in touch if you think a collaboration could be fruitful</p>
        <a href="https://www.google.com/maps/place/Berlin,+Germany/">
          <div class="icon-text-wrapper">
            <button class="icon map"></button>
            <p>Berlin, Germany</p>
          </div>
        </a>
        <a class="email-link" href="mailto:john@johnmoorman.com">
          <div class="icon-text-wrapper">
            <button class="icon email"></button>
            <p>john@johnmoorman.com</p>
          </div>
        </a>
        <div class="social-media-icons">
          <a href="https://github.com/mojoro" target="_blank"><button class="icon github"></button></a>
          <a href="https://www.linkedin.com/in/john-moorman/"><button class="icon linkedin"></button></a>
          <a href="https://twitter.com/john_moorman"><button class="icon twitter"></button></a>
        </div>
      </div>
      <div class="contact-img-wrapper">
        <img src="../media/images/john-about-img.jpeg" alt="John Moorman standing on a mountaintop">
      </div>
    </div>
    <div class="credits">
      <p><a href="https://storyset.com/work">Work illustrations by Storyset, modified by me</a></p>
      <p>Inspiration and welcome: <a href="https://dunks1980.com/">dunks1980.com</a></p>
    </div>
  </footer>`;
}

function postPage({ title, date, description, htmlBody }) {
  const formattedDate = formatDate(date);
  return `<!DOCTYPE html>
<html lang="en">
${head(title, description)}
<body>
  <header class="post-header">
    <div class="post-header-content">
      <a href="/blog/" class="back-link">← Back to Blog</a>
      <h1>${title}</h1>
      <time datetime="${date}">${formattedDate}</time>
    </div>
  </header>
  <main>
    <div class="blog-post-content">
      ${htmlBody}
    </div>
  </main>
  ${footer()}
</body>
</html>`;
}

function blogIndexPage(posts) {
  const cards = posts.map(({ title, date, description, slug }) => {
    const formattedDate = formatDate(date);
    return `      <article class="post-card">
        <a href="/blog/${slug}.html" class="post-card-link" aria-label="${title}"></a>
        <h2>${title}</h2>
        <time datetime="${date}">${formattedDate}</time>
        <p>${description}</p>
        <a href="/blog/${slug}.html" class="read-more">Read more →</a>
      </article>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
${head('Blog', 'Writing on web development, automation, and software engineering by John Moorman.')}
<body>
  <header class="post-header blog-index-header">
    <div class="post-header-content">
      <a href="/" class="back-link">← Back to Portfolio</a>
      <h1>Blog</h1>
      <p>Writing on web development, automation, and engineering.</p>
    </div>
  </header>
  <main>
    <div class="blog-index-content">
      ${cards}
    </div>
  </main>
  ${footer()}
</body>
</html>`;
}

function build() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const { data, body } = parseFrontmatter(raw);
    const slug = path.basename(file, '.md');
    const htmlBody = marked.parse(body);

    const html = postPage({
      title: data.title,
      date: data.date,
      description: data.description,
      htmlBody,
    });

    fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), html);
    console.log(`Built blog/${slug}.html`);

    posts.push({ title: data.title, date: data.date, description: data.description, slug });
  }

  // Sort newest first
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));

  const indexHtml = blogIndexPage(posts);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
  console.log('Built blog/index.html');
}

build();
