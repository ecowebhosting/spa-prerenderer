const {should, expect} = require('chai');
const chai = require('chai');
const fs = require('fs');
const Prerenderer = require('..');
const inputDir = __dirname + '/examples/input';
const outputDir = __dirname + '/examples/output';
chai.use(require('chai-as-promised'));
should();

describe('prerenderer construction', function() {
  context('config validation', function() {
    it('should require a `staticDir`', function() {
      const badCall = () => new Prerenderer();
      expect(badCall).to.throw(
          Error,
          'staticDir must be explicitly set.',
      );
    });
    it('should require `staticDir` to be an absolute path', function() {
      const badCall = () => new Prerenderer({staticDir: './'});
      expect(badCall).to.throw(
          Error,
          'staticDir must be an absolute path.',
      );
    });
    it('should require `routes` to be an array', function() {
      const badCall = () => new Prerenderer({
        staticDir: inputDir,
        routes: '/not-an-array',
      });
      expect(badCall).to.throw(
          TypeError,
          'routes must be an array.',
      );
    });
    it('should require `useHttps` to be a boolean', function() {
      const badCall = () => new Prerenderer({
        staticDir: inputDir,
        useHttps: 'notABoolean',
      });
      expect(badCall).to.throw(
          TypeError,
          'useHttps must be a boolean value.',
      );
    });
    it('should require `supressOutput` to be a boolean', function() {
      const badCall = () => new Prerenderer({
        staticDir: inputDir,
        supressOutput: 'notABoolean',
      });
      expect(badCall).to.throw(
          TypeError,
          'supressOutput must be a boolean value.',
      );
    });
    it('should require `reportPageErrors` to be a boolean', function() {
      const badCall = () => new Prerenderer({
        staticDir: inputDir,
        reportPageErrors: 'notABoolean',
      });
      expect(badCall).to.throw(
          TypeError,
          'reportPageErrors must be a boolean value.',
      );
    });
  });
  context('valid options given', function() {
    it('should be instantiable with https', function() {
      const prerenderer = new Prerenderer({
        staticDir: inputDir,
        routes: ['/'],
        outputDir: outputDir,
        waitForElement: '#dynamic',
        useHttps: true,
        supressOutput: true,
      });
      expect(prerenderer).to.exist;
      prerenderer.server.destroy();
    });

    it('should be instantiable with http', function() {
      const prerenderer = new Prerenderer({
        staticDir: inputDir,
        routes: ['/'],
        outputDir: outputDir,
        waitForElement: '#dynamic',
        useHttps: false,
        supressOutput: true,
      });
      expect(prerenderer).to.exist;
      prerenderer.server.destroy();
    });
  });
});

describe('prerender init', function() {
  context('https server', function() {
    const httpsPrerenderer = new Prerenderer({
      staticDir: inputDir,
      routes: ['/'],
      outputDir: outputDir,
      waitForElement: '#dynamic',
      useHttps: true,
      supressOutput: true,
    });

    describe('puppeteer instance', async () => {
      it('should open', async () => {
        await httpsPrerenderer.startBrowser();
        expect(httpsPrerenderer.browser, 'Prerenderer puppeteer instance')
            .to.be.an('object');
      });
    });

    describe('prerender output', async () => {
      it('should save index.html to the correct path', async () => {
        await httpsPrerenderer.init();
        fs.existsSync(`${outputDir}/index.html`)
            .should.be.true;
      });

      it('should match prerender input', () => {
        const output = fs.readFileSync(`${outputDir}/index.html`, 'utf8');
        output.should.contain(
            '<section id="dynamic"><h2>Dynamic bit</h2>',
            'Actual output does not match expected output',
        );
      });
    });
  });


  context('http server', function() {
    const httpPrerenderer = new Prerenderer({
      staticDir: inputDir,
      routes: ['/'],
      outputDir: outputDir,
      waitForElement: '#dynamic',
      useHttps: false,
      supressOutput: true,
    });

    describe('puppeteer instance', () => {
      it('should open', async () => {
        await httpPrerenderer.startBrowser();
        expect(httpPrerenderer.browser, 'Prerenderer puppeteer instance')
            .to.be.an('object');
      });
    });

    describe('prerender output', async () => {
      it('should save index.html to the correct path', async () => {
        await httpPrerenderer.init();
        fs.existsSync(`${outputDir}/index.html`)
            .should.be.true;
      });
      it('should match prerender input', () => {
        const output = fs.readFileSync(`${outputDir}/index.html`, 'utf8');
        output.should.contain(
            '<section id="dynamic"><h2>Dynamic bit</h2>',
            'Actual output does not match expected output',
        );
      });
    });
  });
});
