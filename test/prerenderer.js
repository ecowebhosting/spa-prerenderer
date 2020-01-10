const {should, expect} = require('chai');
const fs = require('fs');
should();

const Prerenderer = require('..');

const inputDir = __dirname + '/examples/input';
const outputDir = __dirname + '/examples/output';
const options = [inputDir, ['/'], outputDir, '#dynamic', false, true];
const prerenderer = new Prerenderer(...options);

describe('prerenderer class', function() {
  it('should be instantiable', function() {
    prerenderer.should.be.an('object');
  });
});

describe('prerender init', function() {
  describe('puppeteer instance', function() {
    it('should open', async function() {
      await prerenderer.startBrowser();
      expect(prerenderer.browser, 'Prerenderer puppeteer instance')
          .to.be.an('object');
    });
  });

  describe('prerender output', function() {
    it('should save an index.html be saved in the right place', async () => {
      await prerenderer.init();
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

  describe('server', function() {
    it('should terminate upon running destroy()', async function() {
      await prerenderer.server.destroy();
    });
  });
});
