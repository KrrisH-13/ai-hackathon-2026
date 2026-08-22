import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      ".next/**",
      "public/sw.js",
      "node_modules/**",
      "espoo-climatepulse-ai---finnish-carbon-neutrality-2030-assistant/**",
    ],
  },
];

export default eslintConfig;
