const path = require('path');

/**
 * Represents options for prerenderer.
 */
class Options {
  /**
   * Validates provided options
   *
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
   *
   * @return  {boolean}  Whether the options are valid or not.
   */
  static validate({
    staticDir,
    routes,
    outputDir,
    waitForElement,
    useHttps,
    supressOutput,
    stopOnPageError,
  }) {
    if (staticDir === null) {
      throw new Error('staticDir must be explicitly set.');
    }
    if (!path.isAbsolute(staticDir)) {
      throw new Error('staticDir must be an absolute path.');
    }
    if (!Array.isArray(routes)) {
      throw new TypeError('routes must be an array.');
    }
    if (typeof useHttps !== 'boolean') {
      throw new TypeError('useHttps must be a boolean value.');
    }
    if (typeof supressOutput !== 'boolean') {
      throw new TypeError('supressOutput must be a boolean value.');
    }
    if (typeof stopOnPageError !== 'boolean') {
      throw new TypeError('stopOnPageError must be a boolean value.');
    }
    return true;
  }
}

module.exports = Options;
