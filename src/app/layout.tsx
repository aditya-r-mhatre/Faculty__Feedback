import './globals.css'
import { Inter } from 'next/font/google'
import AuthProvider from "@/components/AuthProvider"; // You'll need this wrapper

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Faculty Feedback System',
  description: 'Anonymous feedback portal for students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}