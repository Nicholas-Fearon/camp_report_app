import './globals.css'

export const metadata = {
  title: 'Camp Report App',
  description: 'Manage players and create performance reports',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}