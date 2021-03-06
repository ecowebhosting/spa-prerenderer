const puppeteer = require('puppeteer');
const fs = require('fs');
const chalk = require('chalk');
const portfinder = require('portfinder-sync');
const Server = require('./lib/server');
const Options = require('./lib/options');


/**
 * Prerenders dynamically created markup to static files.
 *
 * The configuration is provided on construction.
 *
 * The `init()` method uses that to begin prerendering.
 *
 * @author Andy Dunn <andy@d-unn.uk>
 */
class Prerenderer {
  /**
   * @param   {Object}  options                 Parent options object.
   *
   * @param   {string}  options.staticDir       The path to the docroot of
   *                                            the site to prerender.
   *
   * @param   {array}   options.routes          An array of the routes of the
   *                                            site to prerender.
   *
   * @param   {string}  options.outputDir       The path to the directory the
   *                                            prerendered files should be
   *                                            output to.
   *
   * @param   {string}  options.waitForElement  Wait for specific element
   *                                            to be rendered.
   *
   * @param   {boolean} options.useHttps        Whether the server should use
   *                                            https or not.
   *
   * @param   {boolean} options.supressOutput   Whether or not to output
   *                                            to the console.
   *
   * @param   {boolean} options.reportPageErrors Whether the prerenderer should
   *                                             output errors from the page
   *                                             being rendered. Useful if that
   *                                             error prevents the
   *                                             `waitForElement` element from
   *                                             being rendered.
   */
  constructor({
    staticDir = null,
    routes = ['/'],
    outputDir = '.',
    waitForElement = null,
    useHttps = true,
    supressOutput = false,
    reportPageErrors = false,
  } = {}) {
    Options.validate({
      staticDir,
      routes,
      outputDir,
      waitForElement,
      useHttps,
      supressOutput,
      reportPageErrors,
    });
    this.routes = routes;
    this.staticDir = staticDir;
    this.outputDir = outputDir;
    this.waitForElement = waitForElement;
    this.useHttps = useHttps;
    this.supressOutput = supressOutput;
    this.reportPageErrors = reportPageErrors;
    this.port = portfinder.getPort(3000);
    const serverOptions = {
      server: {port: this.port},
      useHttps: useHttps,
      staticDir: staticDir,
    };
    this.server = new Server(serverOptions);
    this.server.init();
  }

  /**
   * Performs the prerender.
   *
   * @return  {void}
   */
  async init() {
    await this.startBrowser();
    await Promise.all(this.routes.map(async (route) => {
      route = route.startsWith('/') ?
        route :
        `/${route}`;

      const targetBase = this.outputDir.endsWith('/') ?
        this.outputDir.slice(0, -1) :
        this.outputDir;

      const target = `${targetBase}${route}/index.html`;

      if (this.supressOutput === false) {
        console.info(chalk`{blue {bold Prerendering }${route}}`);
      }
      const content = await this.getMarkup(route);
      if (this.supressOutput === false) {
        console.info(
            chalk`{green {bold Prerendered} ${route}} {bold.blue Saving…}`,
        );
      }

      this.saveFile(content, target);
      if (this.supressOutput === false) {
        console.info(chalk`{green.inverse {bold Saved} to ${target}}`);
      }
    }));

    await this.browser.close();
    await this.server.destroy();

    return true;
  }

  /**
   * Starts a Chromium instance using Puppeteer.
   *
   * This will be used to perform the rendering.
   *
   * @return  {void}
   */
  async startBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        defaultViewport: null,
        args: [
          '--ignore-certificate-errors',
        ],
      });
    } catch (e) {
      throw e;
    }
  }

  /**
   * Opens a new browser page, renders the route in it, and
   * only when #app has loaded, returns the content.
   *
   * @param   {string}   route  The route, relative to the docroot, to get
   *                            prerendered markup for.
   *
   * @return  {Promise}         The prerendered content
   *
   * @throws  {Error}           on general failure or if page has error
   *                            and this.stopOnPageError is true
   */
  async getMarkup(route) {
    const s = this.useHttps === true ? 's' : '';
    const url = `http${s}://localhost:${this.port}${route}`;
    const page = await this.browser.newPage();

    if (this.reportPageErrors === true) {
      page.on('pageerror', (err) => {
        const errorHint = this.waitForElement !== null ?
          chalk`This may prevent the element {bold ${this.waitForElement}}` +
          ` from rendering, causing a timeout.` :
          '';
        console.error(
            chalk`{bgRed.white {bold Error from the page being rendered:}}`,
        );
        console.error(chalk`{red ${err}}`);
        console.error(chalk`{red ${errorHint}}`);
      });
    }

    await page.goto(url, {timeout: 60000});
    if (this.waitForElement !== null) {
      await page.waitForSelector(this.waitForElement, {timeout: 60000});
    }
    return await page.content();
  }

  /**
   * Saves the prerendered content to
   * a file in the output directory.
   *
   * @param   {string}  fileContent  The prerendered markup
   * @param   {string}  filePath     The path of the file to save it to
   *
   * @return  {void}
   */
  saveFile(fileContent, filePath) {
    const pathComponents = filePath.split('/');
    pathComponents.pop();
    const dirPath = pathComponents.join('/');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, {recursive: true});
    }
    if (fs.existsSync(filePath) && !fs.lstatSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
    }
    fs.writeFileSync(filePath, fileContent);
  }
}

module.exports = Prerenderer;
