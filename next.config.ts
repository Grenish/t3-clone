import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    // Disable preloading entries to reduce memory usage
    preloadEntriesOnStart: false,
    // Enable server components HMR cache for faster development
    serverComponentsHmrCache: true,
    // Optimize package imports - remove @supabase/ssr to prevent HMR issues
    optimizePackageImports: ['ai', 'gsap'],
  },

  // Turbopack configuration (replaces webpack config when using --turbopack)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Memory optimization - only apply webpack config when not using turbopack
  webpack: (config: any, { dev }: { dev: boolean }) => {
    // Skip webpack config when using turbopack
    if (process.env.TURBOPACK) {
      return config;
    }

    // Fix Supabase SSR HMR issues in development
    if (dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@supabase/ssr': require.resolve('@supabase/ssr'),
      };
      
      // Prevent Supabase modules from being optimized during development
      config.optimization.providedExports = false;
    }

    // Optimize bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all'
          },
          ai: {
            test: /[\\/]node_modules[\\/](ai|@ai-sdk)[\\/]/,
            name: 'ai-chunk',
            priority: 10,
            chunks: 'all'
          },
          supabase: {
            test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
            name: 'supabase-chunk',
            priority: 10,
            chunks: 'all'
          },
          gsap: {
            test: /[\\/]node_modules[\\/](gsap)[\\/]/,
            name: 'gsap-chunk',
            priority: 10,
            chunks: 'all'
          }
        }
      }
    };

    return config;
  },

  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Add image optimization
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: true,
  },

  // Optimize headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },

  // Enable gzip compression
  compress: true,

  // Optimize builds
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // TypeScript optimization
  typescript: {
    // Ignore build errors in development (remove in production)
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // ESLint optimization
  eslint: {
    // Ignore during builds for faster deployment (remove in production)
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },

  // Server optimization
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
