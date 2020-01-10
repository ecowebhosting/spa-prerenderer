const puppeteer = require('puppeteer');
const fs = require('fs');
const chalk = require('chalk');
const Server = require('./lib/server');

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
   * @param   {string}  staticDir     The path to the docroot of
   *                                  the site to prerender.
   * @param   {array}   routes        An array of the routes of the
   *                                  site to prerender.
   * @param   {string}  outputDir     The path to the directory the
   *                                  prerendered files should be output to.
   * @param   {string}  waitForElement Wait for specific element to be rendered
   * @param   {boolean} useHttps      Whether the server should use https or not
   * @param   {boolean} supressOutput Whether or not to output to the console.
   */
  constructor(
      staticDir,
      routes = ['/'],
      outputDir = '.',
      waitForElement = null,
      useHttps = true,
      supressOutput = false,
  ) {
    this.routes = routes;
    this.staticDir = staticDir;
    this.outputDir = outputDir;
    this.waitForElement = waitForElement;
    this.useHttps = useHttps;
    this.supressOutput = supressOutput;

    const serverOptions = {
      server: {port: 5002},
      staticDir: staticDir,
    };
    this.server = new Server(serverOptions);
    this.server.init();
  }

  /**
   * C O M M E N C E
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
        console.info(chalk.blue(chalk.bold('Prerendering ') + route));
      }
      const content = await this.getMarkup(route);
      if (this.supressOutput === false) {
        console.info(chalk.green(
            chalk.bold('Prerendered ') + route,
        ) + chalk.bold.blue(' Saving…'));
      }

      this.saveFile(content, target);
      if (this.supressOutput === false) {
        console.info(
            chalk.green.inverse(chalk.bold('Saved ') + `to ${target}`),
        );
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
   */
  async getMarkup(route) {
    const page = await this.browser.newPage();
    await page.goto(`https://localhost:5002${route}`, {timeout: 60000});
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
