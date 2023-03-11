const { FakeContent } = require("../models/FakeContent");

class CompanyGenerator {
  /**
   *
   * @returns {FakeContent}
   */
  generate() {
    return new FakeContent(
      `ООО "${Math.random()
        .toString(36)
        .slice(2, 2 + 3)
        .toUpperCase()}"`
    );
  }
}

module.exports = { CompanyGenerator };
