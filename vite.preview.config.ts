export default {
  preview: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: `${process.env.VITE_FIREFLY_URL}/api`,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },
}
