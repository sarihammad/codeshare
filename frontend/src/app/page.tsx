'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Real-Time Collaboration',
    description:
      'Edit code together instantly with live synchronization powered by Yjs and Monaco Editor.',
    icon: '💻',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Smart Room Management',
    description:
      'Create, join, and manage collaborative coding rooms with ease and security.',
    icon: '🗂️',
    color: 'from-red-500 to-black-500',
  },
  {
    title: 'Live Presence & Chat',
    description:
      "See who's online, chat in real-time, and share ideas seamlessly.",
    icon: '🗨️',
    color: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Version History',
    description:
      'Browse, diff, and restore previous code snapshots with intelligent versioning.',
    icon: '🕑',
    color: 'from-orange-500 to-red-500',
  },
  {
    title: 'Enterprise Security',
    description:
      'JWT auth, S3 storage, Redis, Kafka, and Postgres for enterprise-grade reliability.',
    icon: '🔒',
    color: 'from-red-600 to-red-800',
  },
  {
    title: 'Modern UI/UX',
    description:
      'Beautiful, responsive design built with Next.js 15 and Tailwind CSS.',
    icon: '✨',
    color: 'from-red-400 to-black-400',
  },
];

const stats = [
  { number: '10K+', label: 'Active Users' },
  { number: '50K+', label: 'Code Sessions' },
  { number: '99.9%', label: 'Uptime' },
  { number: '24/7', label: 'Support' },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-black-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-white font-bold text-xl">CodeShare</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link
              href="/login"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-red-500 to-black-500 text-white px-6 py-2 rounded-full hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Main Content */}
      <main role="main">
        {/* Hero Section */}
        <section className="relative px-6 py-20 lg:py-32" aria-labelledby="hero-heading">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 id="hero-heading" className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Code Together,
              <span className="bg-gradient-to-r from-red-400 to-black-400 bg-clip-text text-transparent">
                {' '}
                Build Together
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Real-time collaborative code editor inspired by Google Docs,
              Replit, and VS Code Live Share. Work together, learn together,
              build the future together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/register"
                className="bg-gradient-to-r from-red-500 to-black-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105"
              >
                Start Coding Now
              </Link>
              <Link
                href="/about"
                className="border border-gray-600 text-gray-300 px-8 py-4 rounded-full text-lg font-semibold hover:border-gray-400 hover:text-white transition-all duration-300"
              >
                Learn More
              </Link>
            </div>

            <p className="text-sm text-gray-400">
              No credit card required • Free forever
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-black/20" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 id="features-heading" className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Everything You Need to Code Together
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Powerful features designed for modern collaborative development
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105">
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20" aria-labelledby="cta-heading">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 id="cta-heading" className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Coding Experience?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of developers, students, and teams who are already
              building the future of collaborative coding.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center bg-gradient-to-r from-red-500 to-black-500 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105"
            >
              Get Started Free Today
            </Link>
          </motion.div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/10" role="contentinfo">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-black-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-white font-bold">CodeShare</span>
          </div>
          <p className="text-gray-400 text-sm">© 2024 CodeShare.</p>
        </div>
      </footer>
    </div>
  );
}
