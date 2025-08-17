import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Calculateur du revenu disponible - Québec',
  description: 'Calculateur moderne des impôts et transferts au Québec',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Onest:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}