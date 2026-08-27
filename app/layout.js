import './globals.css';

export const metadata = {
  title: 'Malaysia University & Program Explorer',
  description: 'Search Malaysian university programs, fees, requirements and scholarships.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
