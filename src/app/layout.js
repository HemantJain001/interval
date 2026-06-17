import { Inter, Playfair_Display, Fira_Code, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import ToastContainer from '@/components/Toast';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-body',
    display: 'swap',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-heading',
    display: 'swap',
});

const firaCode = Fira_Code({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

const bricolage = Bricolage_Grotesque({
    subsets: ['latin'],
    variable: '--font-display',
    display: 'swap',
});

export const metadata = {
    title: 'Interval — Spaced Repetition & Habit Tracker',
    description: 'A beautiful dashboard to track daily spaced repetition and habits consistency.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${inter.variable} ${playfair.variable} ${firaCode.variable} ${bricolage.variable}`}>
            <body>
                <Providers>
                    {children}
                    <ToastContainer />
                </Providers>
            </body>
        </html>
    );
}
