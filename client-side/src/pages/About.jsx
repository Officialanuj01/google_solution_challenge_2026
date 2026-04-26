
import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Users, Globe, Rocket, Code, Database, Cpu, Target, Eye, ArrowRight, Heart, BarChart2, MapPin, Clock, Shield, Star } from 'lucide-react';

const heroBg = [
  'from-cyan-400/30 to-blue-500/30',
  'from-blue-400/30 to-purple-500/30',
  'from-pink-400/30 to-yellow-400/30',
];

const achievements = [
  { icon: Code, label: 'Lines of Code', value: '10K+' },
  { icon: Users, label: 'Development Hours', value: '500+' },
  { icon: Globe, label: 'Project Status', value: 'Beta' },
  { icon: Rocket, label: 'Technologies Used', value: '8+' },
];

const technologies = [
  { icon: Brain, name: 'AI & ML', desc: 'Advanced algorithms for prediction and optimization', color: 'from-purple-500 to-indigo-600' },
  { icon: Database, name: 'MongoDB', desc: 'Flexible NoSQL database powering our backend', color: 'from-green-500 to-emerald-600' },
  { icon: Cpu, name: 'Cloud Infra', desc: 'Scalable, reliable, modern architecture on Google Cloud', color: 'from-orange-500 to-red-600' },
  { icon: Shield, name: 'Security', desc: 'Enterprise-grade protection and privacy', color: 'from-blue-500 to-cyan-600' },
  { icon: Code, name: 'React', desc: 'Modern UI library for fast, interactive experiences', color: 'from-cyan-500 to-blue-600' },
  { icon: Rocket, name: 'Vite', desc: 'Lightning-fast build tool for rapid development', color: 'from-pink-500 to-yellow-500' },
  { icon: Globe, name: 'Express', desc: 'Robust Node.js framework for scalable APIs', color: 'from-gray-500 to-gray-700' },
  { icon: Star, name: 'Tailwind CSS', desc: 'Utility-first CSS for beautiful, responsive design', color: 'from-teal-400 to-blue-400' },
];

const features = [
  { icon: BarChart2, title: 'Predictive Analytics', desc: 'Forecast demand and optimize inventory.', stat: 'Smart Forecasting' },
  { icon: MapPin, title: 'Route Planning', desc: 'Intelligent route optimization for efficiency.', stat: 'Optimized Routes' },
  { icon: Clock, title: 'Call Scheduling', desc: 'Automated calling system', stat: 'Automated Calls' },
  { icon: Star, title: 'Customer Experience', desc: 'Seamless delivery and communication.', stat: '5-Star Service' },
];

const team = [
  { name: 'Devraj Patil', role: 'Full Stack Developer', desc: 'UI/UX design, frontend Designer', icon: Code },
  { name: 'Saksham Gupta', role: 'Full Stack Developer', desc: 'Authentication backend & frontend Developer', icon: Database },
  { name: 'Anuj Sahu', role: 'Full Stack Developer', desc: 'Backend Machine Learning Developer', icon: Cpu },
];

const timeline = [
  { year: '2024', event: 'Predelix founded', icon: Rocket },
  { year: '2024 Q2', event: 'First AI model deployed', icon: Brain },
  { year: '2024 Q3', event: 'Beta launch', icon: Globe },
  { year: '2025', event: '500+ dev hours, 10K+ lines', icon: Code },
];

function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col overflow-x-hidden relative">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-20">
        {heroBg.map((bg, i) => (
          <div key={i} className={`absolute ${i === 0 ? 'top-1/4 left-1/3 w-80 h-80' : i === 1 ? 'bottom-1/4 right-1/3 w-52 h-52' : 'top-1/2 left-1/2 w-56 h-56'} bg-gradient-to-br ${bg} rounded-full blur-3xl animate-pulse opacity-70`} />
        ))}
      </div>
      {/* Section divider */}
      <div className="absolute left-1/2 top-0 h-full w-1 bg-gradient-to-b from-cyan-200/30 via-blue-200/10 to-transparent -translate-x-1/2 pointer-events-none z-0" />

      {/* Hero Section */}
      <section className="py-14 px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mb-6 shadow-2xl mx-auto border-4 border-white/30 relative">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-md" />
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 12, ease: 'linear' }} className="absolute inset-0 rounded-full border-2 border-cyan-400/30" />
            <Brain className="w-12 h-12 text-white relative z-10" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 tracking-tight drop-shadow-lg">
            About Predelix
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed mb-6">
            Pioneering the future of logistics with <span className="text-cyan-600 font-bold">AI-powered intelligence</span>—transforming how businesses predict, optimize, and deliver in the global supply chain.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            {achievements.map((a, i) => (
              <motion.div key={i} whileHover={{ scale: 1.09, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} className="p-5 text-center bg-white/60 rounded-2xl shadow-xl backdrop-blur-lg border border-cyan-100/30 transition-all duration-300 hover:border-cyan-400/40">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 flex items-center justify-center shadow-lg border border-white/20">
                  <a.icon className="w-7 h-7 text-cyan-500" />
                </div>
                <div className="text-xl font-bold text-gray-800 mb-1 tracking-tight">{a.value}</div>
                <div className="text-sm text-gray-600">{a.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Our Tech Stack Section */}
      <section className="py-10 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Tech Stack</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {technologies.map((tech, i) => (
              <motion.div key={i} whileHover={{ scale: 1.09, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} className={`p-7 text-center bg-white/70 rounded-2xl shadow-xl backdrop-blur-lg border border-gray-100 transition-all duration-300 hover:border-cyan-400/40 group`}> 
                <div className={`relative w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${tech.color} flex items-center justify-center shadow-lg border-2 border-white/30 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="absolute inset-0 rounded-full bg-white/10 blur-md" />
                  <tech.icon className="w-8 h-8 text-white relative z-10 group-hover:animate-spin-slow" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2 tracking-tight">{tech.name}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Predelix Section */}
      <section className="py-10 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Why Predelix?</h2>
          <div className="grid md:grid-cols-3 gap-7">
            <motion.div whileHover={{ scale: 1.05 }} className="p-6 text-center bg-white/80 rounded-2xl shadow-lg backdrop-blur-md">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h4 className="text-lg font-bold text-gray-800 mb-1">Sustainability</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Eco-friendly logistics solutions for a greener future.</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="p-6 text-center bg-white/80 rounded-2xl shadow-lg backdrop-blur-md">
              <Clock className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
              <h4 className="text-lg font-bold text-gray-800 mb-1">Speed</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Lightning-fast delivery and real-time tracking.</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="p-6 text-center bg-white/80 rounded-2xl shadow-lg backdrop-blur-md">
              <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="text-lg font-bold text-gray-800 mb-1">Reliability</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Trusted by businesses for secure, predictable logistics.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">What We Deliver</h2>
          <div className="grid md:grid-cols-2 gap-7">
            {features.map((feature, i) => (
              <motion.div key={i} whileHover={{ scale: 1.07, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} className="p-7 bg-white/70 rounded-2xl shadow-xl backdrop-blur-lg border border-cyan-100/30 transition-all duration-300 hover:border-cyan-400/40 group">
                <div className="flex items-center mb-4">
                  <div className="relative w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg border border-white/20 group-hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 rounded-xl bg-white/10 blur-md" />
                    <feature.icon className="w-7 h-7 text-white relative z-10 group-hover:animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-1">{feature.title}</h4>
                    <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full">{feature.stat}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-10 px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Meet Our Team</h2>
          <p className="text-base text-gray-600">A dedicated team passionate about transforming logistics through innovative technology.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-7 max-w-3xl mx-auto">
          {team.map((member, i) => (
            <motion.div key={i} whileHover={{ scale: 1.09, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} className="p-7 text-center bg-white/70 rounded-2xl shadow-xl backdrop-blur-lg border border-cyan-100/30 transition-all duration-300 hover:border-cyan-400/40 group">
              <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-white/30 group-hover:scale-110 transition-transform duration-300">
                <div className="absolute inset-0 rounded-2xl bg-white/10 blur-md" />
                <member.icon className="w-7 h-7 text-white relative z-10 group-hover:animate-spin-slow" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{member.name}</h3>
              <div className="text-cyan-600 font-semibold mb-2">{member.role}</div>
              <p className="text-gray-600 text-sm leading-relaxed">{member.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} className="p-10 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl shadow-2xl backdrop-blur-lg border-2 border-white/20">
            <div className="relative w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <div className="absolute inset-0 rounded-2xl bg-white/10 blur-md" />
              <Rocket className="w-7 h-7 text-white relative z-10 animate-bounce" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 drop-shadow-lg">Ready to Explore Our Platform?</h2>
            <p className="text-lg mb-6 text-cyan-50">Experience how Predelix can help optimize your logistics operations with our AI-powered prediction and smart delivery solutions.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-cyan-600 rounded-xl font-bold hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center text-base shadow-lg border border-cyan-400/30 active:scale-95">
                Try Demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:animate-bounce" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default About;
