import React, { useMemo, useState } from 'react';
import { Github, Linkedin, Mail, ExternalLink, Truck, Package, Globe, Zap, Shield, BarChart2, X, Construction } from 'lucide-react';

const useFooterData = () => {
  const creators = useMemo(() => [
    {
      name: 'Anuj Sahu',
      role: 'Full Stack Developer',
      linkedin: 'https://www.linkedin.com/in/anuj-sahu-4059bb253/',
    },
    {
      name: 'Saksham Gupta',
      role: 'Full Stack Developer',
      linkedin: 'https://www.linkedin.com/in/saksham-gupta-87a1a427b/',
    },
    {
      name: 'Devraj Patil',
      role: 'Full Stack Developer',
      linkedin: 'https://www.linkedin.com/in/devraj-patil-0944b22b5/',
    },
  ], []);

  const links = useMemo(() => ({
    product: [
      { name: 'Features', href: '/features' },
      { name: 'Documentation', href: '/docs' },
      { name: 'API Reference', href: '/api' },
      { name: 'Pricing', href: '/pricing' },
    ],
    resources: [
      { name: 'Demo', href: '/demo' },
      { name: 'Case Studies', href: '/case-studies' },
      { name: 'Blog', href: '/blog' },
      { name: 'Help Center', href: '/help' },
      { name: 'Knowledge Base', href: '/knowledge-base' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
  }), []);

  return { creators, links };
};

export function Footer() {
  const { creators, links } = useFooterData();
  const [showDevModal, setShowDevModal] = useState(false);

  const handleDevLinkClick = (e) => {
    e.preventDefault();
    setShowDevModal(true);
  };

  const closeModal = () => {
    setShowDevModal(false);
  };
  
  return (
    <footer className="bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/30 border-t border-cyan-200/50 mt-auto w-full relative z-50 overflow-hidden">
      {/* Floating footer elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-8 w-6 h-6 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-md animate-float1 flex items-center justify-center">
          <Truck className="w-3 h-3 text-cyan-500/60" />
        </div>
        <div className="absolute top-8 right-12 w-5 h-5 bg-gradient-to-br from-blue-400/20 to-sky-500/20 rounded-sm animate-float2 flex items-center justify-center">
          <Package className="w-2.5 h-2.5 text-blue-500/60" />
        </div>
        <div className="absolute bottom-8 left-1/4 w-4 h-4 bg-gradient-to-br from-sky-400/20 to-cyan-500/20 rounded-full animate-float3 flex items-center justify-center">
          <Globe className="w-2 h-2 text-sky-500/60 animate-spin-slow" />
        </div>
        <div className="absolute bottom-4 right-1/3 w-5 h-5 bg-gradient-to-br from-cyan-300/20 to-blue-400/20 rounded-lg animate-float1 flex items-center justify-center">
          <Zap className="w-2.5 h-2.5 text-cyan-500/60" />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Enhanced Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Enhanced Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center animate-float1">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 bg-clip-text text-transparent">
                Predelix
              </h2>
            </div>
            <p className="text-sky-600 text-sm leading-relaxed">
              Next-generation AI-powered logistics intelligence platform revolutionizing supply chain management with predictive analytics and smart automation.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/DSAops/Predelix"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 hover:from-cyan-200 hover:to-blue-200 text-cyan-600 hover:text-cyan-700 transition-all duration-300 transform hover:scale-110"
              >
                <Github className="h-5 w-5 group-hover:animate-bounce" />
              </a>
              <a
                href="mailto:contact@predelix.com"
                className="group p-2 rounded-lg bg-gradient-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 hover:text-blue-700 transition-all duration-300 transform hover:scale-110"
              >
                <Mail className="h-5 w-5 group-hover:animate-pulse" />
              </a>
            </div>
          </div>

          {/* Enhanced Quick Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-sky-800 font-semibold uppercase tracking-wider text-sm flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
                <span>{category}</span>
              </h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      onClick={item.href.startsWith('/') && !item.href.includes('#') ? handleDevLinkClick : undefined}
                      className="group text-sky-600 hover:text-cyan-600 text-sm transition-all duration-300 flex items-center transform hover:translate-x-1 cursor-pointer"
                    >
                      <span className="group-hover:font-medium">{item.name}</span>
                      {item.href.startsWith('http') && (
                        <ExternalLink className="ml-1 h-3 w-3 group-hover:animate-bounce" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Enhanced Creators Section */}
        <div className="border-t border-cyan-200/50 pt-8">
          <h3 className="text-sky-800 font-semibold mb-6 flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Shield className="w-3 h-3 text-white animate-pulse" />
            </div>
            <span>Created By</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creators.map((creator, index) => (
              <div
                key={creator.name}
                className="group flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-br from-white/80 to-cyan-50/50 border border-cyan-200/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="flex-1">
                  <h4 className="text-sky-800 font-medium group-hover:text-cyan-600 transition-colors duration-300">
                    {creator.name}
                  </h4>
                  <p className="text-sky-600 text-sm">{creator.role}</p>
                </div>
                <a
                  href={creator.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 hover:from-cyan-200 hover:to-blue-200 text-cyan-600 hover:text-cyan-700 transition-all duration-300 transform hover:scale-110"
                >
                  <Linkedin className="h-5 w-5 group-hover:animate-bounce" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Bottom Bar */}
        <div className="border-t border-cyan-200/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-sky-600">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-sm animate-pulse"></div>
            <p>© 2025 Predelix. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a
              href="https://github.com/DSAops/Predelix"
              target="_blank"
              rel="noopener noreferrer"
              className="group hover:text-cyan-600 transition-all duration-300 flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 transform hover:scale-105"
            >
              <Github className="h-4 w-4 group-hover:animate-bounce" />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </div>
      
      {/* Development Modal */}
      {showDevModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden">
            {/* Modal Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-blue-50"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-cyan-300/20 to-blue-300/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-blue-300/20 to-sky-300/20 rounded-full blur-xl"></div>
            
            {/* Modal Content */}
            <div className="relative p-8 text-center">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Construction className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Coming Soon!
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                This page is currently under development. We're working hard to bring you an amazing experience. Stay tuned!
              </p>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-cyan-600 mb-4">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              
              <button
                onClick={closeModal}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(2px) rotate(-2deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(1deg); }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .animate-float1 { animation: float1 4s ease-in-out infinite; }
        .animate-float2 { animation: float2 5s ease-in-out infinite; }
        .animate-float3 { animation: float3 6s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </footer>
  );
}
