export default function (
  $bay_uniqid,
  $bay,
  $global,
  $route,
  $el,
  $parent,
  $ref
) {
  "use strict";
  // bay-component;
  function bay_receive_fn(e) {
    $bay.receive($bay, $el, e.detail.name, e.detail.data);
  }
  window.removeEventListener("bay_emit", bay_receive_fn);
  window.addEventListener("bay_emit", bay_receive_fn);
  this.img = "";
  this.open_modal = false;
  this.image_click = (e) => {
    let data = e.target.dataset;
    if (data.img) {
      this.img = data.img;
      this.open_modal = true;
    }
  };
  this.projects = [];
  async function loadJSON() {
    const response = await fetch("./projects.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    return jsonData;
  }
  loadJSON()
    .then((data) => {
      this.projects = data.data;
    })
    .catch((error) => {
      console.error("Error loading JSON:", error);
    });
  this.setscr = () => {
    console.log(this.img);
    return this.img ? `style="${this.img}"` : "";
  };
  $bay["$mounted"] = () => {
    setTimeout(() => {
      this.loaded = "loaded";
    }, 10);
    const text =
      "My name is Ian Dunkerley, a front-end developer based in Torquay, Devon, UK. I have worked on a wide range of front-end projects, from DJ applications to eCommerce booking platforms, with a focus on creating clean, well-crafted interfaces that not only look great but also provide a seamless user experience.";
    const words = text.split(" ");
    this.words_els = [];
    this.words_els = words.map((word, i) => {
      return `<span class="word">${word}</span> `;
    });
    const updateArrayWithDelay = (index = 0) => {
      if (index < this.words_els.length) {
        this.words_els[index] = this.words_els[index].replace(
          'class="word"',
          'class="word visible"'
        );
        setTimeout(() => {
          updateArrayWithDelay(index + 1);
        }, 30);
      }
    };
    setTimeout(() => {
      updateArrayWithDelay();
    }, 60);
  };
  $bay.template = () => {
    return `        <div class="hero">
            <div class="hero-inner">
              <div class="hero-text">
                <bay-welcome bay="/components/welcome.html">
                  <svg xmlns="http://www.w3.org/2000/svg" id="welcome" width="6.30667in" height="1.27333in" viewBox="0 0 1892 382"></svg>
                </bay-welcome>
                <div>
                  <p>
                    ${
                      Array.isArray(this.words_els)
                        ? this.words_els
                            .map((word) => {
                              return `
                      ${$bay.decode(word)}
                    `;
                            })
                            .join("")
                        : ""
                    }
                  </p>
                </div>
              </div>
              <div class="hero-image">
                <picture>
                  <source srcset="./images/hero_setup.avif" type="image/avif">
                  <source srcset="./images/hero_setup.webp" type="image/webp">
                  <img width="500" height="500" src="./images/hero_setup.jpg" alt="hero image">
                </picture>
              </div>
            </div>
          </div>
          <svg class="svg-curve" viewBox="0 0 1440 79" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100 79C-100 79 218.416 23.165 693.5 23.165C1168.58 23.165 1487 79 1487 79V0H-100V79Z"></path>
          </svg>
          <div class="projects">
            <div class="projects-text">
              <h2>My Work</h2>
              <p>A collection of projects I've worked on.</p>
            </div>
          </div>
          <div class="project-grid">
            ${(() => {
              let bay_for_0058b136 = "";
              Array.isArray(this.projects)
                ? this.projects.forEach((project) => {
                    bay_for_0058b136 += `<div class="project">
              <div class="project-wrap">
                <div style="background-image: url(${project.avif}), url(${
                      project.webp
                    })" class="project-img" data-img="background-image: url(${
                      project.avif
                    }), url(${
                      project.webp
                    })" data-bay-click="this.image_click(e)" data-47d8e78f="">
                </div>
                <div class="project-text">
                  <h3>${project.title}</h3>
                  <p class="project-parragraph">${project.text}</p>
                </div>
              </div>
              <div class="project-buttons">
                ${(() => {
                  let bay_for_dd05e078 = "";
                  Array.isArray(project.buttons)
                    ? project.buttons.forEach((button) => {
                        bay_for_dd05e078 += `<div class="project-button">
                  <a aria-label="${button.aria}" href="${
                          button.href
                        }" rel="noopener" target="_blank">
                    ${(() => {
                      if (button.icon === "WebSVG") {
                        return `
            <svg style="height:1em; width:1em" viewBox="0 0 1024 1024" transform="scale(1.2)">
              <path fill="currentColor" d="M698.027 597.333C701.44 569.173 704 541.013 704 512c0-29.013-2.56-57.173-5.973-85.333H842.24c6.827 27.306 11.093 55.893 11.093 85.333 0 29.44-4.266 58.027-11.093 85.333M622.507 834.56c25.6-47.36 45.226-98.56 58.88-151.893h125.866c-40.96 70.4-106.24 125.013-184.746 151.893M611.84 597.333H412.16c-4.267-28.16-6.827-56.32-6.827-85.333 0-29.013 2.56-57.6 6.827-85.333h199.68c3.84 27.733 6.827 56.32 6.827 85.333 0 29.013-2.987 57.173-6.827 85.333M512 851.627c-35.413-51.2-64-107.947-81.493-168.96h162.986C576 743.68 547.413 800.427 512 851.627M341.333 341.333H216.747c40.533-70.826 106.24-125.44 184.32-151.893-25.6 47.36-44.8 98.56-59.734 151.893M216.747 682.667h124.586C356.267 736 375.467 787.2 401.067 834.56c-78.08-26.88-143.787-81.493-184.32-151.893m-34.987-85.334c-6.827-27.306-11.093-55.893-11.093-85.333 0-29.44 4.266-58.027 11.093-85.333h144.213C322.56 454.827 320 482.987 320 512c0 29.013 2.56 57.173 5.973 85.333M512 171.947c35.413 51.2 64 108.373 81.493 169.386H430.507C448 280.32 476.587 223.147 512 171.947m295.253 169.386H681.387C667.733 288 648.107 236.8 622.507 189.44c78.506 26.88 143.786 81.067 184.746 151.893M512 85.333c-235.947 0-426.667 192-426.667 426.667 0 235.52 191.147 426.667 426.667 426.667 235.52 0 426.667-191.147 426.667-426.667C938.667 276.48 747.52 85.333 512 85.333z"></path>
            </svg>
                    `;
                      } else if (button.icon === "GITSVG") {
                        return `
            <svg viewBox="0 0 120.78 117.79" style="height: 1em; width: 1em; transform: scale(1.05);">
              <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1">
                  <path class="cls-1" fill="currentColor" d="M60.39 0A60.39 60.39 0 0 0 41.3 117.69c3 .56 4.12-1.31 4.12-2.91 0-1.44-.05-6.19-.08-11.24C28.54 107.19 25 96.42 25 96.42c-2.75-7-6.71-8.84-6.71-8.84-5.48-3.75.41-3.67.41-3.67 6.07.43 9.26 6.22 9.26 6.22 5.39 9.23 14.13 6.57 17.57 5 .55-3.9 2.11-6.56 3.84-8.07C36 85.55 21.85 80.37 21.85 57.23A23.35 23.35 0 0 1 28.08 41c-.63-1.52-2.7-7.66.58-16 0 0 5.07-1.62 16.61 6.19a57.36 57.36 0 0 1 30.25 0C87 23.42 92.11 25 92.11 25c3.28 8.32 1.22 14.46.59 16a23.34 23.34 0 0 1 6.21 16.21c0 23.2-14.12 28.3-27.57 29.8 2.16 1.87 4.09 5.55 4.09 11.18 0 8.08-.06 14.59-.06 16.57 0 1.61 1.08 3.49 4.14 2.9A60.39 60.39 0 0 0 60.39 0Z">
                  </path>
                  <path class="cls-2" d="M22.87 86.7c-.13.3-.6.39-1 .19s-.69-.61-.55-.91.61-.39 1-.19.69.61.54.91ZM25.32 89.43c-.29.27-.85.14-1.24-.28a.92.92 0 0 1-.17-1.25c.3-.27.84-.14 1.24.28s.47 1 .17 1.25ZM27.7 92.91c-.37.26-1 0-1.35-.52s-.37-1.18 0-1.44 1 0 1.35.51.37 1.19 0 1.45ZM31 96.27a1.13 1.13 0 0 1-1.59-.27c-.53-.49-.68-1.18-.34-1.54s1-.27 1.56.23.68 1.18.33 1.54ZM35.46 98.22c-.15.47-.82.69-1.51.49s-1.13-.76-1-1.24.82-.7 1.51-.49 1.13.76 1 1.24ZM40.4 98.58c0 .5-.56.91-1.28.92s-1.3-.38-1.31-.88.56-.91 1.29-.92 1.3.39 1.3.88ZM45 97.8c.09.49-.41 1-1.12 1.12s-1.35-.17-1.44-.66.42-1 1.12-1.12 1.35.17 1.44.66Z">
                  </path>
                </g>
              </g>
            </svg>
                    `;
                      } else if (button.icon === "NPMSVG") {
                        return `
            <svg viewBox="0 0 400 400" style="height: 1em; width: 1em; transform: scale(1.4);">
              <path id="Selection1" fill="currentColor" stroke-width="1" d="M69 69c262 0 0 0 0 0v262h131V121h59c4.17 0 16.63-1.2 18.98 2.31 1.23 1.85 1.02 5.5 1.02 7.69v200h52V69Z">
              </path>
            </svg>
                    `;
                      }
                      return "";
                    })()}
                  </a>
                </div>`;
                      })
                    : "";
                  return bay_for_dd05e078;
                })()}
              </div>
            </div>`;
                  })
                : "";
              return bay_for_0058b136;
            })()}
          </div>
          <svg class="svg-curve" viewBox="0 0 1440 79" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100 0C-100 0 218.416 55.835 693.5 55.835C1168.58 55.835 1487 0 1487 0V79H-100V0Z"></path>
          </svg>
          <footer>
            <div class="footer-inner">
              <div class="footer-copy">
                Â© ${new Date().getFullYear()} dunks1980.com
              </div>
              <div class="footer-links">
                <a aria-label="github" rel="noopener" target="_blank" href="https://github.com/Dunks1980/">
            <svg viewBox="0 0 120.78 117.79" style="height: 1em; width: 1em; transform: scale(1.05);">
              <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1">
                  <path class="cls-1" fill="currentColor" d="M60.39 0A60.39 60.39 0 0 0 41.3 117.69c3 .56 4.12-1.31 4.12-2.91 0-1.44-.05-6.19-.08-11.24C28.54 107.19 25 96.42 25 96.42c-2.75-7-6.71-8.84-6.71-8.84-5.48-3.75.41-3.67.41-3.67 6.07.43 9.26 6.22 9.26 6.22 5.39 9.23 14.13 6.57 17.57 5 .55-3.9 2.11-6.56 3.84-8.07C36 85.55 21.85 80.37 21.85 57.23A23.35 23.35 0 0 1 28.08 41c-.63-1.52-2.7-7.66.58-16 0 0 5.07-1.62 16.61 6.19a57.36 57.36 0 0 1 30.25 0C87 23.42 92.11 25 92.11 25c3.28 8.32 1.22 14.46.59 16a23.34 23.34 0 0 1 6.21 16.21c0 23.2-14.12 28.3-27.57 29.8 2.16 1.87 4.09 5.55 4.09 11.18 0 8.08-.06 14.59-.06 16.57 0 1.61 1.08 3.49 4.14 2.9A60.39 60.39 0 0 0 60.39 0Z">
                  </path>
                  <path class="cls-2" d="M22.87 86.7c-.13.3-.6.39-1 .19s-.69-.61-.55-.91.61-.39 1-.19.69.61.54.91ZM25.32 89.43c-.29.27-.85.14-1.24-.28a.92.92 0 0 1-.17-1.25c.3-.27.84-.14 1.24.28s.47 1 .17 1.25ZM27.7 92.91c-.37.26-1 0-1.35-.52s-.37-1.18 0-1.44 1 0 1.35.51.37 1.19 0 1.45ZM31 96.27a1.13 1.13 0 0 1-1.59-.27c-.53-.49-.68-1.18-.34-1.54s1-.27 1.56.23.68 1.18.33 1.54ZM35.46 98.22c-.15.47-.82.69-1.51.49s-1.13-.76-1-1.24.82-.7 1.51-.49 1.13.76 1 1.24ZM40.4 98.58c0 .5-.56.91-1.28.92s-1.3-.38-1.31-.88.56-.91 1.29-.92 1.3.39 1.3.88ZM45 97.8c.09.49-.41 1-1.12 1.12s-1.35-.17-1.44-.66.42-1 1.12-1.12 1.35.17 1.44.66Z">
                  </path>
                </g>
              </g>
            </svg>
                </a>
                <a aria-label="npm" rel="noopener" target="_blank" href="https://www.npmjs.com/~dunks1980">
            <svg viewBox="0 0 400 400" style="height: 1em; width: 1em; transform: scale(1.4);">
              <path id="Selection1" fill="currentColor" stroke-width="1" d="M69 69c262 0 0 0 0 0v262h131V121h59c4.17 0 16.63-1.2 18.98 2.31 1.23 1.85 1.02 5.5 1.02 7.69v200h52V69Z">
              </path>
            </svg>
                </a>
              </div>
            </div>
          </footer>
          <bay-modal open="${$bay.encode(JSON.stringify(this.open_modal))}">
            ${(() => {
              if (this.img) {
                return `
              <div class="modal-image" ${(() => {
                return this.setscr() || "";
              })()} data-47d8e78f="" data-bay-click="this.open_modal = false"></div>
            `;
              }
              return "";
            })()}
          </bay-modal>
      <bay-component-update></bay-component-update>`;
  };
  $bay.styles = () => {
    return `*:not(:defined){opacity:0;max-width:0px;max-height:0px}*:not(:defined)*{opacity:0;max-width:0px;max-height:0px}.bay-hide{display:none}* {box-sizing: border-box;margin: 0;padding: 0;}#welcome {display: inline-block;box-sizing: border-box;max-height: calc(180px - 2rem);width: auto;}@media screen and (max-width: 768px) {#welcome {max-height: calc(150px - 2rem);width: 100%;}}.svg-curve {fill: none;width: 100%;display: block;}.svg-curve path {fill: #0a001b;}.hero {width: 100%;height: 100%;min-height: 88vh;background: #0a001b;border-top: 10px solid #2b69fb;background-attachment: fixed;display: flex;flex-direction: column;justify-content: center;align-items: center;padding: 2rem 1rem;margin-bottom: -2px;}.hero-inner {width: 100%;max-width: calc(1280px + 2rem);padding: 1rem;display: flex;flex-direction: row;justify-content: space-between;align-items: center;height: 100%;color: #fff;gap: 2rem;}@media screen and (max-width: 1200px) {.hero-inner {flex-direction: column-reverse;gap: 0rem;padding: 0rem;}.hero-image {margin-top: 0rem;margin-bottom: -3rem;}.hero-image img {width: 100%;height: auto;}.hero-text * {margin: 0 auto;text-align: center;}}.hero-text {width: 100%;height: 100%;display: grid;grid-template-rows: 1fr 1fr;gap: 1rem;}@media screen and (max-width: 1200px) {.hero-text {padding: 1rem;grid-template-rows: auto 1fr;}}.hero-image {animation: fadeIn .3s ease-in-out;}.hero-image img {mask-image: radial-gradient(circle, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 66%);-webkit-mask-image: radial-gradient(circle, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 66%);}@keyframes fadeIn {from {opacity: 0;}to {opacity: 1;}}@media screen and (max-width: 1200px) {.hero-image {/* display: none; */}}.hero-inner p {max-width: 69ch;}.projects {display: block;width: 100%;display: flex;flex-direction: column;justify-content: center;align-items: center;padding: 3rem 1rem;}.projects-text {width: 100%;max-width: 1200px;display: flex;flex-direction: column;justify-content: center;align-items: center;height: 100%;gap: 1rem;}h2 {font-size: 3rem;line-height: 1;}h3 {font-size: 1.5rem;line-height: 1;}.project-grid {margin: 0 auto 6rem;display: grid;max-width: calc(1280px + 2rem);padding: 0 1rem;width: 100%;grid-template-columns: 1fr 1fr 1fr;gap: 2rem;}@media screen and (max-width: 1320px) {.project-grid {gap: 1rem;}}@media screen and (max-width: 1100px) {.project-grid {grid-template-columns: 1fr 1fr;}}@media screen and (max-width: 768px) {.project-grid {grid-template-columns: 1fr;}}.project {margin: 0 auto;padding: 1rem;border-radius: 2rem;border: 1px solid #2b69fb1f;box-shadow: 0 0 1rem 1rem #2b69fb0f;position: relative;}.project-wrap {display: grid;grid-template-columns: 1fr;grid-template-rows: 1fr;position: relative;width: 100%;/* Example width */height: auto;/* Example height */overflow: hidden;}.project-img,.project-text {grid-column: 1 / -1;grid-row: 1 / -1;position: relative;}.project-img {display: flex;width: 100%;height: auto;background-size: 100% auto;background-position: top center;background-repeat: no-repeat;border-radius: .8rem;border: 1px solid #2b69fb1f;cursor: pointer;transition: all 0.3s ease-in-out;}.project-img:hover {background-size: 110% auto;}.project-img img {position: absolute;width: 100%;height: auto;border-radius: .8rem;border: 1px solid #2b69fb1f;}.project-text {display: flex;flex-direction: column;justify-content: flex-start;align-items: flex-start;gap: 1rem;padding: 0rem 1rem;color: #0a001b;margin-top: 47%;background: #fafeff;box-shadow: 0 0 4rem 6rem #fafeff;}@media screen and (max-width: 768px) {.project-text {padding: 0rem 0rem;}}.project-parragraph {margin-bottom: 3.5rem;}@media screen and (max-width: 768px) {.project-parragraph {margin-bottom: 2.5rem;}}.project-buttons {display: flex;justify-content: flex-start;align-items: center;gap: 1.5rem;font-size: 1.5rem;position: absolute;bottom: 0;padding: 1rem;}@media screen and (max-width: 768px) {.project-buttons {padding: 0.5rem 0rem;}}a {color: #0a001b;text-decoration: none;}.modal-image {max-width: 90vw;max-height: 90vh;cursor: pointer;background-size: contain;background-position: center;width: 100vw;height: 100vh;background-repeat: no-repeat;}footer {display: flex;justify-content: center;align-items: center;background: #0a001b;margin-top: -2px;}footer a {color: #fff;text-decoration: none;}.footer-inner {display: flex;justify-content: space-between;align-items: center;width: 100%;max-width: 1280px;padding: 5rem 1rem;margin: auto;color: #fff;}.footer-copy {font-size: 1rem;}.footer-links {display: flex;justify-content: space-between;align-items: center;gap: 1.5rem;font-size: 1.5rem;}.word.word.word {display: inline-block;opacity: 0;transform: translateX(.5rem);transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.6s ease-in-out;}.word.word.word.visible {transform: translateX(0);opacity: 1;}bay-welcome {align-self: flex-end;}`;
  };
}
