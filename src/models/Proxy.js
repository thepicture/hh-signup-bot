class Proxy {
  constructor(host, port, username = "", password = "") {
    this.host = host;
    this.port = port;

    this.username = username;
    this.password = password;
  }
}

module.exports = { Proxy };
