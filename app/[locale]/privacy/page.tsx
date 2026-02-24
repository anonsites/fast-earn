import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-20 preserve-bullets">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href={`/${locale}/dashboard`} className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-8 bg-white/5 p-8 rounded-2xl border border-white/10">
          <section>
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              FastEarn ("we", "us", "our", or "Company") operates the FastEarn application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">2. Information Collection and Use</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We collect various types of information in connection with the services we provide:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Personal identification information (name, email address, phone number)</li>
              <li>Account information (username, password, tier level)</li>
              <li>Financial information (wallet balance, transaction history, earnings)</li>
              <li>Device information (IP address, device fingerprint, browser type)</li>
              <li>Usage data (tasks completed, time spent, pages visited)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">3. Use of Data</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              FastEarn uses the collected data for various purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>To provide and maintain our Service</li>
              <li>To manage user accounts and subscriptions</li>
              <li>To track earnings and process payments</li>
              <li>To detect, prevent and address fraud and security issues</li>
              <li>To provide customer support and respond to inquiries</li>
              <li>To monitor and analyze trends, usage, and activities</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">4. Security of Data</h2>
            <p className="text-gray-300 leading-relaxed">
              The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">5. Changes to This Privacy Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">6. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at support@fastearn.com or through the contact form in our application.
            </p>
          </section>

          <section className="pt-4 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              Last Updated: February 22, 2026
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
