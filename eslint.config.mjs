import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "public/sw.js", "node_modules/**"],
  },
];

export default eslintConfig;
