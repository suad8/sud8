/**
 * بدون هذا الملف لا تُعالَج توجيهات `@tailwind` في globals.css، فتُشحن
 * الصفحة بلا أنماط إطلاقًا — والبناء ينجح صامتًا، فلا شيء ينبّهك.
 */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
