module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000"],
      numberOfRuns: 3,
      startServerCommand: "npm start",
      startServerReadyTimeout: 30000,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["warn", { minScore: 0.8 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
        "categories:pwa": "warn",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
