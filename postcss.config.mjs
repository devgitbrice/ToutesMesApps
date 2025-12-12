/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // <--- C'est ici que ça change
    autoprefixer: {},
  },
};

export default config;