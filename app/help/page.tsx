import Link from 'next/link';
import { HelpCircle, MessageCircle, BookOpen, Shield, FileText, ArrowRight } from 'lucide-react';

const helpSections = [
  {
    title: 'FAQ',
    description: 'Answers to most common questions',
    icon: BookOpen,
    href: '/faq',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Contact Support',
    description: 'Get help from our support team',
    icon: MessageCircle,
    href: '/support',
    color: 'from-white to-amber-600',
  },
  {
    title: 'Responsible Gaming',
    description: 'Play safely and responsibly',
    icon: Shield,
    href: '/responsible-gaming',
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    title: 'Terms of Service',
    description: 'Read our terms and conditions',
    icon: FileText,
    href: '/terms',
    color: 'from-purple-500 to-purple-600',
  },
  {
    title: 'Privacy Policy',
    description: 'How we handle your data',
    icon: Shield,
    href: '/privacy',
    color: 'from-pink-500 to-pink-600',
  },
];

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 rounded-full mb-6">
            <HelpCircle className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-gray-400 text-lg">
            Find the help you need or contact our support team
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {helpSections.map((section, idx) => (
            <Link
              key={idx}
              href={section.href}
              className="group bg-gray-800 rounded-2xl p-6 hover:bg-gray-750 transition-all"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} mb-4`}>
                <section.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-400 transition-colors">
                {section.title}
              </h3>
              <p className="text-gray-400 mb-4">{section.description}</p>
              <div className="flex items-center text-yellow-400 font-semibold group-hover:translate-x-2 transition-transform">
                <span>Learn more</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
