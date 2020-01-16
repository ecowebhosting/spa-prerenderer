# spa-prerenderer

A prerenderer for making static pages from dynamically generated content. Features include the ability to prerender on a https server (useful for scripts that generate URLs relative to the protocol the page is being served on) and reporting of errors on the page being rendered.

It works by creating a server instance to serve routes of a site, then using [Puppeteer](https://github.com/puppeteer/puppeteer) to open those routes in a headless Chromium instance before saving the markup to the configured output directory.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

* Node

### Installing

You have two options to install this package. You can clone the repo:

```shell
$ git clone git@github.com:ecowebhosting/spa-prerenderer.git ./destination_directory
```

Or use npm:

```shell
$ npm install ecowebhosting/spa-prerenderer
```

## Usage

Once the prerenderer is installed, include it in the top of the file you want to use it in (if not installed via npm, you will need to make sure the path matches the install location):

```javascript
const SpaPrerenderer = require('spa-prerenderer');
```
The prerenderer can then be instantiated with an options object. This is an example that explicitly states all available options. Details of those options can be found in the [Configuration Options section](#configoptions):

```javascript
const spaPrerenderer = new SpaPrerenderer({
      staticDir: '/Users/andy/sites/ecowebhosting.co.uk/dist/',
      routes: ['/', '/domain-names', '/hosting', '/vps', '/about'],
      outputDir: '/Users/andy/sites/ecowebhosting.co.uk/prerendered/',
      waitForElement: '#app',
      useHttps: true,
      supressOutput: true,
      reportPageErrors: true,
    });
```

And then run by calling its `init()` method (which takes no arguments).
*Note: this is an asynchronous method, so if further execution needs to occur after it, remember to prefix it with the `await` keyword, or suffix it with a `then()`.*

```javascript
await spaPrerenderer.init();
```

### Configuration Options <a name="configoptions"></a>

These are the available configuration options and their respective defaults:

```javascript
{
    staticDir = null,
    routes = ['/'],
    outputDir = '.',
    waitForElement = null,
    useHttps = true,
    supressOutput = false,
    reportPageErrors = false,
  }
  ```

Here is what they do:

#### `staticDir` {string} *(required)*
This is essentially where the input for the prerenderer is set. In most cases, it will be the public docroot of a web site/app.

The option does not accept relative paths, only absolute ones.

#### `routes` {array}
An array of all the routes to render relative to the public document root (as defined by`staticDir`).

If not set, defaults to just `/`.

#### `outputDir` {string}
The absolute path to the directory the prerendered files should be output to.

#### `waitForElement` {string}
If set, the prerenderer will wait for an element with the identifier specified here to render before capturing the markup and saving it to the output directory. This can be set to ensure the output isn't saved before the dynamically rendered page has finished rendering what is intended.

For example, for a Vue app that renders content to an element with the ID of 'app', this option should be set to '#app'.

Beware: If an error on the page prevents this element from loading, the prerenderer will wait indefinitely before timing out. If this is a possibility, the `reportPageErrors` option can provide some handy insight.

#### `useHttps` {boolean}
This option toggles whether the express server that serves the site that the prerenderer then loads uses https or http (and toggles the prerenderer to access it using the corresponding protocol).

In most cases, whether the site is rendered using http or https is fairly irrelevant to the static output. The inclusion of this option is for the remaining cases.

Some third party scripts (e.g. TrustPilot's trustbox widget) are loaded through a script that renders the content with URL protocols relative to the protocol used for the original document. If the prerenderer uses http to create the static content, in these cases, the static content will contain http-prefixed URLs, even if it is to be served on a https site.

If your site is (as it probably should be onwards of 2020) served over https and loads third party scripts, this option should prevent mixed content errors.

Otherwise, you can turn it off for a slightly quicker prerender. The lack of this option in other prerenders I found was the primary motivation for creating this one.

#### `supressOutput` {boolean}

If this option is set to `false`, the prerenderer provides borderline-verbose output (which page is being prerendered, the status of that prerender and the save location). Otherwise, it doesn't.

#### `reportPageErrors` {boolean}

This option specifically toggles reporting of errors from the page being rendered. It is independent to the `supressOutput` option.

If set to `true`, it will report if a script error is encountered on the page being prerendered. This can provide useful insight if you've set the `waitForElement` option and find the prerender process keeps timing out. The reason is often a script error that prevents the element being waited on from loading.

## Running the tests

Tests are written for Mocha using the Chai and chai-as-promised assertion libraries. You can run them via npm using:

```shell
$ npm test
```

## Built With

* [eslint](https://eslint.org/) - Linter
* [npm](https://npmjs.com/) - Dependency Management
* [mocha](https://mochajs.org/) - Test suite
* [chai](https://www.chaijs.com/) - Assertion library
* [chai-as-promised](https://github.com/domenic/chai-as-promised) - Async extension to chai

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Andy Dunn** - *Initial work* - [mahatma-andy](https://github.com/mahatma-andy)

See also the list of [contributors](https://github.com/ecowebhosting/spa-prerenderer/contributors) who participated in this project.

## Licence

This project is licenced under the GNU GENERAL PUBLIC LICENSE - see the [LICENCE.md](LICENCE.md) file for details

## Acknowledgments

* StackOverflow (of course) for help
* Chris Fritz's [prerender-spa-plugin](https://github.com/chrisvfritz/prerender-spa-plugin) for inspiration

