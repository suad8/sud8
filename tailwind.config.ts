import type { Config } from "tailwindcss";

/**
 * نظام الرموز (design tokens).
 *
 * اللوحة مأخوذة من ورقة ملصقات عربية بطراز الريزوغراف: كوبالت أزرق،
 * قرمزي، أصفر ذهبي، أخضر غامق، نعناعي، وردي، سماوي، على ورق كريمي.
 *
 * التوزيع مقصود: الكوبالت يحمل كل الإجراءات في التطبيق (وهو الأغلب في
 * المرجع)، وبقية الألوان تعيش في ثيمات الصفحات العامة — حيث التعبير
 * الشخصي مناسب — لا في واجهة إدارة أرقام الحسابات.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /** كوبالت — لون العلامة والإجراءات */
        brand: {
          50: "#eef2ff",
          100: "#dde5ff",
          200: "#bccbff",
          300: "#93a9ff",
          400: "#6683fb",
          500: "#3f5cf0",
          600: "#2b4cd4", // درجة المرجع
          700: "#233db0",
          800: "#21358c",
          900: "#1f3070",
          950: "#141d45",
        },

        /**
         * محايد بمسحة ورقية دافئة — ورق الملصقات كريمي لا أبيض بارد،
         * ورمادي أزرق كان سيتصادم مع دفء اللوحة.
         */
        neutral: {
          50: "#faf9f5",
          100: "#f2f0e8",
          200: "#e5e1d6",
          300: "#cbc6b7",
          400: "#a09a89",
          500: "#726c5e",
          600: "#575249",
          700: "#45413a",
          800: "#33302b",
          900: "#1e1d1a",
          950: "#0f0e0d",
        },

        /** قرمزي المرجع — يقوم بدور الخطر */
        danger: {
          50: "#fef2f1",
          100: "#fde3e1",
          200: "#fbc7c3",
          600: "#ee4136",
          700: "#c93026",
          800: "#a32a22",
        },

        /** ذهبي المرجع — يقوم بدور التنبيه */
        warn: {
          50: "#fffaeb",
          100: "#fff3c8",
          200: "#ffe589",
          700: "#996b06",
          800: "#7a5406",
          900: "#5c3f08",
        },

        /** أخضر المرجع الغامق — التأكيدات الإيجابية */
        success: {
          50: "#eefaf3",
          100: "#d3f2e0",
          200: "#a6e4c3",
          600: "#0f7a4e",
          700: "#0c6240",
          800: "#0b4e34",
        },

        /** ألوان المرجع المستخدمة في ثيمات الصفحات العامة */
        sticker: {
          cobalt: "#2b4cd4",
          vermilion: "#ee4136",
          golden: "#ffd84d",
          forest: "#0f7a4e",
          mint: "#6ecfaa",
          blossom: "#ffafcc",
          sky: "#a5dcf2",
          paper: "#fbfaf5",
        },
      },

      /** سلّم زوايا من أربع درجات فقط */
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "0.625rem",
        md: "0.625rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },

      boxShadow: {
        xs: "0 1px 2px rgba(30,29,26,.05)",
        sm: "0 1px 3px rgba(30,29,26,.07), 0 1px 2px rgba(30,29,26,.04)",
        md: "0 4px 12px rgba(30,29,26,.08)",
        lg: "0 12px 32px rgba(30,29,26,.12)",
      },

      fontFamily: {
        sans: ["var(--font-arabic)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      /** سلّم خط ثابت بارتفاعات سطر مناسبة للعربية */
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.25rem" }],
        sm: ["0.8125rem", { lineHeight: "1.375rem" }],
        base: ["0.9375rem", { lineHeight: "1.6875rem" }],
        lg: ["1.0625rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem", { lineHeight: "2.125rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.5rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.875rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
