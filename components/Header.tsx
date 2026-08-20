// 1. Import the new component at the very top
import Logo from '@/components/Logo';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-sm">
      {/* 2. Drop the Logo tag exactly where you want it */}
      <Logo />
      
      {/* The rest of your existing navigation links go here */}
      <div className="flex gap-4">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/login">Login</Link>
      </div>
    </nav>
  );
}