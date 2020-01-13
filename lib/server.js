/* eslint-disable no-console */
const express = require('express');
const https = require('https');
const path = require('path');
const selfsigned = require('selfsigned');

/**
 * Wrapper for an Express server
 */
class Server {
  /**
   * @param   {Object}  options  Server options
   *
   * @return  {void}
   */
  constructor(options) {
    this._options = options;
    this._expressServer = express();
    this._nativeServer = null;
  }

  /**
   * Creates an Express server instance
   *
   * @return  {Promise}  Express server instance
   */
  init() {
    const server = this._expressServer;

    server.use(express.static(this._options.staticDir, {
      dotfiles: 'allow',
    }));

    server.get('*', (req, res) => res.sendFile(
        path.join(this._options.staticDir, 'index.html')),
    );

    return new Promise((resolve) => {
      const tlsParts = this.generateSelfSignedCert();
      this._nativeServer = this._options.useHttps === true ?
        https.createServer(
            {
              key: tlsParts.key,
              cert: tlsParts.cert,
            },
            this._expressServer,
        ).listen(
            this._options.server.port,
            () => {
              resolve();
            },
        ) :
        this._nativeServer = server.listen(
            this._options.server.port,
            () => {
              resolve();
            },
        );
    });
  }

  /**
   * Kills the server instance
   *
   * @return  {void}
   */
  async destroy() {
    await this._nativeServer.close();
  }

  /**
   * Generates a self-signed certificate to allow
   * the server to serve https requests.
   *
   * @return  {Object}  An object containing the path to the key and cert
   */
  generateSelfSignedCert() {
    const attrs = [{name: 'commonName', value: 'localhost'}];
    const pems = selfsigned.generate(attrs, {
      keySize: 2048,
      days: 30,
      algorithm: 'sha256',
    });
    return {
      key: pems.private,
      cert: pems.cert,
    };
  }
}

module.exports = Server;
