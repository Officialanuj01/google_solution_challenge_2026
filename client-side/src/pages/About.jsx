
import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Users, Globe, Rocket, Code, Database, Server, PhoneCall, Cloud, Wallet, Zap, Languages, MessageSquare, LineChart, Link as LinkIcon, ArrowRight, Star } from 'lucide-react';

const heroBg = [
  'from-cyan-400/30 to-blue-500/30',
  'from-blue-400/30 to-purple-500/30',
  'from-pink-400/30 to-yellow-400/30',
];

const teamStats = [
  { icon: Users, label: 'Team Name', value: 'DSA' },
  { icon: Rocket, label: 'Problem Statement', value: 'Supply Chains' },
  { icon: Globe, label: 'Innovation', value: 'Open Innovation' },
];

const technologies = [
  { icon: Code, name: 'Frontend', desc: 'React.js, Interactive UI, HTML, CSS, JS', color: 'from-cyan-500 to-blue-600' },
  { icon: Server, name: 'Backend', desc: 'Node.js, Python, REST APIs, Business Logic', color: 'from-green-500 to-emerald-600' },
  { icon: Brain, name: 'Machine Learning & AI', desc: 'Gemini, Scikit-learn, Pandas/NumPy, Hugging Face', color: 'from-purple-500 to-indigo-600' },
  { icon: PhoneCall, name: 'Communication', desc: 'Twilio API, Automated voice calls, Speech Recognition', color: 'from-orange-500 to-red-600' },
  { icon: Database, name: 'Data & Auth', desc: 'MongoDB, Predictions & logs, Google Auth', color: 'from-blue-500 to-cyan-600' },
  { icon: Cloud, name: 'Cloud & Ops', desc: 'Firebase Hosting, Render, Git, GitHub, Postman, CSV Input', color: 'from-pink-500 to-yellow-500' },
];

const costEstimates = [
  { icon: PhoneCall, title: 'Communication', desc: 'Using Twilio, ~1 min avg. call', stat: '₹1000 - ₹2000' },
  { icon: Brain, title: 'AI Processing', desc: 'Google Gemini, Negligible usage', stat: '₹200 - ₹500' },
  { icon: Cloud, title: 'Cloud & DB', desc: 'Firebase Hosting, Render & MongoDB', stat: '₹500 - ₹1000' },
  { icon: Wallet, title: 'Total Monthly Cost', desc: 'Estimated for 1000 Users', stat: '₹1.7k - ₹3.5k' },
];

const roadmap = [
  { icon: Languages, name: 'Multilingual Voice', desc: 'Support regional languages, improve accessibility, and enhance success rates.', color: 'from-blue-500 to-cyan-600' },
  { icon: MessageSquare, name: 'Multi-Channel', desc: 'WhatsApp, SMS, In-app integration to reduce call dependency and lower costs.', color: 'from-green-500 to-emerald-600' },
  { icon: Brain, name: 'Advanced AI', desc: 'Powered by Google Gemini for better demand prediction and anomaly detection.', color: 'from-purple-500 to-indigo-600' },
  { icon: LineChart, name: 'Analytics', desc: 'Trend & behavior insights for strategic decision support.', color: 'from-orange-500 to-red-600' },
  { icon: LinkIcon, name: 'Integration', desc: 'ERP, Warehouse, and Logistics for end-to-end automation.', color: 'from-cyan-500 to-blue-600' },
  { icon: Zap, name: 'Scalability', desc: 'High-volume optimization and multi-city deployments.', color: 'from-pink-500 to-yellow-500' },
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
            Project Pulse
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed mb-6">
            <span className="font-bold text-cyan-600">Smart Supply Chains</span> Open Innovation
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {teamStats.map((a, i) => (
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

      {/* Tech Stack Section */}
      <section className="py-10 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Technologies Used</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
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

      {/* Cost Estimate Section */}
      <section className="py-10 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Monthly Cost Estimate</h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            The primary cost driver is voice calls; all other software components remain extremely low cost and highly scalable. <br/>
            <span className="font-bold text-cyan-600">Pulse operates at approximately ₹2–₹3.5 per user per month.</span>
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-7">
            {costEstimates.map((feature, i) => (
              <motion.div key={i} whileHover={{ scale: 1.07, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} className="p-7 bg-white/70 rounded-2xl shadow-xl backdrop-blur-lg border border-cyan-100/30 transition-all duration-300 hover:border-cyan-400/40 group flex flex-col items-center text-center">
                <div className="relative w-12 h-12 mb-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20 group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 rounded-xl bg-white/10 blur-md" />
                  <feature.icon className="w-7 h-7 text-white relative z-10 group-hover:animate-spin-slow" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-1">{feature.title}</h4>
                <span className="text-sm font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full mb-3 inline-block">{feature.stat}</span>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-10 px-4 relative z-10">
        <div className="max-w-6xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-3 text-center">Future Development Roadmap</h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-7 max-w-5xl mx-auto">
          {roadmap.map((item, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} className="p-6 text-center bg-white/80 rounded-2xl shadow-lg backdrop-blur-md border border-cyan-100/30 hover:border-cyan-400/40 transition-colors">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">{item.name}</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} className="p-10 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl shadow-2xl backdrop-blur-lg border-2 border-white/20">
            <div className="relative w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <div className="absolute inset-0 rounded-2xl bg-white/10 blur-md" />
              <Zap className="w-7 h-7 text-white relative z-10 animate-bounce" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 drop-shadow-lg">Building a robust, automated ecosystem</h2>
            <p className="text-lg mb-6 text-cyan-50">Experience how Pulse provides a reliable workflow for smarter delivery management.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-cyan-600 rounded-xl font-bold hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center text-base shadow-lg border border-cyan-400/30 active:scale-95">
                Explore Pulse
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
