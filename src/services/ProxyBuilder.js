const { Proxy } = require("../models/Proxy");

const {
  PROXY_HOST,
  PROXY_PORT,
  PROXY_USERNAME,
  PROXY_PASSWORD,
} = require("../config/urls");

class ProxyBuilder {
  canProxyBuild() {
    return (
      !!PROXY_HOST && !!PROXY_PORT && (!PROXY_PASSWORD || !!PROXY_USERNAME)
    );
  }

  buildProxy() {
    const proxy = new Proxy(
      PROXY_HOST,
      PROXY_PORT,
      PROXY_USERNAME,
      PROXY_PASSWORD
    );

    if (proxy.username) {
      return {
        proxy: {
          server: `${proxy.host}:${proxy.port}`,
          username: proxy.username,
          password: proxy.password,
        },
      };
    } else {
      return {
        proxy: {
          server: `${proxy.host}:${proxy.port}`,
        },
      };
    }
  }
}

module.exports = {
  ProxyBuilder,
};
