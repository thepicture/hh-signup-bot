const { Phone } = require("../models/Phone");

class PhoneGenerator {
  /**
   *
   * @returns {Phone}
   */
  generate() {
    return new Phone(
      `7900${new Array(7)
        .fill(null)
        .map(() => Math.floor(Math.random() * 10))
        .join("")}`
    );
  }
}

module.exports = { PhoneGenerator };
