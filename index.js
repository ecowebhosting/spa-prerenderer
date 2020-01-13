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
   * @param   {boolean} options.stopOnPageError Whether the prerenderer should
   *                                            throw an exception if an error
   *                                            on the page to be rendered
   *                                            occurs. Useful if that error
   *                                            prevents the `waitForElement`
   *                                            element from being rendered.
   */
  constructor({
    staticDir = null,
    routes = ['/'],
    outputDir = '.',
    waitForElement = null,
    useHttps = true,
    supressOutput = false,
    stopOnPageError = false,
  } = {}) {
    Options.validate({
      staticDir: staticDir,
      routes: routes,
      outputDir: outputDir,
      waitForElement: waitForElement,
      useHttps: useHttps,
      supressOutput: supressOutput,
      stopOnPageError: stopOnPageError,
    });
    this.routes = routes;
    this.staticDir = staticDir;
    this.outputDir = outputDir;
    this.waitForElement = waitForElement;
    this.useHttps = useHttps;
    this.supressOutput = supressOutput;
    this.stopOnPageError = stopOnPageError;
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
    this.browser = await puppeteer.launch({
      headless: true,
      ignoreHTTPSErrors: true,
      defaultViewport: null,
      args: [
        '--ignore-certificate-errors',
      ],
    });
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
    const page = await this.browser.newPage();
    page.on('error', (err) => {
      if (this.stopOnPageError === true) {
        throw err;
      }
      console.log(
          `Error: ${err.toString()}` +
          `If this prevents the \`waitForElement\` element ` +
          `${this.waitForElement} from loading, the prerender will timeout.`,
      );
    });
    page.on('pageerror', (err) => {
      if (this.stopOnPageError === true) {
        throw err;
      }
      console.log(
          `Page error: ${err.toString()}` +
          `If this prevents the \`waitForElement\` element ` +
          `${this.waitForElement} from loading, the prerender will timeout.`,
      );
    });
    const s = this.useHttps === true ? 's' : '';
    const url = `http${s}://localhost:${this.port}${route}`;
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
